import React, { useRef, useState, useMemo } from 'react';
import {
  FileText,
  Sparkles,
  Sliders,
  UploadCloud,
  Clock,
  ArrowRight,
  Download,
  Trash2,
  Loader2,
  Search,
  CheckCircle2,
  FileCheck2,
  History,
  FolderOpen,
  Tag,
  X
} from 'lucide-react';
import { DocumentTemplate, GeneratedDocument } from '../types/document';
import { processUploadedPdf } from '../services/pdfUploadService';
import { ManageTagsModal } from './ManageTagsModal';
import { Cloud, Building2 } from 'lucide-react';
import { sharePointClient } from '../services/sharePointClientService';

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
  onDeleteHistoryDoc?: (docId: string) => void;
  onClearAllHistory?: () => void;
  onNavigateView?: (view: 'dashboard' | 'form' | 'editor' | 'preview' | 'history' | 'sharepoint') => void;
  onUpdateTemplateTags?: (templateId: string, tags: string[]) => void;
}

export const getTagColorClass = (tag: string, isSelected: boolean = false) => {
  if (isSelected) {
    return 'bg-blue-600 text-white font-semibold shadow-2xs border-blue-600';
  }
  const lower = tag.toLowerCase().trim();
  if (lower === 'legal' || lower === 'jurídico' || lower === 'juridico') {
    return 'bg-indigo-50/80 text-indigo-700 hover:bg-indigo-100/90 border border-indigo-200/70';
  }
  if (lower === 'hr' || lower === 'rh' || lower === 'recursos humanos') {
    return 'bg-purple-50/80 text-purple-700 hover:bg-purple-100/90 border border-purple-200/70';
  }
  if (lower === 'sales' || lower === 'vendas' || lower === 'comercial') {
    return 'bg-emerald-50/80 text-emerald-700 hover:bg-emerald-100/90 border border-emerald-200/70';
  }
  if (lower === 'finance' || lower === 'financeiro') {
    return 'bg-amber-50/80 text-amber-800 hover:bg-amber-100/90 border border-amber-200/70';
  }
  if (lower === 'compliance' || lower === 'operações' || lower === 'operacoes' || lower === 'operations') {
    return 'bg-cyan-50/80 text-cyan-800 hover:bg-cyan-100/90 border border-cyan-200/70';
  }
  if (lower === 'upload' || lower === 'personalizado') {
    return 'bg-sky-50/80 text-sky-700 hover:bg-sky-100/90 border border-sky-200/70';
  }
  return 'bg-slate-100/90 text-slate-700 hover:bg-slate-200/90 border border-slate-200/80';
};

