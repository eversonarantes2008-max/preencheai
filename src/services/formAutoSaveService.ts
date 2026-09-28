/**
 * Serviço de Salvamento Automático de Rascunhos do Formulário
 * Salva os valores preenchidos no localStorage periodicamente para que o usuário
 * não perca o progresso caso navegue entre telas, feche ou atualize a página.
 */

const STORAGE_PREFIX = 'prenche_form_draft_v2_';

export interface FormDraftData {
  templateId: string;
  templateName?: string;
  values: Record<string, string>;
  confidenceScores?: Record<string, number>;
  savedAt: string;
}

export function saveFormDraft(
  templateId: string,
  values: Record<string, string>,
  confidenceScores?: Record<string, number>,
  templateName?: string
): void {
  if (!templateId) return;

  // Não salva se todos os valores forem vazios
  const hasValues = Object.values(values).some((v) => typeof v === 'string' && v.trim().length > 0);
  if (!hasValues) return;

  try {
    const data: FormDraftData = {
      templateId,
      templateName,
      values,
      confidenceScores,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(`${STORAGE_PREFIX}${templateId}`, JSON.stringify(data));
    localStorage.setItem(`${STORAGE_PREFIX}last_template_id`, templateId);
  } catch (err) {
    console.warn('Erro ao salvar rascunho no localStorage:', err);
  }
}

export function loadFormDraft(templateId: string): FormDraftData | null {
  if (!templateId) return null;
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${templateId}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.warn('Erro ao carregar rascunho do localStorage:', err);
    return null;
  }
}

export function clearFormDraft(templateId: string): void {
  if (!templateId) return;
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${templateId}`);
  } catch (err) {
    console.warn('Erro ao limpar rascunho do localStorage:', err);
  }
}

export function hasFormDraft(templateId: string): boolean {
  if (!templateId) return false;
  try {
    return Boolean(localStorage.getItem(`${STORAGE_PREFIX}${templateId}`));
  } catch {
    return false;
  }
}
