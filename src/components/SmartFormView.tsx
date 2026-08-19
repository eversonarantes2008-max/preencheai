import React, { useState, useMemo } from 'react';
import {
  DocumentTemplate,
  TemplateField,
  FieldGroup,
  FieldValidationResult,
} from '../types/document';
import { validateField, applyMask } from '../services/validationService';
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Trash2,
  ArrowRight,
  User,
  Building2,
  Car,
  ShieldAlert,
  PhoneCall,
  Calendar,
  Layers,
  Wand2,
  FileUp,
  Info
} from 'lucide-react';
import { extractDocumentData } from '../services/aiExtractionService';

interface SmartFormViewProps {
  template: DocumentTemplate;
  formValues: Record<string, string>;
  confidenceScores: Record<string, number>;
  onValueChange: (key: string, value: string) => void;
  onSetAllValues: (values: Record<string, string>, confidences?: Record<string, number>) => void;
  onFillExample: () => void;
  onClearForm: () => void;
  onProceedToReview: () => void;
}

const GROUP_METADATA: Record<
  FieldGroup,
  { label: string; icon: React.ReactNode; description: string; color: string }
> = {
  declarante: {
    label: '1. Dados do Declarante',
    icon: <User className="w-4 h-4" />,
    description: 'Pessoa física que transfere a responsabilidade e posse do veículo',
    color: 'blue',
  },
  comprador: {
    label: '2. Dados do Comprador / Adquirente',
    icon: <Building2 className="w-4 h-4" />,
    description: 'Empresa compradora ou pessoa jurídica adquirente',
    color: 'blue',
  },
  veiculo: {
    label: '3. Características do Veículo',
    icon: <Car className="w-4 h-4" />,
    description: 'Dados técnicos, placa e identificação do chassi (VIN)',
    color: 'blue',
  },
  proprietario: {
    label: '4. Proprietário Anterior',
    icon: <ShieldAlert className="w-4 h-4" />,
    description: 'Proprietário original registrado no documento do veículo',
    color: 'blue',
  },
  comunicacoes: {
    label: '5. Comunicações, Notificações e Cobranças',
    icon: <PhoneCall className="w-4 h-4" />,
    description: 'Endereços de contato e condutor responsável',
    color: 'blue',
  },
  data: {
    label: '6. Data e Local do Documento',
    icon: <Calendar className="w-4 h-4" />,
    description: 'Data oficial da assinatura e formalização',
    color: 'blue',
  },
  assinaturas: {
    label: 'Assinaturas',
    icon: <Layers className="w-4 h-4" />,
    description: 'Campos reservados para assinatura física ou digital',
    color: 'blue',
  },
  outros: {
    label: 'Outros Dados',
    icon: <Layers className="w-4 h-4" />,
    description: 'Campos adicionais do documento',
    color: 'blue',
  },
};

