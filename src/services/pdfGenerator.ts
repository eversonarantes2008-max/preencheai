import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { DocumentTemplate, TemplateField } from '../types/document';

export const PAGE_WIDTH = 595.32;
export const PAGE_HEIGHT = 841.92;

/**
 * Generates the authentic vector Master PDF for "Termo de responsabilidade.pdf"
 * Standard A4 (595.32 x 841.92 points)
 */
export async function generateMasterResponsabilidadePdf(): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const primaryColor = rgb(0.1, 0.15, 0.25);
  const darkText = rgb(0.12, 0.12, 0.14);
  const grayText = rgb(0.4, 0.45, 0.5);
  const lineColor = rgb(0.7, 0.73, 0.78);
  const boxBg = rgb(0.96, 0.97, 0.98);

  // Helper to draw text easily
  const drawTxt = (
    text: string,
    x: number,
    yFromTop: number,
    size = 9,
    isBold = false,
    color = darkText
  ) => {
    const y = PAGE_HEIGHT - yFromTop;
    page.drawText(text, {
      x,
      y,
      size,
      font: isBold ? fontBold : fontRegular,
      color,
    });
  };

  // Helper to draw horizontal line
  const drawHLine = (x1: number, yFromTop: number, x2: number, width = 0.75, color = lineColor) => {
    const y = PAGE_HEIGHT - yFromTop;
    page.drawLine({
      start: { x: x1, y },
      end: { x: x2, y },
      thickness: width,
      color,
    });
  };

  // --- Document Outer Border ---
  page.drawRectangle({
    x: 28,
    y: 28,
    width: PAGE_WIDTH - 56,
    height: PAGE_HEIGHT - 56,
    borderColor: rgb(0.8, 0.83, 0.88),
    borderWidth: 1,
  });

  // --- Header ---
  page.drawRectangle({
    x: 28,
    y: PAGE_HEIGHT - 75,
    width: PAGE_WIDTH - 56,
    height: 47,
    color: rgb(0.94, 0.96, 0.99),
  });

  drawTxt('TERMO DE RESPONSABILIDADE', 185, 52, 13, true, primaryColor);
  drawTxt('Transferência de Posse, Custódia e Encargos Veiculares', 170, 66, 8, false, grayText);

  // --- Declaração Principal ---
  let curY = 95;
  drawTxt('Eu, ', 40, curY, 8.5, true);
  drawHLine(58, curY - 1, 350); // declarante_nome
  drawTxt(', inscrito no CPF sob o nº ', 352, curY, 8.5);
  drawHLine(446, curY - 1, 555); // declarante_cpf

  curY += 18;
  drawTxt('portador do RG nº ', 40, curY, 8.5);
  drawHLine(115, curY - 1, 230); // declarante_rg
  drawTxt(', CNH nº ', 233, curY, 8.5);
  drawHLine(272, curY - 1, 380); // declarante_cnh
  drawTxt(', residente e domiciliado na ', 382, curY, 8.5);
  drawHLine(488, curY - 1, 555); // declarante_endereco (part 1)

  curY += 18;
  drawTxt('Rua/Av: ', 40, curY, 8.5);
  drawHLine(75, curY - 1, 340); // declarante_endereco (completo)
  drawTxt(', CEP: ', 345, curY, 8.5);
  drawHLine(375, curY - 1, 445); // declarante_cep
  drawTxt(', Bairro: ', 450, curY, 8.5);
  drawHLine(485, curY - 1, 555); // declarante_bairro

  curY += 18;
  drawTxt('Município: ', 40, curY, 8.5);
  drawHLine(85, curY - 1, 230); // declarante_municipio
  drawTxt('UF: ', 235, curY, 8.5);
  drawHLine(250, curY - 1, 275); // declarante_estado
  drawTxt(', Tel: ', 280, curY, 8.5);
  drawHLine(305, curY - 1, 410); // declarante_telefone
  drawTxt(', declaro ter transferido a posse do veículo à:', 412, curY, 8.5);

  curY += 18;
  drawTxt('Comprador / Empresa: ', 40, curY, 8.5, true);
  drawHLine(135, curY - 1, 385); // comprador_nome
  drawTxt('CNPJ: ', 390, curY, 8.5, true);
  drawHLine(420, curY - 1, 555); // comprador_cnpj

  // --- Seção 1: Características do Veículo / Proprietário ---
  curY += 25;
  page.drawRectangle({
    x: 40,
    y: PAGE_HEIGHT - (curY + 16),
    width: PAGE_WIDTH - 80,
    height: 18,
    color: boxBg,
    borderColor: lineColor,
    borderWidth: 0.75,
  });
  drawTxt('CARACTERÍSTICAS DO VEÍCULO / PROPRIETÁRIO', 170, curY + 12, 8.5, true, primaryColor);

  curY += 24;
  // Veículo Grid Box
  page.drawRectangle({
    x: 40,
    y: PAGE_HEIGHT - (curY + 80),
    width: PAGE_WIDTH - 80,
    height: 80,
    borderColor: lineColor,
    borderWidth: 0.75,
  });

  // Linha 1 Veículo
  drawTxt('Marca:', 48, curY + 14, 8, true);
  drawHLine(80, curY + 13, 205); // veiculo_marca
  drawTxt('Modelo:', 215, curY + 14, 8, true);
  drawHLine(250, curY + 13, 410); // veiculo_modelo
  drawTxt('Ano/Mod:', 420, curY + 14, 8, true);
  drawHLine(465, curY + 13, 545); // veiculo_modelo_ano

  // Linha 2 Veículo
  drawTxt('Cor:', 48, curY + 34, 8, true);
  drawHLine(70, curY + 33, 170); // veiculo_cor
  drawTxt('Placa:', 180, curY + 34, 8, true);
  drawHLine(210, curY + 33, 310); // veiculo_placa
  drawTxt('Chassi:', 320, curY + 34, 8, true);
  drawHLine(355, curY + 33, 545); // veiculo_chassi

  // Linha 3 Proprietário
  drawTxt('Proprietário Anterior:', 48, curY + 54, 8, true);
  drawHLine(140, curY + 53, 545); // proprietario_nome

  // Linha 4 Documentos Proprietário
  drawTxt('RG:', 48, curY + 72, 8, true);
  drawHLine(68, curY + 71, 180); // proprietario_rg
  drawTxt('UF:', 190, curY + 72, 8, true);
  drawHLine(208, curY + 71, 235); // proprietario_rg_uf
  drawTxt('CPF:', 245, curY + 72, 8, true);
  drawHLine(270, curY + 71, 420); // proprietario_cpf

  // --- Seção 2: Comunicações e Cobranças ---
  curY += 92;
  page.drawRectangle({
    x: 40,
    y: PAGE_HEIGHT - (curY + 16),
    width: PAGE_WIDTH - 80,
    height: 18,
    color: boxBg,
    borderColor: lineColor,
    borderWidth: 0.75,
  });
  drawTxt('DADOS PARA EVENTUAIS COMUNICAÇÕES E COBRANÇAS RELATIVAS AO VEÍCULO AQUI DESCRITO', 62, curY + 12, 7.5, true, primaryColor);

  curY += 24;
  page.drawRectangle({
    x: 40,
    y: PAGE_HEIGHT - (curY + 115),
    width: PAGE_WIDTH - 80,
    height: 115,
    borderColor: lineColor,
    borderWidth: 0.75,
  });

  drawTxt('Endereço Residencial:', 48, curY + 16, 8, true);
  drawHLine(145, curY + 15, 545); // endereco_residencial

  drawTxt('Endereço Comercial:', 48, curY + 36, 8, true);
  drawHLine(145, curY + 35, 545); // endereco_comercial

  drawTxt('Telefone:', 48, curY + 56, 8, true);
  drawHLine(90, curY + 55, 200); // telefone_comunicacao
  drawTxt('WhatsApp:', 210, curY + 56, 8, true);
  drawHLine(260, curY + 55, 370); // whatsapp
  drawTxt('E-mail:', 380, curY + 56, 8, true);
  drawHLine(415, curY + 55, 545); // email

  drawTxt('Principal Condutor:', 48, curY + 76, 8, true);
  drawHLine(135, curY + 75, 545); // principal_condutor

  drawTxt('CNH Condutor:', 48, curY + 96, 8, true);
  drawHLine(115, curY + 95, 270); // cnh_principal_condutor
  drawTxt('CPF Condutor:', 285, curY + 96, 8, true);
  drawHLine(350, curY + 95, 545); // cpf_principal_condutor

  // --- Termos Legais Fixos ---
  curY += 128;
  const legalClause1 = 'O declarante acima qualificado assume civil, criminal e administrativamente toda e qualquer responsabilidade';
  const legalClause2 = 'por multas, acidentes, infrações de trânsito, tributos e encargos sobre o veículo até a data e hora desta entrega.';
  const legalClause3 = 'Declara ainda serem autênticos e verdadeiros todos os dados preenchidos neste termo de responsabilidade.';
  drawTxt(legalClause1, 40, curY, 7.5, false, darkText);
  drawTxt(legalClause2, 40, curY + 11, 7.5, false, darkText);
  drawTxt(legalClause3, 40, curY + 22, 7.5, false, darkText);

  // --- Data ---
  curY += 45;
  drawTxt('Campinas, ', 155, curY, 9, true);
  drawHLine(205, curY - 1, 235); // data_dia
  drawTxt(' de ', 237, curY, 9);
  drawHLine(255, curY - 1, 375); // data_mes
  drawTxt(' de 20', 378, curY, 9);
  drawHLine(403, curY - 1, 430); // data_ano
  drawTxt('.', 432, curY, 9);

  // --- Assinaturas ---
  curY += 60;
  drawHLine(55, curY, 260, 0.9, rgb(0.2, 0.2, 0.2));
  drawTxt('Nome e assinatura do declarante', 85, curY + 12, 8, true, darkText);
  drawTxt('(Conforme documento de identificação)', 75, curY + 22, 7, false, grayText);

  drawHLine(325, curY, 535, 0.9, rgb(0.2, 0.2, 0.2));
  drawTxt('Proprietário (RECONHECER POR AUTENTICIDADE)', 330, curY + 12, 7.5, true, darkText);
  drawTxt('Assinatura do Proprietário no Cartório', 355, curY + 22, 7, false, grayText);

  // Footer note
  drawTxt('PREENCHENDO AI • Sistema Inteligente de Automação e Preenchimento de Documentos PDF', 130, 815, 6.5, false, grayText);

  return await pdfDoc.save();
}

