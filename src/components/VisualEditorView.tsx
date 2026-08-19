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
  generateMasterResponsabilidadePdf,
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

  // Handle Dragging
  const handleMouseDownOnField = (e: React.MouseEvent, field: TemplateField) => {
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

  // Handle Resizing
  const handleMouseDownOnResize = (e: React.MouseEvent, field: TemplateField) => {
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

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (draggingRef.current) {
        const { fieldId, startX, startY, initialFieldX, initialFieldY } = draggingRef.current;
        const deltaX = (e.clientX - startX) / zoom;
        const deltaY = (e.clientY - startY) / zoom;

        setFields((prev) =>
          prev.map((f) => {
            if (f.id === fieldId) {
              const nextX = Math.max(0, Math.min(PAGE_WIDTH - f.width, Math.round(initialFieldX + deltaX)));
              const nextY = Math.max(0, Math.min(PAGE_HEIGHT - f.height, Math.round(initialFieldY + deltaY)));
              return { ...f, x: nextX, y: nextY };
            }
            return f;
          })
        );
      }

      if (resizingRef.current) {
        const { fieldId, startX, startY, initialWidth, initialHeight } = resizingRef.current;
        const deltaX = (e.clientX - startX) / zoom;
        const deltaY = (e.clientY - startY) / zoom;

        setFields((prev) =>
          prev.map((f) => {
            if (f.id === fieldId) {
              const nextW = Math.max(20, Math.round(initialWidth + deltaX));
              const nextH = Math.max(10, Math.round(initialHeight + deltaY));
              return { ...f, width: nextW, height: nextH };
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

  // Add new field
  const handleAddNewField = () => {
    const newField: TemplateField = {
      id: `f_custom_${Date.now()}`,
      template_id: template.id,
      field_key: `campo_${fields.length + 1}`,
      label: `Novo Campo ${fields.length + 1}`,
      page: 1,
      x: 100,
      y: 200,
      width: 150,
      height: 14,
      font_size: 8.5,
      font_weight: 'normal',
      alignment: 'left',
      field_type: 'text',
      required: false,
      auto_resize: true,
      sort_order: fields.length + 1,
      group: 'outros',
      test_value: 'Texto de Teste',
    };
    setFields((prev) => [...prev, newField]);
    setSelectedFieldId(newField.id);
  };

  // Duplicate selected field
  const handleDuplicateField = () => {
    if (!selectedField) return;
    const duplicated: TemplateField = {
      ...selectedField,
      id: `f_copy_${Date.now()}`,
      field_key: `${selectedField.field_key}_copia`,
      label: `${selectedField.label} (Cópia)`,
      x: selectedField.x + 10,
      y: selectedField.y + 15,
      sort_order: fields.length + 1,
    };
    setFields((prev) => [...prev, duplicated]);
    setSelectedFieldId(duplicated.id);
  };

  // Delete selected field
  const handleDeleteField = () => {
    if (!selectedFieldId) return;
    setFields((prev) => prev.filter((f) => f.id !== selectedFieldId));
    setSelectedFieldId(fields.find((f) => f.id !== selectedFieldId)?.id || null);
  };

  // Save changes
  const handleSave = () => {
    onSaveTemplate({
      ...template,
      fields,
      updated_at: new Date().toISOString(),
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  // AI Auto-detect
  const handleAiAutoDetect = async () => {
    setIsAutoDetecting(true);
    try {
      const res = await detectPdfFieldsWithAi(
        'Termo de responsabilidade de veículo com dados de declarante, comprador, veículo, proprietário e comunicações.',
        { width: PAGE_WIDTH, height: PAGE_HEIGHT }
      );
      if (res && Array.isArray(res.detected_fields) && res.detected_fields.length > 0) {
        setFields(res.detected_fields);
      }
    } finally {
      setIsAutoDetecting(false);
    }
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Top Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3 sticky top-16 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={onNavigateToForm}
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
            title="Voltar ao Formulário"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                Calibrador Visual de Coordenadas PDF
              </h1>
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full">
                CALIBRANDO
              </span>
            </div>
            <span className="text-[11px] text-slate-500 block">
              {template.name} • {fields.length} campos mapeados
            </span>
          </div>
        </div>

        {/* View Controls & Action buttons */}
        <div className="flex items-center gap-2">
          {/* Zoom buttons */}
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-1 text-xs">
            <button
              onClick={() => setZoom((z) => Math.max(0.6, Math.round((z - 0.1) * 10) / 10))}
              className="p-1 text-slate-500 hover:text-slate-900 rounded"
              title="Reduzir Zoom"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 font-mono text-slate-700 font-bold">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom((z) => Math.min(1.6, Math.round((z + 0.1) * 10) / 10))}
              className="p-1 text-slate-500 hover:text-slate-900 rounded"
              title="Aumentar Zoom"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => setIsTestMode((m) => !m)}
            className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
              isTestMode
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
            title="Exibir valores de teste sobre o PDF"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Valores Fictícios</span>
          </button>

          <button
            onClick={handleAddNewField}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Novo Campo</span>
          </button>

          <button
            onClick={onResetDefault}
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
            title="Restaurar coordenadas padrão de fábrica"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-sm shadow-blue-200 transition-all"
          >
            {saveSuccess ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
            <span>{saveSuccess ? 'Salvo!' : 'Salvar Calibração'}</span>
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
            {/* Master Template Background (Real Uploaded PDF iframe or built-in vector representation) */}
            {template.file_url ? (
              <iframe
                src={`${template.file_url}#toolbar=0&navpanes=0&scrollbar=0`}
                className="absolute inset-0 w-full h-full border-none pointer-events-none"
                title="Master PDF Background"
              />
            ) : (
              <div
                className="absolute inset-0 pointer-events-none p-6 font-sans"
                style={{ fontSize: `${8.5 * zoom}px` }}
              >
                {/* Outer border */}
                <div
                  className="absolute border border-slate-300 rounded"
                  style={{
                    left: `${28 * zoom}px`,
                    top: `${28 * zoom}px`,
                    width: `${(PAGE_WIDTH - 56) * zoom}px`,
                    height: `${(PAGE_HEIGHT - 56) * zoom}px`,
                  }}
                ></div>

                {/* Header Box */}
                <div
                  className="absolute bg-slate-50 border-b border-slate-300 text-center py-2 flex flex-col justify-center"
                  style={{
                    left: `${28 * zoom}px`,
                    top: `${28 * zoom}px`,
                    width: `${(PAGE_WIDTH - 56) * zoom}px`,
                    height: `${47 * zoom}px`,
                  }}
                >
                  <div
                    className="font-bold text-slate-800 tracking-wide font-serif uppercase"
                    style={{ fontSize: `${12.5 * zoom}px` }}
                  >
                    TERMO DE RESPONSABILIDADE
                  </div>
                  <div
                    className="text-slate-500 tracking-tight"
                    style={{ fontSize: `${7.5 * zoom}px` }}
                  >
                    Transferência de Posse, Custódia e Encargos Veiculares
                  </div>
                </div>

                {/* Static background lines and labels for reference */}
                <div
                  className="absolute text-slate-800"
                  style={{
                    left: `${40 * zoom}px`,
                    top: `${95 * zoom}px`,
                    fontSize: `${8.5 * zoom}px`,
                  }}
                >
                  Eu, <span className="inline-block border-b border-slate-400" style={{ width: `${292 * zoom}px` }}></span>, inscrito no CPF sob o nº <span className="inline-block border-b border-slate-400" style={{ width: `${109 * zoom}px` }}></span>
                </div>

                <div
                  className="absolute text-slate-800"
                  style={{
                    left: `${40 * zoom}px`,
                    top: `${113 * zoom}px`,
                    fontSize: `${8.5 * zoom}px`,
                  }}
                >
                  portador do RG nº <span className="inline-block border-b border-slate-400" style={{ width: `${115 * zoom}px` }}></span>, CNH nº <span className="inline-block border-b border-slate-400" style={{ width: `${108 * zoom}px` }}></span>, residente e domiciliado na <span className="inline-block border-b border-slate-400" style={{ width: `${67 * zoom}px` }}></span>
                </div>

                <div
                  className="absolute text-slate-800"
                  style={{
                    left: `${40 * zoom}px`,
                    top: `${131 * zoom}px`,
                    fontSize: `${8.5 * zoom}px`,
                  }}
                >
                  Rua/Av: <span className="inline-block border-b border-slate-400" style={{ width: `${265 * zoom}px` }}></span>, CEP: <span className="inline-block border-b border-slate-400" style={{ width: `${70 * zoom}px` }}></span>, Bairro: <span className="inline-block border-b border-slate-400" style={{ width: `${70 * zoom}px` }}></span>
                </div>

                <div
                  className="absolute text-slate-800"
                  style={{
                    left: `${40 * zoom}px`,
                    top: `${149 * zoom}px`,
                    fontSize: `${8.5 * zoom}px`,
                  }}
                >
                  Município: <span className="inline-block border-b border-slate-400" style={{ width: `${145 * zoom}px` }}></span> UF: <span className="inline-block border-b border-slate-400" style={{ width: `${25 * zoom}px` }}></span>, Tel: <span className="inline-block border-b border-slate-400" style={{ width: `${105 * zoom}px` }}></span>, transferi o veículo à:
                </div>

                <div
                  className="absolute text-slate-800 font-semibold"
                  style={{
                    left: `${40 * zoom}px`,
                    top: `${167 * zoom}px`,
                    fontSize: `${8.5 * zoom}px`,
                  }}
                >
                  Comprador / Empresa: <span className="inline-block border-b border-slate-400 font-normal" style={{ width: `${250 * zoom}px` }}></span> CNPJ: <span className="inline-block border-b border-slate-400 font-normal" style={{ width: `${135 * zoom}px` }}></span>
                </div>

                {/* Section 1 Bar */}
                <div
                  className="absolute bg-slate-100 border border-slate-300 font-bold text-slate-800 px-3 py-1 uppercase text-center"
                  style={{
                    left: `${40 * zoom}px`,
                    top: `${192 * zoom}px`,
                    width: `${(PAGE_WIDTH - 80) * zoom}px`,
                    height: `${16 * zoom}px`,
                    fontSize: `${8 * zoom}px`,
                    lineHeight: `${14 * zoom}px`,
                  }}
                >
                  CARACTERÍSTICAS DO VEÍCULO / PROPRIETÁRIO
                </div>

                {/* Section 1 Box */}
                <div
                  className="absolute border border-slate-300"
                  style={{
                    left: `${40 * zoom}px`,
                    top: `${216 * zoom}px`,
                    width: `${(PAGE_WIDTH - 80) * zoom}px`,
                    height: `${80 * zoom}px`,
                  }}
                >
                  {/* Linha 1 */}
                  <div className="absolute font-semibold text-slate-800" style={{ left: `${8 * zoom}px`, top: `${14 * zoom}px`, fontSize: `${8 * zoom}px` }}>
                    Marca: <span className="inline-block border-b border-slate-400 font-normal" style={{ width: `${125 * zoom}px`, marginLeft: `${4 * zoom}px` }}></span>
                  </div>
                  <div className="absolute font-semibold text-slate-800" style={{ left: `${175 * zoom}px`, top: `${14 * zoom}px`, fontSize: `${8 * zoom}px` }}>
                    Modelo: <span className="inline-block border-b border-slate-400 font-normal" style={{ width: `${160 * zoom}px`, marginLeft: `${4 * zoom}px` }}></span>
                  </div>
                  <div className="absolute font-semibold text-slate-800" style={{ left: `${380 * zoom}px`, top: `${14 * zoom}px`, fontSize: `${8 * zoom}px` }}>
                    Ano/Mod: <span className="inline-block border-b border-slate-400 font-normal" style={{ width: `${80 * zoom}px`, marginLeft: `${4 * zoom}px` }}></span>
                  </div>

                  {/* Linha 2 */}
                  <div className="absolute font-semibold text-slate-800" style={{ left: `${8 * zoom}px`, top: `${34 * zoom}px`, fontSize: `${8 * zoom}px` }}>
                    Cor: <span className="inline-block border-b border-slate-400 font-normal" style={{ width: `${100 * zoom}px`, marginLeft: `${4 * zoom}px` }}></span>
                  </div>
                  <div className="absolute font-semibold text-slate-800" style={{ left: `${140 * zoom}px`, top: `${34 * zoom}px`, fontSize: `${8 * zoom}px` }}>
                    Placa: <span className="inline-block border-b border-slate-400 font-normal" style={{ width: `${100 * zoom}px`, marginLeft: `${4 * zoom}px` }}></span>
                  </div>
                  <div className="absolute font-semibold text-slate-800" style={{ left: `${280 * zoom}px`, top: `${34 * zoom}px`, fontSize: `${8 * zoom}px` }}>
                    Chassi: <span className="inline-block border-b border-slate-400 font-normal" style={{ width: `${190 * zoom}px`, marginLeft: `${4 * zoom}px` }}></span>
                  </div>

                  {/* Linha 3 */}
                  <div className="absolute font-semibold text-slate-800" style={{ left: `${8 * zoom}px`, top: `${54 * zoom}px`, fontSize: `${8 * zoom}px` }}>
                    Proprietário Anterior: <span className="inline-block border-b border-slate-400 font-normal" style={{ width: `${405 * zoom}px`, marginLeft: `${4 * zoom}px` }}></span>
                  </div>

                  {/* Linha 4 */}
                  <div className="absolute font-semibold text-slate-800" style={{ left: `${8 * zoom}px`, top: `${72 * zoom}px`, fontSize: `${8 * zoom}px` }}>
                    RG: <span className="inline-block border-b border-slate-400 font-normal" style={{ width: `${112 * zoom}px`, marginLeft: `${4 * zoom}px` }}></span>
                  </div>
                  <div className="absolute font-semibold text-slate-800" style={{ left: `${150 * zoom}px`, top: `${72 * zoom}px`, fontSize: `${8 * zoom}px` }}>
                    UF: <span className="inline-block border-b border-slate-400 font-normal" style={{ width: `${27 * zoom}px`, marginLeft: `${4 * zoom}px` }}></span>
                  </div>
                  <div className="absolute font-semibold text-slate-800" style={{ left: `${205 * zoom}px`, top: `${72 * zoom}px`, fontSize: `${8 * zoom}px` }}>
                    CPF: <span className="inline-block border-b border-slate-400 font-normal" style={{ width: `${150 * zoom}px`, marginLeft: `${4 * zoom}px` }}></span>
                  </div>
                </div>

                {/* Section 2 Bar */}
                <div
                  className="absolute bg-slate-100 border border-slate-300 font-bold text-slate-800 px-3 py-1 uppercase text-center"
                  style={{
                    left: `${40 * zoom}px`,
                    top: `${308 * zoom}px`,
                    width: `${(PAGE_WIDTH - 80) * zoom}px`,
                    height: `${16 * zoom}px`,
                    fontSize: `${7.5 * zoom}px`,
                    lineHeight: `${14 * zoom}px`,
                  }}
                >
                  DADOS PARA EVENTUAIS COMUNICAÇÕES E COBRANÇAS RELATIVAS AO VEÍCULO AQUI DESCRITO
                </div>

                {/* Section 2 Box */}
                <div
                  className="absolute border border-slate-300"
                  style={{
                    left: `${40 * zoom}px`,
                    top: `${332 * zoom}px`,
                    width: `${(PAGE_WIDTH - 80) * zoom}px`,
                    height: `${115 * zoom}px`,
                  }}
                >
                  <div className="absolute font-semibold text-slate-800" style={{ left: `${8 * zoom}px`, top: `${16 * zoom}px`, fontSize: `${8 * zoom}px` }}>
                    Endereço Residencial: <span className="inline-block border-b border-slate-400 font-normal" style={{ width: `${400 * zoom}px`, marginLeft: `${4 * zoom}px` }}></span>
                  </div>
                  <div className="absolute font-semibold text-slate-800" style={{ left: `${8 * zoom}px`, top: `${36 * zoom}px`, fontSize: `${8 * zoom}px` }}>
                    Endereço Comercial: <span className="inline-block border-b border-slate-400 font-normal" style={{ width: `${400 * zoom}px`, marginLeft: `${4 * zoom}px` }}></span>
                  </div>
                  <div className="absolute font-semibold text-slate-800" style={{ left: `${8 * zoom}px`, top: `${56 * zoom}px`, fontSize: `${8 * zoom}px` }}>
                    Telefone: <span className="inline-block border-b border-slate-400 font-normal" style={{ width: `${110 * zoom}px`, marginLeft: `${4 * zoom}px` }}></span>
                  </div>
                  <div className="absolute font-semibold text-slate-800" style={{ left: `${170 * zoom}px`, top: `${56 * zoom}px`, fontSize: `${8 * zoom}px` }}>
                    WhatsApp: <span className="inline-block border-b border-slate-400 font-normal" style={{ width: `${110 * zoom}px`, marginLeft: `${4 * zoom}px` }}></span>
                  </div>
                  <div className="absolute font-semibold text-slate-800" style={{ left: `${340 * zoom}px`, top: `${56 * zoom}px`, fontSize: `${8 * zoom}px` }}>
                    E-mail: <span className="inline-block border-b border-slate-400 font-normal" style={{ width: `${130 * zoom}px`, marginLeft: `${4 * zoom}px` }}></span>
                  </div>
                  <div className="absolute font-semibold text-slate-800" style={{ left: `${8 * zoom}px`, top: `${76 * zoom}px`, fontSize: `${8 * zoom}px` }}>
                    Principal Condutor: <span className="inline-block border-b border-slate-400 font-normal" style={{ width: `${410 * zoom}px`, marginLeft: `${4 * zoom}px` }}></span>
                  </div>
                  <div className="absolute font-semibold text-slate-800" style={{ left: `${8 * zoom}px`, top: `${96 * zoom}px`, fontSize: `${8 * zoom}px` }}>
                    CNH Condutor: <span className="inline-block border-b border-slate-400 font-normal" style={{ width: `${155 * zoom}px`, marginLeft: `${4 * zoom}px` }}></span>
                  </div>
                  <div className="absolute font-semibold text-slate-800" style={{ left: `${245 * zoom}px`, top: `${96 * zoom}px`, fontSize: `${8 * zoom}px` }}>
                    CPF Condutor: <span className="inline-block border-b border-slate-400 font-normal" style={{ width: `${195 * zoom}px`, marginLeft: `${4 * zoom}px` }}></span>
                  </div>
                </div>

                {/* Legal Text */}
                <div
                  className="absolute text-slate-600 text-justify"
                  style={{
                    left: `${40 * zoom}px`,
                    top: `${460 * zoom}px`,
                    width: `${(PAGE_WIDTH - 80) * zoom}px`,
                    fontSize: `${7.5 * zoom}px`,
                    lineHeight: '1.4',
                  }}
                >
                  O declarante assume total e irrestrita responsabilidade civil, administrativa e criminal por quaisquer infrações de trânsito, acidentes, multas ou débitos decorrentes da condução e guarda do veículo até a presente data, isentando o adquirente de responsabilidades pretéritas.
                </div>

                {/* Date Line */}
                <div
                  className="absolute text-slate-800"
                  style={{
                    left: `${155 * zoom}px`,
                    top: `${505 * zoom}px`,
                    fontSize: `${9 * zoom}px`,
                  }}
                >
                  Campinas, <span className="inline-block border-b border-slate-400" style={{ width: `${30 * zoom}px` }}></span> de <span className="inline-block border-b border-slate-400" style={{ width: `${120 * zoom}px` }}></span> de 20<span className="inline-block border-b border-slate-400" style={{ width: `${27 * zoom}px` }}></span>.
                </div>

                {/* Signatures */}
                <div
                  className="absolute flex justify-between"
                  style={{
                    left: `${50 * zoom}px`,
                    top: `${565 * zoom}px`,
                    width: `${(PAGE_WIDTH - 100) * zoom}px`,
                  }}
                >
                  <div className="text-center" style={{ width: `${205 * zoom}px` }}>
                    <div className="border-t border-slate-800 mb-1"></div>
                    <div className="font-bold text-[8px] text-slate-800">Nome e assinatura do declarante</div>
                    <div className="text-[7px] text-slate-500">(Conforme documento de identificação)</div>
                  </div>

                  <div className="text-center" style={{ width: `${210 * zoom}px` }}>
                    <div className="border-t border-slate-800 mb-1"></div>
                    <div className="font-bold text-[8px] text-slate-800">Proprietário (RECONHECER POR AUTENTICIDADE)</div>
                    <div className="text-[7px] text-slate-500">Assinatura no Cartório</div>
                  </div>
                </div>
              </div>
            )}

            {/* Interactive Draggable / Resizable Field Overlays with Sleek Blue Styling */}
            {fields.map((field) => {
              const isSelected = field.id === selectedFieldId;
              const displayVal = field.test_value || field.label;

              return (
                <div
                  key={field.id}
                  onMouseDown={(e) => handleMouseDownOnField(e, field)}
                  className={`absolute group cursor-move transition-shadow ${
                    isSelected
                      ? 'ring-2 ring-blue-600 bg-blue-100/70 z-20 shadow-md'
                      : 'border-b border-blue-400 bg-blue-50/50 hover:bg-blue-100/70 z-10'
                  }`}
                  style={{
                    left: `${field.x * zoom}px`,
                    top: `${field.y * zoom}px`,
                    width: `${field.width * zoom}px`,
                    height: `${field.height * zoom}px`,
                  }}
                >
                  {/* Field content */}
                  <div
                    className={`w-full h-full flex items-center px-1 overflow-hidden font-sans ${
                      field.alignment === 'center'
                        ? 'justify-center'
                        : field.alignment === 'right'
                        ? 'justify-end'
                        : 'justify-start'
                    } ${field.font_weight === 'bold' ? 'font-bold' : 'font-normal'}`}
                    style={{
                      fontSize: `${(field.font_size || 8.5) * zoom}px`,
                      color: isTestMode ? '#0f172a' : '#2563eb',
                    }}
                  >
                    <span className="truncate">
                      {isTestMode ? displayVal : field.label}
                    </span>
                  </div>

                  {/* Top Badge when Selected */}
                  {isSelected && (
                    <div
                      className="absolute -top-5 left-0 bg-blue-600 text-white font-sans text-[8px] font-bold uppercase tracking-tighter px-1.5 py-0.2 rounded shadow whitespace-nowrap pointer-events-none"
                    >
                      {field.field_key} • {field.x}, {field.y}
                    </div>
                  )}

                  {/* Bottom-Right Resize Handle */}
                  {isSelected && (
                    <div
                      onMouseDown={(e) => handleMouseDownOnResize(e, field)}
                      className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-blue-600 border-2 border-white rounded-full cursor-se-resize shadow-md hover:scale-125 transition-transform"
                      title="Redimensionar Caixa"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Configuration & Calibration Sidebar */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4 text-slate-800">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-600" />
                Configuração do Campo
              </h2>
              <p className="text-[11px] text-slate-500">Ajuste as propriedades para geração</p>
            </div>
            {selectedField && (
              <div className="flex items-center gap-1">
                <button
                  onClick={handleDuplicateField}
                  title="Duplicar este campo"
                  className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleDeleteField}
                  title="Excluir campo"
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {selectedField ? (
            <div className="space-y-3.5 text-xs">
              {/* Field Key */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Field Key</label>
                <input
                  type="text"
                  value={selectedField.field_key}
                  onChange={(e) => updateFieldProperty('field_key', e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 text-xs font-mono rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Field Label */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Rótulo (Label)</label>
                <input
                  type="text"
                  value={selectedField.label}
                  onChange={(e) => updateFieldProperty('label', e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 text-xs font-semibold rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Group & Type */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Grupo</label>
                  <select
                    value={selectedField.group}
                    onChange={(e) => updateFieldProperty('group', e.target.value as FieldGroup)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  >
                    <option value="declarante">Declarante</option>
                    <option value="comprador">Comprador</option>
                    <option value="veiculo">Veículo</option>
                    <option value="proprietario">Proprietário</option>
                    <option value="comunicacoes">Comunicações</option>
                    <option value="data">Data</option>
                    <option value="outros">Outros</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Tipo</label>
                  <select
                    value={selectedField.field_type}
                    onChange={(e) => updateFieldProperty('field_type', e.target.value as FieldType)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  >
                    <option value="text">Texto</option>
                    <option value="cpf">CPF</option>
                    <option value="cnpj">CNPJ</option>
                    <option value="rg">RG</option>
                    <option value="cnh">CNH</option>
                    <option value="plate">Placa</option>
                    <option value="chassis">Chassi</option>
                    <option value="phone">Telefone</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="email">E-mail</option>
                    <option value="cep">CEP</option>
                    <option value="date">Data</option>
                  </select>
                </div>
              </div>

              {/* Micro-Calibration Coordinates Tool */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Coordenadas Reais PDF (Pontos)
                </span>

                <div className="grid grid-cols-2 gap-2.5">
                  {/* X */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-slate-600 mb-1">
                      <span>X (pts):</span>
                      <span className="font-mono text-slate-900 font-bold">{selectedField.x}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => nudgeCoordinate('x', -1)}
                        className="flex-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 py-1 rounded text-xs font-mono font-bold"
                      >
                        -1
                      </button>
                      <button
                        onClick={() => nudgeCoordinate('x', 1)}
                        className="flex-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 py-1 rounded text-xs font-mono font-bold"
                      >
                        +1
                      </button>
                    </div>
                  </div>

                  {/* Y */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-slate-600 mb-1">
                      <span>Y (pts):</span>
                      <span className="font-mono text-slate-900 font-bold">{selectedField.y}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => nudgeCoordinate('y', -1)}
                        className="flex-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 py-1 rounded text-xs font-mono font-bold"
                      >
                        -1
                      </button>
                      <button
                        onClick={() => nudgeCoordinate('y', 1)}
                        className="flex-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 py-1 rounded text-xs font-mono font-bold"
                      >
                        +1
                      </button>
                    </div>
                  </div>

                  {/* Width */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-slate-600 mb-1">
                      <span>Largura:</span>
                      <span className="font-mono text-slate-900 font-bold">{selectedField.width}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => nudgeCoordinate('width', -2)}
                        className="flex-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 py-1 rounded text-xs font-mono font-bold"
                      >
                        -2
                      </button>
                      <button
                        onClick={() => nudgeCoordinate('width', 2)}
                        className="flex-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 py-1 rounded text-xs font-mono font-bold"
                      >
                        +2
                      </button>
                    </div>
                  </div>

                  {/* Height */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-slate-600 mb-1">
                      <span>Altura:</span>
                      <span className="font-mono text-slate-900 font-bold">{selectedField.height}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => nudgeCoordinate('height', -1)}
                        className="flex-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 py-1 rounded text-xs font-mono font-bold"
                      >
                        -1
                      </button>
                      <button
                        onClick={() => nudgeCoordinate('height', 1)}
                        className="flex-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 py-1 rounded text-xs font-mono font-bold"
                      >
                        +1
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Typography & Alignment */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Fonte (pt)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={selectedField.font_size}
                    onChange={(e) => updateFieldProperty('font_size', parseFloat(e.target.value) || 8.5)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Alinhamento</label>
                  <select
                    value={selectedField.alignment}
                    onChange={(e) => updateFieldProperty('alignment', e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-800 bg-white"
                  >
                    <option value="left">Esquerda</option>
                    <option value="center">Centralizado</option>
                    <option value="right">Direita</option>
                  </select>
                </div>
              </div>

              {/* Checkboxes */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedField.font_weight === 'bold'}
                    onChange={(e) => updateFieldProperty('font_weight', e.target.checked ? 'bold' : 'normal')}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs font-medium text-slate-700">Texto em Negrito</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedField.required}
                    onChange={(e) => updateFieldProperty('required', e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs font-medium text-slate-700">Campo Obrigatório</span>
                </label>
              </div>

              {/* Value Test */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Valor de Teste</label>
                <input
                  type="text"
                  value={selectedField.test_value || ''}
                  onChange={(e) => updateFieldProperty('test_value', e.target.value)}
                  placeholder="Ex: João da Silva"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800 text-xs"
                />
              </div>

              {/* Actions */}
              <div className="pt-2 space-y-2">
                <button
                  onClick={handleSave}
                  className="w-full py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-lg shadow-sm transition-all"
                >
                  Salvar Mapeamento
                </button>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs">
              <Move className="w-8 h-8 mx-auto opacity-30 mb-2" />
              <p>Selecione um campo sobre o PDF para calibrar coordenadas e propriedades.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
