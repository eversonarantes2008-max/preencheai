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
  ShieldCheck
} from 'lucide-react';

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
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3.5 py-2.5 rounded-lg flex items-center gap-1.5 border border-slate-200 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar e Editar</span>
          </button>

          <button
            onClick={handlePrint}
            disabled={isGenerating}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3.5 py-2.5 rounded-lg flex items-center gap-1.5 border border-slate-200 transition-colors"
            title="Imprimir Documento"
          >
            <Printer className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">Imprimir</span>
          </button>

          <button
            onClick={handleDownload}
            disabled={isGenerating}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-sm shadow-blue-200 transition-all transform active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Baixar PDF Oficial</span>
          </button>

          <button
            onClick={onNewDocument}
            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold px-3.5 py-2.5 rounded-lg flex items-center gap-1.5 transition-all"
            title="Iniciar novo preenchimento em branco"
          >
            <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Novo Documento</span>
          </button>
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
            className="p-1 text-slate-500 hover:text-slate-900"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="font-mono text-slate-800 font-semibold">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom((z) => Math.min(1.4, z + 0.1))}
            className="p-1 text-slate-500 hover:text-slate-900"
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
    </div>
  );
};
