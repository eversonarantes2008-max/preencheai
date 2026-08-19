import React, { useRef, useState } from 'react';
import {
  FileText,
  Sliders,
  History,
  Sparkles,
  Shield,
  Database,
  PlusCircle,
  UploadCloud,
  FileCheck,
  Layers,
  Loader2
} from 'lucide-react';
import { processUploadedPdf } from '../services/pdfUploadService';
import { DocumentTemplate } from '../types/document';

interface NavbarProps {
  currentView: 'dashboard' | 'form' | 'editor' | 'preview' | 'history';
  onNavigate: (view: 'dashboard' | 'form' | 'editor' | 'preview' | 'history') => void;
  isAdmin: boolean;
  onToggleAdmin: () => void;
  onOpenTeachModal: () => void;
  onOpenSchemaModal: () => void;
  activeTemplateName: string;
  onPdfUploaded: (template: DocumentTemplate) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  isAdmin,
  onToggleAdmin,
  onOpenTeachModal,
  onOpenSchemaModal,
  activeTemplateName,
  onPdfUploaded,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      alert('Por favor, selecione um arquivo PDF válido.');
      return;
    }

    setIsUploading(true);
    try {
      const result = await processUploadedPdf(file);
      onPdfUploaded(result.template);
    } catch (err: any) {
      console.error('Error uploading PDF:', err);
      alert('Erro ao processar o arquivo PDF: ' + (err?.message || 'Tente novamente.'));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 text-slate-900 shadow-xs">
      {/* Hidden PDF File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div
            className="flex items-center gap-3 cursor-pointer select-none"
            onClick={() => onNavigate('dashboard')}
          >
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-xs">
              <div className="w-3.5 h-3.5 border-2 border-white rounded-xs rotate-45"></div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-blue-900 font-sans">
                  PREENCHENDO <span className="text-blue-600">AI</span>
                </h1>
                <span className="hidden md:inline px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full">
                  SISTEMA DOCUMENTAL
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Preenchimento Inteligente de Documentos PDF
              </p>
            </div>
          </div>

          {/* Navigation links styled like the Sleek Interface tabs */}
          <nav className="hidden md:flex items-center gap-6">
            <button
              onClick={() => onNavigate('dashboard')}
              className={`text-sm font-medium py-5 transition-colors ${
                currentView === 'dashboard'
                  ? 'text-slate-900 border-b-2 border-blue-600 font-semibold'
                  : 'text-slate-600 hover:text-blue-600'
              }`}
            >
              Documentos & Templates
            </button>

            <button
              onClick={() => onNavigate('form')}
              className={`text-sm font-medium py-5 transition-colors flex items-center gap-1.5 ${
                currentView === 'form'
                  ? 'text-slate-900 border-b-2 border-blue-600 font-semibold'
                  : 'text-slate-600 hover:text-blue-600'
              }`}
            >
              <span>Preencher</span>
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            </button>

            <button
              onClick={() => onNavigate('editor')}
              className={`text-sm font-medium py-5 transition-colors flex items-center gap-1.5 ${
                currentView === 'editor'
                  ? 'text-slate-900 border-b-2 border-blue-600 font-semibold'
                  : 'text-slate-600 hover:text-blue-600'
              }`}
            >
              <span>Calibrador Visual</span>
            </button>

            <button
              onClick={() => onNavigate('history')}
              className={`text-sm font-medium py-5 transition-colors ${
                currentView === 'history'
                  ? 'text-slate-900 border-b-2 border-blue-600 font-semibold'
                  : 'text-slate-600 hover:text-blue-600'
              }`}
            >
              Histórico
            </button>
          </nav>

          {/* Direct Upload Button & Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Primary Direct PDF Upload Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs px-3 sm:px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-sm shadow-blue-200 transition-all transform active:scale-95 cursor-pointer"
              title="Fazer upload de um arquivo PDF do seu computador"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span className="hidden sm:inline">Processando PDF...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4 text-white" />
                  <span>Fazer Upload de PDF</span>
                </>
              )}
            </button>

            {/* Supabase Schema Modal trigger */}
            <button
              onClick={onOpenSchemaModal}
              className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-slate-200"
              title="Ver Estrutura do Banco de Dados Supabase (SQL DDL)"
            >
              <Database className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
