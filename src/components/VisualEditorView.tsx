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
    if (!selectedFieldId && template.fields.length > 0) {
      setSelectedFieldId(template.fields[0].id);
    }
  }, [template]);

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
              <TemplateCanvasBackground templateId={template.id} zoom={zoom} />
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
            {fields.map((field) => {
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
const TemplateCanvasBackground: React.FC<{ templateId: string; zoom: number }> = ({ templateId, zoom }) => {
  switch (templateId) {
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
            Solicito devolução integral do pagamento efetuado via <span className="inline-block border-b border-slate-500" style={{ width: `${200 * zoom}px` }}></span>.
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
        <div className="absolute inset-0 pointer-events-none p-6 font-sans text-slate-900" style={{ fontSize: `${8 * zoom}px` }}>
          <div className="absolute border border-slate-700 rounded-lg px-3 py-1 font-bold text-center" style={{ left: `${180 * zoom}px`, top: `${70 * zoom}px`, width: `${235 * zoom}px`, fontSize: `${7.5 * zoom}px` }}>
            DECLARAÇÃO DE DAÇÃO EM PAGAMENTO DE VEÍCULO
          </div>
          {/* Box Proprietário */}
          <div className="absolute border border-slate-700" style={{ left: `${75 * zoom}px`, top: `${110 * zoom}px`, width: `${445 * zoom}px`, height: `${65 * zoom}px` }}>
            <div className="absolute top-0 bottom-0 left-0 border-r border-slate-700 flex flex-col justify-center items-center font-bold text-[7px]" style={{ width: `${20 * zoom}px` }}>
              <span>p</span><span>r</span><span>o</span><span>p</span><span>r</span><span>i</span><span>e</span>
            </div>
            <div className="pl-6 pt-1 text-[7.5px] space-y-1">
              <div>Eu, <span className="inline-block border-b border-slate-500" style={{ width: `${390 * zoom}px` }}></span></div>
              <div className="border-t border-slate-300 pt-1">portador do RG nº: <span className="inline-block border-b border-slate-500" style={{ width: `${120 * zoom}px` }}></span> e do CPF nº <span className="inline-block border-b border-slate-500" style={{ width: `${160 * zoom}px` }}></span></div>
              <div className="border-t border-slate-300 pt-1">Estado Civil <span className="inline-block border-b border-slate-500" style={{ width: `${140 * zoom}px` }}></span> Profissão: <span className="inline-block border-b border-slate-500" style={{ width: `${160 * zoom}px` }}></span></div>
            </div>
          </div>

          <div className="absolute font-bold text-[7.5px]" style={{ left: `${75 * zoom}px`, top: `${188 * zoom}px` }}>
            DECLARO sob minha total responsabilidade dar em pagamento o veículo
          </div>

          {/* Box Usado */}
          <div className="absolute border border-slate-700" style={{ left: `${75 * zoom}px`, top: `${202 * zoom}px`, width: `${445 * zoom}px`, height: `${48 * zoom}px` }}>
            <div className="absolute top-0 bottom-0 left-0 border-r border-slate-700 flex flex-col justify-center items-center font-bold text-[7px]" style={{ width: `${20 * zoom}px` }}>
              <span>u</span><span>s</span><span>a</span><span>d</span><span>o</span>
            </div>
            <div className="pl-6 pt-1 text-[7.5px] space-y-1">
              <div>Placa: <span className="inline-block border-b border-slate-500" style={{ width: `${70 * zoom}px` }}></span> Ano Fabricação: <span className="inline-block border-b border-slate-500" style={{ width: `${50 * zoom}px` }}></span> Marca: <span className="inline-block border-b border-slate-500" style={{ width: `${160 * zoom}px` }}></span></div>
              <div className="border-t border-slate-300 pt-1">Chassi: <span className="inline-block border-b border-slate-500" style={{ width: `${380 * zoom}px` }}></span></div>
            </div>
          </div>

          <div className="absolute font-bold text-[7.5px]" style={{ left: `${75 * zoom}px`, top: `${260 * zoom}px` }}>
            objetivando realizar o pagamento parcial do veículo
          </div>

          {/* Box Adquirido */}
          <div className="absolute border border-slate-700" style={{ left: `${75 * zoom}px`, top: `${275 * zoom}px`, width: `${445 * zoom}px`, height: `${48 * zoom}px` }}>
            <div className="absolute top-0 bottom-0 left-0 border-r border-slate-700 flex flex-col justify-center items-center font-bold text-[7px]" style={{ width: `${20 * zoom}px` }}>
              <span>n</span><span>o</span><span>v</span><span>o</span>
            </div>
            <div className="pl-6 pt-1 text-[7.5px] space-y-1">
              <div>Placa: <span className="inline-block border-b border-slate-500" style={{ width: `${70 * zoom}px` }}></span> Ano: <span className="inline-block border-b border-slate-500" style={{ width: `${90 * zoom}px` }}></span> Marca / Modelo: <span className="inline-block border-b border-slate-500" style={{ width: `${130 * zoom}px` }}></span></div>
              <div className="border-t border-slate-300 pt-1">Chassi: <span className="inline-block border-b border-slate-500" style={{ width: `${380 * zoom}px` }}></span></div>
            </div>
          </div>

          {/* Box Comprador */}
          <div className="absolute border border-slate-700 flex items-center px-3" style={{ left: `${75 * zoom}px`, top: `${330 * zoom}px`, width: `${445 * zoom}px`, height: `${25 * zoom}px` }}>
            <span className="font-bold text-[7.5px] mr-2">neste ato adquirido por</span>
            <span className="text-[7.5px]">Comprador: <span className="inline-block border-b border-slate-500" style={{ width: `${270 * zoom}px` }}></span></span>
          </div>

          {/* Date & Signature */}
          <div className="absolute border border-slate-700 px-3 py-1" style={{ left: `${290 * zoom}px`, top: `${655 * zoom}px`, width: `${230 * zoom}px`, fontSize: `${7.5 * zoom}px` }}>
            Data: Campinas, <span className="inline-block border-b border-slate-500" style={{ width: `${165 * zoom}px` }}></span>
          </div>

          <div className="absolute text-center" style={{ left: `${115 * zoom}px`, top: `${755 * zoom}px`, width: `${200 * zoom}px` }}>
            <div className="border-t border-slate-700 mb-1 w-full"></div>
            <div className="font-bold text-[7.5px]">Assinatura - do proprietário</div>
            <div className="text-[6.5px] text-slate-500">reconhecer por autenticidade</div>
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
        <div className="absolute inset-0 pointer-events-none p-6 font-sans" style={{ fontSize: `${8.5 * zoom}px` }}>
          <div className="absolute text-center font-bold tracking-wide underline uppercase text-slate-900" style={{ left: `${80 * zoom}px`, top: `${120 * zoom}px`, width: `${435 * zoom}px`, fontSize: `${10.5 * zoom}px` }}>
            TERMO DE RESPONSABILIDADE
          </div>
          <div className="absolute text-slate-800" style={{ left: `${80 * zoom}px`, top: `${150 * zoom}px`, fontSize: `${8 * zoom}px` }}>
            Eu, <span className="inline-block border-b border-slate-500" style={{ width: `${320 * zoom}px` }}></span>, inscrito no CPF sob
          </div>
          <div className="absolute text-slate-800" style={{ left: `${80 * zoom}px`, top: `${164.5 * zoom}px`, fontSize: `${8 * zoom}px` }}>
            o nº <span className="inline-block border-b border-slate-500" style={{ width: `${111 * zoom}px` }}></span>, RG. Nº <span className="inline-block border-b border-slate-500" style={{ width: `${97 * zoom}px` }}></span>, e CNH Nº <span className="inline-block border-b border-slate-500" style={{ width: `${73 * zoom}px` }}></span>, residente e
          </div>
          <div className="absolute text-slate-800" style={{ left: `${80 * zoom}px`, top: `${179 * zoom}px`, fontSize: `${8 * zoom}px` }}>
            domiciliado na <span className="inline-block border-b border-slate-500" style={{ width: `${370 * zoom}px` }}></span>,
          </div>
          <div className="absolute text-slate-800" style={{ left: `${80 * zoom}px`, top: `${193.5 * zoom}px`, fontSize: `${8 * zoom}px` }}>
            CEP <span className="inline-block border-b border-slate-500" style={{ width: `${73 * zoom}px` }}></span>, Bairro <span className="inline-block border-b border-slate-500" style={{ width: `${115 * zoom}px` }}></span>, Município de <span className="inline-block border-b border-slate-500" style={{ width: `${80 * zoom}px` }}></span>, Estado de
          </div>
          <div className="absolute text-slate-800" style={{ left: `${80 * zoom}px`, top: `${208 * zoom}px`, fontSize: `${8 * zoom}px` }}>
            <span className="inline-block border-b border-slate-500" style={{ width: `${25 * zoom}px` }}></span>, Telefone nº ( <span className="inline-block border-b border-slate-500" style={{ width: `${18 * zoom}px` }}></span> ) <span className="inline-block border-b border-slate-500" style={{ width: `${100 * zoom}px` }}></span>, <span className="font-semibold text-[7.5px]">DECLARO, PARA TODOS OS FINS DE</span>
          </div>
          <div className="absolute text-slate-800 font-semibold text-[7.5px]" style={{ left: `${80 * zoom}px`, top: `${222.5 * zoom}px` }}>
            DIREITO, QUE VENDI, NESTA DATA, O VEÍCULO ABAIXO DESCRITO, DE MINHA PROPRIEDADE,
          </div>
          <div className="absolute text-slate-800 font-semibold text-[7.5px]" style={{ left: `${80 * zoom}px`, top: `${237 * zoom}px` }}>
            LIVRE E DESEMBARAÇADO DE QUALQUER ÔNUS, a <span className="inline-block border-b border-slate-500" style={{ width: `${207 * zoom}px` }}></span>
          </div>
          <div className="absolute text-slate-800" style={{ left: `${80 * zoom}px`, top: `${251.5 * zoom}px`, fontSize: `${8 * zoom}px` }}>
            inscrita no CNPJ sob o nº <span className="inline-block border-b border-slate-500" style={{ width: `${132 * zoom}px` }}></span>, transferindo-lhe a posse e propriedade do mesmo,
          </div>
          <div className="absolute text-slate-800" style={{ left: `${80 * zoom}px`, top: `${266 * zoom}px`, fontSize: `${8 * zoom}px` }}>
            bem como toda e qualquer responsabilidade civil e criminal sobre o mesmo.
          </div>
          {/* Veículo */}
          <div className="absolute text-slate-800" style={{ left: `${80 * zoom}px`, top: `${286 * zoom}px`, fontSize: `${8 * zoom}px` }}>
            Marca <span className="inline-block border-b border-slate-500" style={{ width: `${92 * zoom}px` }}></span> Modelo: <span className="inline-block border-b border-slate-500" style={{ width: `${110 * zoom}px` }}></span> Ano/Modelo <span className="inline-block border-b border-slate-500" style={{ width: `${46 * zoom}px` }}></span> / Cor: <span className="inline-block border-b border-slate-500" style={{ width: `${35 * zoom}px` }}></span>
          </div>
          <div className="absolute text-slate-800" style={{ left: `${80 * zoom}px`, top: `${299 * zoom}px`, fontSize: `${8 * zoom}px` }}>
            Placa: <span className="inline-block border-b border-slate-500" style={{ width: `${80 * zoom}px` }}></span> Chassi: <span className="inline-block border-b border-slate-500" style={{ width: `${290 * zoom}px` }}></span>
          </div>
          <div className="absolute text-slate-800" style={{ left: `${80 * zoom}px`, top: `${312 * zoom}px`, fontSize: `${8 * zoom}px` }}>
            Proprietário: <span className="inline-block border-b border-slate-500" style={{ width: `${264 * zoom}px` }}></span> CPF: <span className="inline-block border-b border-slate-500" style={{ width: `${87 * zoom}px` }}></span>
          </div>
          <div className="absolute text-slate-800" style={{ left: `${80 * zoom}px`, top: `${325 * zoom}px`, fontSize: `${8 * zoom}px` }}>
            RG: <span className="inline-block border-b border-slate-500" style={{ width: `${132 * zoom}px` }}></span> UF: <span className="inline-block border-b border-slate-500" style={{ width: `${30 * zoom}px` }}></span> .
          </div>
          {/* Bottom box */}
          <div className="absolute border border-slate-700 p-2" style={{ left: `${75 * zoom}px`, top: `${668 * zoom}px`, width: `${440 * zoom}px`, height: `${130 * zoom}px` }}>
            <div className="font-bold text-[7.2px] border-b border-slate-300 pb-1">DADOS PARA EVENTUAIS COMUNICAÇÕES E COBRANÇAS RELATIVAS AO VEÍCULO AQUI DESCRITO</div>
            <div className="text-[7px] space-y-1 pt-1">
              <div>Endereço residencial: <span className="inline-block border-b border-slate-400" style={{ width: `${340 * zoom}px` }}></span></div>
              <div>Endereço comercial: <span className="inline-block border-b border-slate-400" style={{ width: `${345 * zoom}px` }}></span></div>
              <div>Telefone: <span className="inline-block border-b border-slate-400" style={{ width: `${160 * zoom}px` }}></span> WhatsApp: <span className="inline-block border-b border-slate-400" style={{ width: `${140 * zoom}px` }}></span></div>
              <div>e-mails: <span className="inline-block border-b border-slate-400" style={{ width: `${390 * zoom}px` }}></span></div>
            </div>
          </div>
        </div>
      );
  }
};
