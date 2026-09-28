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
  Loader2,
  Cloud,
  Building2,
  User,
  Settings
} from 'lucide-react';
import { processUploadedPdf } from '../services/pdfUploadService';
import { DocumentTemplate } from '../types/document';
import { UserProfile } from '../types/sharepoint';
import { sharePointClient } from '../services/sharePointClientService';

interface NavbarProps {
  currentView: 'dashboard' | 'form' | 'editor' | 'preview' | 'history' | 'sharepoint';
  onNavigate: (view: 'dashboard' | 'form' | 'editor' | 'preview' | 'history' | 'sharepoint') => void;
  isAdmin: boolean;
  onToggleAdmin: () => void;
  onOpenTeachModal: () => void;
  onOpenSchemaModal: () => void;
  onOpenSharePointAdmin: () => void;
  currentUser: UserProfile;
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
  onOpenSharePointAdmin,
  currentUser,
  activeTemplateName,
  onPdfUploaded,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const config = sharePointClient.getConfig();

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
            className="flex items-center gap-2.5 cursor-pointer select-none"
            onClick={() => onNavigate('dashboard')}
          >
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-xs">
              <div className="w-3.5 h-3.5 border-2 border-white rounded-xs rotate-45"></div>
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-slate-900 leading-tight">
                PRENCHE
              </span>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Dahruj GWM
              </span>
            </div>
          </div>

          {/* Navigation links */}
          <nav className="hidden lg:flex items-center gap-6">
            <button
              onClick={() => onNavigate('dashboard')}
              className={`text-sm font-medium py-5 transition-colors whitespace-nowrap cursor-pointer ${
                currentView === 'dashboard'
                  ? 'text-slate-900 border-b-2 border-blue-600 font-semibold'
                  : 'text-slate-600 hover:text-blue-600'
              }`}
            >
              Documentos
            </button>

            <button
              onClick={() => onNavigate('form')}
              className={`text-sm font-medium py-5 transition-colors whitespace-nowrap cursor-pointer ${
                currentView === 'form'
                  ? 'text-slate-900 border-b-2 border-blue-600 font-semibold'
                  : 'text-slate-600 hover:text-blue-600'
              }`}
            >
              Preencher
            </button>

            <button
              onClick={() => onNavigate('sharepoint')}
              className={`text-sm font-medium py-5 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                currentView === 'sharepoint'
                  ? 'text-slate-900 border-b-2 border-blue-600 font-semibold'
                  : 'text-slate-600 hover:text-blue-600'
              }`}
            >
              <Cloud className="w-4 h-4 text-blue-600" />
              <span>SharePoint Dahruj</span>
            </button>

            <button
              onClick={() => onNavigate('editor')}
              className={`text-sm font-medium py-5 transition-colors whitespace-nowrap cursor-pointer ${
                currentView === 'editor'
                  ? 'text-slate-900 border-b-2 border-blue-600 font-semibold'
                  : 'text-slate-600 hover:text-blue-600'
              }`}
            >
              Calibrador
            </button>

            <button
              onClick={() => onNavigate('history')}
              className={`text-sm font-medium py-5 transition-colors whitespace-nowrap cursor-pointer ${
                currentView === 'history'
                  ? 'text-slate-900 border-b-2 border-blue-600 font-semibold'
                  : 'text-slate-600 hover:text-blue-600'
              }`}
            >
              Histórico
            </button>
          </nav>

          {/* User Profile & Direct Upload Button & Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* User & Unit Profile Indicator */}
            <button
              type="button"
              onClick={onOpenSharePointAdmin}
              className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-lg text-xs transition-colors cursor-pointer text-left"
              title="Clique para gerenciar unidade, perfil ou integrações do SharePoint"
            >
              <div className="w-6 h-6 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px]">
                {currentUser.name.charAt(0)}
              </div>
              <div className="leading-tight">
                <span className="font-bold text-slate-800 block text-[11px] truncate max-w-[120px]">
                  {currentUser.name}
                </span>
                <span className="text-[10px] text-slate-500 flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-blue-600" /> {currentUser.unit}
                </span>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="SharePoint Dahruj Conectado" />
            </button>

            {/* SharePoint Admin button */}
            <button
              type="button"
              onClick={onOpenSharePointAdmin}
              className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-slate-200 cursor-pointer"
              title="Painel de Integração SharePoint Dahruj GWM"
            >
              <Cloud className="w-4 h-4 text-blue-600" />
            </button>

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
                  <span className="hidden sm:inline">Processando...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4 text-white" />
                  <span>Upload PDF</span>
                </>
              )}
            </button>

            {/* Supabase Schema Modal trigger */}
            <button
              onClick={onOpenSchemaModal}
              className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-slate-200 cursor-pointer"
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

