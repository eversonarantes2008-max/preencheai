import { DocumentTypeOption } from '../types/sharepoint';

/**
 * Normaliza o nome do cliente seguindo as diretrizes corporativas Dahruj GWM:
 * - Remove espaços duplicados
 * - Remove espaços no início e no fim
 * - Remove acentos e caracteres diacríticos (NFD)
 * - Converte para letras MAIÚSCULAS
 * - Trata e substitui caracteres proibidos no SharePoint e Windows: \ / : * ? " < > | # % ~ &
 * - Garante integridade evitando duplicações por variações de grafia
 *
 * Exemplo:
 * Entrada: " João   da Silva "
 * Saída:   "JOAO DA SILVA"
 */
export function normalizeClientName(rawName: string): string {
  if (!rawName) return 'CLIENTE NAO IDENTIFICADO';

  let clean = rawName.trim();

  // Decompor acentos (NFD) e remover marcas diacríticas
  clean = clean.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Substituir múltiplos espaços em branco consecutivos por um único espaço
  clean = clean.replace(/\s+/g, ' ');

  // Substituir caracteres inválidos no SharePoint Online e sistemas de arquivos
  // Caracteres proibidos: \ / : * ? " < > | # % ~ &
  clean = clean.replace(/[\\/:*?"<>|#%~&]/g, '');

  // Transformar em CAIXA ALTA
  clean = clean.toUpperCase().trim();

  return clean || 'CLIENTE NAO IDENTIFICADO';
}

/**
 * Extrai informações do cliente a partir dos campos preenchidos do formulário
 */
export function extractClientInfo(formValues: Record<string, string>): {
  originalName: string;
  normalizedName: string;
  cpfCnpj?: string;
  phone?: string;
  email?: string;
} {
  // Lista de chaves prováveis de nome em ordem de prioridade
  const nameKeys = [
    'declarante_nome',
    'cliente_nome',
    'nome_cliente',
    'comprador_nome',
    'proprietario_nome',
    'principal_condutor',
    'nome',
    'nome_completo',
    'razao_social',
  ];

  let rawName = '';
  for (const k of nameKeys) {
    if (formValues[k] && formValues[k].trim()) {
      rawName = formValues[k].trim();
      break;
    }
  }

  // Se não encontrou nas chaves exatas, busca heurística por chave contendo 'nome'
  if (!rawName) {
    for (const [key, val] of Object.entries(formValues)) {
      if (key.toLowerCase().includes('nome') && typeof val === 'string' && val.trim().length > 2) {
        rawName = val.trim();
        break;
      }
    }
  }

  // CPF / CNPJ
  const docKeys = [
    'declarante_cpf',
    'cliente_cpf',
    'comprador_cnpj',
    'cpf',
    'cnpj',
    'cpf_cnpj',
    'proprietario_cpf',
    'cpf_principal_condutor',
  ];

  let cpfCnpj = '';
  for (const k of docKeys) {
    if (formValues[k] && formValues[k].trim()) {
      cpfCnpj = formValues[k].trim();
      break;
    }
  }

  const phone = formValues['declarante_telefone'] || formValues['whatsapp'] || formValues['telefone_comunicacao'] || '';
  const email = formValues['email'] || formValues['declarante_email'] || '';

  const originalName = rawName || 'Cliente Dahruj GWM';
  const normalizedName = normalizeClientName(originalName);

  return {
    originalName,
    normalizedName,
    cpfCnpj: cpfCnpj || undefined,
    phone: phone || undefined,
    email: email || undefined,
  };
}

/**
 * Normaliza o tipo de documento em caixa alta para a nomenclatura de arquivo
 */
export function normalizeDocumentType(typeStr: string): string {
  if (!typeStr) return 'DOCUMENTO';
  return typeStr
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\\/:*?"<>|#%~&]/g, '')
    .replace(/\s+/g, ' ')
    .toUpperCase()
    .trim();
}

/**
 * Gera a nomenclatura corporativa padronizada para o arquivo:
 * [NOME DO CLIENTE] - [TIPO DO DOCUMENTO] - V[VERSÃO].pdf
 * Ou opcionalmente com data:
 * [NOME DO CLIENTE] - [TIPO DO DOCUMENTO] - [YYYY-MM-DD] - V[VERSÃO].pdf
 */
export function generateSharePointFileName(params: {
  normalizedClientName: string;
  documentType: string;
  version: string | number; // 'V01' or 1
  includeDate?: boolean;
}): string {
  const { normalizedClientName, documentType, version, includeDate } = params;

  let versionStr = '';
  if (typeof version === 'number') {
    versionStr = `V${String(version).padStart(2, '0')}`;
  } else {
    // se já vem "V01" ou "01" ou "1"
    const num = parseInt(version.replace(/[^\d]/g, ''), 10) || 1;
    versionStr = `V${String(num).padStart(2, '0')}`;
  }

  const cleanDocType = normalizeDocumentType(documentType);
  const cleanClient = normalizeClientName(normalizedClientName);

  if (includeDate) {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    return `${cleanClient} - ${cleanDocType} - ${today} - ${versionStr}.pdf`;
  }

  return `${cleanClient} - ${cleanDocType} - ${versionStr}.pdf`;
}

/**
 * Constrói o caminho completo do arquivo na biblioteca do SharePoint:
 * [Pasta Raiz]/[Unidade]/[NOME DO CLIENTE]/[Arquivo].pdf
 */
export function buildSharePointFullPath(params: {
  rootFolder: string;
  unit: string;
  normalizedClientName: string;
  fileName: string;
}): string {
  const root = (params.rootFolder || 'Vendas').replace(/^\/+|\/+$/g, '');
  const unit = params.unit.trim().replace(/^\/+|\/+$/g, '');
  const client = normalizeClientName(params.normalizedClientName);
  const fileName = params.fileName.trim();

  return `${root}/${unit}/${client}/${fileName}`;
}

/**
 * Lista padrão dos tipos de documentos homologados Dahruj GWM
 */
export const DEFAULT_DAHRUJ_DOCUMENT_TYPES: DocumentTypeOption[] = [
  { id: 'dt-1', name: 'Proposta Comercial', code: 'PROPOSTA COMERCIAL', isDefault: false },
  { id: 'dt-2', name: 'Ficha Cadastral', code: 'FICHA CADASTRAL', isDefault: false },
  { id: 'dt-3', name: 'Contrato de Compra e Venda', code: 'CONTRATO', isDefault: false },
  { id: 'dt-4', name: 'Instrumento de Comodato de Veículo', code: 'COMODATO DE VEICULO', isDefault: true },
  { id: 'dt-5', name: 'Pedido de Venda', code: 'PEDIDO', isDefault: false },
  { id: 'dt-6', name: 'Simulação de Financiamento', code: 'SIMULACAO', isDefault: false },
  { id: 'dt-7', name: 'Financiamento e Crédito', code: 'FINANCIAMENTO', isDefault: false },
  { id: 'dt-8', name: 'Avaliação de Usado', code: 'AVALIACAO', isDefault: false },
  { id: 'dt-9', name: 'Termo de Responsabilidade e Declaração', code: 'TERMO DE RESPONSABILIDADE', isDefault: false },
  { id: 'dt-10', name: 'Documento de Entrega / Checklist', code: 'DOCUMENTO DE ENTREGA', isDefault: false },
  { id: 'dt-11', name: 'Outros Documentos', code: 'OUTROS', isDefault: false },
];
