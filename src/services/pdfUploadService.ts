import { DocumentTemplate, TemplateField } from '../types/document';
import { PAGE_WIDTH, PAGE_HEIGHT } from './pdfGenerator';
import { detectPdfFieldsWithAi } from './aiExtractionService';
import { saveTemplate, loadAllTemplates } from './templateStore';
import { PDFDocument } from 'pdf-lib';

export interface UploadPdfResult {
  template: DocumentTemplate;
  isExisting: boolean;
}

/**
 * Computes SHA-256 hash of a File or ArrayBuffer
 */
export async function computePdfHash(buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Converts ArrayBuffer to Base64 data URL
 */
export function bufferToDataUrl(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return `data:application/pdf;base64,${btoa(binary)}`;
}

/**
 * Process a user-uploaded PDF file:
 * 1. Reads the raw ArrayBuffer & Base64
 * 2. Parses with pdf-lib to get actual page count and dimensions (width/height)
 * 3. Generates template with exact uploaded master PDF bytes
 */
export async function processUploadedPdf(file: File): Promise<UploadPdfResult> {
  const arrayBuffer = await file.arrayBuffer();
  const fileHash = await computePdfHash(arrayBuffer);
  const base64Url = bufferToDataUrl(arrayBuffer);

  // Parse dimensions from the real PDF
  let pageWidth = PAGE_WIDTH;
  let pageHeight = PAGE_HEIGHT;
  let pageCount = 1;

  try {
    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    pageCount = pdfDoc.getPageCount();
    if (pageCount > 0) {
      const firstPage = pdfDoc.getPage(0);
      const { width, height } = firstPage.getSize();
      pageWidth = Math.round(width * 100) / 100;
      pageHeight = Math.round(height * 100) / 100;
    }
  } catch (err) {
    console.warn('Could not parse PDF dimensions with pdf-lib, falling back to A4:', err);
  }

  // Check if this hash was already uploaded
  const existingTemplates = loadAllTemplates();
  const existing = existingTemplates.find((t) => t.file_hash === fileHash);
  if (existing) {
    // Update its file_url if it was missing
    if (!existing.file_url) {
      existing.file_url = base64Url;
      saveTemplate(existing);
    }
    return { template: existing, isExisting: true };
  }

  const cleanName = file.name.replace(/\.[^/.]+$/, '').trim() || 'Documento PDF';
  const templateId = `tpl_upload_${Date.now()}`;

  // Run AI / standard field detection
  let fields: TemplateField[] = [];
  try {
    const aiResult = await detectPdfFieldsWithAi(
      `Documento PDF enviado pelo usuário: ${cleanName}`,
      { width: pageWidth, height: pageHeight }
    );

    if (aiResult && Array.isArray(aiResult.detected_fields) && aiResult.detected_fields.length > 0) {
      fields = aiResult.detected_fields.map((f: any, idx: number) => ({
        id: `f_upl_${idx}_${Date.now()}`,
        template_id: templateId,
        field_key: f.field_key || `campo_${idx + 1}`,
        label: f.label || `Campo ${idx + 1}`,
        page: f.page || 1,
        x: f.x || 80,
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
  } catch (e) {
    console.warn('AI field detection fallback:', e);
  }

  // If no fields detected, generate baseline starter fields
  if (fields.length === 0) {
    fields = [
      {
        id: `f_1_${Date.now()}`,
        template_id: templateId,
        field_key: 'nome_completo',
        label: 'Nome Completo',
        page: 1,
        x: 60,
        y: 90,
        width: 250,
        height: 14,
        font_size: 8.5,
        font_weight: 'bold',
        alignment: 'left',
        field_type: 'text',
        required: true,
        auto_resize: true,
        sort_order: 1,
        group: 'declarante',
        test_value: 'Nome do Titular',
      },
      {
        id: `f_2_${Date.now()}`,
        template_id: templateId,
        field_key: 'cpf_cnpj',
        label: 'CPF / CNPJ',
        page: 1,
        x: 350,
        y: 90,
        width: 140,
        height: 14,
        font_size: 8.5,
        font_weight: 'normal',
        alignment: 'left',
        field_type: 'cpf',
        required: true,
        mask: '000.000.000-00',
        auto_resize: true,
        sort_order: 2,
        group: 'declarante',
        test_value: '000.000.000-00',
      },
      {
        id: `f_3_${Date.now()}`,
        template_id: templateId,
        field_key: 'data_documento',
        label: 'Data do Documento',
        page: 1,
        x: 60,
        y: 130,
        width: 120,
        height: 14,
        font_size: 8.5,
        font_weight: 'normal',
        alignment: 'left',
        field_type: 'date',
        required: false,
        auto_resize: true,
        sort_order: 3,
        group: 'data',
        test_value: new Date().toLocaleDateString('pt-BR'),
      },
    ];
  }

  const newTemplate: DocumentTemplate = {
    id: templateId,
    name: cleanName,
    description: `PDF enviado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}.`,
    file_hash: fileHash,
    version: 'v1.0',
    page_count: pageCount,
    page_width: pageWidth,
    page_height: pageHeight,
    status: 'active',
    fields,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    file_url: base64Url,
  };

  saveTemplate(newTemplate);
  return { template: newTemplate, isExisting: false };
}