export const DashboardView: React.FC<DashboardViewProps> = ({
  templates,
  recentDocuments,
  onSelectTemplate,
  onOpenCalibrator,
  onFillExample,
  onDownloadHistoryDoc,
  onPdfUploaded,
  onDeleteTemplate,
  onDeleteHistoryDoc,
  onClearAllHistory,
  onNavigateView,
  onUpdateTemplateTags,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'builtin' | 'custom'>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [tagModalTemplate, setTagModalTemplate] = useState<DocumentTemplate | null>(null);

  const defaultTemplate = useMemo(() => {
    return (
      templates.find((t) => t.id === 'template_comodato_veiculo') ||
      templates[0]
    );
  }, [templates]);

  // Compute all tags and frequency counts across all templates
  const allTagsWithCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    templates.forEach((t) => {
      (t.tags || []).forEach((tag) => {
        const trimmed = tag.trim();
        if (trimmed) {
          counts[trimmed] = (counts[trimmed] || 0) + 1;
        }
      });
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [templates]);

  const allExistingTagNames = useMemo(() => {
    return allTagsWithCounts.map(([name]) => name);
  }, [allTagsWithCounts]);

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

  // Filter templates based on search, official/custom category, and selected tag
  const filteredTemplates = useMemo(() => {
    return templates.filter((template) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        template.name.toLowerCase().includes(q) ||
        (template.description && template.description.toLowerCase().includes(q)) ||
        (template.tags && template.tags.some((t) => t.toLowerCase().includes(q)));

      if (!matchesSearch) return false;

      if (selectedFilter === 'builtin' && !template.is_built_in) return false;
      if (selectedFilter === 'custom' && template.is_built_in) return false;

      if (selectedTag !== 'all') {
        if (!template.tags || !template.tags.includes(selectedTag)) {
          return false;
        }
      }

      return true;
    });
  }, [templates, searchQuery, selectedFilter, selectedTag]);

  // Determine if default template is prominently featured or filtered out
  const isFeaturedCardVisible = useMemo(() => {
    if (!defaultTemplate) return false;

    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      defaultTemplate.name.toLowerCase().includes(q) ||
      (defaultTemplate.description && defaultTemplate.description.toLowerCase().includes(q)) ||
      (defaultTemplate.tags && defaultTemplate.tags.some((t) => t.toLowerCase().includes(q)));

    if (!matchesSearch) return false;

    if (selectedFilter === 'builtin' && !defaultTemplate.is_built_in) return false;
    if (selectedFilter === 'custom' && defaultTemplate.is_built_in) return false;

    if (selectedTag !== 'all') {
      if (!defaultTemplate.tags || !defaultTemplate.tags.includes(selectedTag)) {
        return false;
      }
    }

    return true;
  }, [defaultTemplate, searchQuery, selectedFilter, selectedTag]);

  // In the catalog grid, display templates excluding defaultTemplate ONLY if defaultTemplate is already in the featured hero card
  const displayedGridTemplates = useMemo(() => {
    if (isFeaturedCardVisible && defaultTemplate) {
      return filteredTemplates.filter((t) => t.id !== defaultTemplate.id);
    }
    return filteredTemplates;
  }, [filteredTemplates, isFeaturedCardVisible, defaultTemplate]);

  const handleOpenTagModal = (template: DocumentTemplate) => {
    setTagModalTemplate(template);
    setIsTagModalOpen(true);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Header Section: Clean & Professional Title */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Central de Documentos
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Selecione o documento para preencher os dados, organize por etiquetas ou importe novos PDFs.
          </p>
        </div>

        {/* Quick Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nome, descrição ou etiqueta..."
            className="w-full pl-9 pr-8 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-medium p-0.5 rounded cursor-pointer"
              title="Limpar busca"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Banner Corporativo Dahruj GWM SharePoint */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white rounded-2xl p-5 shadow-sm border border-blue-900/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center shrink-0">
            <Cloud className="w-6 h-6 text-blue-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-300">
                Armazenamento Corporativo SharePoint • Dahruj GWM
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400" title="Ativo" />
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Organização automática por filial (<strong>Jundiaí, Campinas, Sorocaba</strong>) e pasta individual por cliente com versionamento independente por tipo de documento.
            </p>
          </div>
        </div>

        {onNavigateView && (
          <button
            type="button"
            onClick={() => onNavigateView('sharepoint')}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2.5 rounded-lg flex items-center gap-1.5 transition-all shadow-sm shrink-0 cursor-pointer"
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>Acessar Arquivos no SharePoint</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Menu com Opções Rápidas */}
      <div className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Menu de Opções Rápidas
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Opção 1: Preenchimento do Modelo Padrão */}
          <button
            onClick={() => {
              if (defaultTemplate) onSelectTemplate(defaultTemplate);
            }}
            className="text-left bg-white border border-slate-200 hover:border-blue-500 hover:bg-blue-50/20 rounded-xl p-4 transition-all group flex flex-col justify-between shadow-xs cursor-pointer"
          >
            <div>
              <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <FileText className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                Preencher Documento Padrão
              </h3>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                Instrumento Particular de Comodato de Veículo (7 páginas oficiais).
              </p>
            </div>
            <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-blue-600">
              <span>Iniciar preenchimento</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>

          {/* Opção 2: Fazer Upload de PDF */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="text-left bg-white border border-slate-200 hover:border-blue-500 hover:bg-blue-50/20 rounded-xl p-4 transition-all group flex flex-col justify-between shadow-xs cursor-pointer"
          >
            <div>
              <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                {isUploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <UploadCloud className="w-4 h-4" />
                )}
              </div>
              <h3 className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                Importar Novo PDF
              </h3>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                Envie qualquer arquivo PDF para definir como modelo de preenchimento.
              </p>
            </div>
            <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-indigo-600">
              <span>{isUploading ? 'Processando...' : 'Selecionar arquivo'}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>

          {/* Opção 3: Preencher com Dados de Teste */}
          <button
            onClick={onFillExample}
            className="text-left bg-white border border-slate-200 hover:border-amber-500 hover:bg-amber-50/20 rounded-xl p-4 transition-all group flex flex-col justify-between shadow-xs cursor-pointer"
          >
            <div>
              <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900 group-hover:text-amber-700 transition-colors">
                Preencher com Exemplo
              </h3>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                Carrega dados válidos de demonstração para testar a geração do PDF.
              </p>
            </div>
            <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-amber-700">
              <span>Carregar teste</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>

          {/* Opção 4: Histórico de Documentos Gerados */}
          <button
            onClick={() => {
              if (onNavigateView) onNavigateView('history');
            }}
            className="text-left bg-white border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/20 rounded-xl p-4 transition-all group flex flex-col justify-between shadow-xs cursor-pointer"
          >
            <div>
              <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <History className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors">
                Histórico & Downloads
              </h3>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                {recentDocuments.length > 0
                  ? `${recentDocuments.length} documento(s) gerado(s) pronto(s) para download.`
                  : 'Acesse e consulte todos os documentos PDF gerados.'}
              </p>
            </div>
            <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-emerald-700">
              <span>Ver histórico</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>
        </div>
      </div>

      {/* Documento Principal em Destaque (Comodato de Veículo) */}
      {isFeaturedCardVisible && defaultTemplate && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Documento Padrão Principal
            </h2>
            <span className="text-xs text-blue-600 font-medium">
              Calibração Milimétrica Preservada
            </span>
          </div>

          <div className="bg-white border-2 border-blue-500/80 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                  PDF
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 leading-snug">
                    {defaultTemplate.name}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                    <span className="font-semibold text-blue-700">Modelo Oficial Padrão</span>
                    <span aria-hidden="true">·</span>
                    <span>{defaultTemplate.page_count} páginas</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">{defaultTemplate.fields.length} campos</span>
                    <span aria-hidden="true">·</span>
                    <span>Diagramação 100% Intacta</span>
                  </div>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {defaultTemplate.description ||
                  'Instrumento de 7 páginas de comodato de veículo com cláusulas de conformidade, termos e dados de comodatária.'}
              </p>

              {/* Tags for Default Template */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  <span>Etiquetas:</span>
                </span>
                {defaultTemplate.tags && defaultTemplate.tags.length > 0 ? (
                  defaultTemplate.tags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setSelectedTag(selectedTag === tag ? 'all' : tag)}
                      className={`text-[11px] font-medium px-2 py-0.5 rounded-md transition-colors cursor-pointer ${getTagColorClass(
                        tag,
                        selectedTag === tag
                      )}`}
                      title={`Filtrar documentos por etiqueta "${tag}"`}
                    >
                      {tag}
                    </button>
                  ))
                ) : (
                  <span className="text-[11px] text-slate-400 italic">Sem etiquetas</span>
                )}
                <button
                  type="button"
                  onClick={() => handleOpenTagModal(defaultTemplate)}
                  className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 font-medium px-2 py-0.5 rounded hover:bg-blue-50 transition-colors cursor-pointer"
                  title="Editar etiquetas deste documento"
                >
                  <Tag className="w-3 h-3" />
                  <span>Editar etiquetas</span>
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
              <button
                onClick={() => onSelectTemplate(defaultTemplate)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm py-2.5 px-5 rounded-lg flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer whitespace-nowrap"
              >
                <FileCheck2 className="w-4 h-4" />
                <span>Preencher Este Documento</span>
              </button>

              <button
                onClick={() => onOpenCalibrator(defaultTemplate)}
                title="Ajustar coordenadas dos campos sobre o PDF"
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm py-2.5 px-4 rounded-lg flex items-center justify-center gap-1.5 border border-slate-200 font-medium transition-colors cursor-pointer whitespace-nowrap"
              >
                <Sliders className="w-4 h-4 text-slate-600" />
                <span>Calibrar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Documentos a Serem Preenchidos */}
      <div className="space-y-4">
        {/* Section Header & Official/Custom Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Documentos a Serem Preenchidos
            </h2>
            <p className="text-xs text-slate-500">
              Selecione qualquer documento do catálogo para preencher os dados cadastrais
            </p>
          </div>

          {/* Interactive filter control (Todos / Oficiais / Enviados) */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg shrink-0">
            <button
              onClick={() => setSelectedFilter('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                selectedFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos ({templates.length})
            </button>
            <button
              onClick={() => setSelectedFilter('builtin')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                selectedFilter === 'builtin'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Oficiais
            </button>
            <button
              onClick={() => setSelectedFilter('custom')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                selectedFilter === 'custom'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Enviados ({templates.filter((t) => !t.is_built_in).length})
            </button>
          </div>
        </div>

        {/* Tag Filtering Bar: Categorize and filter templates by labels like Legal, HR, Sales */}
        <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-100/70 border border-slate-200/80 rounded-xl">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 px-2 shrink-0">
            <Tag className="w-3.5 h-3.5 text-slate-400" />
            <span>Filtrar por Etiqueta:</span>
          </div>

          <button
            type="button"
            onClick={() => setSelectedTag('all')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer shrink-0 ${
              selectedTag === 'all'
                ? 'bg-slate-900 text-white shadow-2xs font-semibold'
                : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200/80'
            }`}
          >
            Todas as Etiquetas ({templates.length})
          </button>

          {allTagsWithCounts.map(([tag, count]) => {
            const isSelected = selectedTag === tag;
            return (
              <button
                key={tag}
                type="button"
                onClick={() => setSelectedTag(isSelected ? 'all' : tag)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer shrink-0 ${getTagColorClass(
                  tag,
                  isSelected
                )}`}
                title={`Filtrar por etiqueta "${tag}" (${count} documentos)`}
              >
                <span>{tag}</span>
                <span
                  className={`text-[10px] font-mono rounded px-1 ${
                    isSelected
                      ? 'bg-blue-700/60 text-white'
                      : 'bg-black/5 text-slate-600 font-semibold'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}

          {selectedTag !== 'all' && (
            <button
              type="button"
              onClick={() => setSelectedTag('all')}
              className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-medium px-2 py-1 rounded hover:bg-rose-50 transition-colors ml-auto cursor-pointer shrink-0"
              title="Limpar filtro de etiqueta"
            >
              <X className="w-3.5 h-3.5" />
              <span>Limpar etiqueta</span>
            </button>
          )}
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedGridTemplates.map((template) => (
            <div
              key={template.id}
              className="bg-white border border-slate-200 hover:border-blue-400 rounded-xl p-4 transition-all shadow-xs flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 text-xs font-bold">
                      PDF
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium">
                      <span>{template.page_count} pág</span>
                      <span className="mx-1.5" aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">{template.fields.length} campos</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenTagModal(template);
                      }}
                      className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                      title="Gerenciar etiquetas deste documento"
                    >
                      <Tag className="w-3.5 h-3.5" />
                    </button>

                    {onDeleteTemplate && !template.is_built_in && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Deseja remover o modelo "${template.name}"?`)) {
                            onDeleteTemplate(template.id);
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                        title="Excluir este documento"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <h3 className="font-semibold text-sm text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                  {template.name}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2 mt-1 mb-2">
                  {template.description || 'Documento PDF com campos estruturados para preenchimento oficial.'}
                </p>

                {/* Tags on Card */}
                <div className="flex flex-wrap items-center gap-1 mb-3">
                  {template.tags && template.tags.length > 0 ? (
                    template.tags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTag(selectedTag === tag ? 'all' : tag);
                        }}
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-md transition-colors cursor-pointer ${getTagColorClass(
                          tag,
                          selectedTag === tag
                        )}`}
                        title={`Filtrar por etiqueta "${tag}"`}
                      >
                        {tag}
                      </button>
                    ))
                  ) : (
                    <span className="text-[10px] text-slate-400 italic">Sem etiquetas</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => onSelectTemplate(template)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Preencher</span>
                </button>
                <button
                  onClick={() => onOpenCalibrator(template)}
                  title="Ajustar coordenadas dos campos"
                  className="bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-1 border border-slate-200 font-medium transition-colors cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Calibrar</span>
                </button>
              </div>
            </div>
          ))}

          {/* Drag & Drop / Upload Card in the Grid */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-5 transition-all flex flex-col items-center justify-center text-center cursor-pointer min-h-[160px] ${
              dragOver
                ? 'border-blue-600 bg-blue-50/80 ring-2 ring-blue-200'
                : 'border-slate-200 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/30'
            }`}
          >
            <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 text-slate-500 flex items-center justify-center mb-2 shadow-xs">
              {isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              ) : (
                <UploadCloud className="w-4 h-4 text-blue-600" />
              )}
            </div>
            <span className="text-xs font-semibold text-slate-800">
              {isUploading ? 'Processando PDF...' : '+ Adicionar Novo Arquivo PDF'}
            </span>
            <span className="text-[11px] text-slate-400 mt-0.5">
              Clique ou arraste um arquivo PDF para este local
            </span>
          </div>
        </div>

        {displayedGridTemplates.length === 0 && !isFeaturedCardVisible && (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
            <FolderOpen className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-700">Nenhum documento encontrado</p>
            <p className="text-xs text-slate-400 mt-1">
              {selectedTag !== 'all'
                ? `Nenhum documento com a etiqueta "${selectedTag}".`
                : 'Tente ajustar o termo da busca ou o filtro selecionado.'}
            </p>
            {selectedTag !== 'all' && (
              <button
                type="button"
                onClick={() => setSelectedTag('all')}
                className="mt-3 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 rounded-lg transition-colors cursor-pointer"
              >
                Limpar filtro de etiqueta
              </button>
            )}
          </div>
        )}
      </div>

      {/* Histórico Recente de Documentos Preenchidos */}
      {recentDocuments.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                Documentos Preenchidos Recentemente
              </h2>
              <p className="text-xs text-slate-500">
                Acesse e baixe os arquivos em PDF oficiais gerados recentemente
              </p>
            </div>

            <div className="flex items-center gap-3">
              {onClearAllHistory && (
                <button
                  onClick={() => {
                    if (window.confirm('Deseja limpar todos os documentos do histórico?')) {
                      onClearAllHistory();
                    }
                  }}
                  className="text-xs text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                >
                  Limpar histórico
                </button>
              )}
              {onNavigateView && (
                <button
                  onClick={() => onNavigateView('history')}
                  className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <span>Ver todos ({recentDocuments.length})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100 shadow-xs overflow-hidden">
            {recentDocuments.slice(0, 4).map((doc) => (
              <div
                key={doc.id}
                className="p-3.5 hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900 truncate" title={doc.file_name}>
                      {doc.file_name}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                      <span>{doc.template_name}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">
                        {new Date(doc.created_at).toLocaleDateString('pt-BR')} às{' '}
                        {new Date(doc.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => onDownloadHistoryDoc(doc)}
                    className="inline-flex items-center gap-1 text-xs font-medium py-1.5 px-3 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 rounded-md transition-colors cursor-pointer"
                    title="Baixar arquivo PDF oficial"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Baixar</span>
                  </button>
                  {onDeleteHistoryDoc && (
                    <button
                      onClick={() => onDeleteHistoryDoc(doc.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                      title="Excluir do histórico"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal for Managing Template Tags */}
      <ManageTagsModal
        isOpen={isTagModalOpen}
        template={tagModalTemplate}
        allExistingTags={allExistingTagNames}
        onClose={() => {
          setIsTagModalOpen(false);
          setTagModalTemplate(null);
        }}
        onSaveTags={(templateId, newTags) => {
          if (onUpdateTemplateTags) {
            onUpdateTemplateTags(templateId, newTags);
          }
        }}
      />
    </div>
  );
};
