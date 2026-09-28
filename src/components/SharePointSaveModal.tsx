import React, { useState, useEffect } from 'react';
import {
  Cloud,
  CheckCircle2,
  Folder,
  FileText,
  Building2,
  User,
  ExternalLink,
  Copy,
  Download,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Check,
  ChevronRight,
  Layers
} from 'lucide-react';
import {
  SharePointDocumentRecord,
  DahrujUnit,
  DocumentTypeOption,
  UserProfile,
} from '../types/sharepoint';
import { sharePointClient } from '../services/sharePointClientService';
import {
  normalizeClientName,
  normalizeDocumentType,
  generateSharePointFileName,
  buildSharePointFullPath,
  extractClientInfo,
} from '../services/sharepointNormalizer';

interface SharePointSaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfBytes: Uint8Array | null;
  formValues: Record<string, string>;
  templateName: string;
  onSavedSuccess?: (record: SharePointDocumentRecord) => void;
}

type ModalStage = 'confirm' | 'processing' | 'success' | 'error';

export const SharePointSaveModal: React.FC<SharePointSaveModalProps> = ({
  isOpen,
  onClose,
  pdfBytes,
  formValues,
  templateName,
  onSavedSuccess,
}) => {
  const [stage, setStage] = useState<ModalStage>('confirm');
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => sharePointClient.getCurrentUser());
  const [units, setUnits] = useState<DahrujUnit[]>(() => sharePointClient.getUnits());
  const [docTypes, setDocTypes] = useState<DocumentTypeOption[]>(() => sharePointClient.getDocumentTypes());
  const [config, setConfig] = useState(() => sharePointClient.getConfig());

  // Extracted info
  const clientInfo = extractClientInfo(formValues);
  const [clientName, setClientName] = useState(clientInfo.originalName);
  const [selectedUnit, setSelectedUnit] = useState<string>(currentUser.unit || 'Jundiaí');

  // Match default document type based on template name
  const [selectedDocType, setSelectedDocType] = useState<string>(() => {
    const lower = templateName.toLowerCase();
    if (lower.includes('comodato')) return 'Instrumento de Comodato de Veículo';
    if (lower.includes('proposta')) return 'Proposta Comercial';
    if (lower.includes('contrato')) return 'Contrato de Compra e Venda';
    if (lower.includes('ficha')) return 'Ficha Cadastral';
    if (lower.includes('pedido')) return 'Pedido de Venda';
    return 'Instrumento de Comodato de Veículo';
  });

  const [versionInfo, setVersionInfo] = useState<{
    nextVersion: string;
    versionNumber: number;
    existingFiles: string[];
  }>({ nextVersion: 'V01', versionNumber: 1, existingFiles: [] });

  // Processing state
  const [activeStepId, setActiveStepId] = useState<string>('step-generate');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [savedRecord, setSavedRecord] = useState<SharePointDocumentRecord | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Recalculate version when client, docType, or unit changes
  useEffect(() => {
    if (!isOpen) return;
    const normalized = normalizeClientName(clientName);
    const ver = sharePointClient.checkNextVersion(selectedUnit, normalized, selectedDocType);
    setVersionInfo(ver);
  }, [clientName, selectedUnit, selectedDocType, isOpen]);

  // Sync state on modal open
  useEffect(() => {
    if (isOpen) {
      setCurrentUser(sharePointClient.getCurrentUser());
      setUnits(sharePointClient.getUnits());
      setDocTypes(sharePointClient.getDocumentTypes());
      const cfg = sharePointClient.getConfig();
      setConfig(cfg);

      const info = extractClientInfo(formValues);
      setClientName(info.originalName);

      const user = sharePointClient.getCurrentUser();
      const defaultUnit = user.unit && user.unit !== 'Todas as Unidades' ? user.unit : 'Jundiaí';
      setSelectedUnit(defaultUnit);

      setStage('confirm');
      setProgressPercent(0);
      setSavedRecord(null);
      setErrorMessage('');
      setCopiedLink(false);

      // Auto-upload if configured
      if (cfg.autoUpload && pdfBytes) {
        handleConfirmUpload();
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const normalizedClient = normalizeClientName(clientName);
  const plannedFileName = generateSharePointFileName({
    normalizedClientName: normalizedClient,
    documentType: selectedDocType,
    version: versionInfo.nextVersion,
    includeDate: config.includeDateInName,
  });

  const plannedPath = buildSharePointFullPath({
    rootFolder: config.rootFolder,
    unit: selectedUnit,
    normalizedClientName: normalizedClient,
    fileName: plannedFileName,
  });

  const handleConfirmUpload = async () => {
    if (!pdfBytes) {
      setErrorMessage('Conteúdo binário do PDF não está pronto para upload.');
      setStage('error');
      return;
    }

    setStage('processing');
    setProgressPercent(10);
    setActiveStepId('step-generate');

    try {
      const record = await sharePointClient.uploadDocument({
        pdfBytes,
        unit: selectedUnit,
        clientName,
        clientCpfCnpj: clientInfo.cpfCnpj,
        documentType: selectedDocType,
        customFileName: plannedFileName,
        onProgressStep: (stepId, pct) => {
          setActiveStepId(stepId);
          if (pct !== undefined) setProgressPercent(pct);
        },
      });

      setSavedRecord(record);
      setStage('success');
      if (onSavedSuccess) onSavedSuccess(record);
    } catch (err: any) {
      console.error('SharePoint upload error:', err);
      setErrorMessage(err?.message || 'Falha ao conectar com o serviço do SharePoint Online.');
      setStage('error');
    }
  };

  const handleCopyLink = () => {
    if (!savedRecord?.webUrl) return;
    navigator.clipboard.writeText(savedRecord.webUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleDownloadLocal = () => {
    if (!pdfBytes) return;
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = savedRecord?.fileName || plannedFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Steps definition for visual progress
  const steps = [
    { id: 'step-generate', label: 'Gerando documento vetorial...' },
    { id: 'step-client', label: 'Identificando e normalizando cliente...' },
    { id: 'step-folder', label: 'Localizando pasta corporativa no SharePoint...' },
    { id: 'step-version', label: `Verificando versionamento inteligente (${versionInfo.nextVersion})...` },
    { id: 'step-upload', label: 'Enviando arquivo ao SharePoint Dahruj GWM...' },
    { id: 'step-done', label: 'Documento salvo com sucesso!' },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === activeStepId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-xs">
              <Cloud className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight">Armazenamento Corporativo SharePoint</h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-400 text-emerald-950">
                  Dahruj GWM
                </span>
              </div>
              <p className="text-xs text-blue-100 mt-0.5">
                Biblioteca Oficial: {config.driveName} • Site: {config.siteName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors text-lg leading-none cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Modal Body based on stage */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* ================= STAGE 1: CONFIRM ================= */}
          {stage === 'confirm' && (
            <div className="space-y-5">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                      Documento Pronto para Armazenamento
                    </span>
                  </div>
                  <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
                    Versão Calculada: {versionInfo.nextVersion}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                  <div>
                    <span className="text-slate-500 block mb-1">Cliente Identificado:</span>
                    <input
                      type="text"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full font-semibold text-slate-900 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      Normalizado no SharePoint: <strong className="text-slate-700">{normalizedClient}</strong>
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 block mb-1">Unidade Responsável:</span>
                    <select
                      value={selectedUnit}
                      onChange={(e) => setSelectedUnit(e.target.value)}
                      disabled={currentUser.role === 'vendedor' && currentUser.unit !== 'Todas as Unidades'}
                      className="w-full font-semibold text-slate-900 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-blue-600 focus:outline-none disabled:bg-slate-100"
                    >
                      {units.map((u) => (
                        <option key={u.id} value={u.name}>
                          {u.name} ({u.path})
                        </option>
                      ))}
                    </select>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      Operador: {currentUser.name} ({currentUser.role.toUpperCase()})
                    </span>
                  </div>

                  <div className="sm:col-span-2">
                    <span className="text-slate-500 block mb-1">Tipo de Documento:</span>
                    <select
                      value={selectedDocType}
                      onChange={(e) => setSelectedDocType(e.target.value)}
                      className="w-full font-semibold text-slate-900 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    >
                      {docTypes.map((dt) => (
                        <option key={dt.id} value={dt.name}>
                          {dt.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Versioning info card */}
              {versionInfo.existingFiles.length > 0 && (
                <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Versionamento Ativo: Versões anteriores detectadas no SharePoint</p>
                    <p className="text-[11px] text-amber-800 mt-0.5">
                      Este cliente já possui {versionInfo.existingFiles.length} documento(s) deste tipo salvo(s).
                      O sistema salvará com segurança a nova versão <strong>{versionInfo.nextVersion}</strong>, sem sobrescrever nenhum arquivo existente.
                    </p>
                  </div>
                </div>
              )}

              {/* Destino Planejado */}
              <div className="border border-slate-200 rounded-xl p-4 space-y-2 bg-white">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                  Estrutura e Nomenclatura no SharePoint
                </span>

                <div className="space-y-1.5 text-xs">
                  <div className="flex items-start gap-2">
                    <Folder className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-slate-500">Caminho da Pasta:</span>
                      <p className="font-mono font-medium text-slate-900 break-all">
                        SharePoint → {config.rootFolder} → {selectedUnit} → {normalizedClient}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 pt-1 border-t border-slate-100">
                    <FileText className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-slate-500">Nome Oficial do Arquivo:</span>
                      <p className="font-mono font-bold text-slate-900 break-all">
                        {plannedFileName}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= STAGE 2: PROCESSING (Item 23) ================= */}
          {stage === 'processing' && (
            <div className="space-y-6 py-4">
              <div className="text-center space-y-1.5">
                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-3">
                  <Cloud className="w-6 h-6 animate-pulse" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Enviando Documento ao SharePoint Dahruj GWM</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Processando normalização de pastas, versionamento corporativo e upload via Microsoft Graph API...
                </p>
              </div>

              {/* Progress bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span>Progresso do Upload</span>
                  <span className="font-mono">{progressPercent}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Checklist de Etapas Visuais */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 divide-y divide-slate-100">
                {steps.map((step, idx) => {
                  const isDone = idx < currentStepIndex;
                  const isCurrent = idx === currentStepIndex;

                  return (
                    <div key={step.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        {isDone ? (
                          <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs">
                            ✓
                          </div>
                        ) : isCurrent ? (
                          <div className="w-5 h-5 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center text-[10px]">
                            {idx + 1}
                          </div>
                        )}
                        <span className={`font-medium ${isDone ? 'text-slate-800' : isCurrent ? 'text-blue-600 font-bold' : 'text-slate-400'}`}>
                          {step.label}
                        </span>
                      </div>

                      {isDone && (
                        <span className="text-[11px] font-bold text-emerald-600">✓ Concluído</span>
                      )}
                      {isCurrent && (
                        <span className="text-[11px] font-bold text-blue-600 animate-pulse">Processando...</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================= STAGE 3: SUCCESS (Item 24) ================= */}
          {stage === 'success' && savedRecord && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Check className="w-6 h-6 stroke-[3]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-emerald-900">Documento Salvo no SharePoint com Sucesso!</h3>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    O arquivo foi armazenado de forma permanente na estrutura corporativa da Dahruj GWM.
                  </p>
                </div>
              </div>

              {/* Detalhes do Documento Salvo */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
                <div className="grid grid-cols-2 gap-3 text-xs border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-slate-500 block">Cliente:</span>
                    <span className="font-bold text-slate-900">{savedRecord.clientName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Unidade:</span>
                    <span className="font-bold text-slate-900">{savedRecord.unit}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Documento:</span>
                    <span className="font-bold text-slate-900">{savedRecord.documentType}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Versão:</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      {savedRecord.version}
                    </span>
                  </div>
                </div>

                <div className="text-xs space-y-1.5 pt-1">
                  <div>
                    <span className="text-slate-500 block">Arquivo Gerado:</span>
                    <span className="font-mono font-bold text-slate-900 break-all">{savedRecord.fileName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Localização Completa:</span>
                    <span className="font-mono text-xs text-slate-700 break-all">{savedRecord.sharepointPath}</span>
                  </div>
                </div>
              </div>

              {/* Botões de Ação do Resultado */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
                <a
                  href={savedRecord.webUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition-all text-center cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Abrir no SharePoint</span>
                </a>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs px-4 py-2.5 rounded-lg flex items-center justify-center gap-1.5 border border-slate-200 transition-colors cursor-pointer"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Link Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-600" />
                      <span>Copiar Link</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleDownloadLocal}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs px-4 py-2.5 rounded-lg flex items-center justify-center gap-1.5 border border-slate-200 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-slate-600" />
                  <span>Baixar Cópia Local</span>
                </button>
              </div>
            </div>
          )}

          {/* ================= STAGE 4: ERROR ================= */}
          {stage === 'error' && (
            <div className="space-y-4 py-3">
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-rose-900">Falha ao Salvar no SharePoint</h3>
                  <p className="text-xs text-rose-700 mt-1">{errorMessage}</p>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2">
                <span className="font-bold text-slate-800 block">Soluções recomendadas:</span>
                <ul className="list-disc pl-4 space-y-1 text-slate-600 text-[11px]">
                  <li>Verifique se sua conta Microsoft 365 possui permissões de gravação na pasta da unidade.</li>
                  <li>Acesse Administração → Integrações → SharePoint para testar a conexão.</li>
                  <li>Você ainda pode baixar uma cópia local do documento em PDF sem interrupções.</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          {stage === 'confirm' ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleConfirmUpload}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-6 py-2.5 rounded-lg flex items-center gap-2 shadow-sm shadow-blue-200 transition-all transform active:scale-95 cursor-pointer"
              >
                <Cloud className="w-4 h-4" />
                <span>Salvar no SharePoint</span>
              </button>
            </>
          ) : stage === 'processing' ? (
            <div className="w-full text-center text-xs text-slate-500 font-medium">
              Por favor, aguarde a conclusão do envio...
            </div>
          ) : (
            <div className="w-full flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-5 py-2.5 rounded-lg transition-colors cursor-pointer"
              >
                Concluir e Fechar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
