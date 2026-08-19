import React, { useState } from 'react';
import { Database, Copy, Check, ShieldCheck, Server, Layers } from 'lucide-react';

interface DatabaseSchemaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DatabaseSchemaModal: React.FC<DatabaseSchemaModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const sqlSchema = `-- PREENCHENDO AI • Supabase & PostgreSQL Schema DDL
-- Tables: profiles, templates, template_versions, template_fields, documents, document_values, document_history

-- 1. Profiles & Roles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Templates
CREATE TABLE IF NOT EXISTS public.templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  file_hash TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT 'v1.0',
  page_count INT NOT NULL DEFAULT 1,
  page_width NUMERIC(8,2) NOT NULL DEFAULT 595.32,
  page_height NUMERIC(8,2) NOT NULL DEFAULT 841.92,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'calibrating', 'active', 'archived')),
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Template Versions
CREATE TABLE IF NOT EXISTS public.template_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES public.templates(id) ON DELETE CASCADE,
  version_number TEXT NOT NULL,
  changelog TEXT,
  file_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Template Fields (Exact PDF Coordinates)
CREATE TABLE IF NOT EXISTS public.template_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES public.templates(id) ON DELETE CASCADE,
  field_key TEXT NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  page INT NOT NULL DEFAULT 1,
  x NUMERIC(8,2) NOT NULL,
  y NUMERIC(8,2) NOT NULL,
  width NUMERIC(8,2) NOT NULL,
  height NUMERIC(8,2) NOT NULL,
  font_family TEXT DEFAULT 'Helvetica',
  font_size NUMERIC(5,2) NOT NULL DEFAULT 8.5,
  font_weight TEXT DEFAULT 'normal' CHECK (font_weight IN ('normal', 'bold')),
  alignment TEXT DEFAULT 'left' CHECK (alignment IN ('left', 'center', 'right')),
  max_length INT,
  field_type TEXT NOT NULL DEFAULT 'text',
  required BOOLEAN DEFAULT FALSE,
  mask TEXT,
  validation_rule TEXT,
  multiline BOOLEAN DEFAULT FALSE,
  auto_resize BOOLEAN DEFAULT TRUE,
  sort_order INT NOT NULL DEFAULT 0,
  field_group TEXT DEFAULT 'outros',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Documents
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES public.templates(id),
  file_name TEXT NOT NULL,
  user_id UUID REFERENCES public.profiles(id),
  status TEXT DEFAULT 'completed' CHECK (status IN ('draft', 'completed', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Document Values
CREATE TABLE IF NOT EXISTS public.document_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
  field_key TEXT NOT NULL,
  field_value TEXT,
  confidence_score NUMERIC(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Document History & Audit
CREATE TABLE IF NOT EXISTS public.document_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_values ENABLE ROW LEVEL SECURITY;

-- Storage Bucket for Templates & Generated PDFs
INSERT INTO storage.buckets (id, name, public) 
VALUES ('document_templates', 'document_templates', true),
       ('generated_documents', 'generated_documents', false)
ON CONFLICT (id) DO NOTHING;`;

  const handleCopy = () => {
    navigator.clipboard.writeText(sqlSchema);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col text-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Estrutura Supabase / PostgreSQL (DDL)
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold">
                  PRONTO PARA PRODUÇÃO
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Tabelas e RLS prontas para migração e persistência na nuvem
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1">
            ✕
          </button>
        </div>

        {/* Info pills */}
        <div className="grid grid-cols-3 gap-3 text-xs">
          <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl flex items-center gap-2">
            <Server className="w-4 h-4 text-blue-600" />
            <div>
              <span className="text-slate-500 block text-[10px]">Database</span>
              <strong className="text-slate-800">PostgreSQL 15+</strong>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <div>
              <span className="text-slate-500 block text-[10px]">Tabelas</span>
              <strong className="text-slate-800">7 Tabelas + RLS</strong>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <div>
              <span className="text-slate-500 block text-[10px]">Storage</span>
              <strong className="text-slate-800">2 Buckets S3</strong>
            </div>
          </div>
        </div>

        {/* SQL Code block */}
        <div className="relative flex-1 min-h-[300px] overflow-hidden rounded-xl border border-slate-200 bg-slate-900">
          <div className="absolute top-3 right-3 z-10">
            <button
              onClick={handleCopy}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 border border-slate-700 shadow-sm transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado!' : 'Copiar SQL'}</span>
            </button>
          </div>
          <pre className="p-4 text-xs font-mono text-slate-200 overflow-auto h-full leading-relaxed select-all">
            {sqlSchema}
          </pre>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
          <span className="text-slate-500">
            Copie o script e execute no SQL Editor do seu projeto Supabase.
          </span>
          <button
            onClick={onClose}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-4 py-2 rounded-lg"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
