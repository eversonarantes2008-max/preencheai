import React, { useState } from 'react';
import { GeneratedDocument, DocumentTemplate } from '../types/document';
import {
  History,
  Search,
  Download,
  Copy,
  Trash2,
  FileText,
  Calendar,
  ShieldCheck,
  ArrowRight,
  ExternalLink
} from 'lucide-react';

interface DocumentHistoryViewProps {
  documents: GeneratedDocument[];
  templates: DocumentTemplate[];
  onDownload: (doc: GeneratedDocument) => void;
  onDuplicateToForm: (doc: GeneratedDocument) => void;
  onDelete: (docId: string) => void;
  onClearAll?: () => void;
  onNavigateToForm: () => void;
}

export const DocumentHistoryView: React.FC<DocumentHistoryViewProps> = ({
  documents,
  templates: _templates,
  onDownload,
  onDuplicateToForm,
  onDelete,
  onClearAll,
  onNavigateToForm,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = documents.filter((d) => {
    const term = searchTerm.toLowerCase();
    const nameMatch = (d.file_name || '').toLowerCase().includes(term);
    const templateMatch = (d.template_name || '').toLowerCase().includes(term);
    const declMatch = (d.values?.declarante_nome || '').toLowerCase().includes(term);
    const plateMatch = (d.values?.veiculo_placa || '').toLowerCase().includes(term);
    return nameMatch || templateMatch || declMatch || plateMatch;
  });

  const handleDeleteSingle = (doc: GeneratedDocument) => {
    if (window.confirm(`Deseja realmente excluir o arquivo "${doc.file_name}" do histórico?`)) {
      onDelete(doc.id);
    }
  };

  const handleClearAll = () => {
    if (window.confirm(`Tem certeza que deseja excluir permanentemente todos os ${documents.length} arquivos do histórico?`)) {
      if (onClearAll) onClearAll();
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Histórico de Documentos Gerados
            </h1>
            <p className="text-xs text-slate-500">
              Registros e downloads de todos os PDFs gerados pelo PREENCHENDO AI ({documents.length} {documents.length === 1 ? 'arquivo' : 'arquivos'})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {documents.length > 0 && onClearAll && (
            <button
              onClick={handleClearAll}
              className="bg-white hover:bg-rose-50 border border-rose-200 text-rose-600 hover:text-rose-700 font-semibold text-xs px-3.5 py-2.5 rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
              title="Excluir todos os arquivos do histórico"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
              <span>Excluir Todos</span>
            </button>
          )}

          <button
            onClick={onNavigateToForm}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg flex items-center gap-2 shadow-sm shadow-blue-200 transition-all cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>+ Novo Preenchimento</span>
          </button>
        </div>
      </div>

      {/* Search Filter Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5 pointer-events-none" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por nome do declarante, placa, modelo ou nome do arquivo..."
          className="w-full bg-white border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-xs"
        />
      </div>

      {/* Table / List */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        {filtered.length === 0 ? (
          <div className="py-16 text-center space-y-3 text-slate-400 text-xs">
            <FileText className="w-10 h-10 mx-auto opacity-30 text-slate-400" />
            <p className="font-semibold text-slate-700">Nenhum documento encontrado.</p>
            <p className="text-[11px] text-slate-400">
              {searchTerm ? 'Tente buscar com outros termos.' : 'Gere seu primeiro documento para visualizá-lo aqui.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((doc) => {
              const declarante = doc.values?.declarante_nome || 'Não informado';
              const placa = doc.values?.veiculo_placa || 'Sem placa';
              const veiculo = `${doc.values?.veiculo_marca || ''} ${doc.values?.veiculo_modelo || ''}`.trim() || 'Veículo';

              return (
                <div
                  key={doc.id}
                  className="p-4 sm:p-5 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 truncate">
                        {doc.file_name}
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {doc.status === 'completed' ? 'CONCLUÍDO' : doc.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span>Declarante: <strong className="text-slate-800 font-semibold">{declarante}</strong></span>
                      <span>Veículo: <strong className="text-slate-800 font-semibold">{veiculo} ({placa})</strong></span>
                      <span>Data: {new Date(doc.created_at).toLocaleString('pt-BR')}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => onDuplicateToForm(doc)}
                      className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-slate-200"
                      title="Copiar dados para novo preenchimento"
                    >
                      <Copy className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onDownload(doc)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
                      title="Baixar PDF Gerado"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Baixar PDF</span>
                    </button>

                    <button
                      onClick={() => handleDeleteSingle(doc)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-200 cursor-pointer"
                      title="Excluir este arquivo gerado"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
