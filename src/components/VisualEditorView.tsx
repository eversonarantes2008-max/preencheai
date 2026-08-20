import React, { useState, useRef, useEffect } from 'react';
import {
  DocumentTemplate,
  TemplateField,
  FieldGroup,
  FieldType,
} from '../types/document';
import {
  PAGE_WIDTH,
  PAGE_HEIGHT,
} from '../services/pdfGenerator';
import {
  Sliders,
  ZoomIn,
  ZoomOut,
  Save,
  RotateCcw,
  Sparkles,
  Plus,
  Trash2,
  Copy,
  Eye,
  Grid,
  Check,
  Move,
  Type,
  Maximize2,
  Play,
  ArrowLeft
} from 'lucide-react';
import { detectPdfFieldsWithAi } from '../services/aiExtractionService';

interface VisualEditorViewProps {
  template: DocumentTemplate;
  onSaveTemplate: (updatedTemplate: DocumentTemplate) => void;
  onResetDefault: () => void;
  onNavigateToForm: () => void;
}

export const VisualEditorView: React.FC<VisualEditorViewProps> = ({
  template,
  onSaveTemplate,
  onResetDefault,
  onNavigateToForm,
}) => {
  const [fields, setFields] = useState<TemplateField[]>(template.fields);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(
    template.fields[0]?.id || null
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(1.0); // 1.0 = 100% (595px width)
  const [showGrid, setShowGrid] = useState(false);
  const [isTestMode, setIsTestMode] = useState(true);
  const [isAutoDetecting, setIsAutoDetecting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef<{
    fieldId: string;
    startX: number;
    startY: number;
    initialFieldX: number;
    initialFieldY: number;
  } | null>(null);

  const resizingRef = useRef<{
    fieldId: string;
    startX: number;
    startY: number;
    initialWidth: number;
    initialHeight: number;
  } | null>(null);

  // Sync if template changes
  useEffect(() => {
    setFields(template.fields);
    setCurrentPage(1);
    if (!selectedFieldId && template.fields.length > 0) {
      setSelectedFieldId(template.fields[0].id);
    }
  }, [template]);

  // Page change sync
  const pageFields = fields.filter((f) => (f.page || 1) === currentPage);
  const totalPages = template.page_count || 1;

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
    const firstFieldOnPage = fields.find((f) => (f.page || 1) === newPage);
    if (firstFieldOnPage) {
      setSelectedFieldId(firstFieldOnPage.id);
    }
  };

  const selectedField = fields.find((f) => f.id === selectedFieldId);

  // Update selected field property
  const updateFieldProperty = (key: keyof TemplateField, val: any) => {
    if (!selectedFieldId) return;
    setFields((prev) =>
      prev.map((f) => (f.id === selectedFieldId ? { ...f, [key]: val } : f))
    );
  };

  // Nudge coordinate by delta
  const nudgeCoordinate = (key: 'x' | 'y' | 'width' | 'height', delta: number) => {
    if (!selectedFieldId) return;
    setFields((prev) =>
      prev.map((f) => {
        if (f.id === selectedFieldId) {
          const current = f[key] || 0;
          const next = Math.max(0, Math.round((current + delta) * 10) / 10);
          return { ...f, [key]: next };
        }
        return f;
      })
    );
  };

  // Save changes
  const handleSave = () => {
    onSaveTemplate({
      ...template,
      fields,
      updated_at: new Date().toISOString(),
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Add new manual field
  const handleAddField = () => {
    const newField: TemplateField = {
      id: `f_custom_${Date.now()}`,
      template_id: template.id,
      field_key: `novo_campo_${fields.length + 1}`,
      label: `Novo Campo ${fields.length + 1}`,
      page: 1,
      x: 80,
      y: 350,
      width: 150,
      height: 14,
      font_size: 9,
      font_weight: 'normal',
      alignment: 'left',
      field_type: 'text',
      required: false,
      auto_resize: true,
      sort_order: fields.length + 1,
      group: 'outros',
      test_value: 'Texto Exemplo',
    };
    setFields((prev) => [...prev, newField]);
    setSelectedFieldId(newField.id);
  };

  // Delete selected field
  const handleDeleteField = (id: string) => {
    setFields((prev) => prev.filter((f) => f.id !== id));
    if (selectedFieldId === id) {
      const remaining = fields.filter((f) => f.id !== id);
      setSelectedFieldId(remaining[0]?.id || null);
    }
  };

  // Duplicate selected field
  const handleDuplicateField = (field: TemplateField) => {
    const copy: TemplateField = {
      ...field,
      id: `f_copy_${Date.now()}`,
      field_key: `${field.field_key}_copia`,
      label: `${field.label} (Cópia)`,
      y: field.y + 16,
      sort_order: fields.length + 1,
    };
    setFields((prev) => [...prev, copy]);
    setSelectedFieldId(copy.id);
  };

  // Auto-detect with Gemini AI
  const handleAutoDetect = async () => {
    setIsAutoDetecting(true);
    try {
      const result = await detectPdfFieldsWithAi('Layout de documento padrão', {
        width: PAGE_WIDTH,
        height: PAGE_HEIGHT,
      });

      if (result?.detected_fields && result.detected_fields.length > 0) {
        const mappedFields: TemplateField[] = result.detected_fields.map(
          (df: any, idx: number) => ({
            id: `f_ai_${Date.now()}_${idx}`,
            template_id: template.id,
            field_key: df.field_key || `campo_${idx + 1}`,
            label: df.label || `Campo ${idx + 1}`,
            description: df.description || '',
            page: 1,
            x: Math.round(df.x || 80),
            y: Math.round(df.y || 150 + idx * 18),
            width: Math.round(df.width || 150),
            height: Math.round(df.height || 14),
            font_size: df.font_size || 8.5,
            font_weight: df.font_weight || 'normal',
            alignment: df.alignment || 'left',
            field_type: (df.field_type as FieldType) || 'text',
            required: !!df.required,
            auto_resize: true,
            sort_order: idx + 1,
            group: (df.group as FieldGroup) || 'declarante',
            test_value: df.test_value || 'Valor Detectado',
          })
        );
        setFields(mappedFields);
        setSelectedFieldId(mappedFields[0]?.id || null);
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao auto-detectar campos.');
    } finally {
      setIsAutoDetecting(false);
    }
  };

  // Mouse Drag Handler
  const handleMouseDown = (e: React.MouseEvent, field: TemplateField) => {
    e.stopPropagation();
    setSelectedFieldId(field.id);
    draggingRef.current = {
      fieldId: field.id,
      startX: e.clientX,
      startY: e.clientY,
      initialFieldX: field.x,
      initialFieldY: field.y,
    };
  };

  // Mouse Resize Handler
  const handleResizeMouseDown = (e: React.MouseEvent, field: TemplateField) => {
    e.stopPropagation();
    setSelectedFieldId(field.id);
    resizingRef.current = {
      fieldId: field.id,
      startX: e.clientX,
      startY: e.clientY,
      initialWidth: field.width,
      initialHeight: field.height,
    };
  };

  // Global Mouse Move & Up
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (draggingRef.current) {
        const { fieldId, startX, startY, initialFieldX, initialFieldY } =
          draggingRef.current;
        const deltaX = (e.clientX - startX) / zoom;
        const deltaY = (e.clientY - startY) / zoom;

        setFields((prev) =>
          prev.map((f) => {
            if (f.id === fieldId) {
              return {
                ...f,
                x: Math.max(0, Math.round((initialFieldX + deltaX) * 10) / 10),
                y: Math.max(0, Math.round((initialFieldY + deltaY) * 10) / 10),
              };
            }
            return f;
          })
        );
      }

      if (resizingRef.current) {
        const { fieldId, startX, startY, initialWidth, initialHeight } =
          resizingRef.current;
        const deltaX = (e.clientX - startX) / zoom;
        const deltaY = (e.clientY - startY) / zoom;

        setFields((prev) =>
          prev.map((f) => {
            if (f.id === fieldId) {
              return {
                ...f,
                width: Math.max(20, Math.round((initialWidth + deltaX) * 10) / 10),
                height: Math.max(10, Math.round((initialHeight + deltaY) * 10) / 10),
              };
            }
            return f;
          })
        );
      }
    };

    const handleMouseUp = () => {
      draggingRef.current = null;
      resizingRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [zoom]);

  // Keyboard navigation for precision nudge
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedFieldId) return;
      // Don't intercept if typing in an input
      if (
        ['INPUT', 'SELECT', 'TEXTAREA'].includes(
          (e.target as HTMLElement).tagName
        )
      ) {
        return;
      }

      const step = e.shiftKey ? 5 : 0.5;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          nudgeCoordinate('x', -step);
          break;
        case 'ArrowRight':
          e.preventDefault();
          nudgeCoordinate('x', step);
          break;
        case 'ArrowUp':
          e.preventDefault();
          nudgeCoordinate('y', -step);
          break;
        case 'ArrowDown':
          e.preventDefault();
          nudgeCoordinate('y', step);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedFieldId]);

  return (
    <div className="space-y-4 pb-12">
      {/* Top Header / Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onNavigateToForm}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
            title="Voltar ao Formulário"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-600" />
              Editor Visual e Calibrador Milimétrico
            </h1>
            <p className="text-xs text-slate-500">
              Modelo ativo: <strong className="text-slate-700">{template.name}</strong> • {fields.length} campos mapeados
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Zoom controls */}
          <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200 text-xs">
            <button
              onClick={() => setZoom((z) => Math.max(0.6, z - 0.1))}
              className="p-1.5 hover:bg-white rounded text-slate-700 transition-colors"
              title="Diminuir Zoom"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 font-mono font-bold text-slate-700">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(1.5, z + 0.1))}
              className="p-1.5 hover:bg-white rounded text-slate-700 transition-colors"
              title="Aumentar Zoom"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Test mode toggle */}
          <button
            onClick={() => setIsTestMode(!isTestMode)}
            className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
              isTestMode
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : 'bg-slate-50 text-slate-600 border-slate-200'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            {isTestMode ? 'Visualizando Dados' : 'Modo Caixas'}
          </button>

          {/* Page Navigator if multi-page */}
          {totalPages > 1 && (
            <div className="flex items-center bg-blue-50 border border-blue-200 rounded-lg p-1 text-xs">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="px-2 py-1 hover:bg-white rounded text-blue-800 disabled:opacity-30 font-bold transition-colors"
                title="Página Anterior"
              >
                ◀
              </button>
              <span className="px-2 font-bold text-blue-900">
                Pág. {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="px-2 py-1 hover:bg-white rounded text-blue-800 disabled:opacity-30 font-bold transition-colors"
                title="Próxima Página"
              >
                ▶
              </button>
            </div>
          )}

          {/* Grid Toggle */}
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`p-2 rounded-lg border transition-colors ${
              showGrid
                ? 'bg-blue-50 text-blue-700 border-blue-300'
                : 'bg-slate-50 text-slate-600 border-slate-200'
            }`}
            title="Exibir Grade de Alinhamento"
          >
            <Grid className="w-4 h-4" />
          </button>

          {/* Add Field */}
          <button
            onClick={handleAddField}
            className="px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Novo Campo
          </button>

          {/* Reset Template */}
          <button
            onClick={() => {
              if (confirm('Deseja restaurar as coordenadas padrão originais deste modelo?')) {
                onResetDefault();
              }
            }}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
            title="Restaurar Padrão Oficial"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Save Button */}
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-blue-200"
          >
            {saveSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                Salvo com Sucesso!
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Salvar Calibração
              </>
            )}
          </button>
        </div>
      </div>

      {/* Editor Main Layout (PDF Canvas center + Right Properties Sidebar) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left/Center Visual Canvas */}
        <div className="lg:col-span-8 bg-slate-200/90 border border-slate-300 rounded-xl p-6 overflow-auto shadow-inner flex justify-center min-h-[880px] relative">
          <div
            ref={containerRef}
            className="relative bg-white text-slate-900 shadow-2xl rounded border border-slate-300 select-none overflow-hidden"
            style={{
              width: `${(template.page_width || PAGE_WIDTH) * zoom}px`,
              height: `${(template.page_height || PAGE_HEIGHT) * zoom}px`,
              transformOrigin: 'top center',
            }}
          >
            {/* Master Template Background (Real Uploaded PDF iframe or vector canvas layout) */}
            {template.file_url ? (
              <iframe
                src={`${template.file_url}#toolbar=0&navpanes=0&scrollbar=0`}
                className="absolute inset-0 w-full h-full border-none pointer-events-none"
                title="Master PDF Background"
              />
            ) : (
              <TemplateCanvasBackground templateId={template.id} zoom={zoom} page={currentPage} />
            )}

            {/* Alignment Grid Overlay */}
            {showGrid && (
              <div
                className="absolute inset-0 pointer-events-none opacity-20"
                style={{
                  backgroundImage:
                    'linear-gradient(to right, #2563eb 1px, transparent 1px), linear-gradient(to bottom, #2563eb 1px, transparent 1px)',
                  backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
                }}
              />
            )}

            {/* Overlaid Interactive Fields (Blue calibrated boxes) */}
            {pageFields.length === 0 && totalPages > 1 && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-900/80 text-white text-xs px-3 py-1.5 rounded-full shadow pointer-events-none z-30">
                Página {currentPage} — Cláusulas contratuais sem lacunas variáveis
              </div>
            )}

            {pageFields.map((field) => {
              const isSelected = field.id === selectedFieldId;
              const displayVal = isTestMode
                ? field.test_value || field.label
                : field.label;

              return (
                <div
                  key={field.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFieldId(field.id);
                  }}
                  onMouseDown={(e) => handleMouseDown(e, field)}
                  className={`absolute group cursor-move transition-shadow rounded-xs ${
                    isSelected
                      ? 'ring-2 ring-blue-600 bg-blue-500/25 z-30 shadow-md'
                      : 'border border-blue-400/80 bg-blue-400/10 hover:bg-blue-400/20 z-20'
                  }`}
                  style={{
                    left: `${field.x * zoom}px`,
                    top: `${field.y * zoom}px`,
                    width: `${field.width * zoom}px`,
                    height: `${field.height * zoom}px`,
                  }}
                >
                  {/* Field content preview */}
                  <div
                    className={`w-full h-full overflow-hidden text-ellipsis whitespace-nowrap px-0.5 flex items-center ${
                      field.alignment === 'center'
                        ? 'justify-center'
                        : field.alignment === 'right'
                        ? 'justify-end'
                        : 'justify-start'
                    } ${field.font_weight === 'bold' ? 'font-bold' : 'font-normal'} text-slate-900`}
                    style={{
                      fontSize: `${(field.font_size || 8.5) * zoom}px`,
                      lineHeight: 1,
                    }}
                  >
                    {displayVal}
                  </div>

                  {/* Resizing handle on bottom right corner */}
                  {isSelected && (
                    <div
                      onMouseDown={(e) => handleResizeMouseDown(e, field)}
                      className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-blue-600 border border-white rounded-full cursor-se-resize shadow-xs z-40"
                    />
                  )}

                  {/* Micro label tooltip on hover */}
                  <div className="absolute -top-4 left-0 hidden group-hover:block bg-slate-900 text-white text-[9px] font-mono px-1 py-0.5 rounded whitespace-nowrap pointer-events-none z-50 shadow">
                    {field.label} ({field.x}, {field.y})
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Sidebar: Selected Field Inspector & Coordinates Fine-Tuning */}
        <div className="lg:col-span-4 space-y-4">
          {selectedField ? (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center font-bold text-xs">
                    {selectedField.sort_order}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">
                      {selectedField.label}
                    </h3>
                    <p className="text-[11px] font-mono text-slate-400">
                      {selectedField.field_key}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleDuplicateField(selectedField)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                    title="Duplicar Campo"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteField(selectedField.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                    title="Excluir Campo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Coordinates Control Grid (X, Y, W, H) with Nudge Buttons */}
              <div className="space-y-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  Posicionamento Milimétrico (Pontos)
                </span>

                <div className="grid grid-cols-2 gap-3">
                  {/* X */}
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                      <span className="font-bold">Posição X:</span>
                      <span className="font-mono text-blue-600 font-bold">{selectedField.x} pt</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => nudgeCoordinate('x', -1)}
                        className="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-bold hover:bg-slate-100"
                      >
                        -1
                      </button>
                      <button
                        onClick={() => nudgeCoordinate('x', -0.2)}
                        className="px-1.5 py-1 bg-white border border-slate-200 rounded text-[11px] hover:bg-slate-100"
                      >
                        -0.2
                      </button>
                      <button
                        onClick={() => nudgeCoordinate('x', 0.2)}
                        className="px-1.5 py-1 bg-white border border-slate-200 rounded text-[11px] hover:bg-slate-100"
                      >
                        +0.2
                      </button>
                      <button
                        onClick={() => nudgeCoordinate('x', 1)}
                        className="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-bold hover:bg-slate-100"
                      >
                        +1
                      </button>
                    </div>
                  </div>

                  {/* Y */}
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                      <span className="font-bold">Posição Y:</span>
                      <span className="font-mono text-blue-600 font-bold">{selectedField.y} pt</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => nudgeCoordinate('y', -1)}
                        className="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-bold hover:bg-slate-100"
                      >
                        -1
                      </button>
                      <button
                        onClick={() => nudgeCoordinate('y', -0.2)}
                        className="px-1.5 py-1 bg-white border border-slate-200 rounded text-[11px] hover:bg-slate-100"
                      >
                        -0.2
                      </button>
                      <button
                        onClick={() => nudgeCoordinate('y', 0.2)}
                        className="px-1.5 py-1 bg-white border border-slate-200 rounded text-[11px] hover:bg-slate-100"
                      >
                        +0.2
                      </button>
                      <button
                        onClick={() => nudgeCoordinate('y', 1)}
                        className="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-bold hover:bg-slate-100"
                      >
                        +1
                      </button>
                    </div>
                  </div>

                  {/* Width */}
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                      <span className="font-bold">Largura (W):</span>
                      <span className="font-mono text-blue-600 font-bold">{selectedField.width} pt</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => nudgeCoordinate('width', -2)}
                        className="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-bold hover:bg-slate-100"
                      >
                        -2
                      </button>
                      <button
                        onClick={() => nudgeCoordinate('width', 2)}
                        className="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-bold hover:bg-slate-100"
                      >
                        +2
                      </button>
                    </div>
                  </div>

                  {/* Height */}
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                      <span className="font-bold">Altura (H):</span>
                      <span className="font-mono text-blue-600 font-bold">{selectedField.height} pt</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => nudgeCoordinate('height', -1)}
                        className="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-bold hover:bg-slate-100"
                      >
                        -1
                      </button>
                      <button
                        onClick={() => nudgeCoordinate('height', 1)}
                        className="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-bold hover:bg-slate-100"
                      >
                        +1
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Typography & Styling Controls */}
              <div className="space-y-3">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  Tipografia & Alinhamento
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">
                      Tamanho da Fonte (pt)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="6"
                      max="20"
                      value={selectedField.font_size || 8.5}
                      onChange={(e) =>
                        updateFieldProperty('font_size', parseFloat(e.target.value) || 8.5)
                      }
                      className="w-full text-xs font-mono px-3 py-1.5 rounded border border-slate-200 focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">
                      Peso da Fonte
                    </label>
                    <select
                      value={selectedField.font_weight || 'normal'}
                      onChange={(e) =>
                        updateFieldProperty('font_weight', e.target.value)
                      }
                      className="w-full text-xs px-3 py-1.5 rounded border border-slate-200 focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                    >
                      <option value="normal">Normal (Helvetica Regular)</option>
                      <option value="bold">Negrito (Helvetica Bold)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">
                      Alinhamento do Texto
                    </label>
                    <select
                      value={selectedField.alignment || 'left'}
                      onChange={(e) =>
                        updateFieldProperty('alignment', e.target.value)
                      }
                      className="w-full text-xs px-3 py-1.5 rounded border border-slate-200 focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                    >
                      <option value="left">Esquerda</option>
                      <option value="center">Centralizado</option>
                      <option value="right">Direita</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">
                      Auto Redimensionar Texto
                    </label>
                    <div className="flex items-center h-8">
                      <input
                        type="checkbox"
                        checked={selectedField.auto_resize !== false}
                        onChange={(e) =>
                          updateFieldProperty('auto_resize', e.target.checked)
                        }
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        id="check_auto_resize"
                      />
                      <label
                        htmlFor="check_auto_resize"
                        className="text-xs text-slate-600 ml-2"
                      >
                        Ajustar ao limite
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Data & Label Editing */}
              <div className="space-y-3 border-t border-slate-100 pt-3">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  Propriedades do Campo
                </span>

                <div className="space-y-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">
                      Rótulo Visível (Label)
                    </label>
                    <input
                      type="text"
                      value={selectedField.label}
                      onChange={(e) =>
                        updateFieldProperty('label', e.target.value)
                      }
                      className="w-full text-xs px-3 py-1.5 rounded border border-slate-200 focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">
                      Valor de Teste para Visualização
                    </label>
                    <input
                      type="text"
                      value={selectedField.test_value || ''}
                      onChange={(e) =>
                        updateFieldProperty('test_value', e.target.value)
                      }
                      className="w-full text-xs px-3 py-1.5 rounded border border-slate-200 focus:ring-1 focus:ring-blue-500 focus:outline-hidden font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500 text-xs">
              Clique em qualquer campo sobre o documento para calibrar suas coordenadas.
            </div>
          )}

          {/* Fields List for Quick Selection */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <h3 className="font-bold text-xs text-slate-700 mb-2 uppercase tracking-wider">
              Todos os Campos ({fields.length})
            </h3>
            <div className="max-h-[300px] overflow-y-auto space-y-1 pr-1">
              {fields.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setSelectedFieldId(f.id)}
                  className={`w-full text-left px-2.5 py-1.5 rounded text-xs flex items-center justify-between transition-colors ${
                    f.id === selectedFieldId
                      ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200'
                      : 'hover:bg-slate-50 text-slate-700 border border-transparent'
                  }`}
                >
                  <span className="truncate">{f.label}</span>
                  <span className="text-[10px] font-mono text-slate-400 shrink-0 ml-2">
                    {f.x}, {f.y}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Component to render authentic vector backgrounds in visual editor based on active template
const TemplateCanvasBackground: React.FC<{ templateId: string; zoom: number; page?: number }> = ({ templateId, zoom, page = 1 }) => {
  switch (templateId) {
    case 'template_autorizacao_pagamento':
      return (
        <div className="absolute inset-0 pointer-events-none p-6 font-sans text-slate-900 leading-normal" style={{ fontSize: `${8.0 * zoom}px` }}>
          {/* Title Box */}
          <div
            className="absolute border border-slate-900 bg-white font-bold text-center uppercase tracking-wide flex items-center justify-center shadow-xs"
            style={{
              left: `${185 * zoom}px`,
              top: `${85 * zoom}px`,
              width: `${225 * zoom}px`,
              height: `${22 * zoom}px`,
              fontSize: `${9.2 * zoom}px`,
            }}
          >
            AUTORIZAÇÃO DE PAGAMENTO
          </div>

          {/* Line 1 (y: 160) */}
          <div className="absolute flex items-baseline" style={{ left: `${75 * zoom}px`, top: `${160 * zoom}px`, width: `${445 * zoom}px` }}>
            <span className="shrink-0 pr-1.5" style={{ fontSize: `${9.5 * zoom}px` }}>Eu,</span>
            <span className="border-b border-slate-600 inline-block h-[1px]" style={{ width: `${344 * zoom}px` }}></span>
            <span className="shrink-0 pl-1.5" style={{ fontSize: `${9.5 * zoom}px` }}>, portador (a) da</span>
          </div>

          {/* Line 2 (y: 185) */}
          <div className="absolute flex items-baseline" style={{ left: `${75 * zoom}px`, top: `${185 * zoom}px`, width: `${445 * zoom}px` }}>
            <span className="shrink-0 pr-1.5" style={{ fontSize: `${9.5 * zoom}px` }}>Cédula de Identidade nº.</span>
            <span className="border-b border-slate-600 inline-block h-[1px]" style={{ width: `${100 * zoom}px` }}></span>
            <span className="shrink-0 pl-1.5" style={{ fontSize: `${9.5 * zoom}px` }}>, inscrito (a) no Cadastro das Pessoas</span>
          </div>

          {/* Line 3 (y: 210) */}
          <div className="absolute flex items-baseline" style={{ left: `${75 * zoom}px`, top: `${210 * zoom}px`, width: `${445 * zoom}px` }}>
            <span className="shrink-0 pr-1.5" style={{ fontSize: `${9.5 * zoom}px` }}>Físicas do Ministério da Fazenda sob o nº.</span>
            <span className="border-b border-slate-600 inline-block h-[1px]" style={{ width: `${124 * zoom}px` }}></span>
            <span className="shrink-0 pl-1.5" style={{ fontSize: `${9.5 * zoom}px` }}>, na qualidade de</span>
          </div>

          {/* Line 4 (y: 235) */}
          <div className="absolute leading-relaxed text-justify" style={{ left: `${75 * zoom}px`, top: `${235 * zoom}px`, width: `${445 * zoom}px`, fontSize: `${9.5 * zoom}px` }}>
            <span>vendedor(a) do veículo baixo descrito, </span>
            <span className="font-bold">Solicito e Autorizo</span>
            <span> que o valor acertado com a</span>
          </div>

          {/* Line 5 (y: 260) */}
          <div className="absolute leading-relaxed text-justify" style={{ left: `${75 * zoom}px`, top: `${260 * zoom}px`, width: `${445 * zoom}px`, fontSize: `${9.5 * zoom}px` }}>
            <span>venda de meu veículo seja efetuado diretamente na conta corrente de titularidade da</span>
          </div>

          {/* Line 6 (y: 285) */}
          <div className="absolute flex items-baseline" style={{ left: `${75 * zoom}px`, top: `${285 * zoom}px`, width: `${445 * zoom}px` }}>
            <span className="shrink-0 pr-1.5" style={{ fontSize: `${9.5 * zoom}px` }}>empresa, inscrita no CNPJ/MF sob o n.</span>
            <span className="border-b border-slate-600 inline-block h-[1px]" style={{ width: `${218 * zoom}px` }}></span>
            <span className="shrink-0 pl-0.5" style={{ fontSize: `${9.5 * zoom}px` }}>,</span>
          </div>

          {/* Date Line (y: 338) */}
          <div className="absolute flex items-baseline" style={{ left: `${165 * zoom}px`, top: `${338 * zoom}px` }}>
            <span className="shrink-0 pr-1.5" style={{ fontSize: `${9.5 * zoom}px` }}>São Paulo,</span>
            <span className="border-b border-slate-600 inline-block h-[1px]" style={{ width: `${24 * zoom}px` }}></span>
            <span className="shrink-0 px-1.5" style={{ fontSize: `${9.5 * zoom}px` }}>de</span>
            <span className="border-b border-slate-600 inline-block h-[1px]" style={{ width: `${70 * zoom}px` }}></span>
            <span className="shrink-0 px-1.5" style={{ fontSize: `${9.5 * zoom}px` }}>de</span>
            <span className="border-b border-slate-600 inline-block h-[1px]" style={{ width: `${50 * zoom}px` }}></span>
            <span className="shrink-0" style={{ fontSize: `${9.5 * zoom}px` }}>.</span>
          </div>

          {/* Signature Line (y: 390) */}
          <div className="absolute text-center" style={{ left: `${75 * zoom}px`, top: `${390 * zoom}px`, width: `${445 * zoom}px` }}>
            <div className="border-t-2 border-slate-900 w-full mb-3"></div>
            <div className="font-bold text-slate-900" style={{ fontSize: `${9.5 * zoom}px` }}>Nome do Vendedor:</div>
          </div>
        </div>
      );

    case 'template_comodato_veiculo':
      if (page === 1) {
        return (
          <div className="absolute inset-0 pointer-events-none p-6 font-sans text-slate-900 leading-tight space-y-3" style={{ fontSize: `${8.5 * zoom}px` }}>
            <div className="absolute font-bold text-center uppercase tracking-wide" style={{ left: `${70 * zoom}px`, top: `${85 * zoom}px`, width: `${455 * zoom}px`, fontSize: `${10 * zoom}px` }}>
              INSTRUMENTO PARTICULAR DE COMODATO DE VEÍCULO
            </div>
            
            <div className="absolute leading-relaxed text-justify" style={{ left: `${70 * zoom}px`, top: `${155 * zoom}px`, width: `${455 * zoom}px` }}>
              <div>Por este instrumento particular, de um lado CMD GW COMERCIO DE VEÍCULOS</div>
              <div>AUTOMOTORES LTDA., pessoa jurídica de direito privado, devidamente constituída</div>
              <div>e inscrita no CNPJ/MF sob o nº. 48.967.629/0004-84, com sede em JUNDIAÍ, na AV NOVE</div>
              <div>DE JULHO, 380 - Jundiaí, CEP 13209-010, aqui denominado simplesmente COMODANTE, e, de outro lado</div>
              <div className="pt-2 flex items-baseline">
                <span className="shrink-0 pr-1">aqui denominado simplesmente COMODANTE, e, de outro lado</span>
                <span className="border-b border-slate-600 inline-block h-[1px]" style={{ width: `${175 * zoom}px` }}></span>
              </div>
              <div className="pt-2 flex items-baseline">
                <span className="shrink-0 pr-1">portador(a) da Cédula de Identidade nº</span>
                <span className="border-b border-slate-600 inline-block h-[1px]" style={{ width: `${110 * zoom}px` }}></span>
              </div>
              <div className="pt-2 flex items-baseline">
                <span className="shrink-0 pr-1">, inscrito(a) no CPF sob o nº</span>
                <span className="border-b border-slate-600 inline-block h-[1px]" style={{ width: `${150 * zoom}px` }}></span>
                <span className="shrink-0 pl-1">, residente e domiciliado(a)</span>
              </div>
              <div className="pt-2 flex items-baseline">
                <span className="shrink-0 pr-1">na Cidade de</span>
                <span className="border-b border-slate-600 inline-block h-[1px]" style={{ width: `${90 * zoom}px` }}></span>
                <span className="shrink-0 px-1">, Estado S. PAULO, na</span>
                <span className="border-b border-slate-600 inline-block h-[1px]" style={{ width: `${175 * zoom}px` }}></span>
                <span className="shrink-0 px-1">,</span>
                <span className="border-b border-slate-600 inline-block h-[1px]" style={{ width: `${25 * zoom}px` }}></span>
              </div>
              <div className="pt-2 flex items-baseline">
                <span className="shrink-0 pr-1">Bairro:</span>
                <span className="border-b border-slate-600 inline-block h-[1px]" style={{ width: `${120 * zoom}px` }}></span>
                <span className="shrink-0 px-1">Cep:</span>
                <span className="border-b border-slate-600 inline-block h-[1px]" style={{ width: `${80 * zoom}px` }}></span>
                <span className="shrink-0 pl-1">aqui simplesmente denominada COMODATÁRIA,</span>
              </div>

              <div className="pt-6">
                <div>1. A COMODANTE é proprietária do veículo <span className="inline-block border-b border-slate-600" style={{ width: `${190 * zoom}px` }}></span> , <span className="inline-block border-b border-slate-600" style={{ width: `${28 * zoom}px` }}></span> / <span className="inline-block border-b border-slate-600" style={{ width: `${30 * zoom}px` }}></span> ,</div>
                <div className="pt-2">COR <span className="inline-block border-b border-slate-600" style={{ width: `${65 * zoom}px` }}></span> PLACA <span className="inline-block border-b border-slate-600" style={{ width: `${95 * zoom}px` }}></span> , e neste ato, por este instrumento concede o mesmo a</div>
                <div className="pt-2">título de COMODATO, por período indeterminado, a contar da data deste instrumento, para uso da COMODATÁRIA.</div>
              </div>

              <div className="pt-5">
                <div>2. O veículo definido na cláusula 1º deste ficará na posse da própria COMODATÁRIA, podendo a mesma usar e gozar do bem da forma que melhor lhe convir, sendo-lhe apenas vedado à locação e a alienação a outrem sem expressa autorização da COMODANTE.</div>
              </div>

              <div className="pt-5">
                <div>2.A. A COMODATÁRIA obriga-se a utilizar do veículo somente com condutores devidamente habilitados, se comprometendo ainda a fornecer, quando solicitada, no prazo máximo de 24 horas a Carteira Nacional de Habilitação de condutor que eventualmente cometa infrações.</div>
              </div>

              <div className="pt-5">
                <div>3. A COMODATÁRIA obriga-se a reembolsar a COMODANTE, de todas as despesas havidas com o veículo, tais como eventuais taxas e infrações de trânsito que venham recair sobre o bem, e ainda eventuais sinistros ocorridos que causem danos ao próprio bem ou a terceiros durante o período de vigência deste instrumento.</div>
              </div>

              <div className="pt-5">
                <div>4. A COMODATÁRIA obriga-se a efetuar o pagamento do valor estabelecido a época dos fatos pela Tabela Fipe, nos casos de furto, roubo e ou perda total do veículo objeto do presente instrumento...</div>
              </div>
            </div>

            <div className="absolute text-center text-slate-400" style={{ bottom: `${20 * zoom}px`, width: '100%', fontSize: `${7.0 * zoom}px` }}>
              Página 1 de 7
            </div>
          </div>
        );
      }
      if (page === 2) {
        return (
          <div className="absolute inset-0 pointer-events-none p-6 font-sans text-slate-900 leading-tight space-y-4" style={{ fontSize: `${8.5 * zoom}px` }}>
            <div className="absolute leading-relaxed text-justify space-y-4" style={{ left: `${70 * zoom}px`, top: `${85 * zoom}px`, width: `${455 * zoom}px` }}>
              <div>presente instrumento, lançando mão desde já de qualquer alegação de caso fortuito ou força maior como excludentes da responsabilidade e ou obrigação de indenizar aqui assumida.</div>
              <div>5. Em caso de turbação ou esbulho da posse do bem por atos de terceiros, a COMODATÁRIA deverá tomar as providências cabíveis a fim de cessar tais atos, bem como comunicar imediatamente tais fatos à COMODANTE.</div>
              <div>6. Qualquer tolerância ou concessão das partes quanto ao cumprimento do disposto neste contrato constituir-se-á ato de mera liberalidade, não podendo ser considerado novação.</div>
              <div>7. As Partes declaram que, direta ou indiretamente, atuam em seus negócios pautadas no profissionalismo e na ética, em conformidade com as leis brasileiras, sempre respeitando o pactuado no presente Contrato e sem qualquer violação às previsões da presente cláusula.</div>
              <div>7.1 As Partes garantem, para todos os efeitos, que:</div>
              <div className="pl-3 space-y-2">
                <div>a) Cumprem todas as leis e normas relacionadas à anticorrupção, lavagem de dinheiro, antissuborno, antitruste e conflito de interesses, incluindo principalmente, mas não se limitando à Lei Brasileira Anticorrupção (Lei 12.846/2013), Decreto Brasileiro Anticorrupção (Decreto n° 8.420/2015), Lei Brasileira de Licitações (Lei n° 8.666/1993) e qualquer legislação relativa a Lavagem de Dinheiro;</div>
                <div>b) Adotam políticas de prevenção e combate à corrupção, à lavagem de dinheiro e ao financiamento ao terrorismo, elaboradas em conformidade com as legislações aplicáveis.</div>
              </div>
            </div>
            <div className="absolute text-center text-slate-400" style={{ bottom: `${20 * zoom}px`, width: '100%', fontSize: `${7.0 * zoom}px` }}>
              Página 2 de 7
            </div>
          </div>
        );
      }
      if (page === 3) {
        return (
          <div className="absolute inset-0 pointer-events-none p-6 font-sans text-slate-900 leading-tight space-y-4" style={{ fontSize: `${8.5 * zoom}px` }}>
            <div className="absolute leading-relaxed text-justify space-y-4" style={{ left: `${70 * zoom}px`, top: `${85 * zoom}px`, width: `${455 * zoom}px` }}>
              <div>7.2. As Partes declaram expressamente que conduzem suas atividades em estrita conformidade com os mais elevados padrões éticos e legais.</div>
              <div>8. DAS CLÁUSULAS DE PROTEÇÃO DE DADOS PESSOAIS (LGPD - LEI Nº 13.709/2018)</div>
              <div>8.1. No âmbito deste contrato, as Partes comprometem-se a cumprir integralmente a legislação vigente relativa à proteção de dados pessoais (LGPD).</div>
              <div>8.2. O tratamento de dados pessoais no presente contrato se limita estritamente às finalidades necessárias para a execução e fiscalização das obrigações aqui pactuadas.</div>
              <div>8.3. As partes adotarão as medidas de segurança técnicas e administrativas aptas a proteger os dados pessoais de acessos não autorizados e de situações acidentais ou ilícitas.</div>
            </div>
            <div className="absolute text-center text-slate-400" style={{ bottom: `${20 * zoom}px`, width: '100%', fontSize: `${7.0 * zoom}px` }}>
              Página 3 de 7
            </div>
          </div>
        );
      }
      if (page === 4) {
        return (
          <div className="absolute inset-0 pointer-events-none p-6 font-sans text-slate-900 leading-tight space-y-4" style={{ fontSize: `${8.5 * zoom}px` }}>
            <div className="absolute leading-relaxed text-justify space-y-4" style={{ left: `${70 * zoom}px`, top: `${85 * zoom}px`, width: `${455 * zoom}px` }}>
              <div>8.4. As Partes comprometem-se a não comercializar, ceder ou transferir a terceiros, a qualquer título, os dados pessoais obtidos em razão da execução deste Contrato.</div>
              <div>8.5. O compartilhamento de dados com terceiros somente ocorrerá quando estritamente necessário para o cumprimento de obrigações legais, regulatórias ou ordens de autoridades competentes.</div>
              <div>8.6. As Partes garantem que os colaboradores autorizados a acessar os dados pessoais assumiram compromisso formal de confidencialidade.</div>
              <div>8.7. Cada Parte responderá na medida de sua culpa por quaisquer danos causados em virtude do tratamento inadequado ou ilícito de dados pessoais.</div>
            </div>
            <div className="absolute text-center text-slate-400" style={{ bottom: `${20 * zoom}px`, width: '100%', fontSize: `${7.0 * zoom}px` }}>
              Página 4 de 7
            </div>
          </div>
        );
      }
      if (page === 5) {
        return (
          <div className="absolute inset-0 pointer-events-none p-6 font-sans text-slate-900 leading-tight space-y-4" style={{ fontSize: `${8.5 * zoom}px` }}>
            <div className="absolute leading-relaxed text-justify space-y-4" style={{ left: `${70 * zoom}px`, top: `${85 * zoom}px`, width: `${455 * zoom}px` }}>
              <div>8.8. As Partes cooperarão mutuamente para o atendimento dos direitos dos titulares de dados previstos na Lei Geral de Proteção de Dados.</div>
              <div>8.9. Em caso de incidente de segurança com dados pessoais, a Parte afetada comunicará a outra em até 24 (vinte e quatro) horas a partir da ciência do fato.</div>
              <div>8.10. Findo o contrato ou atingida a finalidade, os dados pessoais serão eliminados ou anonimizados, ressalvadas as hipóteses legais de conservação.</div>
              <div>8.11. As Partes asseguram o uso de criptografia, controles de acesso restrito e ferramentas atualizadas de proteção da informação.</div>
            </div>
            <div className="absolute text-center text-slate-400" style={{ bottom: `${20 * zoom}px`, width: '100%', fontSize: `${7.0 * zoom}px` }}>
              Página 5 de 7
            </div>
          </div>
        );
      }
      if (page === 6) {
        return (
          <div className="absolute inset-0 pointer-events-none p-6 font-sans text-slate-900 leading-tight space-y-4" style={{ fontSize: `${8.5 * zoom}px` }}>
            <div className="absolute leading-relaxed text-justify space-y-4" style={{ left: `${70 * zoom}px`, top: `${85 * zoom}px`, width: `${455 * zoom}px` }}>
              <div>relacionadas com o presente Contrato, bem como acerca de qualquer violação da legislação de privacidade e de proteção de dados pessoais que tiver ciência com relação aos dados em sua custódia, inclusive violação acidental ou culposa.</div>
              <div>8.15. Caso qualquer das Partes sofram qualquer dano ou prejuízos em decorrência do descumprimento comprovado das cláusulas de proteção de dados pessoais deste Contrato ou do descumprimento legal de obrigações de proteção de dados, ocasionado por ação ou omissão da outra Parte, ficará a Parte Infratora obrigada a ressarcir integralmente quaisquer danos, prejuízos e lucros cessantes à Parte Inocente.</div>
              <div>8.16. Na hipótese de qualquer questionamento por parte de autoridades públicas ou ação judicial relacionada à proteção de dados, as Partes obrigam-se a informar uma à outra no prazo de 24 (vinte e quatro horas) tão logo tenha ciência.</div>
              <div>9. Admite-se a rescisão do presente contrato, sem ônus e a qualquer tempo, por parte da COMODANTE e por parte da COMODATÁRIA mediante aviso prévio de 03 (tres) dias.</div>
              <div>10. O não cumprimento de qualquer das cláusulas deste contrato implicará na sua imediata rescisão, perfeitamente reconhecida pelos contratantes.</div>
              <div>11. Os contratantes elegem o foro da Comarca de Campinas do Estado de São Paulo para dirimir dúvidas ou questões oriundas do presente contrato.</div>
              <div className="pt-2">E assim, por estarem justos e contratados, assinam o presente instrumento em 02 (duas) vias de igual teor, por um só fim, na presença de testemunhas a tudo presentes.</div>

              {/* Data */}
              <div className="pt-6 flex items-baseline">
                <span className="shrink-0 pr-1">Jundiaí,</span>
                <span className="border-b border-slate-600 inline-block h-[1px]" style={{ width: `${25 * zoom}px` }}></span>
                <span className="shrink-0 px-1">de</span>
                <span className="border-b border-slate-600 inline-block h-[1px]" style={{ width: `${100 * zoom}px` }}></span>
                <span className="shrink-0 px-1">de</span>
                <span className="border-b border-slate-600 inline-block h-[1px]" style={{ width: `${40 * zoom}px` }}></span>
                <span className="shrink-0">.</span>
              </div>
            </div>
            <div className="absolute text-center text-slate-400" style={{ bottom: `${20 * zoom}px`, width: '100%', fontSize: `${7.0 * zoom}px` }}>
              Página 6 de 7
            </div>
          </div>
        );
      }
      // Página 7: Assinaturas e Testemunhas
      return (
        <div className="absolute inset-0 pointer-events-none p-6 font-sans text-slate-900 leading-tight space-y-4" style={{ fontSize: `${8.5 * zoom}px` }}>
          <div className="absolute leading-relaxed space-y-8" style={{ left: `${70 * zoom}px`, top: `${85 * zoom}px`, width: `${455 * zoom}px` }}>
            <div className="text-center space-y-6">
              <div className="font-bold text-[9.5px]">CMD GW COMERCIO DE VEÍCULOS AUTOMOTORES LTDA</div>
              <div className="text-slate-600">Comodante</div>
            </div>

            <div className="pt-10 text-center space-y-2">
              <div className="border-t border-slate-800 w-3/5 mx-auto mb-1"></div>
              <div className="text-slate-700">Comodatária</div>
            </div>

            <div className="pt-10 space-y-6">
              <div className="font-bold">Testemunhas:</div>
              <div className="space-y-4 pt-2">
                <div className="space-y-1">
                  <div className="border-t border-slate-500 w-2/5 mb-1"></div>
                  <div>Nome: <span className="inline-block border-b border-slate-400" style={{ width: `${180 * zoom}px` }}></span></div>
                  <div>RG: <span className="inline-block border-b border-slate-400" style={{ width: `${180 * zoom}px` }}></span></div>
                </div>
                <div className="space-y-1 pt-4">
                  <div className="border-t border-slate-500 w-2/5 mb-1"></div>
                  <div>Nome: <span className="inline-block border-b border-slate-400" style={{ width: `${180 * zoom}px` }}></span></div>
                  <div>RG: <span className="inline-block border-b border-slate-400" style={{ width: `${180 * zoom}px` }}></span></div>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute text-center text-slate-400" style={{ bottom: `${20 * zoom}px`, width: '100%', fontSize: `${7.0 * zoom}px` }}>
            Página 7 de 7
          </div>
        </div>
      );

    case 'template_carta_cancelamento':
      return (
        <div className="absolute inset-0 pointer-events-none p-6 font-sans text-slate-900" style={{ fontSize: `${9 * zoom}px` }}>
          <div className="absolute font-bold tracking-wider" style={{ left: `${80 * zoom}px`, top: `${45 * zoom}px`, fontSize: `${15 * zoom}px` }}>
            GWM <span className="text-slate-400 font-normal">|</span> DAHRUJ
          </div>
          <div className="absolute font-bold underline tracking-wide text-center uppercase" style={{ left: `${80 * zoom}px`, top: `${95 * zoom}px`, width: `${435 * zoom}px`, fontSize: `${13 * zoom}px` }}>
            CARTA DE CANCELAMENTO
          </div>
          <div className="absolute" style={{ left: `${80 * zoom}px`, top: `${165 * zoom}px` }}>Prezados,</div>
          <div className="absolute" style={{ left: `${80 * zoom}px`, top: `${195 * zoom}px` }}>
            Eu, <span className="inline-block border-b border-slate-500" style={{ width: `${245 * zoom}px` }}></span>, portador do
          </div>
          <div className="absolute" style={{ left: `${80 * zoom}px`, top: `${215 * zoom}px` }}>
            CPF/CNPJ: <span className="inline-block border-b border-slate-500" style={{ width: `${175 * zoom}px` }}></span>, venho por meio deste, solicitar o
          </div>
          <div className="absolute font-bold" style={{ left: `${80 * zoom}px`, top: `${235 * zoom}px` }}>
            cancelamento referente ao pagamento no valor de R$ <span className="inline-block border-b border-slate-500" style={{ width: `${68 * zoom}px` }}></span> ( <span className="inline-block border-b border-slate-500" style={{ width: `${115 * zoom}px` }}></span> ), junto
          </div>
          <div className="absolute font-bold" style={{ left: `${80 * zoom}px`, top: `${255 * zoom}px` }}>
            à concessionária <span className="inline-block border-b border-slate-500" style={{ width: `${365 * zoom}px` }}></span>,
          </div>
          <div className="absolute font-bold" style={{ left: `${80 * zoom}px`, top: `${275 * zoom}px` }}>
            LTDA, por motivos pessoais.
          </div>
          <div className="absolute font-bold" style={{ left: `${80 * zoom}px`, top: `${295 * zoom}px` }}>
            Solicito devolução integral do pagamento efetuado via <span className="inline-block border-b border-slate-500" style={{ width: `${160 * zoom}px` }}></span>.
          </div>
          <div className="absolute" style={{ left: `${80 * zoom}px`, top: `${345 * zoom}px` }}>Sem mais,</div>
          <div className="absolute" style={{ left: `${80 * zoom}px`, top: `${395 * zoom}px` }}>
            São Paulo <span className="inline-block border-b border-slate-500" style={{ width: `${35 * zoom}px` }}></span> / <span className="inline-block border-b border-slate-500" style={{ width: `${45 * zoom}px` }}></span> / <span className="inline-block border-b border-slate-500" style={{ width: `${55 * zoom}px` }}></span>
          </div>
          <div className="absolute text-center" style={{ left: `${160 * zoom}px`, top: `${490 * zoom}px`, width: `${275 * zoom}px` }}>
            <div className="border-t border-slate-700 mb-1 w-full"></div>
            <div>Assinatura cliente</div>
          </div>
        </div>
      );

    case 'template_dacao_pagamento':
      return (
        <div className="absolute inset-0 pointer-events-none p-0 font-sans text-slate-900 select-none" style={{ fontSize: `${7.5 * zoom}px` }}>
          {/* Outer Rounded Frame */}
          <div
            className="absolute border border-slate-700"
            style={{
              left: `${50 * zoom}px`,
              top: `${40 * zoom}px`,
              width: `${495.28 * zoom}px`,
              height: `${760 * zoom}px`,
              borderRadius: `${40 * zoom}px`,
            }}
          />

          {/* Title Pill Badge */}
          <div
            className="absolute bg-white border border-slate-700 rounded-full flex items-center justify-center font-bold tracking-wide z-10"
            style={{
              left: `${177.64 * zoom}px`,
              top: `${29 * zoom}px`,
              width: `${240 * zoom}px`,
              height: `${22 * zoom}px`,
              fontSize: `${7.8 * zoom}px`,
            }}
          >
            DECLARAÇÃO DE DAÇÃO EM PAGAMENTO DE VEÍCULO
          </div>

          {/* Box 1: Proprietário */}
          <div
            className="absolute border border-slate-700 bg-white"
            style={{
              left: `${64 * zoom}px`,
              top: `${72 * zoom}px`,
              width: `${467.28 * zoom}px`,
              height: `${66 * zoom}px`,
            }}
          >
            <div
              className="absolute top-0 bottom-0 left-0 border-r border-slate-700 flex items-center justify-center font-bold text-slate-900"
              style={{
                width: `${24 * zoom}px`,
                fontSize: `${7.2 * zoom}px`,
                writingMode: 'vertical-rl',
                transform: 'rotate(180deg)',
              }}
            >
              proprietário
            </div>
            <div className="absolute top-0 right-0 bottom-0 flex flex-col justify-between" style={{ left: `${24 * zoom}px` }}>
              <div className="flex items-center px-1.5 border-b border-slate-500 text-slate-800" style={{ height: `${22 * zoom}px`, fontSize: `${7.8 * zoom}px` }}>
                <span>Eu,</span>
              </div>
              <div className="flex items-center border-b border-slate-500 text-slate-800" style={{ height: `${22 * zoom}px`, fontSize: `${7.8 * zoom}px` }}>
                <div className="px-1.5 flex items-center border-r border-slate-500 h-full text-slate-800" style={{ width: `${212 * zoom}px` }}>
                  portador do RG nº:
                </div>
                <div className="flex-1 px-1.5 flex items-center text-slate-800">
                  e do CPF nº
                </div>
              </div>
              <div className="flex items-center text-slate-800" style={{ height: `${22 * zoom}px`, fontSize: `${7.8 * zoom}px` }}>
                <div className="px-1.5 flex items-center border-r border-slate-500 h-full text-slate-800" style={{ width: `${212 * zoom}px` }}>
                  Estado Civil
                </div>
                <div className="flex-1 px-1.5 flex items-center text-slate-800">
                  Profissão:
                </div>
              </div>
            </div>
          </div>

          {/* Header 1 */}
          <div
            className="absolute font-bold text-slate-900"
            style={{
              left: `${64 * zoom}px`,
              top: `${154 * zoom}px`,
              fontSize: `${7.8 * zoom}px`,
            }}
          >
            DECLARO sob minha total responsabilidade dar em pagamento o veículo
          </div>

          {/* Box 2: Veículo Usado */}
          <div
            className="absolute border border-slate-700 bg-white"
            style={{
              left: `${64 * zoom}px`,
              top: `${172 * zoom}px`,
              width: `${467.28 * zoom}px`,
              height: `${44 * zoom}px`,
            }}
          >
            <div
              className="absolute top-0 bottom-0 left-0 border-r border-slate-700 flex items-center justify-center font-bold text-slate-900"
              style={{
                width: `${24 * zoom}px`,
                fontSize: `${6.8 * zoom}px`,
                writingMode: 'vertical-rl',
                transform: 'rotate(180deg)',
              }}
            >
              veículo usado
            </div>
            <div className="absolute top-0 right-0 bottom-0 flex flex-col justify-between" style={{ left: `${24 * zoom}px` }}>
              <div className="flex items-center border-b border-slate-500 text-slate-800" style={{ height: `${22 * zoom}px`, fontSize: `${7.8 * zoom}px` }}>
                <div className="px-1.5 border-r border-slate-500 h-full flex items-center text-slate-800" style={{ width: `${70 * zoom}px` }}>
                  Placa:
                </div>
                <div className="px-1.5 border-r border-slate-500 h-full flex items-center text-slate-800" style={{ width: `${127 * zoom}px` }}>
                  Ano Fabricação:
                </div>
                <div className="flex-1 px-1.5 flex items-center text-slate-800">
                  Marca
                </div>
              </div>
              <div className="flex items-center px-1.5 text-slate-800" style={{ height: `${22 * zoom}px`, fontSize: `${7.8 * zoom}px` }}>
                Chassi:
              </div>
            </div>
          </div>

          {/* Header 2 */}
          <div
            className="absolute font-bold text-slate-900"
            style={{
              left: `${64 * zoom}px`,
              top: `${232 * zoom}px`,
              fontSize: `${7.8 * zoom}px`,
            }}
          >
            objetivando realizar o pagamento parcial do veículo
          </div>

          {/* Box 3: Veículo Adquirido */}
          <div
            className="absolute border border-slate-700 bg-white"
            style={{
              left: `${64 * zoom}px`,
              top: `${250 * zoom}px`,
              width: `${467.28 * zoom}px`,
              height: `${44 * zoom}px`,
            }}
          >
            <div
              className="absolute top-0 bottom-0 left-0 border-r border-slate-700 flex items-center justify-center font-bold text-slate-900"
              style={{
                width: `${24 * zoom}px`,
                fontSize: `${6.6 * zoom}px`,
                writingMode: 'vertical-rl',
                transform: 'rotate(180deg)',
              }}
            >
              veículo adquirido
            </div>
            <div className="absolute top-0 right-0 bottom-0 flex flex-col justify-between" style={{ left: `${24 * zoom}px` }}>
              <div className="flex items-center border-b border-slate-500 text-slate-800" style={{ height: `${22 * zoom}px`, fontSize: `${7.8 * zoom}px` }}>
                <div className="px-1.5 border-r border-slate-500 h-full flex items-center text-slate-800" style={{ width: `${70 * zoom}px` }}>
                  Placa:
                </div>
                <div className="px-1.5 border-r border-slate-500 h-full flex items-center text-slate-800" style={{ width: `${127 * zoom}px` }}>
                  Ano:
                </div>
                <div className="flex-1 px-1.5 flex items-center text-slate-800">
                  Marca / Modelo:
                </div>
              </div>
              <div className="flex items-center px-1.5 text-slate-800" style={{ height: `${22 * zoom}px`, fontSize: `${7.8 * zoom}px` }}>
                Chassi:
              </div>
            </div>
          </div>

          {/* Box 4: Comprador */}
          <div
            className="absolute border border-slate-700 bg-white flex items-center text-slate-800"
            style={{
              left: `${64 * zoom}px`,
              top: `${310 * zoom}px`,
              width: `${467.28 * zoom}px`,
              height: `${22 * zoom}px`,
              fontSize: `${7.8 * zoom}px`,
            }}
          >
            <div className="px-2 border-r border-slate-500 h-full flex items-center font-bold text-slate-900" style={{ width: `${116 * zoom}px` }}>
              neste ato adquirido por
            </div>
            <div className="flex-1 px-2 flex items-center text-slate-800">
              Comprador:
            </div>
          </div>

          {/* Legal Paragraphs */}
          <div
            className="absolute text-slate-800 leading-tight space-y-1.5 text-justify"
            style={{
              left: `${64 * zoom}px`,
              top: `${348 * zoom}px`,
              width: `${467.28 * zoom}px`,
              fontSize: `${7.2 * zoom}px`,
            }}
          >
            <div>
              , que conjuntamente assume ampla responsabilidade solidária e é autorizado a receber eventuais valores provenientes da negociação junto à DAHRUJ MOTORS LTDA , seja a que título for.
            </div>
            <div>
              Declaro, também, sob as penas da lei, que o veículo objeto da dação em pagamento se encontra totalmente livre e desembaraçado de quaisquer ônus, dívida real, pessoal, fiscal ou extrajudicial, penhora, arresto ou sequestro, ou ainda restrições ou constrições de qualquer natureza, em especial em razão de qualquer processo judicial.
            </div>
            <div>
              Assumo em meu nome, pelo veículo dado em pagamento, a mais ampla e irrestrita responsabilidade, especialmente, mas não limitado, quanto aos seguintes ônus:
            </div>

            <div className="space-y-1 pl-3 pt-0.5">
              <div className="flex items-start gap-1.5 font-bold">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-900 mt-1 shrink-0"></span>
                <span>Débito ou dívida direta ou indireta contraída por mim e que pese ou venha a pesar sobre o mesmo; multas de trânsito de qualquer gravidade e ou valor que tenham sido geradas até a presente data;</span>
              </div>
              <div className="flex items-start gap-1.5 font-bold">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-900 mt-1 shrink-0"></span>
                <span>Penhora, arrestos, sequestros ou quaisquer outras constrições que possam vir a pesar sobre o veículo, seja a que título ou tempo for, decorrente ou não de processo judicial;</span>
              </div>
              <div className="flex items-start gap-1.5 font-bold">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-900 mt-1 shrink-0"></span>
                <span>Toda e qualquer responsabilidade civil ou criminal.</span>
              </div>
            </div>

            <div className="pt-1 leading-snug" style={{ fontSize: `${7.0 * zoom}px` }}>
              Em recaindo sobre o veículo qualquer tipo de cobrança (judicial ou extrajudicial) ou qualquer tipo de constrição judicial e ou administrativa, que venha de qualquer forma, ainda que parcialmente, comprometer ou limitar sua plena, livre e ilimitada disposição, utilização ou comercialização, obrigo-me a adotar todas as providências necessárias e indicadas para sua IMEDIATA liberação e completa isenção de responsabilidade da DAHRUJ MOTORS LTDA, seja pagando a integridade do débito, seja através de qualquer outro meio eficaz, providências estas que deverão ocorrer dentro de um prazo máximo de 24 horas da efetivação da cientificação, o que ocorrerá por qualquer meio de comunicação, sob pena de responder por todas as perdas e danos decorrentes, além de multa diária ora estabelecida no valor de R$1.000,00(hum mil reais), além de juros mensais de 1%, correção monetária com base no índice CDI e honorários advocatícios de 20% se necessária providência judicial. Pelas obrigações acima assumidas, ofereço ainda ampla garantia fidejussória. Estas obrigações constituem-se em direito líquido, certo e exigível da DAHRUJ MOTORS LTDA , podendo ser exercido através de ação executiva.
            </div>
          </div>

          {/* Date Box */}
          <div
            className="absolute border border-slate-700 bg-white p-1"
            style={{
              left: `${311 * zoom}px`,
              top: `${600 * zoom}px`,
              width: `${220 * zoom}px`,
              height: `${19 * zoom}px`,
            }}
          >
            <div className="text-slate-500 font-bold leading-none" style={{ fontSize: `${5.5 * zoom}px` }}>Data:</div>
            <div className="text-slate-800 font-medium pl-3 leading-none mt-0.5" style={{ fontSize: `${7.5 * zoom}px` }}>Campinas,</div>
          </div>

          {/* Signature Line */}
          <div
            className="absolute text-center"
            style={{
              left: `${163 * zoom}px`,
              top: `${665 * zoom}px`,
              width: `${270 * zoom}px`,
            }}
          >
            <div className="border-t border-slate-700 w-full mb-1"></div>
            <div className="font-bold text-slate-900" style={{ fontSize: `${8.0 * zoom}px` }}>Assinatura - do proprietário</div>
            <div className="text-slate-500" style={{ fontSize: `${6.8 * zoom}px` }}>reconhecer por autenticidade</div>
          </div>
        </div>
      );

    case 'template_isencao_nf_servicos':
      return (
        <div className="absolute inset-0 pointer-events-none p-6 font-sans text-slate-900" style={{ fontSize: `${9.5 * zoom}px` }}>
          <div className="absolute font-bold text-center uppercase" style={{ left: `${80 * zoom}px`, top: `${85 * zoom}px`, width: `${435 * zoom}px`, fontSize: `${14 * zoom}px` }}>
            DECLARAÇÃO
          </div>
          <div className="absolute leading-relaxed" style={{ left: `${80 * zoom}px`, top: `${145 * zoom}px`, width: `${435 * zoom}px` }}>
            <div>A empresa <span className="inline-block border-b border-slate-500" style={{ width: `${170 * zoom}px` }}></span>, CNPJ <span className="inline-block border-b border-slate-500" style={{ width: `${150 * zoom}px` }}></span>,</div>
            <div className="mt-4">vem através desta, declarar que está desobrigada a EMISSÃO DE NOTA FISCAL DE VENDA modelo 1, por se tratar de empresa cuja a atividade é exclusivamente de PRESTAÇÃO DE SERVIÇOS, não sendo portanto contribuinte de ICMS.</div>
          </div>

          <div className="absolute space-y-6 font-bold" style={{ left: `${80 * zoom}px`, top: `${345 * zoom}px`, width: `${435 * zoom}px` }}>
            <div>VEÍCULO: <span className="inline-block border-b border-slate-500 font-normal" style={{ width: `${370 * zoom}px` }}></span></div>
            <div>ANO : <span className="inline-block border-b border-slate-500 font-normal" style={{ width: `${390 * zoom}px` }}></span></div>
            <div>COR: <span className="inline-block border-b border-slate-500 font-normal" style={{ width: `${395 * zoom}px` }}></span></div>
            <div>RENAVAM: <span className="inline-block border-b border-slate-500 font-normal" style={{ width: `${370 * zoom}px` }}></span></div>
            <div>CHASSI: <span className="inline-block border-b border-slate-500 font-normal" style={{ width: `${385 * zoom}px` }}></span></div>
          </div>

          <div className="absolute text-right" style={{ right: `${80 * zoom}px`, top: `${560 * zoom}px` }}>
            Para maior clareza, firma presente
          </div>
          <div className="absolute text-right" style={{ right: `${80 * zoom}px`, top: `${630 * zoom}px` }}>
            Cidade, e data <span className="inline-block border-b border-slate-500" style={{ width: `${160 * zoom}px` }}></span>
          </div>

          <div className="absolute text-center" style={{ left: `${170 * zoom}px`, top: `${740 * zoom}px`, width: `${250 * zoom}px` }}>
            <div className="border-t border-slate-700 mb-1 w-full"></div>
            <div className="font-bold">ASSINATURA</div>
            <div className="text-[8.5px] text-slate-500">(contador ou sócio majoritário)</div>
          </div>
        </div>
      );

    case 'template_termo_compra_usado_gwm':
      return (
        <div className="absolute inset-0 pointer-events-none p-6 font-sans text-slate-900" style={{ fontSize: `${8.5 * zoom}px` }}>
          <div className="absolute font-bold" style={{ left: `${80 * zoom}px`, top: `${50 * zoom}px`, fontSize: `${16 * zoom}px` }}>
            GWM
          </div>
          <div className="absolute font-bold text-center" style={{ left: `${80 * zoom}px`, top: `${85 * zoom}px`, width: `${435 * zoom}px`, fontSize: `${10.5 * zoom}px` }}>
            Termo de Compra do veículo usado
          </div>
          <div className="absolute font-bold" style={{ left: `${80 * zoom}px`, top: `${115 * zoom}px` }}>
            Pedido RTO - <span className="inline-block border-b border-slate-500 font-normal" style={{ width: `${200 * zoom}px` }}></span>
          </div>
          <div className="absolute" style={{ left: `${80 * zoom}px`, top: `${140 * zoom}px` }}>
            Eu (cliente), <span className="inline-block border-b border-slate-500" style={{ width: `${290 * zoom}px` }}></span>, CPF <span className="inline-block border-b border-slate-500" style={{ width: `${150 * zoom}px` }}></span>
          </div>
          <div className="absolute" style={{ left: `${80 * zoom}px`, top: `${165 * zoom}px` }}>
            , declaro para os devidos fins que obtive o benefício:
          </div>
          <div className="absolute font-bold text-[11px]" style={{ left: `${80 * zoom}px`, top: `${205 * zoom}px` }}>
            Declaração de Venda de Veículo Seminovo
          </div>
          <div className="absolute" style={{ left: `${80 * zoom}px`, top: `${240 * zoom}px` }}>
            Declaro para os devidos fins que vendi meu veículo seminovo, abaixo descrito, no valor de
          </div>
          <div className="absolute" style={{ left: `${80 * zoom}px`, top: `${270 * zoom}px` }}>
            R$ <span className="inline-block border-b border-slate-500" style={{ width: `${250 * zoom}px` }}></span> (valor por extenso) para a
          </div>
          <div className="absolute" style={{ left: `${80 * zoom}px`, top: `${295 * zoom}px` }}>
            concessionária <span className="inline-block border-b border-slate-500" style={{ width: `${200 * zoom}px` }}></span>.
          </div>
          <div className="absolute font-bold" style={{ left: `${80 * zoom}px`, top: `${330 * zoom}px` }}>
            Marca <span className="inline-block border-b border-slate-500 font-normal" style={{ width: `${70 * zoom}px` }}></span> Modelo <span className="inline-block border-b border-slate-500 font-normal" style={{ width: `${70 * zoom}px` }}></span> Versão <span className="inline-block border-b border-slate-500 font-normal" style={{ width: `${70 * zoom}px` }}></span>
          </div>
          <div className="absolute" style={{ left: `${80 * zoom}px`, top: `${380 * zoom}px` }}>
            Ano Fabricação/Modelo <span className="inline-block border-b border-slate-500" style={{ width: `${35 * zoom}px` }}></span> / <span className="inline-block border-b border-slate-500" style={{ width: `${35 * zoom}px` }}></span> Placa <span className="inline-block border-b border-slate-500" style={{ width: `${120 * zoom}px` }}></span>
          </div>
          <div className="absolute" style={{ left: `${80 * zoom}px`, top: `${430 * zoom}px` }}>
            O veículo seminovo está sendo vendido como parte do pagamento na aquisição do veículo novo, de marca GWM, modelo <span className="inline-block border-b border-slate-500" style={{ width: `${75 * zoom}px` }}></span>.
          </div>
          <div className="absolute" style={{ left: `${80 * zoom}px`, top: `${495 * zoom}px` }}>
            Data: <span className="inline-block border-b border-slate-500" style={{ width: `${40 * zoom}px` }}></span> / <span className="inline-block border-b border-slate-500" style={{ width: `${50 * zoom}px` }}></span> / <span className="inline-block border-b border-slate-500" style={{ width: `${50 * zoom}px` }}></span> .
          </div>
          {/* Signatures */}
          <div className="absolute space-y-2" style={{ left: `${80 * zoom}px`, top: `${580 * zoom}px`, width: `${200 * zoom}px` }}>
            <div className="font-bold">(Cliente Assinatura)</div>
            <div>Nome: <span className="inline-block border-b border-slate-500" style={{ width: `${140 * zoom}px` }}></span></div>
            <div>Fone: <span className="inline-block border-b border-slate-500" style={{ width: `${145 * zoom}px` }}></span></div>
            <div>E-mail: <span className="inline-block border-b border-slate-500" style={{ width: `${140 * zoom}px` }}></span></div>
            <div className="font-bold text-[7.5px] mt-2">Proprietário (RECONHECER POR AUTENTICIDADE)</div>
          </div>
          <div className="absolute space-y-2" style={{ left: `${320 * zoom}px`, top: `${580 * zoom}px`, width: `${200 * zoom}px` }}>
            <div className="font-bold">(Concess. Assinatura)</div>
            <div>Nome: <span className="inline-block border-b border-slate-500" style={{ width: `${140 * zoom}px` }}></span></div>
            <div>Função: <span className="inline-block border-b border-slate-500" style={{ width: `${135 * zoom}px` }}></span></div>
          </div>
        </div>
      );

    case 'template_formulario_devolucao':
      return (
        <div className="absolute inset-0 pointer-events-none p-6 font-sans text-slate-900" style={{ fontSize: `${9 * zoom}px` }}>
          <div className="absolute font-bold tracking-wider" style={{ left: `${80 * zoom}px`, top: `${45 * zoom}px`, fontSize: `${15 * zoom}px` }}>
            GWM <span className="text-slate-400 font-normal">|</span> DAHRUJ
          </div>
          <div className="absolute font-bold text-center uppercase" style={{ left: `${80 * zoom}px`, top: `${95 * zoom}px`, width: `${435 * zoom}px`, fontSize: `${12 * zoom}px` }}>
            FORMULÁRIO PARA DEVOLUÇÃO
          </div>
          <div className="absolute font-bold flex items-center gap-6" style={{ left: `${80 * zoom}px`, top: `${145 * zoom}px` }}>
            <span>CONTA CONJUNTA?</span>
            <span className="flex items-center gap-1"><span className="inline-block border border-slate-600 w-3.5 h-3.5"></span> SIM</span>
            <span className="flex items-center gap-1"><span className="inline-block border border-slate-600 w-3.5 h-3.5"></span> NÃO</span>
          </div>
          <div className="absolute font-bold flex items-center gap-6" style={{ left: `${80 * zoom}px`, top: `${175 * zoom}px` }}>
            <span>TERCEIRO?</span>
            <span className="flex items-center gap-1"><span className="inline-block border border-slate-600 w-3.5 h-3.5"></span> SIM</span>
            <span className="flex items-center gap-1"><span className="inline-block border border-slate-600 w-3.5 h-3.5"></span> NÃO</span>
          </div>
          <div className="absolute font-bold space-y-4" style={{ left: `${80 * zoom}px`, top: `${205 * zoom}px` }}>
            <div>CHAVE PIX: <span className="inline-block border-b border-slate-500 font-normal" style={{ width: `${195 * zoom}px` }}></span></div>
            <div>TITULAR: <span className="inline-block border-b border-slate-500 font-normal" style={{ width: `${205 * zoom}px` }}></span></div>
            <div>CPF/CNPJ: <span className="inline-block border-b border-slate-500 font-normal" style={{ width: `${195 * zoom}px` }}></span></div>
            <div>BANCO: <span className="inline-block border-b border-slate-500 font-normal" style={{ width: `${205 * zoom}px` }}></span></div>
            <div>AGÊNCIA: <span className="inline-block border-b border-slate-500 font-normal" style={{ width: `${200 * zoom}px` }}></span></div>
            <div>CONTA POUPANÇA: <span className="inline-block border-b border-slate-500 font-normal" style={{ width: `${155 * zoom}px` }}></span></div>
            <div>CONTA CORRENTE: <span className="inline-block border-b border-slate-500 font-normal" style={{ width: `${155 * zoom}px` }}></span></div>
            <div>OPERAÇÃO CEF (CAIXA ECONÔMICA): <span className="inline-block border-b border-slate-500 font-normal" style={{ width: `${75 * zoom}px` }}></span></div>
          </div>
          <div className="absolute text-[7.5px] font-bold leading-tight" style={{ left: `${80 * zoom}px`, top: `${465 * zoom}px`, width: `${435 * zoom}px` }}>
            <div>OBS: NO CASO SE INDICAR CONTA DE TERCEIRO FAZER CARTA DE PROPRIO PUNHO AUTORIZANDO A TRANSFERENCIA DO VALOR E RECONHECER POR AUTENTICIDADE.</div>
            <div className="mt-3">FIRMO E DOU FÉ QUE AS INFORMAÇÕES ACIMA SÃO VERDADEIRAS E EXATAS.</div>
            <div>ESTOU CIENTE QUE A DEVOLUCAO SÓ SERÁ DEPOSITADA EM 3 DIAS ÚTEIS.</div>
          </div>
          <div className="absolute" style={{ left: `${180 * zoom}px`, top: `${595 * zoom}px` }}>
            São Paulo, <span className="inline-block border-b border-slate-500" style={{ width: `${40 * zoom}px` }}></span> / <span className="inline-block border-b border-slate-500" style={{ width: `${45 * zoom}px` }}></span> / <span className="inline-block border-b border-slate-500" style={{ width: `${55 * zoom}px` }}></span>
          </div>
          <div className="absolute text-center" style={{ left: `${180 * zoom}px`, top: `${680 * zoom}px`, width: `${225 * zoom}px` }}>
            <div className="border-t border-slate-700 mb-1 w-full"></div>
            <div className="font-bold text-[8.5px]">ASSINATURA CLIENTE</div>
          </div>
        </div>
      );

    default:
      // Termo de Responsabilidade default layout
      return (
        <div className="absolute inset-0 pointer-events-none p-6 font-sans select-none" style={{ fontSize: `${8 * zoom}px` }}>
          <div className="absolute text-center font-bold tracking-wide underline uppercase text-slate-900" style={{ left: `${80 * zoom}px`, top: `${120 * zoom}px`, width: `${435 * zoom}px`, fontSize: `${10.5 * zoom}px` }}>
            TERMO DE RESPONSABILIDADE
          </div>
          <div className="absolute text-slate-800" style={{ left: `${80 * zoom}px`, top: `${145 * zoom}px`, fontSize: `${8 * zoom}px` }}>
            Eu, <span className="inline-block border-b border-slate-500" style={{ width: `${323 * zoom}px` }}></span>, inscrito no CPF sob
          </div>
          <div className="absolute text-slate-800" style={{ left: `${80 * zoom}px`, top: `${158 * zoom}px`, fontSize: `${8 * zoom}px` }}>
            o nº <span className="inline-block border-b border-slate-500" style={{ width: `${110 * zoom}px` }}></span>, RG. Nº <span className="inline-block border-b border-slate-500" style={{ width: `${97 * zoom}px` }}></span>, e CNH Nº <span className="inline-block border-b border-slate-500" style={{ width: `${73 * zoom}px` }}></span>, residente e
          </div>
          <div className="absolute text-slate-800" style={{ left: `${80 * zoom}px`, top: `${171 * zoom}px`, fontSize: `${8 * zoom}px` }}>
            domiciliado na <span className="inline-block border-b border-slate-500" style={{ width: `${368 * zoom}px` }}></span>,
          </div>
          <div className="absolute text-slate-800" style={{ left: `${80 * zoom}px`, top: `${184 * zoom}px`, fontSize: `${8 * zoom}px` }}>
            CEP <span className="inline-block border-b border-slate-500" style={{ width: `${73 * zoom}px` }}></span>, Bairro <span className="inline-block border-b border-slate-500" style={{ width: `${115 * zoom}px` }}></span>, Município de <span className="inline-block border-b border-slate-500" style={{ width: `${80 * zoom}px` }}></span>, Estado de
          </div>
          <div className="absolute text-slate-800" style={{ left: `${80 * zoom}px`, top: `${197 * zoom}px`, fontSize: `${8 * zoom}px` }}>
            <span className="inline-block border-b border-slate-500" style={{ width: `${25 * zoom}px` }}></span>, Telefone nº ( <span className="inline-block border-b border-slate-500" style={{ width: `${18 * zoom}px` }}></span> ) <span className="inline-block border-b border-slate-500" style={{ width: `${100 * zoom}px` }}></span>, <span className="font-bold text-[7.5px]">DECLARO, PARA TODOS OS FINS DE</span>
          </div>
          <div className="absolute text-slate-800 font-bold text-[7.5px]" style={{ left: `${80 * zoom}px`, top: `${210 * zoom}px` }}>
            DIREITO, QUE VENDI, NESTA DATA, O VEÍCULO ABAIXO DESCRITO, DE MINHA PROPRIEDADE,
          </div>
          <div className="absolute text-slate-800 font-bold text-[7.5px]" style={{ left: `${80 * zoom}px`, top: `${223 * zoom}px` }}>
            LIVRE E DESEMBARAÇADO DE QUALQUER ÔNUS, a <span className="inline-block border-b border-slate-500" style={{ width: `${207 * zoom}px` }}></span>
          </div>
          <div className="absolute text-slate-800" style={{ left: `${80 * zoom}px`, top: `${236 * zoom}px`, fontSize: `${8 * zoom}px` }}>
            inscrita no CNPJ sob o nº <span className="inline-block border-b border-slate-500" style={{ width: `${132 * zoom}px` }}></span>
          </div>

          <div className="absolute text-center font-bold tracking-wide underline uppercase text-slate-900" style={{ left: `${80 * zoom}px`, top: `${260 * zoom}px`, width: `${435 * zoom}px`, fontSize: `${9 * zoom}px` }}>
            CARACTERÍSTICAS DO VEÍCULO / PROPRIETÁRIO
          </div>

          {/* Linha 1 Veículo */}
          <div className="absolute text-slate-800" style={{ left: `${80 * zoom}px`, top: `${280 * zoom}px`, fontSize: `${8 * zoom}px` }}>
            Marca <span className="inline-block border-b border-slate-500" style={{ width: `${92 * zoom}px` }}></span> Modelo: <span className="inline-block border-b border-slate-500" style={{ width: `${110 * zoom}px` }}></span> Ano/Modelo <span className="inline-block border-b border-slate-500" style={{ width: `${46 * zoom}px` }}></span> / Cor: <span className="inline-block border-b border-slate-500" style={{ width: `${35 * zoom}px` }}></span>
          </div>
          {/* Linha 2 Veículo */}
          <div className="absolute text-slate-800" style={{ left: `${80 * zoom}px`, top: `${294 * zoom}px`, fontSize: `${8 * zoom}px` }}>
            Placa: <span className="inline-block border-b border-slate-500" style={{ width: `${80 * zoom}px` }}></span> Chassi <span className="inline-block border-b border-slate-500" style={{ width: `${291 * zoom}px` }}></span>
          </div>
          {/* Linha 3 Proprietário */}
          <div className="absolute text-slate-800" style={{ left: `${80 * zoom}px`, top: `${308 * zoom}px`, fontSize: `${8 * zoom}px` }}>
            Proprietário: <span className="inline-block border-b border-slate-500" style={{ width: `${265 * zoom}px` }}></span> CPF: <span className="inline-block border-b border-slate-500" style={{ width: `${87 * zoom}px` }}></span>
          </div>
          {/* Linha 4 Docs */}
          <div className="absolute text-slate-800" style={{ left: `${80 * zoom}px`, top: `${322 * zoom}px`, fontSize: `${8 * zoom}px` }}>
            RG/UF: <span className="inline-block border-b border-slate-500" style={{ width: `${126 * zoom}px` }}></span> / <span className="inline-block border-b border-slate-500" style={{ width: `${28 * zoom}px` }}></span> .
          </div>

          {/* Declarações Legais (Bullet points) */}
          <div className="absolute text-slate-900 font-bold" style={{ left: `${80 * zoom}px`, top: `${342 * zoom}px`, fontSize: `${7.5 * zoom}px` }}>
            Declaro, ainda, que:
          </div>

          <div className="absolute text-slate-800 leading-tight" style={{ left: `${80 * zoom}px`, top: `${353 * zoom}px`, width: `${435 * zoom}px`, fontSize: `${7.0 * zoom}px` }}>
            - estou ciente de minha responsabilidade quanto ao veículo ora transacionado, nas esferas civil, administrativa e criminal, por qualquer evento ocorrido até a presente data;
          </div>

          <div className="absolute text-slate-800 leading-tight" style={{ left: `${80 * zoom}px`, top: `${371 * zoom}px`, width: `${435 * zoom}px`, fontSize: `${7.0 * zoom}px` }}>
            - me obrigo a fornecer, neste ato e a qualquer momento que se fizer necessário, toda e qualquer documentação para viabilizar a transferência do veículo;
          </div>

          <div className="absolute text-slate-800 leading-tight" style={{ left: `${80 * zoom}px`, top: `${389 * zoom}px`, width: `${435 * zoom}px`, fontSize: `${7.0 * zoom}px` }}>
            - me responsabilizo por todas as infrações, penalidades, multas, taxas, IPVA, tributos e outros débitos incidentes sobre o veículo até a presente data, ainda que futura ou retroativamente lançados;
          </div>

          <div className="absolute text-slate-800 leading-tight" style={{ left: `${80 * zoom}px`, top: `${407 * zoom}px`, width: `${435 * zoom}px`, fontSize: `${7.0 * zoom}px` }}>
            - em caso de autuação relativa a período anterior a esta data, fico obrigado a, em sendo o caso, indicar o condutor, fornecer sua CNH e assinar o documento de indicação, no campo específico, assumindo, de todo modo, integral responsabilidade pela infração e eventuais danos e prejuízos daí decorrentes;
          </div>

          <div className="absolute text-slate-800 leading-tight" style={{ left: `${80 * zoom}px`, top: `${433 * zoom}px`, width: `${435 * zoom}px`, fontSize: `${7.0 * zoom}px` }}>
            - em se tratando se de veículo importado, responsabilizo-me por eventual direito de regresso se sobre ele recair qualquer ônus ou dívida que possa inviabilizar a sua transferência ao adquirente;
          </div>

          {/* Bullet 6 - BOLD & UNDERLINED */}
          <div className="absolute text-slate-900 font-bold underline leading-tight" style={{ left: `${80 * zoom}px`, top: `${451 * zoom}px`, width: `${435 * zoom}px`, fontSize: `${7.0 * zoom}px` }}>
            - me comprometo a pagar os valores relativos aos débitos incidentes sobre o veículo relativos a período anterior a esta data, assim que cientificado para tal fim, informando, para tanto, o endereço, telefone e e-mail abaixo, obrigando-me a informar qualquer alteração, ou, de todo modo, autorizando, desde já, a cobrança por meio de instituição financeira, mediante emissão de boleto bancário, bem como, em caso de não pagamento ou não localização para envio da cobrança, protesto e negativação;
          </div>

          <div className="absolute text-slate-800 leading-tight" style={{ left: `${80 * zoom}px`, top: `${501 * zoom}px`, width: `${435 * zoom}px`, fontSize: `${7.0 * zoom}px` }}>
            - no caso de serem os débitos quitados pelo comprador, estou ciente de que este ficará sub-rogado no direito ao crédito, ficando expressamente convencionado que, se tiver de promover execução judicial ou cobrança dos valores, estes serão corrigidos e acrescidos de juros moratórios de 1% (um por cento) ao mês.
          </div>

          {/* Data */}
          <div className="absolute font-bold text-slate-900" style={{ left: `${80 * zoom}px`, top: `${538 * zoom}px`, fontSize: `${7.5 * zoom}px` }}>
            Por ser verdade, firmo o presente.
          </div>
          <div className="absolute text-slate-900" style={{ left: `${80 * zoom}px`, top: `${546 * zoom}px`, fontSize: `${8 * zoom}px` }}>
            Campinas, <span className="inline-block border-b border-slate-500" style={{ width: `${26 * zoom}px` }}></span> de <span className="inline-block border-b border-slate-500" style={{ width: `${76 * zoom}px` }}></span> de 20 <span className="inline-block border-b border-slate-500" style={{ width: `${22 * zoom}px` }}></span>.
          </div>

          {/* Assinatura Proprietário */}
          <div className="absolute" style={{ left: `${80 * zoom}px`, top: `${580 * zoom}px`, width: `${200 * zoom}px` }}>
            <div className="border-t border-slate-700 mb-1 w-full"></div>
            <div className="font-bold text-slate-900" style={{ fontSize: `${7.5 * zoom}px` }}>Proprietário (RECONHECER POR AUTENTICIDADE)</div>
          </div>

          {/* Bottom box */}
          <div className="absolute border border-slate-700 p-2.5 bg-white" style={{ left: `${75 * zoom}px`, top: `${637 * zoom}px`, width: `${440 * zoom}px`, height: `${153 * zoom}px` }}>
            <div className="font-bold text-[7.2px] border-b border-slate-300 pb-1 uppercase text-slate-900">
              DADOS PARA EVENTUAIS COMUNICAÇÕES E COBRANÇAS RELATIVAS AO VEÍCULO AQUI DESCRITO (não serão utilizados em hipótese alguma para outra finalidade)
            </div>
            <div className="text-[7.5px] space-y-1.5 pt-1.5 text-slate-800">
              <div>Endereço residencial: <span className="inline-block border-b border-slate-400" style={{ width: `${342 * zoom}px` }}></span></div>
              <div>Endereço comercial: <span className="inline-block border-b border-slate-400" style={{ width: `${345 * zoom}px` }}></span></div>
              <div>Telefone com DDD: <span className="inline-block border-b border-slate-400" style={{ width: `${160 * zoom}px` }}></span> WhatsApp: <span className="inline-block border-b border-slate-400" style={{ width: `${142 * zoom}px` }}></span></div>
              <div>e-mails: <span className="inline-block border-b border-slate-400" style={{ width: `${395 * zoom}px` }}></span></div>
              <div>Principal condutor: <span className="inline-block border-b border-slate-400" style={{ width: `${358 * zoom}px` }}></span></div>
              <div>CNH do principal condutor: <span className="inline-block border-b border-slate-400" style={{ width: `${160 * zoom}px` }}></span> CPF: <span className="inline-block border-b border-slate-400" style={{ width: `${142 * zoom}px` }}></span></div>
              <div className="text-[6px] text-slate-500 pt-0.5">*arquivar cópia dos documentos e comprovantes</div>
            </div>
            <div className="text-center mt-3">
              <div className="mx-auto border-t border-slate-700 w-3/4 mb-1"></div>
              <div className="font-bold text-[7.5px] text-slate-900">
                Nome e assinatura do declarante
              </div>
            </div>
          </div>
        </div>
      );
  }
};
