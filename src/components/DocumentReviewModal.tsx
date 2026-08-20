import React from 'react';
import { DocumentTemplate, TemplateField } from '../types/document';
import { validateField } from '../services/validationService';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileCheck,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Download,
  AlertCircle
} from 'lucide-react';

interface DocumentReviewModalProps {
  template: DocumentTemplate;
  formValues: Record<string, string>;
  confidenceScores: Record<string, number>;
  isOpen: boolean;
  onClose: () => void;
  onConfirmPreview: () => void;
  onDirectGenerate: () => void;
  onJumpToField: (fieldKey: string) => void;
}

export const DocumentReviewModal: React.FC<DocumentReviewModalProps> = ({
  template,
  formValues,
  confidenceScores,
  isOpen,
  onClose,
  onConfirmPreview,
  onDirectGenerate,
  onJumpToField,
}) => {
  if (!isOpen) return null;

  // Categorize every field
  const validFields: { field: TemplateField; value: string }[] = [];
  const warningFields: { field: TemplateField; value: string; reason: string }[] = [];
  const missingRequiredFields: { field: TemplateField; reason: string }[] = [];

  const safeFormValues = formValues || {};
  const safeConfidence = confidenceScores || {};
  const safeFields = template?.fields || [];

  safeFields.forEach((field) => {
    let val = (safeFormValues[field.field_key] || '').trim();
    if (!val) {
      if (field.field_key === 'declarante_nome') {
        val = (safeFormValues.nome_completo || safeFormValues.nome || '').trim();
      } else if (field.field_key === 'nome_completo') {
        val = (safeFormValues.declarante_nome || safeFormValues.nome || '').trim();
      }
    }
    const validation = validateField(field.field_type, val, field.required);
    const confidence = safeConfidence[field.field_key];

    if (field.required && !val) {
      missingRequiredFields.push({
        field,
        reason: 'Campo obrigatório não preenchido',
      });
    } else if (val && !validation.isValid) {
      missingRequiredFields.push({
        field,
        reason: validation.message || 'Formato inválido',
      });
    } else if (val && confidence !== undefined && confidence < 75) {
      warningFields.push({
        field,
        value: val,
        reason: `Confiança de IA baixa (${confidence}%) - Recomenda-se conferência`,
      });
    } else if (val) {
      validFields.push({ field, value: val });
    }
  });

  const canGenerate = missingRequiredFields.length === 0;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-6 my-8 text-slate-900">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Revisão do Documento
              </h2>
              <p className="text-xs text-slate-500">
                Auditoria de conformidade antes da geração definitiva do PDF
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
          >
            ✕
          </button>
        </div>

        {/* Global Status Alert */}
        {canGenerate ? (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-800">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <div className="text-xs">
              <span className="font-bold block">Documento pronto para geração!</span>
              <span>Todos os {template.fields.filter(f => f.required).length} campos obrigatórios foram preenchidos e validados.</span>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-800">
            <XCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <div className="text-xs">
              <span className="font-bold block">Atenção: Campos obrigatórios pendentes</span>
              <span>Corrija os {missingRequiredFields.length} campos destacados abaixo antes de gerar o PDF.</span>
            </div>
          </div>
        )}

        {/* Missing / Required Errors */}
        {missingRequiredFields.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-bold text-rose-700 flex items-center gap-1.5 uppercase">
              <AlertCircle className="w-4 h-4" />
              Campos Obrigatórios Pendentes ({missingRequiredFields.length})
            </div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {missingRequiredFields.map(({ field, reason }) => (
                <div
                  key={field.id}
                  className="p-2.5 rounded-lg bg-rose-50/70 border border-rose-200 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-800">{field.label}: </span>
                    <span className="text-rose-700 font-medium">{reason}</span>
                  </div>
                  <button
                    onClick={() => {
                      onClose();
                      onJumpToField(field.field_key);
                    }}
                    className="text-blue-600 hover:text-blue-800 font-bold text-[11px] underline"
                  >
                    Preencher
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Warnings / Low confidence */}
        {warningFields.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-bold text-amber-700 flex items-center gap-1.5 uppercase">
              <AlertTriangle className="w-4 h-4" />
              Campos com Advertência / IA ({warningFields.length})
            </div>
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {warningFields.map(({ field, value, reason }) => (
                <div
                  key={field.id}
                  className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-between text-xs text-amber-900"
                >
                  <div className="min-w-0">
                    <span className="font-bold">{field.label}: </span>
                    <span className="text-slate-700 truncate font-mono">"{value}"</span>
                    <span className="block text-[10px] text-amber-700 mt-0.5">{reason}</span>
                  </div>
                  <button
                    onClick={() => {
                      onClose();
                      onJumpToField(field.field_key);
                    }}
                    className="text-amber-800 hover:text-amber-950 font-bold text-[11px] underline flex-shrink-0"
                  >
                    Ajustar
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Validated Summary Preview */}
        <div className="space-y-2">
          <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Campos Validados ({validFields.length})
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 max-h-48 overflow-y-auto text-xs grid grid-cols-1 sm:grid-cols-2 gap-2">
            {validFields.map(({ field, value }) => (
              <div key={field.id} className="truncate">
                <span className="text-slate-500">{field.label}: </span>
                <strong className="text-slate-800 font-semibold">{value}</strong>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao Formulário</span>
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onConfirmPreview}
              className="flex-1 sm:flex-initial bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-xs font-bold px-4 py-2.5 rounded-lg transition-colors cursor-pointer"
            >
              Visualizar Prévia
            </button>

            <button
              onClick={onDirectGenerate}
              className="flex-1 sm:flex-initial bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-lg flex items-center justify-center gap-2 shadow-sm shadow-blue-200 transition-all transform active:scale-95 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Gerar e Baixar PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
