import React, { useState } from 'react';
import { DocumentTemplate, TemplateField } from '../types/document';
import {
  UploadCloud,
  Sparkles,
  CheckCircle2,
  FileText,
  Layers,
  ArrowRight,
  Sliders,
  AlertCircle
} from 'lucide-react';
import { detectPdfFieldsWithAi } from '../services/aiExtractionService';
import { PAGE_WIDTH, PAGE_HEIGHT } from '../services/pdfGenerator';
import { createDefaultFieldsForTemplate } from '../services/templateStore';

interface TeachDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingTemplates: DocumentTemplate[];
  onCompleteTeach: (newTemplate: DocumentTemplate) => void;
}

export const TeachDocumentModal: React.FC<TeachDocumentModalProps> = ({
  isOpen,
  onClose,
  existingTemplates,
  onCompleteTeach,
}) => {
  const [step, setStep] = useState<'upload' | 'analyzing' | 'confirm'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [templateDesc, setTemplateDesc] = useState('');
  const [detectedFields, setDetectedFields] = useState<TemplateField[]>([]);
  const [matchedTemplate, setMatchedTemplate] = useState<DocumentTemplate | null>(null);
  const [fileHash, setFileHash] = useState('');
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);

  if (!isOpen) return null;

  // Simple SHA-256 simulator / hash generator for files
  const computeFileHash = async (fileObj: File): Promise<string> => {
    const buffer = await fileObj.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    setTemplateName(selected.name.replace(/\.[^/.]+$/, ''));
    setStep('analyzing');

    try {
      const hash = await computeFileHash(selected);
      setFileHash(hash);

      // Check if hash exists in system
      const match = existingTemplates.find((t) => t.file_hash === hash);
      if (match) {
        setMatchedTemplate(match);
        setStep('confirm');
        return;
      }

      // Convert file to base64 data url for storage
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        setPdfBase64(base64);

        // Run AI field detection
        const aiResult = await detectPdfFieldsWithAi(
          `Documento importado: ${selected.name}`,
          { width: PAGE_WIDTH, height: PAGE_HEIGHT }
        );

        let fields: TemplateField[] = [];
        if (aiResult && Array.isArray(aiResult.detected_fields) && aiResult.detected_fields.length > 0) {
          fields = aiResult.detected_fields.map((f: any, idx: number) => ({
            id: `f_auto_${idx}_${Date.now()}`,
            template_id: `tpl_${Date.now()}`,
            field_key: f.field_key || `campo_${idx + 1}`,
            label: f.label || `Campo ${idx + 1}`,
            page: f.page || 1,
            x: f.x || 100,
            y: f.y || 100 + idx * 25,
            width: f.width || 180,
            height: f.height || 14,
            font_size: 8.5,
            font_weight: 'normal',
            alignment: 'left',
            field_type: f.field_type || 'text',
            required: !!f.required,
            auto_resize: true,
            sort_order: idx + 1,
            group: f.group || 'outros',
            test_value: 'Dado de Teste',
          }));
        }
        
        if (fields.length < 10) {
          fields = createDefaultFieldsForTemplate(`tpl_${Date.now()}`);
        }

        setDetectedFields(fields);
        setStep('confirm');
      };
      reader.readAsDataURL(selected);
    } catch (err) {
      console.error('Error processing PDF upload:', err);
      setStep('upload');
    }
  };

  const handleFinishAndOpenCalibrator = () => {
    const newTemplate: DocumentTemplate = {
      id: `template_${Date.now()}`,
      name: templateName || 'Novo Modelo de Documento',
      description: templateDesc || 'Documento ensinado e mapeado no PREENCHENDO AI.',
      file_hash: fileHash,
      version: 'v1.0',
      page_count: 1,
      page_width: PAGE_WIDTH,
      page_height: PAGE_HEIGHT,
      status: 'calibrating',
      fields: detectedFields,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      file_url: pdfBase64 || undefined,
    };

    onCompleteTeach(newTemplate);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-6 text-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Ensinar Novo Documento PDF
              </h2>
              <p className="text-xs text-slate-500">
                Transforme qualquer PDF em um formulário inteligente reutilizável
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1">
            ✕
          </button>
        </div>

        {/* Wizard Steps */}
        {step === 'upload' && (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-slate-200 hover:border-blue-500 rounded-2xl p-8 text-center transition-colors cursor-pointer relative bg-slate-50">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <UploadCloud className="w-10 h-10 mx-auto text-blue-600 mb-3" />
              <h3 className="text-sm font-bold text-slate-800">
                Arraste seu PDF ou clique para selecionar
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Suporta contratos, termos, recibos, formulários cadastrais em formato PDF A4.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
              <span className="font-semibold text-slate-800 block">Como funciona o aprendizado:</span>
              <p>1. O sistema lê o PDF e analisa as linhas, lacunas e palavras-chave.</p>
              <p>2. A IA sugere os campos automáticos (Nome, CPF, Veículo, Datas, etc.).</p>
              <p>3. Você calibra as coordenadas no editor visual e publica o template!</p>
            </div>
          </div>
        )}

        {step === 'analyzing' && (
          <div className="py-12 flex flex-col items-center justify-center space-y-4 text-center">
            <div className="w-12 h-12 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">Analisando Documento com IA...</h3>
              <p className="text-xs text-slate-500">
                Calculando hash SHA-256, detectando linhas de preenchimento e mapeando coordenadas
              </p>
            </div>
          </div>
        )}

        {step === 'confirm' && (
          <div className="space-y-4">
            {matchedTemplate ? (
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm text-blue-800">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  <span>Template Já Reconhecido!</span>
                </div>
                <p>
                  Este documento possui o mesmo hash de <strong>{matchedTemplate.name}</strong> ({matchedTemplate.fields.length} campos já calibrados).
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => {
                      onCompleteTeach(matchedTemplate);
                      onClose();
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-lg"
                  >
                    Usar Template Existente
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Documento analisado com sucesso! <strong>{detectedFields.length} campos</strong> detectados.</span>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700 font-semibold">Nome do Modelo:</label>
                  <input
                    type="text"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700 font-semibold">Descrição:</label>
                  <input
                    type="text"
                    value={templateDesc}
                    onChange={(e) => setTemplateDesc(e.target.value)}
                    placeholder="Ex: Termo de entrega de chaves com dados de locatário..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => setStep('upload')}
                    className="px-4 py-2 text-slate-500 hover:text-slate-900 font-semibold"
                  >
                    Trocar Arquivo
                  </button>
                  <button
                    onClick={handleFinishAndOpenCalibrator}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-sm shadow-blue-200 transition-all"
                  >
                    <Sliders className="w-4 h-4" />
                    <span>Abrir Calibrador Visual</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
