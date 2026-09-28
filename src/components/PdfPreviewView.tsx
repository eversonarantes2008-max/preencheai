import React, { useEffect, useState } from 'react';
import { DocumentTemplate } from '../types/document';
import {
  renderDocumentPdf,
  generateFilename,
} from '../services/pdfGenerator';
import { getMasterPdfBytes } from '../services/templateStore';
import {
  Download,
  Printer,
  ArrowLeft,
  PlusCircle,
  FileCheck,
  CheckCircle2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ShieldCheck,
  Cloud,
  Building2,
  FolderCheck,
  ExternalLink
} from 'lucide-react';
import { SharePointSaveModal } from './SharePointSaveModal';
import { sharePointClient } from '../services/sharePointClientService';
import { extractClientInfo } from '../services/sharepointNormalizer';
import { SharePointDocumentRecord } from '../types/sharepoint';

interface PdfPreviewViewProps {
  template: DocumentTemplate;
  formValues: Record<string, string>;
  onBackToEdit: () => void;
  onNewDocument: () => void;
  onSaveToHistory: (fileName: string, pdfDataUrl: string, bytesLen: number) => void;
}

export const PdfPreviewView: React.FC<PdfPreviewViewProps> = ({
  template,
  formValues,
  onBackToEdit,
  onNewDocument,
  onSaveToHistory,
}) => {
  const [pdfDataUrl, setPdfDataUrl] = useState<string | null>(null);
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [isGenerating, setIsGenerating] = useState(true);
  const [zoom, setZoom] = useState(1.0);
  const [saved, setSaved] = useState(false);
  const [isSharePointModalOpen, setIsSharePointModalOpen] = useState(false);
  const [lastSavedRecord, setLastSavedRecord] = useState<SharePointDocumentRecord | null>(null);

  const currentUser = sharePointClient.getCurrentUser();
  const config = sharePointClient.getConfig();
  const clientInfo = extractClientInfo(formValues);

  const fileName = generateFilename(template.name, formValues);

  // Generate PDF buffer on mount or when values change
  useEffect(() => {
    let isMounted = true;

    async function buildPdf() {
      setIsGenerating(true);
      try {
        const masterBytes = await getMasterPdfBytes(template);
        const overlaidBytes = await renderDocumentPdf(masterBytes, template, formValues);

        if (!isMounted) return;

        setPdfBytes(overlaidBytes);
        const blob = new Blob([overlaidBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        setPdfDataUrl(url);

        // Auto save to history once
        if (!saved) {
          onSaveToHistory(fileName, url, overlaidBytes.byteLength);
          setSaved(true);
        }
      } catch (err) {
        console.error('Error rendering overlaid PDF:', err);
      } finally {
        if (isMounted) setIsGenerating(false);
      }
    }

    buildPdf();

    return () => {
      isMounted = false;
    };
  }, [template, formValues]);

  // Handle real download
  const handleDownload = () => {
    if (!pdfBytes) return;
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle print
  const handlePrint = () => {
    if (!pdfDataUrl) return;
    const printWindow = window.open(pdfDataUrl, '_blank');
    if (printWindow) {
      printWindow.focus();
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-24 text-slate-900">
      {/* Top Action Header Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
              PDF Vetorial Gerado
            </span>
            <span className="text-xs text-slate-500 font-mono">
              {pdfBytes ? `${Math.round(pdfBytes.byteLength / 1024)} KB` : 'Processando...'}
            </span>
          </div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 font-mono truncate" title={fileName}>
            {fileName}
          </h1>
          <p className="text-xs text-slate-500">
            Documento final gerado com preservação do template original e sobreposição precisa de coordenadas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onBackToEdit}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3.5 py-2.5 rounded-lg flex items-center gap-1.5 border border-slate-200 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar e Editar</span>
          </button>

          <button
            onClick={handlePrint}
            disabled={isGenerating}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3.5 py-2.5 rounded-lg flex items-center gap-1.5 border border-slate-200 transition-colors cursor-pointer"
            title="Imprimir Documento"
          >
            <Printer className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">Imprimir</span>
          </button>

          <button
            onClick={handleDownload}
            disabled={isGenerating}
            className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-4 py-2.5 rounded-lg flex items-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Baixar PDF</span>
          </button>

          {/* SharePoint Dahruj Primary Action Button */}
          <button
            onClick={() => setIsSharePointModalOpen(true)}
            disabled={isGenerating}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-sm shadow-blue-200 transition-all transform active:scale-95 cursor-pointer"
            title="Salvar na estrutura de pastas corporativa do SharePoint Dahruj GWM"
          >
            <Cloud className="w-4 h-4 text-white" />
            <span>Salvar no SharePoint Dahruj</span>
          </button>

          <button
            onClick={onNewDocument}
            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold px-3.5 py-2.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
            title="Iniciar novo preenchimento em branco"
          >
            <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Novo</span>
          </button>
        </div>
      </div>

      {/* SharePoint Dahruj GWM Integration Banner (After Document Generation) */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-blue-800/40">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center shrink-0">
            <Cloud className="w-5 h-5 text-blue-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-300">
                SharePoint Dahruj GWM • Repositório Corporativo
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400" title="Online" />
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-300 mt-1">
              <span>Unidade: <strong>{currentUser.unit}</strong></span>
              <span aria-hidden="true">•</span>
              <span>Cliente: <strong>{clientInfo.originalName}</strong></span>
              <span aria-hidden="true">•</span>
              <span>Pasta: <code className="text-blue-200 font-mono text-[11px]">{config.rootFolder}/{currentUser.unit}/{clientInfo.normalizedName}/</code></span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {lastSavedRecord ? (
            <a
              href={lastSavedRecord.webUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-sm transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Ver no SharePoint</span>
            </a>
          ) : (
            <button
              onClick={() => setIsSharePointModalOpen(true)}
              disabled={isGenerating}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Cloud className="w-3.5 h-3.5" />
              <span>Armazenar no SharePoint</span>
            </button>
          )}
        </div>
      </div>

      {/* Security & Authenticity Banner */}
      <div className="p-3.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between text-xs text-slate-600 shadow-xs">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Layout Master Protegido • Padrão A4 Retrato (595.32 × 841.92 pt)</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom((z) => Math.max(0.7, z - 0.1))}
            className="p-1 text-slate-500 hover:text-slate-900 cursor-pointer"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="font-mono text-slate-800 font-semibold">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom((z) => Math.min(1.4, z + 0.1))}
            className="p-1 text-slate-500 hover:text-slate-900 cursor-pointer"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* PDF View Container */}
      <div className="bg-slate-200/90 border border-slate-300 rounded-xl p-6 flex justify-center shadow-inner overflow-auto min-h-[750px]">
        {isGenerating ? (
          <div className="flex flex-col items-center justify-center space-y-3 py-24 text-slate-500 text-xs">
            <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="font-semibold text-slate-800">Gerando sobreposição vetorial do PDF...</p>
            <p className="text-[11px] text-slate-500">Calculando posições de coordenadas milimétricas</p>
          </div>
        ) : pdfDataUrl ? (
          <div
            className="transition-transform duration-200 shadow-2xl rounded overflow-hidden border border-slate-300 bg-white"
            style={{
              width: `${595.32 * zoom}px`,
              height: `${841.92 * zoom}px`,
            }}
          >
            <iframe
              src={`${pdfDataUrl}#toolbar=0&navpanes=0`}
              title="Pré-visualização do PDF"
              className="w-full h-full border-none"
            />
          </div>
        ) : (
          <div className="text-center py-20 text-slate-500 text-xs">
            Erro ao carregar pré-visualização do PDF.
          </div>
        )}
      </div>

      {/* SharePoint Save Workflow Modal */}
      <SharePointSaveModal
        isOpen={isSharePointModalOpen}
        onClose={() => setIsSharePointModalOpen(false)}
        pdfBytes={pdfBytes}
        formValues={formValues}
        templateName={template.name}
        onSavedSuccess={(rec) => {
          setLastSavedRecord(rec);
        }}
      />
    </div>
  );
};

