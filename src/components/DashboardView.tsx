import React, { useRef, useState } from 'react';
import {
  FileText,
  Sparkles,
  Sliders,
  UploadCloud,
  CheckCircle2,
  Clock,
  ArrowRight,
  Download,
  Copy,
  Layers,
  ChevronRight,
  ShieldCheck,
  Cpu,
  Trash2,
  Loader2,
  FileCheck2,
  Plus
} from 'lucide-react';
import { DocumentTemplate, GeneratedDocument } from '../types/document';
import { processUploadedPdf } from '../services/pdfUploadService';

interface DashboardViewProps {
  templates: DocumentTemplate[];
  recentDocuments: GeneratedDocument[];
  onSelectTemplate: (template: DocumentTemplate) => void;
  onOpenTeachModal: () => void;
  onOpenCalibrator: (template: DocumentTemplate) => void;
  onFillExample: () => void;
  onDownloadHistoryDoc: (doc: GeneratedDocument) => void;
  onPdfUploaded: (template: DocumentTemplate) => void;
  onDeleteTemplate?: (templateId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  templates,
  recentDocuments,
  onSelectTemplate,
  onOpenTeachModal,
  onOpenCalibrator,
  onFillExample,
  onDownloadHistoryDoc,
  onPdfUploaded,
  onDeleteTemplate,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const defaultTemplate = templates.find((t) => t.id === 'template_termo_responsabilidade') || templates[0];

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

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      alert('Por favor, envie um arquivo com extensão .pdf');
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
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Hidden File Input for Dashboard */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Main Upload Dropzone Banner */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`relative overflow-hidden rounded-2xl border-2 transition-all p-6 sm:p-8 ${
          dragOver
            ? 'border-blue-600 bg-blue-50/80 ring-4 ring-blue-100'
            : 'border-slate-200 bg-white hover:border-blue-300 shadow-xs'
        }`}
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider">
              <UploadCloud className="w-3.5 h-3.5 text-blue-600" />
              Upload Direto de Arquivo PDF
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Faça upload do seu documento PDF oficial
            </h1>

            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
              Arraste seu arquivo PDF aqui ou clique no botão abaixo. O arquivo enviado será definido como modelo padrão para preenchimento, calibração milimétrica e geração oficial.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto flex-shrink-0">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold px-6 py-3.5 rounded-xl shadow-md shadow-blue-200 flex items-center justify-center gap-2 text-sm transition-all transform active:scale-95 cursor-pointer"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Processando PDF...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4 text-white" />
                  <span>Selecionar Arquivo PDF</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3.5 shadow-xs">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900 font-mono">100%</div>
            <div className="text-[11px] text-slate-500 font-medium">Preservação do PDF Original</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3.5 shadow-xs">
          <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900 font-mono">{templates.length}</div>
            <div className="text-[11px] text-slate-500 font-medium">PDFs Cadastrados</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3.5 shadow-xs">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900 font-mono">Gemini 3.7</div>
            <div className="text-[11px] text-slate-500 font-medium">Extração Inteligente por IA</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3.5 shadow-xs">
          <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900 font-mono">{recentDocuments.length}</div>
            <div className="text-[11px] text-slate-500 font-medium">Documentos Gerados</div>
          </div>
        </div>
      </div>

      {/* Main Content Grid: Templates + Recent Documents */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Templates Section (2 cols on large) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                Seus Arquivos PDF e Modelos Ativos
              </h2>
              <p className="text-xs text-slate-500">
                Selecione um PDF para preencher os dados ou calibrar as coordenadas
              </p>
            </div>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 hover:underline cursor-pointer"
            >
              + Upload de Novo PDF
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((template) => (
              <div
                key={template.id}
                className="bg-white border border-slate-200 hover:border-blue-400 rounded-xl p-5 transition-all shadow-xs flex flex-col justify-between group relative"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 font-bold text-xs">
                      PDF
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                        {template.is_built_in ? 'PADRÃO INICIAL' : 'PDF DO USUÁRIO'}
                      </span>
                      {onDeleteTemplate && !template.is_built_in && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Deseja remover o modelo "${template.name}"?`)) {
                              onDeleteTemplate(template.id);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                          title="Remover este arquivo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
                    {template.name}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1 mb-4">
                    {template.description || 'Arquivo PDF estruturado para preenchimento de campos.'}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-slate-500 border-t border-slate-100 pt-3 mb-4">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Campos</span>
                      <span className="text-slate-800 font-semibold">{template.fields.length} campos</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Dimensões</span>
                      <span className="text-slate-800 font-semibold">{Math.round(template.page_width)} × {Math.round(template.page_height)} pt</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Páginas</span>
                      <span className="text-slate-800 font-semibold">{template.page_count} pág</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => onSelectTemplate(template)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Preencher Dados</span>
                  </button>
                  <button
                    onClick={() => onOpenCalibrator(template)}
                    title="Calibrar Coordenadas dos Campos sobre o PDF"
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-1 border border-slate-200 font-medium transition-colors cursor-pointer"
                  >
                    <Sliders className="w-3.5 h-3.5 text-slate-600" />
                    <span>Calibrar</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Documents History Sidebar */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              Documentos Recentes
            </h2>
            <span className="text-xs text-slate-400 font-medium">{recentDocuments.length} itens</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
            {recentDocuments.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs space-y-2">
                <FileText className="w-8 h-8 mx-auto opacity-40 text-slate-400" />
                <p className="font-medium text-slate-600">Nenhum documento gerado ainda.</p>
                <p className="text-[11px] text-slate-400">
                  Faça upload do seu PDF ou selecione um modelo para gerar o documento oficial.
                </p>
              </div>
            ) : (
              recentDocuments.slice(0, 5).map((doc) => (
                <div
                  key={doc.id}
                  className="bg-slate-50 hover:bg-blue-50/50 border border-slate-200/80 rounded-lg p-3 transition-colors flex items-center justify-between gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-slate-800 truncate" title={doc.file_name}>
                      {doc.file_name}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1">
                      <span>{new Date(doc.created_at).toLocaleDateString('pt-BR')}</span>
                      <span>•</span>
                      <span className="text-emerald-600 font-semibold">Pronto</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onDownloadHistoryDoc(doc)}
                      title="Baixar PDF"
                      className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-md transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}

            {recentDocuments.length > 0 && (
              <div className="pt-2 text-center border-t border-slate-100">
                <span className="text-[11px] text-slate-400">
                  Histórico salvo localmente com segurança
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