/**
 * Overlay field values onto the master PDF buffer with exact coordinate transformation
 */
export async function renderDocumentPdf(
  masterPdfBytes: Uint8Array,
  template: DocumentTemplate,
  values: Record<string, string>
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(masterPdfBytes);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pages = pdfDoc.getPages();

  for (const field of template.fields) {
    const rawVal = values[field.field_key];
    if (!rawVal && rawVal !== '0') continue;

    const pageIndex = Math.max(0, (field.page || 1) - 1);
    if (pageIndex >= pages.length) continue;
    const page = pages[pageIndex];
    const pageHeight = page.getHeight();

    const textToDraw = String(rawVal);
    const isBold = field.font_weight === 'bold';
    const font = isBold ? fontBold : fontRegular;

    let fontSize = field.font_size || 9;
    const maxBoxWidth = field.width || 100;
    const minFontSize = 6.5;

    // Auto-resize font if text is longer than box width and auto_resize is enabled
    if (field.auto_resize !== false) {
      let measuredWidth = font.widthOfTextAtSize(textToDraw, fontSize);
      while (measuredWidth > maxBoxWidth && fontSize > minFontSize) {
        fontSize -= 0.5;
        measuredWidth = font.widthOfTextAtSize(textToDraw, fontSize);
      }
    }

    // Mathematical coordinate translation:
    // Screen top-left (field.x, field.y) -> PDF bottom-left (x, y)
    // In our coordinate system, field.y is the top edge.
    // The baseline for Helvetica text is approximately (pageHeight - field.y - fontSize + 1).
    const pdfX = field.x;
    const pdfY = pageHeight - (field.y + field.height) + 2;

    // Handle horizontal alignment
    let drawX = pdfX;
    const finalWidth = font.widthOfTextAtSize(textToDraw, fontSize);
    if (field.alignment === 'center') {
      drawX = pdfX + Math.max(0, (field.width - finalWidth) / 2);
    } else if (field.alignment === 'right') {
      drawX = pdfX + Math.max(0, field.width - finalWidth);
    }

    page.drawText(textToDraw, {
      x: Math.round(drawX * 10) / 10,
      y: Math.round(pdfY * 10) / 10,
      size: fontSize,
      font,
      color: rgb(0.05, 0.08, 0.15), // Crisp dark ink color
    });
  }

  return await pdfDoc.save();
}

/**
 * Generate standard clean filename according to requirement:
 * Termo_de_Responsabilidade_NOME_PLACA.pdf
 */
export function generateFilename(templateName: string, values: Record<string, string>): string {
  const sanitize = (s: string) =>
    (s || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');

  const nome = sanitize(values.declarante_nome || values.nome || 'Documento');
  const placa = sanitize(values.veiculo_placa || values.placa || 'SemPlaca');
  const templateSlug = sanitize(templateName || 'Termo_de_Responsabilidade');

  return `${templateSlug}_${nome}_${placa}.pdf`;
}