export const SmartFormView: React.FC<SmartFormViewProps> = ({
  template,
  formValues,
  confidenceScores,
  onValueChange,
  onSetAllValues,
  onFillExample,
  onClearForm,
  onProceedToReview,
}) => {
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiRawText, setAiRawText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Group fields logically
  const groupedFields = useMemo(() => {
    const map = new Map<FieldGroup, TemplateField[]>();
    const order: FieldGroup[] = [
      'declarante',
      'comprador',
      'veiculo',
      'proprietario',
      'comunicacoes',
      'data',
      'outros',
    ];

    order.forEach((g) => map.set(g, []));

    template.fields.forEach((field) => {
      const g = field.group || 'outros';
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(field);
    });

    // Sort fields inside each group
    order.forEach((g) => {
      const list = map.get(g);
      if (list) list.sort((a, b) => a.sort_order - b.sort_order);
    });

    return order.map((g) => ({
      group: g,
      meta: GROUP_METADATA[g] || GROUP_METADATA.outros,
      fields: map.get(g) || [],
    })).filter((item) => item.fields.length > 0);
  }, [template]);

  // Validation map
  const validations = useMemo(() => {
    const results: Record<string, FieldValidationResult> = {};
    const safeFormValues = formValues || {};
    (template?.fields || []).forEach((field) => {
      let val = safeFormValues[field.field_key] || '';
      if (!val) {
        if (field.field_key === 'declarante_nome') {
          val = safeFormValues.nome_completo || safeFormValues.nome || '';
        } else if (field.field_key === 'nome_completo') {
          val = safeFormValues.declarante_nome || safeFormValues.nome || '';
        }
      }
      results[field.field_key] = validateField(field.field_type, val, field.required);
    });
    return results;
  }, [template, formValues]);

  // Count stats
  const stats = useMemo(() => {
    let totalRequired = 0;
    let validRequired = 0;
    let totalFilled = 0;
    let invalidCount = 0;
    const safeFormValues = formValues || {};

    (template?.fields || []).forEach((field) => {
      let val = (safeFormValues[field.field_key] || '').trim();
      if (!val) {
        if (field.field_key === 'declarante_nome') {
          val = (safeFormValues.nome_completo || safeFormValues.nome || '').trim();
        } else if (field.field_key === 'nome_completo') {
          val = (safeFormValues.declarante_nome || safeFormValues.nome || '').trim();
        }
      }
      const res = validations[field.field_key];

      if (val) totalFilled++;
      if (field.required) {
        totalRequired++;
        if (res && res.isValid && val) validRequired++;
      }
      if (res && !res.isValid && (val || field.required)) {
        invalidCount++;
      }
    });

    const isReady = validRequired === totalRequired && invalidCount === 0;

    return {
      totalRequired,
      validRequired,
      totalFilled,
      totalFields: (template?.fields || []).length,
      invalidCount,
      isReady,
      percent: Math.round((totalFilled / Math.max(1, (template?.fields || []).length)) * 100),
    };
  }, [template, formValues, validations]);

  // Handle single field input with automatic mask
  const handleInputChange = (field: TemplateField, rawInput: string) => {
    const masked = field.mask || field.field_type
      ? applyMask(field.field_type, rawInput)
      : rawInput;
    onValueChange(field.field_key, masked);
  };

  // Handle AI Extraction submit
  const handleRunAiExtraction = async () => {
    if (!aiRawText.trim()) return;
    setIsExtracting(true);
    setAiError(null);

    try {
      const result = await extractDocumentData({
        text: aiRawText,
        templateFields: template.fields,
      });

      if (result && result.fields) {
        const newValues: Record<string, string> = { ...formValues };
        const newConfidences: Record<string, number> = { ...confidenceScores };

        Object.entries(result.fields).forEach(([key, info]) => {
          if (info && info.value) {
            newValues[key] = info.value;
            newConfidences[key] = info.confidence || 90;
          }
        });

        onSetAllValues(newValues, newConfidences);
        setShowAiModal(false);
        setAiRawText('');
      } else {
        setAiError('Nenhum dado pôde ser extraído do texto informado.');
      }
    } catch (err: any) {
      setAiError(err?.message || 'Falha ao processar extração.');
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-28">
      {/* Top Header Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-100 text-blue-700">
                Formulário Inteligente
              </span>
              <span className="text-xs text-slate-500">
                {template.name} ({template.version})
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Preenchimento de Documento
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Insira os dados abaixo. O sistema validará automaticamente CPF, CNPJ, Placa e formatará o PDF master.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onFillExample}
              className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5 transition-all shadow-xs"
              title="Preencher com dados fictícios de João da Silva e GWM ORA 5"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Dados de Exemplo</span>
            </button>

            <button
              onClick={() => setShowAiModal(true)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5 transition-all"
            >
              <Wand2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Preencher com IA</span>
            </button>

            <button
              onClick={onClearForm}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-200"
              title="Limpar todos os campos"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-500">
              Progresso do Preenchimento: <strong className="text-slate-800">{stats.totalFilled} de {stats.totalFields} campos</strong>
            </span>
            <span className="font-bold text-blue-600 font-mono">{stats.percent}%</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-blue-600 h-full rounded-full transition-all duration-300 shadow-xs"
              style={{ width: `${stats.percent}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Field Groups Accordions */}
      <div className="space-y-4">
        {groupedFields.map(({ group, meta, fields }) => (
          <div
            key={group}
            className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs transition-all"
          >
            <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
                  {meta.icon}
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-800">{meta.label}</h2>
                  <p className="text-[11px] text-slate-500">{meta.description}</p>
                </div>
              </div>

              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-200/70 text-slate-700">
                {fields.length} campos
              </span>
            </div>

            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {fields.map((field) => {
                const value = formValues[field.field_key] || '';
                const validation = validations[field.field_key] || { isValid: true };
                const confidence = confidenceScores[field.field_key];
                const isInvalid = !validation.isValid && (value || field.required);

                return (
                  <div
                    key={field.id}
                    className={`space-y-1.5 ${
                      field.field_key === 'declarante_endereco' ||
                      field.field_key === 'comprador_nome' ||
                      field.field_key === 'proprietario_nome' ||
                      field.field_key === 'endereco_residencial' ||
                      field.field_key === 'endereco_comercial' ||
                      field.field_key === 'principal_condutor'
                        ? 'sm:col-span-2'
                        : ''
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                        <span>{field.label}</span>
                        {field.required && <span className="text-blue-600 font-bold" title="Obrigatório">*</span>}
                      </label>

                      {confidence && confidence >= 70 && (
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                            confidence >= 90
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                          title={`Identificado por IA com ${confidence}% de confiança`}
                        >
                          {confidence}% IA
                        </span>
                      )}
                    </div>

                    <div className="relative">
                      <input
                        type={field.field_type === 'number' ? 'number' : 'text'}
                        value={value}
                        maxLength={field.max_length}
                        onChange={(e) => handleInputChange(field, e.target.value)}
                        placeholder={field.test_value || field.description || 'Preencher...'}
                        className={`w-full bg-slate-50/70 border rounded-lg px-3.5 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none transition-all ${
                          isInvalid
                            ? 'border-rose-400 focus:ring-1 focus:ring-rose-500 bg-rose-50/30'
                            : value && validation.isValid
                            ? 'border-emerald-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-emerald-50/20'
                            : 'border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                        }`}
                      />

                      {value && validation.isValid && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 absolute right-3 top-2.5 pointer-events-none" />
                      )}

                      {isInvalid && (
                        <AlertCircle className="w-4 h-4 text-rose-500 absolute right-3 top-2.5 pointer-events-none" />
                      )}
                    </div>

                    {isInvalid && (
                      <p className="text-[10px] text-rose-600 flex items-center gap-1 font-medium">
                        <AlertCircle className="w-3 h-3 flex-shrink-0" />
                        {validation.message || 'Dado inválido'}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 p-4 z-30 shadow-lg">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full ${
                stats.isReady ? 'bg-emerald-500' : 'bg-blue-500'
              }`}
            ></div>
            <div className="text-xs">
              <div className="font-semibold text-slate-800">
                {stats.isReady
                  ? 'Todos os campos obrigatórios validados!'
                  : `${stats.validRequired} de ${stats.totalRequired} campos obrigatórios prontos`}
              </div>
              <div className="text-[11px] text-slate-500">
                {stats.invalidCount > 0
                  ? `${stats.invalidCount} campos requerem atenção`
                  : 'Documento pronto para geração em alta fidelidade'}
              </div>
            </div>
          </div>

          <button
            onClick={onProceedToReview}
            className={`font-bold text-xs sm:text-sm px-6 py-3 rounded-lg flex items-center gap-2 shadow-md transition-all transform active:scale-95 ${
              stats.isReady
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200'
                : 'bg-slate-800 hover:bg-slate-900 text-white'
            }`}
          >
            <span>Revisar e Gerar PDF</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* AI Smart Extraction Drawer / Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                  <Wand2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Preenchimento com IA (Gemini 3.7)</h3>
                  <p className="text-xs text-slate-500">Cole o texto de uma ficha, mensagem, CNH ou e-mail</p>
                </div>
              </div>
              <button
                onClick={() => setShowAiModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">
                Texto não-estruturado para extração:
              </label>
              <textarea
                rows={6}
                value={aiRawText}
                onChange={(e) => setAiRawText(e.target.value)}
                placeholder="Exemplo: Declarante João da Silva, CPF 123.456.789-00, RG 12.345.678, morador da Rua das Flores 100, Campinas/SP. Veículo GWM ORA 5 Branco, Placa ABC1D23, Chassi 9BWTESTE123456789..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
              ></textarea>
            </div>

            {aiError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{aiError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowAiModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleRunAiExtraction}
                disabled={isExtracting || !aiRawText.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs px-5 py-2.5 rounded-lg flex items-center gap-2 transition-all shadow-sm shadow-blue-200"
              >
                {isExtracting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Extraindo Dados...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Processar com IA</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
