import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { DocumentTemplate, TemplateField } from '../types/document';

export const PAGE_WIDTH = 595.32;
export const PAGE_HEIGHT = 841.92;

const darkText = rgb(0.1, 0.1, 0.1);
const lineColor = rgb(0.3, 0.3, 0.3);
const grayBoxBg = rgb(0.96, 0.96, 0.97);

/**
 * Helper to draw text easily on a PDF page
 */
function drawTextHelper(
  page: any,
  fontRegular: any,
  fontBold: any,
  text: string,
  x: number,
  yFromTop: number,
  size = 8,
  isBold = false,
  color = darkText
) {
  const y = PAGE_HEIGHT - yFromTop;
  page.drawText(text, {
    x,
    y,
    size,
    font: isBold ? fontBold : fontRegular,
    color,
  });
}

/**
 * Helper to draw horizontal line on a PDF page
 */
function drawHLineHelper(
  page: any,
  x1: number,
  yFromTop: number,
  x2: number,
  width = 0.6,
  color = lineColor
) {
  const y = PAGE_HEIGHT - yFromTop;
  page.drawLine({
    start: { x: x1, y },
    end: { x: x2, y },
    thickness: width,
    color,
  });
}

// 1. TERMO DE RESPONSABILIDADE
export async function generateMasterResponsabilidadePdf(): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const drawTxt = (text: string, x: number, yFromTop: number, size = 8, isBold = false, color = darkText) =>
    drawTextHelper(page, fontRegular, fontBold, text, x, yFromTop, size, isBold, color);

  const drawHLine = (x1: number, yFromTop: number, x2: number, width = 0.6, color = lineColor) =>
    drawHLineHelper(page, x1, yFromTop, x2, width, color);

  // --- Title ---
  drawTxt('TERMO DE RESPONSABILIDADE', 215, 120, 10.5, true);
  drawHLine(215, 121, 380, 0.8);

  // --- Declaração Principal ---
  // Line 1 (y: 145)
  drawTxt('Eu,', 80, 145, 8);
  drawHLine(95, 145, 418);
  drawTxt(', inscrito no CPF sob', 420, 145, 8);

  // Line 2 (y: 158)
  drawTxt('o nº', 80, 158, 8);
  drawHLine(98, 158, 208);
  drawTxt(', RG. Nº', 210, 158, 8);
  drawHLine(248, 158, 345);
  drawTxt(', e CNH Nº', 348, 158, 8);
  drawHLine(402, 158, 475);
  drawTxt(', residente e', 478, 158, 8);

  // Line 3 (y: 171)
  drawTxt('domiciliado na', 80, 171, 8);
  drawHLine(142, 171, 510);
  drawTxt(',', 512, 171, 8);

  // Line 4 (y: 184)
  drawTxt('CEP', 80, 184, 8);
  drawHLine(102, 184, 175);
  drawTxt(', Bairro', 178, 184, 8);
  drawHLine(210, 184, 325);
  drawTxt(', Município de', 328, 184, 8);
  drawHLine(385, 184, 465);
  drawTxt(', Estado de', 468, 184, 8);

  // Line 5 (y: 197)
  drawHLine(80, 197, 105);
  drawTxt(', Telefone nº (', 108, 197, 8);
  drawHLine(162, 197, 180);
  drawTxt(')', 182, 197, 8);
  drawHLine(188, 197, 288);
  drawTxt(', DECLARO, PARA TODOS OS FINS DE', 292, 197, 7.5, true);

  // Line 6 (y: 210)
  drawTxt('DIREITO, QUE VENDI, NESTA DATA, O VEÍCULO ABAIXO DESCRITO, DE MINHA PROPRIEDADE,', 80, 210, 7.5, true);

  // Line 7 (y: 223)
  drawTxt('LIVRE E DESEMBARAÇADO DE QUALQUER ÔNUS, a', 80, 223, 7.5, true);
  drawHLine(308, 223, 515);

  // Line 8 (y: 236)
  drawTxt('inscrita no CNPJ sob o nº', 80, 236, 8);
  drawHLine(188, 236, 320);

  // --- CARACTERÍSTICAS DO VEÍCULO / PROPRIETÁRIO ---
  drawTxt('CARACTERÍSTICAS DO VEÍCULO / PROPRIETÁRIO', 170, 260, 9, true);
  drawHLine(170, 261, 425, 0.8);

  // Linha 1 Veículo (y: 280)
  drawTxt('Marca', 80, 280, 8);
  drawHLine(108, 280, 200);
  drawTxt('Modelo:', 204, 280, 8);
  drawHLine(240, 280, 350);
  drawTxt('Ano/Modelo', 354, 280, 8);
  drawHLine(406, 280, 452);
  drawTxt('/', 454, 280, 8);
  drawTxt('Cor:', 462, 280, 8);
  drawHLine(480, 280, 515);

  // Linha 2 Veículo (y: 294)
  drawTxt('Placa:', 80, 294, 8);
  drawHLine(106, 294, 186);
  drawTxt('Chassi', 190, 294, 8);
  drawHLine(224, 294, 515);

  // Linha 3 Proprietário (y: 308)
  drawTxt('Proprietário:', 80, 308, 8);
  drawHLine(135, 308, 400);
  drawTxt('CPF:', 404, 308, 8);
  drawHLine(428, 308, 515);

  // Linha 4 Documentos Proprietário (y: 322)
  drawTxt('RG/UF:', 80, 322, 8);
  drawHLine(114, 322, 240);
  drawTxt('/', 244, 322, 8);
  drawHLine(252, 322, 280);
  drawTxt('.', 282, 322, 8);

  // --- Declarações Legais (Bullet points) ---
  drawTxt('Declaro, ainda, que:', 80, 342, 7.5, true);

  // Bullet 1
  drawTxt('- estou ciente de minha responsabilidade quanto ao veículo ora transacionado, nas esferas civil,', 80, 353, 7.0);
  drawTxt('  administrativa e criminal, por qualquer evento ocorrido até a presente data;', 80, 361, 7.0);

  // Bullet 2
  drawTxt('- me obrigo a fornecer, neste ato e a qualquer momento que se fizer necessário, toda e qualquer', 80, 371, 7.0);
  drawTxt('  documentação para viabilizar a transferência do veículo;', 80, 379, 7.0);

  // Bullet 3
  drawTxt('- me responsabilizo por todas as infrações, penalidades, multas, taxas, IPVA, tributos e outros débitos', 80, 389, 7.0);
  drawTxt('  incidentes sobre o veículo até a presente data, ainda que futura ou retroativamente lançados;', 80, 397, 7.0);

  // Bullet 4
  drawTxt('- em caso de autuação relativa a período anterior a esta data, fico obrigado a, em sendo o caso, indicar o', 80, 407, 7.0);
  drawTxt('  condutor, fornecer sua CNH e assinar o documento de indicação, no campo específico, assumindo, de todo', 80, 415, 7.0);
  drawTxt('  modo, integral responsabilidade pela infração e eventuais danos e prejuízos daí decorrentes;', 80, 423, 7.0);

  // Bullet 5
  drawTxt('- em se tratando se de veículo importado, responsabilizo-me por eventual direito de regresso se sobre ele', 80, 433, 7.0);
  drawTxt('  recair qualquer ônus ou dívida que possa inviabilizar a sua transferência ao adquirente;', 80, 441, 7.0);

  // Bullet 6 (BOLD & UNDERLINED as in the official document!)
  drawTxt('- me comprometo a pagar os valores relativos aos débitos incidentes sobre o veículo relativos a', 80, 451, 7.0, true);
  drawHLine(80, 452, 515, 0.5);
  drawTxt('  período anterior a esta data, assim que cientificado para tal fim, informando, para tanto, o endereço,', 80, 459, 7.0, true);
  drawHLine(80, 460, 515, 0.5);
  drawTxt('  telefone e e-mail abaixo, obrigando-me a informar qualquer alteração, ou, de todo modo,', 80, 467, 7.0, true);
  drawHLine(80, 468, 515, 0.5);
  drawTxt('  autorizando, desde já, a cobrança por meio de instituição financeira, mediante emissão de boleto', 80, 475, 7.0, true);
  drawHLine(80, 476, 515, 0.5);
  drawTxt('  bancário, bem como, em caso de não pagamento ou não localização para envio da cobrança,', 80, 483, 7.0, true);
  drawHLine(80, 484, 515, 0.5);
  drawTxt('  protesto e negativação;', 80, 491, 7.0, true);
  drawHLine(80, 492, 185, 0.5);

  // Bullet 7
  drawTxt('- no caso de serem os débitos quitados pelo comprador, estou ciente de que este ficará sub-rogado no', 80, 501, 7.0);
  drawTxt('  direito ao crédito, ficando expressamente convencionado que, se tiver de promover execução judicial ou', 80, 509, 7.0);
  drawTxt('  cobrança dos valores, estes serão corrigidos e acrescidos de juros moratórios de 1% (um por cento) ao', 80, 517, 7.0);
  drawTxt('  mês.', 80, 525, 7.0);

  // --- Data ---
  drawTxt('Por ser verdade, firmo o presente.', 80, 538, 7.5, true);
  drawTxt('Campinas,', 80, 546, 8);
  drawHLine(124, 546, 150);
  drawTxt('de', 154, 546, 8);
  drawHLine(166, 546, 242);
  drawTxt('de 20', 246, 546, 8);
  drawHLine(266, 546, 288);
  drawTxt('.', 290, 546, 8);

  // Assinatura Proprietário
  drawHLine(80, 580, 280, 0.6);
  drawTxt('Proprietário (RECONHECER POR AUTENTICIDADE)', 80, 592, 7.5, true);

  // Box Bottom: Comunicações e Cobranças
  page.drawRectangle({
    x: 75,
    y: PAGE_HEIGHT - 778,
    width: 440,
    height: 153,
    borderColor: lineColor,
    borderWidth: 0.6,
  });

  drawTxt('DADOS PARA EVENTUAIS COMUNICAÇÕES E COBRANÇAS RELATIVAS AO VEÍCULO AQUI', 80, 637, 7.2, true);
  drawTxt('DESCRITO (não serão utilizados em hipótese alguma para outra finalidade)', 80, 646, 7.2, true);
  drawHLine(75, 649, 515, 0.6);

  drawTxt('Endereço residencial:', 80, 654, 7.5, true);
  drawHLine(168, 654, 510);

  drawTxt('Endereço comercial:', 80, 669, 7.5, true);
  drawHLine(165, 669, 510);

  drawTxt('Telefone com DDD:', 80, 684, 7.5, true);
  drawHLine(155, 684, 315);
  drawTxt('WhatsApp:', 320, 684, 7.5, true);
  drawHLine(368, 684, 510);

  drawTxt('e-mails:', 80, 699, 7.5, true);
  drawHLine(115, 699, 510);

  drawTxt('Principal condutor:', 80, 714, 7.5, true);
  drawHLine(152, 714, 510);

  drawTxt('CNH do principal condutor:', 80, 729, 7.5, true);
  drawHLine(182, 729, 342);
  drawTxt('CPF:', 346, 729, 7.5, true);
  drawHLine(368, 729, 510);

  drawTxt('*arquivar cópia dos documentos e comprovantes', 80, 741, 6);

  // Assinatura Declarante dentro da caixa
  drawHLine(180, 762, 410, 0.6);
  drawTxt('Nome e assinatura do declarante', 232, 772, 7.5, true);

  return await pdfDoc.save();
}

// 2. CARTA DE CANCELAMENTO (GWM | DAHRUJ)
export async function generateMasterCartaCancelamentoPdf(): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const drawTxt = (text: string, x: number, yFromTop: number, size = 9, isBold = false, color = darkText) =>
    drawTextHelper(page, fontRegular, fontBold, text, x, yFromTop, size, isBold, color);

  const drawHLine = (x1: number, yFromTop: number, x2: number, width = 0.6, color = lineColor) =>
    drawHLineHelper(page, x1, yFromTop, x2, width, color);

  // Logo GWM | DAHRUJ
  drawTxt('GWM', 80, 45, 15, true);
  drawTxt('|', 132, 45, 14, false, rgb(0.4, 0.4, 0.4));
  drawTxt('DAHRUJ', 142, 45, 15, true);

  // Title
  drawTxt('CARTA DE CANCELAMENTO', 195, 95, 13, true);
  drawHLine(195, 97, 400, 1.0);

  // Body
  drawTxt('Prezados,', 80, 165, 9.5);

  drawTxt('Eu,', 80, 195, 9.5);
  drawHLine(98, 195, 325, 0.6);
  drawTxt(', portador do', 328, 195, 9.5);

  drawTxt('CPF/CNPJ:', 80, 215, 9.5);
  drawHLine(138, 215, 285, 0.6);
  drawTxt(', venho por meio deste, solicitar o', 288, 215, 9.5);

  drawTxt('cancelamento referente ao pagamento no valor de R$', 80, 235, 9.5, true);
  drawHLine(322, 235, 388, 0.6);
  drawTxt('(', 392, 235, 9.5, true);
  drawHLine(398, 235, 506, 0.6);
  drawTxt('), junto', 508, 235, 9.5, true);

  drawTxt('à concessionária', 80, 255, 9.5, true);
  drawHLine(160, 255, 508, 0.6);
  drawTxt(',', 510, 255, 9.5);

  drawTxt('LTDA, por motivos pessoais.', 80, 275, 9.5, true);

  drawTxt('Solicito devolução integral do pagamento efetuado via', 80, 295, 9.5, true);
  drawHLine(348, 295, 508, 0.6);
  drawTxt('.', 510, 295, 9.5);

  drawTxt('Sem mais,', 80, 345, 9.5);

  // Date
  drawTxt('São Paulo', 80, 395, 9.5);
  drawHLine(135, 395, 175, 0.6);
  drawTxt('/', 180, 395, 9.5);
  drawHLine(188, 395, 235, 0.6);
  drawTxt('/', 240, 395, 9.5);
  drawHLine(248, 395, 305, 0.6);

  // Signature
  drawHLine(160, 490, 435, 0.8);
  drawTxt('Assinatura cliente', 245, 505, 9.5);

  return await pdfDoc.save();
}

// 3. DECLARAÇÃO DE DAÇÃO EM PAGAMENTO DE VEÍCULO
export async function generateMasterDacaoPagamentoPdf(): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const drawTxt = (text: string, x: number, yFromTop: number, size = 7.5, isBold = false, color = darkText) =>
    drawTextHelper(page, fontRegular, fontBold, text, x, yFromTop, size, isBold, color);

  const drawHLine = (x1: number, yFromTop: number, x2: number, width = 0.6, color = lineColor) =>
    drawHLineHelper(page, x1, yFromTop, x2, width, color);

  const boxX = 64;
  const boxWidth = 467.28;
  const splitColX = 88;

  // 1. Moldura externa com cantos arredondados cobrindo toda a página
  const frameX = 50;
  const frameY = 40;
  const frameW = 495.28;
  const frameH = 760;
  const cornerR = 40;

  // Badge capsule dimensions
  const badgeW = 240;
  const badgeH = 22;
  const badgeX = (PAGE_WIDTH - badgeW) / 2;
  const badgeY = frameY - 11;
  const badgeR = 11;

  // Top line (interrompida no centro para o badge)
  page.drawLine({
    start: { x: frameX + cornerR, y: PAGE_HEIGHT - frameY },
    end: { x: badgeX - 3, y: PAGE_HEIGHT - frameY },
    thickness: 0.9,
    color: lineColor,
  });
  page.drawLine({
    start: { x: badgeX + badgeW + 3, y: PAGE_HEIGHT - frameY },
    end: { x: frameX + frameW - cornerR, y: PAGE_HEIGHT - frameY },
    thickness: 0.9,
    color: lineColor,
  });
  // Right line
  page.drawLine({
    start: { x: frameX + frameW, y: PAGE_HEIGHT - (frameY + cornerR) },
    end: { x: frameX + frameW, y: frameY + cornerR },
    thickness: 0.9,
    color: lineColor,
  });
  // Bottom line
  page.drawLine({
    start: { x: frameX + cornerR, y: frameY },
    end: { x: frameX + frameW - cornerR, y: frameY },
    thickness: 0.9,
    color: lineColor,
  });
  // Left line
  page.drawLine({
    start: { x: frameX, y: PAGE_HEIGHT - (frameY + cornerR) },
    end: { x: frameX, y: frameY + cornerR },
    thickness: 0.9,
    color: lineColor,
  });

  // Arcos dos 4 cantos da moldura externa
  const drawCornerArc = (cx: number, cy: number, startAngle: number) => {
    const steps = 18;
    for (let i = 0; i < steps; i++) {
      const a1 = startAngle + (i * Math.PI) / (2 * steps);
      const a2 = startAngle + ((i + 1) * Math.PI) / (2 * steps);
      page.drawLine({
        start: { x: cx + cornerR * Math.cos(a1), y: cy + cornerR * Math.sin(a1) },
        end: { x: cx + cornerR * Math.cos(a2), y: cy + cornerR * Math.sin(a2) },
        thickness: 0.9,
        color: lineColor,
      });
    }
  };
  drawCornerArc(frameX + cornerR, PAGE_HEIGHT - (frameY + cornerR), Math.PI / 2); // Top-Left
  drawCornerArc(frameX + frameW - cornerR, PAGE_HEIGHT - (frameY + cornerR), 0); // Top-Right
  drawCornerArc(frameX + frameW - cornerR, frameY + cornerR, (3 * Math.PI) / 2); // Bottom-Right
  drawCornerArc(frameX + cornerR, frameY + cornerR, Math.PI); // Bottom-Left

  // 2. Title Pill Badge no topo com cantos arredondados
  page.drawRectangle({
    x: badgeX + badgeR,
    y: PAGE_HEIGHT - (badgeY + badgeH),
    width: badgeW - 2 * badgeR,
    height: badgeH,
    color: rgb(1, 1, 1),
  });
  page.drawRectangle({
    x: badgeX,
    y: PAGE_HEIGHT - (badgeY + badgeH) + badgeR,
    width: badgeW,
    height: badgeH - 2 * badgeR,
    color: rgb(1, 1, 1),
  });
  page.drawLine({
    start: { x: badgeX + badgeR, y: PAGE_HEIGHT - badgeY },
    end: { x: badgeX + badgeW - badgeR, y: PAGE_HEIGHT - badgeY },
    thickness: 0.9,
    color: lineColor,
  });
  page.drawLine({
    start: { x: badgeX + badgeR, y: PAGE_HEIGHT - (badgeY + badgeH) },
    end: { x: badgeX + badgeW - badgeR, y: PAGE_HEIGHT - (badgeY + badgeH) },
    thickness: 0.9,
    color: lineColor,
  });
  const drawBadgeArc = (cx: number, cy: number, startAngle: number) => {
    const steps = 12;
    for (let i = 0; i < steps; i++) {
      const a1 = startAngle + (i * Math.PI) / (2 * steps);
      const a2 = startAngle + ((i + 1) * Math.PI) / (2 * steps);
      page.drawLine({
        start: { x: cx + badgeR * Math.cos(a1), y: cy + badgeR * Math.sin(a1) },
        end: { x: cx + badgeR * Math.cos(a2), y: cy + badgeR * Math.sin(a2) },
        thickness: 0.9,
        color: lineColor,
      });
    }
  };
  drawBadgeArc(badgeX + badgeR, PAGE_HEIGHT - (badgeY + badgeR), Math.PI / 2); // Top-Left
  drawBadgeArc(badgeX + badgeW - badgeR, PAGE_HEIGHT - (badgeY + badgeR), 0); // Top-Right
  drawBadgeArc(badgeX + badgeW - badgeR, PAGE_HEIGHT - (badgeY + badgeH - badgeR), (3 * Math.PI) / 2); // Bottom-Right
  drawBadgeArc(badgeX + badgeR, PAGE_HEIGHT - (badgeY + badgeH - badgeR), Math.PI); // Bottom-Left

  drawTxt('DECLARAÇÃO DE DAÇÃO EM PAGAMENTO DE VEÍCULO', badgeX + 13, badgeY + 14.5, 7.8, true);

  // 3. BOX 1: PROPRIETÁRIO
  const b1Y = 72;
  const b1H = 66;
  page.drawRectangle({
    x: boxX,
    y: PAGE_HEIGHT - (b1Y + b1H),
    width: boxWidth,
    height: b1H,
    borderColor: lineColor,
    borderWidth: 0.7,
  });
  // Linha vertical do identificador
  page.drawLine({
    start: { x: splitColX, y: PAGE_HEIGHT - b1Y },
    end: { x: splitColX, y: PAGE_HEIGHT - (b1Y + b1H) },
    thickness: 0.7,
    color: lineColor,
  });
  // Texto vertical 'proprietário'
  page.drawText('proprietário', {
    x: 76,
    y: PAGE_HEIGHT - (b1Y + 58),
    size: 7.2,
    font: fontBold,
    color: darkText,
    rotate: { type: 'degrees' as any, angle: 90 },
  });

  // Linhas horizontais internas do Box 1
  drawHLine(splitColX, b1Y + 22, boxX + boxWidth, 0.5);
  drawHLine(splitColX, b1Y + 44, boxX + boxWidth, 0.5);

  // Linhas verticais separadoras
  const colDiv1X = 300;
  page.drawLine({
    start: { x: colDiv1X, y: PAGE_HEIGHT - (b1Y + 22) },
    end: { x: colDiv1X, y: PAGE_HEIGHT - (b1Y + 44) },
    thickness: 0.5,
    color: lineColor,
  });
  page.drawLine({
    start: { x: colDiv1X, y: PAGE_HEIGHT - (b1Y + 44) },
    end: { x: colDiv1X, y: PAGE_HEIGHT - (b1Y + b1H) },
    thickness: 0.5,
    color: lineColor,
  });

  // Labels Box 1
  drawTxt('Eu,', splitColX + 5, b1Y + 15, 7.8);
  drawTxt('portador do RG nº:', splitColX + 5, b1Y + 37, 7.8);
  drawTxt('e do CPF nº', colDiv1X + 5, b1Y + 37, 7.8);
  drawTxt('Estado Civil', splitColX + 5, b1Y + 59, 7.8);
  drawTxt('Profissão:', colDiv1X + 5, b1Y + 59, 7.8);

  // 4. Section 1 Header
  drawTxt('DECLARO sob minha total responsabilidade dar em pagamento o veículo', boxX, 154, 7.8, true);

  // 5. BOX 2: VEÍCULO USADO
  const b2Y = 172;
  const b2H = 44;
  page.drawRectangle({
    x: boxX,
    y: PAGE_HEIGHT - (b2Y + b2H),
    width: boxWidth,
    height: b2H,
    borderColor: lineColor,
    borderWidth: 0.7,
  });
  page.drawLine({
    start: { x: splitColX, y: PAGE_HEIGHT - b2Y },
    end: { x: splitColX, y: PAGE_HEIGHT - (b2Y + b2H) },
    thickness: 0.7,
    color: lineColor,
  });
  page.drawText('veículo usado', {
    x: 76,
    y: PAGE_HEIGHT - (b2Y + 40),
    size: 6.8,
    font: fontBold,
    color: darkText,
    rotate: { type: 'degrees' as any, angle: 90 },
  });

  drawHLine(splitColX, b2Y + 22, boxX + boxWidth, 0.5);
  // Verticais na linha 1 do usado
  const uCol1X = 158;
  const uCol2X = 285;
  page.drawLine({
    start: { x: uCol1X, y: PAGE_HEIGHT - b2Y },
    end: { x: uCol1X, y: PAGE_HEIGHT - (b2Y + 22) },
    thickness: 0.5,
    color: lineColor,
  });
  page.drawLine({
    start: { x: uCol2X, y: PAGE_HEIGHT - b2Y },
    end: { x: uCol2X, y: PAGE_HEIGHT - (b2Y + 22) },
    thickness: 0.5,
    color: lineColor,
  });

  drawTxt('Placa:', splitColX + 5, b2Y + 15, 7.8);
  drawTxt('Ano Fabricação:', uCol1X + 4, b2Y + 15, 7.8);
  drawTxt('Marca', uCol2X + 5, b2Y + 15, 7.8);
  drawTxt('Chassi:', splitColX + 5, b2Y + 37, 7.8);

  // 6. Section 2 Header
  drawTxt('objetivando realizar o pagamento parcial do veículo', boxX, 232, 7.8, true);

  // 7. BOX 3: VEÍCULO ADQUIRIDO
  const b3Y = 250;
  const b3H = 44;
  page.drawRectangle({
    x: boxX,
    y: PAGE_HEIGHT - (b3Y + b3H),
    width: boxWidth,
    height: b3H,
    borderColor: lineColor,
    borderWidth: 0.7,
  });
  page.drawLine({
    start: { x: splitColX, y: PAGE_HEIGHT - b3Y },
    end: { x: splitColX, y: PAGE_HEIGHT - (b3Y + b3H) },
    thickness: 0.7,
    color: lineColor,
  });
  page.drawText('veículo adquirido', {
    x: 76,
    y: PAGE_HEIGHT - (b3Y + 41),
    size: 6.6,
    font: fontBold,
    color: darkText,
    rotate: { type: 'degrees' as any, angle: 90 },
  });

  drawHLine(splitColX, b3Y + 22, boxX + boxWidth, 0.5);
  const aCol1X = 158;
  const aCol2X = 285;
  page.drawLine({
    start: { x: aCol1X, y: PAGE_HEIGHT - b3Y },
    end: { x: aCol1X, y: PAGE_HEIGHT - (b3Y + 22) },
    thickness: 0.5,
    color: lineColor,
  });
  page.drawLine({
    start: { x: aCol2X, y: PAGE_HEIGHT - b3Y },
    end: { x: aCol2X, y: PAGE_HEIGHT - (b3Y + 22) },
    thickness: 0.5,
    color: lineColor,
  });

  drawTxt('Placa:', splitColX + 5, b3Y + 15, 7.8);
  drawTxt('Ano:', aCol1X + 4, b3Y + 15, 7.8);
  drawTxt('Marca / Modelo:', aCol2X + 5, b3Y + 15, 7.8);
  drawTxt('Chassi:', splitColX + 5, b3Y + 37, 7.8);

  // 8. BOX 4: COMPRADOR
  const b4Y = 310;
  const b4H = 22;
  page.drawRectangle({
    x: boxX,
    y: PAGE_HEIGHT - (b4Y + b4H),
    width: boxWidth,
    height: b4H,
    borderColor: lineColor,
    borderWidth: 0.7,
  });
  const buyerColDivX = 180;
  page.drawLine({
    start: { x: buyerColDivX, y: PAGE_HEIGHT - b4Y },
    end: { x: buyerColDivX, y: PAGE_HEIGHT - (b4Y + b4H) },
    thickness: 0.7,
    color: lineColor,
  });
  drawTxt('neste ato adquirido por', boxX + 8, b4Y + 14.5, 7.8, true);
  drawTxt('Comprador:', buyerColDivX + 5, b4Y + 14.5, 7.8);

  // 9. Legal Paragraphs
  const legY = 348;
  drawTxt(', que conjuntamente assume ampla responsabilidade solidária e é autorizado a receber eventuais valores provenientes da', boxX, legY, 7.2);
  drawTxt('negociação junto à DAHRUJ MOTORS LTDA , seja a que título for.', boxX, legY + 10.5, 7.2);

  drawTxt('Declaro, também, sob as penas da lei, que o veículo objeto da dação em pagamento se encontra totalmente livre e desembaraçado', boxX, legY + 25, 7.2);
  drawTxt('de quaisquer ônus, dívida real, pessoal, fiscal ou extrajudicial, penhora, arresto ou sequestro, ou ainda restrições ou constrições de', boxX, legY + 35.5, 7.2);
  drawTxt('qualquer natureza, em especial em razão de qualquer processo judicial.', boxX, legY + 46, 7.2);

  drawTxt('Assumo em meu nome, pelo veículo dado em pagamento, a mais ampla e irrestrita responsabilidade, especialmente, mas não', boxX, legY + 60.5, 7.2);
  drawTxt('limitado, quanto aos seguintes ônus:', boxX, legY + 71, 7.2);

  // Bullet 1
  page.drawCircle({ x: boxX + 11, y: PAGE_HEIGHT - (legY + 91), size: 2.2, color: darkText });
  drawTxt('Débito ou dívida direta ou indireta contraída por mim e que pese ou venha a pesar sobre o mesmo; multas de', boxX + 20, legY + 89, 7.2, true);
  drawTxt('trânsito de qualquer gravidade e ou valor que tenham sido geradas até a presente data;', boxX + 20, legY + 99.5, 7.2, true);

  // Bullet 2
  page.drawCircle({ x: boxX + 11, y: PAGE_HEIGHT - (legY + 117), size: 2.2, color: darkText });
  drawTxt('Penhora, arrestos, sequestros ou quaisquer outras constrições que possam vir a pesar sobre o veículo, seja a', boxX + 20, legY + 115, 7.2, true);
  drawTxt('que título ou tempo for, decorrente ou não de processo judicial;', boxX + 20, legY + 125.5, 7.2, true);

  // Bullet 3
  page.drawCircle({ x: boxX + 11, y: PAGE_HEIGHT - (legY + 143), size: 2.2, color: darkText });
  drawTxt('Toda e qualquer responsabilidade civil ou criminal.', boxX + 20, legY + 141, 7.2, true);

  // Long legal paragraph
  const pY = legY + 154;
  drawTxt('Em recaindo sobre o veículo qualquer tipo de cobrança (judicial ou extrajudicial) ou qualquer tipo de constrição judicial e ou', boxX, pY, 7.0);
  drawTxt('administrativa, que venha de qualquer forma, ainda que parcialmente, comprometer ou limitar sua plena, livre e ilimitada', boxX, pY + 9.5, 7.0);
  drawTxt('disposição, utilização ou comercialização, obrigo-me a adotar todas as providências necessárias e indicadas para sua IMEDIATA', boxX, pY + 19, 7.0);
  drawTxt('liberação e completa isenção de responsabilidade da DAHRUJ MOTORS LTDA, seja pagando a integridade do débito, seja através de', boxX, pY + 28.5, 7.0);
  drawTxt('qualquer outro meio eficaz, providências estas que deverão ocorrer dentro de um prazo máximo de 24 horas da efetivação da', boxX, pY + 38, 7.0);
  drawTxt('cientificação, o que ocorrerá por qualquer meio de comunicação, sob pena de responder por todas as perdas e danos decorrentes, além', boxX, pY + 47.5, 7.0);
  drawTxt('de multa diária ora estabelecida no valor de R$1.000,00(hum mil reais), além de juros mensais de 1%, correção monetária com base', boxX, pY + 57, 7.0);
  drawTxt('no índice CDI e honorários advocatícios de 20% se necessária providência judicial. Pelas obrigações acima assumidas, ofereço ainda', boxX, pY + 66.5, 7.0);
  drawTxt('ampla garantia fidejussória. Estas obrigações constituem-se em direito líquido, certo e exigível da DAHRUJ MOTORS LTDA , podendo', boxX, pY + 76, 7.0);
  drawTxt('ser exercido através de ação executiva.', boxX, pY + 85.5, 7.0);

  // 10. Date Box
  const dateBoxX = 311;
  const dateBoxY = 600;
  const dateBoxW = 220;
  const dateBoxH = 19;
  page.drawRectangle({
    x: dateBoxX,
    y: PAGE_HEIGHT - (dateBoxY + dateBoxH),
    width: dateBoxW,
    height: dateBoxH,
    borderColor: lineColor,
    borderWidth: 0.7,
  });
  drawTxt('Data:', dateBoxX + 4, dateBoxY + 7.5, 5.5);
  drawTxt('Campinas,', dateBoxX + 20, dateBoxY + 13, 7.5);

  // 11. Signature Block
  const sigY = 665;
  const sigW = 270;
  const sigX = 163;
  drawHLine(sigX, sigY, sigX + sigW, 0.8);
  drawTxt('Assinatura - do proprietário', sigX + 61, sigY + 12, 8.0, true);
  drawTxt('reconhecer por autenticidade', sigX + 67, sigY + 21, 6.8);

  return await pdfDoc.save();
}

// 4. DECLARAÇÃO DE ISENÇÃO DE NOTA FISCAL (PRESTAÇÃO DE SERVIÇOS - ICMS)
export async function generateMasterIsencaoNfPdf(): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const drawTxt = (text: string, x: number, yFromTop: number, size = 9.5, isBold = false, color = darkText) =>
    drawTextHelper(page, fontRegular, fontBold, text, x, yFromTop, size, isBold, color);

  const drawHLine = (x1: number, yFromTop: number, x2: number, width = 0.6, color = lineColor) =>
    drawHLineHelper(page, x1, yFromTop, x2, width, color);

  // Title
  drawTxt('DECLARAÇÃO', 240, 85, 14, true);

  // Body
  drawTxt('A empresa', 80, 145, 10);
  drawHLine(135, 145, 305);
  drawTxt(', CNPJ', 310, 145, 10);
  drawHLine(348, 145, 495);
  drawTxt(',', 498, 145, 10);

  drawTxt('vem através desta, declarar que está desobrigada a EMISSÃO DE NOTA', 80, 170, 10);
  drawTxt('FISCAL DE VENDA modelo 1, por se tratar de empresa cuja a atividade', 80, 190, 10);
  drawTxt('é exclusivamente de PRESTAÇÃO DE SERVIÇOS, não sendo portanto', 80, 210, 10);
  drawTxt('contribuinte de ICMS.', 80, 230, 10);

  // Vehicle data block
  drawTxt('VEÍCULO:', 80, 345, 10, true);
  drawTxt('ANO :', 80, 380, 10, true);
  drawTxt('COR:', 80, 415, 10, true);
  drawTxt('RENAVAM:', 80, 450, 10, true);
  drawTxt('CHASSI:', 80, 485, 10, true);

  // Closing
  drawTxt('Para maior clareza, firma presente', 330, 560, 9.5);
  drawTxt('Cidade, e data', 430, 630, 9.5);

  // Signature
  drawHLine(170, 740, 420, 0.8);
  drawTxt('ASSINATURA', 265, 755, 9.5, true);
  drawTxt('(contador ou sócio majoritário)', 225, 770, 9);

  return await pdfDoc.save();
}

// 5. TERMO DE COMPRA DO VEÍCULO USADO (GWM)
export async function generateMasterTermoCompraUsadoGwmPdf(): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const drawTxt = (text: string, x: number, yFromTop: number, size = 9, isBold = false, color = darkText) =>
    drawTextHelper(page, fontRegular, fontBold, text, x, yFromTop, size, isBold, color);

  const drawHLine = (x1: number, yFromTop: number, x2: number, width = 0.65, color = lineColor) =>
    drawHLineHelper(page, x1, yFromTop, x2, width, color);

  // 1. Top Blue Bar (exact match from document)
  page.drawRectangle({
    x: 0,
    y: PAGE_HEIGHT - 18,
    width: 340,
    height: 18,
    color: rgb(0.0, 0.28, 0.73), // Royal Blue
  });

  // 2. Top-Right Geometric Pattern (criss-cross / chevron watermark lines)
  const patternColor = rgb(0.78, 0.81, 0.85);
  for (let row = 0; row < 6; row++) {
    const yStart = 15 + row * 26;
    for (let col = 0; col < 5; col++) {
      const xStart = 490 + col * 20;
      page.drawLine({
        start: { x: xStart, y: PAGE_HEIGHT - yStart },
        end: { x: xStart + 16, y: PAGE_HEIGHT - (yStart + 22) },
        thickness: 0.6,
        color: patternColor,
      });
      page.drawLine({
        start: { x: xStart + 16, y: PAGE_HEIGHT - yStart },
        end: { x: xStart, y: PAGE_HEIGHT - (yStart + 22) },
        thickness: 0.6,
        color: patternColor,
      });
    }
  }

  // 3. Logo GWM (Emblem circle + text + vertical bar)
  const logoY = 62;
  // Emblem outer circle
  page.drawCircle({
    x: 95,
    y: PAGE_HEIGHT - logoY + 3,
    size: 14,
    borderColor: darkText,
    borderWidth: 1.8,
  });
  // Emblem inner stylized curves/spokes
  page.drawCircle({
    x: 95,
    y: PAGE_HEIGHT - logoY + 3,
    size: 7,
    borderColor: darkText,
    borderWidth: 1.2,
  });
  page.drawLine({
    start: { x: 95, y: PAGE_HEIGHT - logoY + 14 },
    end: { x: 95, y: PAGE_HEIGHT - logoY - 8 },
    thickness: 1.5,
    color: darkText,
  });

  // Text "GWM"
  drawTxt('GWM', 122, logoY + 5, 20, true);

  // Vertical bar "|"
  page.drawLine({
    start: { x: 206, y: PAGE_HEIGHT - (logoY - 14) },
    end: { x: 206, y: PAGE_HEIGHT - (logoY + 16) },
    thickness: 1.5,
    color: darkText,
  });

  // 4. Centered Title
  drawTxt('Termo de Compra do veículo usado', 195, 105, 11, true);

  // 5. Lines and text
  // Pedido RTO
  drawTxt('Pedido RTO -', 70, 140, 9.5, true);
  drawHLine(140, 140, 335);

  // Eu (cliente), ... , CPF
  drawTxt('Eu (cliente),', 70, 168, 9);
  drawHLine(128, 168, 430);
  drawTxt(', CPF', 435, 168, 9);

  // Line 2 of declarante
  drawHLine(70, 196, 210);
  drawTxt(', declaro para os devidos fins que obtive o benefício:', 215, 196, 9);

  // Bold Section Title
  drawTxt('Declaração de Venda de Veículo Seminovo', 70, 238, 12.5, true);

  // Paragraph 1
  drawTxt('Declaro para os devidos fins que vendi meu veículo seminovo, abaixo descrito, no valor de', 70, 275, 9);

  // R$ ... (valor por extenso) para a
  drawTxt('R$', 70, 304, 9);
  drawHLine(88, 304, 340);
  drawTxt('(valor por extenso) para a', 345, 304, 9);

  // concessionária ... .
  drawTxt('concessionária', 70, 330, 9);
  drawHLine(142, 330, 338);
  drawTxt('.', 340, 330, 9);

  // Marca ... Modelo ... Versão ...
  drawTxt('Marca', 70, 365, 9, true);
  drawHLine(105, 365, 172);
  drawTxt('Modelo', 188, 365, 9, true);
  drawHLine(230, 365, 295);
  drawTxt('Versão', 312, 365, 9, true);
  drawHLine(350, 365, 415);

  // Ano Fabricação/Modelo ... / ... Placa ...
  drawTxt('Ano Fabricação/Modelo', 70, 412, 9);
  drawHLine(182, 412, 218);
  drawTxt('/', 223, 412, 9);
  drawHLine(232, 412, 268);
  drawTxt('Placa', 282, 412, 9, true);
  drawHLine(310, 412, 425);

  // Cláusula GWM
  drawTxt('O veículo seminovo está sendo vendido como parte do pagamento na aquisição do veículo', 70, 458, 9);
  drawTxt('novo, de marca GWM, modelo', 70, 474, 9);
  drawHLine(224, 474, 290);
  drawTxt('.', 292, 474, 9);

  // Data
  drawTxt('Data:', 70, 520, 9);
  drawHLine(98, 520, 140);
  drawTxt('/', 144, 520, 9);
  drawHLine(152, 520, 200);
  drawTxt('/', 204, 520, 9);
  drawHLine(212, 520, 264);
  drawTxt('.', 268, 520, 9);

  // 6. Bloco de Assinaturas (duas colunas)
  // Left: Cliente Assinatura
  drawTxt('(Cliente Assinatura)', 70, 600, 9, true);
  drawHLine(168, 600, 255);
  drawTxt('Nome:', 70, 618, 9);
  drawHLine(105, 618, 255);
  drawTxt('Fone:', 70, 636, 9);
  drawHLine(105, 636, 255);
  drawTxt('E-mail:', 70, 654, 9);
  drawHLine(110, 654, 255);

  // Proprietário (RECONHECER POR AUTENTICIDADE)
  drawTxt('Proprietário (RECONHECER POR AUTENTICIDADE)', 70, 688, 9, true);

  // Right: Concess. Assinatura
  drawTxt('(Concess. Assinatura)', 310, 600, 9, true);
  drawHLine(415, 600, 540);
  drawTxt('Nome:', 310, 618, 9);
  drawHLine(348, 618, 465);
  drawTxt('Função:', 310, 636, 9);
  drawHLine(355, 636, 465);

  return await pdfDoc.save();
}

// 6. FORMULÁRIO PARA DEVOLUÇÃO (GWM | DAHRUJ)
export async function generateMasterFormularioDevolucaoPdf(): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const drawTxt = (text: string, x: number, yFromTop: number, size = 9, isBold = false, color = darkText) =>
    drawTextHelper(page, fontRegular, fontBold, text, x, yFromTop, size, isBold, color);

  const drawHLine = (x1: number, yFromTop: number, x2: number, width = 0.6, color = lineColor) =>
    drawHLineHelper(page, x1, yFromTop, x2, width, color);

  // Logo
  drawTxt('GWM', 80, 45, 15, true);
  drawTxt('|', 132, 45, 14, false, rgb(0.4, 0.4, 0.4));
  drawTxt('DAHRUJ', 142, 45, 15, true);

  // Title
  drawTxt('FORMULÁRIO PARA DEVOLUÇÃO', 185, 95, 12, true);

  // Checkboxes
  drawTxt('CONTA CONJUNTA?', 80, 145, 9, true);
  page.drawRectangle({
    x: 188,
    y: PAGE_HEIGHT - 147,
    width: 14,
    height: 14,
    borderColor: lineColor,
    borderWidth: 0.8,
  });
  drawTxt('SIM', 210, 145, 9, true);
  page.drawRectangle({
    x: 275,
    y: PAGE_HEIGHT - 147,
    width: 14,
    height: 14,
    borderColor: lineColor,
    borderWidth: 0.8,
  });
  drawTxt('NÃO', 297, 145, 9, true);

  drawTxt('TERCEIRO?', 80, 175, 9, true);
  page.drawRectangle({
    x: 188,
    y: PAGE_HEIGHT - 177,
    width: 14,
    height: 14,
    borderColor: lineColor,
    borderWidth: 0.8,
  });
  drawTxt('SIM', 210, 175, 9, true);
  page.drawRectangle({
    x: 275,
    y: PAGE_HEIGHT - 177,
    width: 14,
    height: 14,
    borderColor: lineColor,
    borderWidth: 0.8,
  });
  drawTxt('NÃO', 297, 175, 9, true);

  // Fields
  drawTxt('CHAVE PIX:', 80, 205, 9, true);
  drawHLine(140, 205, 335);

  drawTxt('TITULAR:', 80, 235, 9, true);
  drawHLine(130, 235, 335);

  drawTxt('CPF/CNPJ:', 80, 265, 9, true);
  drawHLine(140, 265, 335);

  drawTxt('BANCO:', 80, 295, 9, true);
  drawHLine(128, 295, 335);

  drawTxt('AGÊNCIA:', 80, 325, 9, true);
  drawHLine(135, 325, 335);

  drawTxt('CONTA POUPANÇA:', 80, 355, 9, true);
  drawHLine(180, 355, 335);

  drawTxt('CONTA CORRENTE:', 80, 385, 9, true);
  drawHLine(180, 385, 335);

  drawTxt('OPERAÇÃO CEF (CAIXA ECONÔMICA):', 80, 415, 9, true);
  drawHLine(265, 415, 340);

  // Legal
  drawTxt('OBS: NO CASO SE INDICAR CONTA DE TERCEIRO FAZER CARTA DE PROPRIO PUNHO', 80, 465, 7.5, true);
  drawTxt('AUTORIZANDO A TRANSFERENCIA DO VALOR E RECONHECER POR', 80, 477, 7.5, true);
  drawTxt('AUTENTICIDADE.', 80, 489, 7.5, true);

  drawTxt('FIRMO E DOU FÉ QUE AS INFORMAÇÕES ACIMA SÃO VERDADEIRAS E EXATAS.', 80, 515, 7.5, true);
  drawTxt('ESTOU CIENTE QUE A DEVOLUCAO SÓ SERÁ DEPOSITADA EM 3 DIAS ÚTEIS.', 80, 530, 7.5, true);

  // Date
  drawTxt('São Paulo,', 180, 595, 9);
  drawHLine(235, 595, 275);
  drawTxt('/', 280, 595, 9);
  drawHLine(288, 595, 335);
  drawTxt('/', 340, 595, 9);
  drawHLine(348, 595, 405);

  // Signature
  drawHLine(180, 680, 405, 0.8);
  drawTxt('ASSINATURA CLIENTE', 240, 695, 8.5, true);

  return await pdfDoc.save();
}

// 7. INSTRUMENTO PARTICULAR DE COMODATO DE VEÍCULO (7 PÁGINAS)
export async function generateMasterComodatoVeiculoPdf(): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const createPageHelpers = (page: any) => {
    const drawTxt = (text: string, x: number, yFromTop: number, size = 8.5, isBold = false) => {
      drawTextHelper(page, fontRegular, fontBold, text, x, yFromTop, size, isBold, darkText);
    };
    const drawHLine = (x1: number, yFromTop: number, x2: number, width = 0.6) => {
      drawHLineHelper(page, x1, yFromTop, x2, width, lineColor);
    };
    return { drawTxt, drawHLine };
  };

  // ===================== PÁGINA 1 =====================
  const page1 = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const p1 = createPageHelpers(page1);

  // Título
  p1.drawTxt('INSTRUMENTO PARTICULAR DE COMODATO DE VEÍCULO', 130, 85, 10, true);

  // Preâmbulo
  p1.drawTxt('Por este instrumento particular, de um lado CMD GW COMERCIO DE VEÍCULOS', 70, 155, 8.5);
  p1.drawTxt('AUTOMOTORES LTDA., pessoa jurídica de direito privado, pessoa jurídica de direito', 70, 169, 8.5);
  p1.drawTxt('priva538-56do, devidamente constituída e inscrita no CNPJ/MF sob o nº. 48.967.629/0004-84,', 70, 183, 8.5);
  p1.drawTxt('com sede em JUNDIAÍ, na AV NOVE DE JULHO, 380 - Jundiaí, CEP 13209-010,', 70, 197, 8.5);
  
  p1.drawTxt('aqui denominado simplesmente COMODANTE, e, de outro lado', 70, 211, 8.5);
  p1.drawHLine(345, 211, 520, 0.6);

  p1.drawTxt('portador(a) da Cédula de Identidade nº', 70, 225, 8.5);
  p1.drawHLine(235, 225, 345, 0.6);

  p1.drawTxt(', inscrito(a) no CPF sob o nº', 70, 239, 8.5);
  p1.drawHLine(185, 239, 335, 0.6);
  p1.drawTxt(', residente e domiciliado(a)', 340, 239, 8.5);

  p1.drawTxt('na Cidade de', 70, 253, 8.5);
  p1.drawHLine(125, 253, 215, 0.6);
  p1.drawTxt(', Estado S. PAULO, na', 218, 253, 8.5);
  p1.drawHLine(320, 253, 495, 0.6);
  p1.drawTxt(',', 497, 253, 8.5);
  p1.drawHLine(500, 253, 525, 0.6);

  p1.drawTxt('Bairro:', 70, 267, 8.5);
  p1.drawHLine(105, 267, 225, 0.6);
  p1.drawTxt('Cep:', 228, 267, 8.5);
  p1.drawHLine(255, 267, 335, 0.6);
  p1.drawTxt('aqui simplesmente denominada COMODATÁRIA,', 340, 267, 8.5);

  // Cláusula 1
  p1.drawTxt('1. A COMODANTE é proprietária do veículo', 70, 320, 8.5);
  p1.drawHLine(260, 320, 450, 0.6);
  p1.drawTxt(',', 452, 320, 8.5);
  p1.drawHLine(455, 320, 483, 0.6);
  p1.drawTxt('/', 485, 320, 8.5);
  p1.drawHLine(490, 320, 520, 0.6);
  p1.drawTxt(',', 522, 320, 8.5);

  p1.drawTxt('COR', 70, 334, 8.5);
  p1.drawHLine(100, 334, 165, 0.6);
  p1.drawTxt('PLACA', 170, 334, 8.5);
  p1.drawHLine(205, 334, 300, 0.6);
  p1.drawTxt(', e neste ato, por este instrumento concede o mesmo a', 305, 334, 8.5);

  p1.drawTxt('título de COMODATO, por período indeterminado, a contar da data deste instrumento,', 70, 360, 8.5);
  p1.drawTxt('para uso da COMODATÁRIA.', 70, 374, 8.5);

  // Cláusula 2
  p1.drawTxt('2. O veículo definido na cláusula 1º deste ficará na posse da própria COMODATÁRIA,', 70, 415, 8.5);
  p1.drawTxt('podendo a mesma usar e gozar do bem da forma que melhor lhe convir, sendo-lhe', 70, 429, 8.5);
  p1.drawTxt('apenas vedado à locação e a alienação a outrem sem expressa autorização da', 70, 443, 8.5);
  p1.drawTxt('COMODANTE.', 70, 457, 8.5);

  // Cláusula 2.A
  p1.drawTxt('2.A. A COMODATÁRIA obriga-se a utilizar do veículo somente com condutores', 70, 510, 8.5);
  p1.drawTxt('devidamente habilitados, se comprometendo ainda a fornecer, quando solicitada, no', 70, 524, 8.5);
  p1.drawTxt('prazo máximo de 24 horas a Carteira Nacional de Habilitação de condutor que', 70, 538, 8.5);
  p1.drawTxt('eventualmente cometa infrações.', 70, 552, 8.5);

  // Cláusula 3
  p1.drawTxt('3. A COMODATÁRIA obriga-se a reembolsar a COMODANTE, de todas as despesas', 70, 605, 8.5);
  p1.drawTxt('havidas com o veículo, tais como eventuais taxas e infrações de trânsito que venham', 70, 619, 8.5);
  p1.drawTxt('recair sobre o bem, e ainda eventuais sinistros ocorridos que causem danos ao próprio', 70, 633, 8.5);
  p1.drawTxt('bem ou a terceiros durante o período de vigência deste instrumento.', 70, 647, 8.5);

  // Cláusula 4
  p1.drawTxt('4. A COMODATÁRIA obriga-se a efetuar o pagamento do valor estabelecido a época dos', 70, 700, 8.5);
  p1.drawTxt('fatos pela Tabela Fipe, nos casos de furto, roubo e ou perda total do veículo objeto do', 70, 714, 8.5);

  // ===================== PÁGINA 2 =====================
  const page2 = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const p2 = createPageHelpers(page2);

  p2.drawTxt('presente instrumento, lançando mão desde já de qualquer alegação de caso fortuito ou', 70, 85, 8.5);
  p2.drawTxt('força maior como excludentes da responsabilidade e ou obrigação de indenizar aqui', 70, 99, 8.5);
  p2.drawTxt('assumida.', 70, 113, 8.5);

  // Cláusula 5
  p2.drawTxt('5. Em caso de turbação ou esbulho da posse do bem por atos de terceiros, a', 70, 180, 8.5);
  p2.drawTxt('COMODATÁRIA deverá tomar as providências cabíveis a fim de cessar tais atos, bem', 70, 194, 8.5);
  p2.drawTxt('como comunicar imediatamente tais fatos à COMODANTE.', 70, 208, 8.5);

  // Cláusula 6
  p2.drawTxt('6. Qualquer tolerância ou concessão das partes quanto ao cumprimento do disposto', 70, 275, 8.5);
  p2.drawTxt('neste contrato constituir-se-á ato de mera liberalidade, não podendo ser considerado', 70, 289, 8.5);
  p2.drawTxt('novação.', 70, 303, 8.5);

  // Cláusula 7
  p2.drawTxt('7. As Partes declaram que, direta ou indiretamente, atuam em seus negócios pautadas', 70, 370, 8.5);
  p2.drawTxt('no profissionalismo e na ética, em conformidade com as leis brasileiras, sempre', 70, 384, 8.5);
  p2.drawTxt('respeitando o pactuado no presente Contrato e sem qualquer violação às previsões da', 70, 398, 8.5);
  p2.drawTxt('presente cláusula.', 70, 412, 8.5);

  // Cláusula 7.1
  p2.drawTxt('7.1 As Partes garantem, para todos os efeitos, que:', 70, 480, 8.5);

  p2.drawTxt('a) Cumprem todas as leis e normas relacionadas à anticorrupção, lavagem de', 70, 535, 8.5);
  p2.drawTxt('dinheiro, antissuborno, antitruste e conflito de interesses, incluindo principalmente,', 70, 549, 8.5);
  p2.drawTxt('mas não se limitando à Lei Brasileira Anticorrupção (Lei 12.846/2013), Decreto', 70, 563, 8.5);
  p2.drawTxt('Brasileiro Anticorrupção (Decreto n° 8.420/2015), Lei Brasileira de Licitações (Lei n°', 70, 577, 8.5);
  p2.drawTxt('8.666/1993) e qualquer legislação relativa a Lavagem de Dinheiro;', 70, 591, 8.5);

  p2.drawTxt('b) Adotam políticas de prevenção e combate à corrupção, à lavagem de dinheiro e ao', 70, 650, 8.5);
  p2.drawTxt('financiamento ao terrorismo, elaboradas em conformidade com as legislações aplicáveis,', 70, 664, 8.5);
  p2.drawTxt('bem como desenvolvem suas atividades em estrita observância a estas políticas, não', 70, 678, 8.5);
  p2.drawTxt('adotando qualquer prática vedada pela legislação aplicável ou utilizando em suas', 70, 692, 8.5);
  p2.drawTxt('atividades quaisquer valores, bens ou direitos provenientes de infração penal;', 70, 706, 8.5);

  // ===================== PÁGINA 3 =====================
  const page3 = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const p3 = createPageHelpers(page3);

  p3.drawTxt('c) Não utilizam trabalho ilegal, se comprometendo a não utilizar práticas de trabalho', 70, 85, 8.5);
  p3.drawTxt('análogo ao escravo ou mão de obra infantil, salvo esta última na condição de aprendiz,', 70, 99, 8.5);
  p3.drawTxt('observadas as disposições constantes da Consolidação das Leis do Trabalho - CLT;', 70, 113, 8.5);

  p3.drawTxt('d) Não empregam menores até 18 (dezoito) anos, inclusive menor aprendiz, em locais', 70, 180, 8.5);
  p3.drawTxt('prejudiciais à sua formação, ao seu desenvolvimento físico, psíquico, moral e social,', 70, 194, 8.5);
  p3.drawTxt('bem como em locais e serviços perigosos ou insalubres, em horário noturno e, ainda,', 70, 208, 8.5);
  p3.drawTxt('em horários que não permitam a frequência destes empregados à escola;', 70, 222, 8.5);

  p3.drawTxt('e) Cumprem a legislação trabalhista, quanto às horas de trabalho e aos direitos dos', 70, 295, 8.5);
  p3.drawTxt('empregados e também não dificultam a participação dos empregados em sindicatos;', 70, 309, 8.5);

  p3.drawTxt('f) Não utilizam práticas de discriminação negativa e limitativas ao acesso à relação', 70, 375, 8.5);
  p3.drawTxt('de emprego ou a sua manutenção, incluindo, mas sem limitação, práticas de', 70, 389, 8.5);
  p3.drawTxt('discriminação e limitação em razão de sexo, origem, raça, cor, condição física, religião,', 70, 403, 8.5);
  p3.drawTxt('estado civil, idade, situação familiar ou estado gravídico; e', 70, 417, 8.5);

  p3.drawTxt('g) Executam suas atividades em observância à legislação vigente no que tange à', 70, 490, 8.5);
  p3.drawTxt('proteção ao meio ambiente, comprometendo-se a prevenir e erradicar práticas danosas', 70, 504, 8.5);
  p3.drawTxt('ao meio ambiente.', 70, 518, 8.5);

  p3.drawTxt('8. As Partes declaram, garantem e aceitam que, com relação a este Contrato e sua', 70, 560, 8.5);
  p3.drawTxt('atividade:', 70, 574, 8.5);

  p3.drawTxt('a) Não houve e não haverá nenhum tipo de solicitação, cobrança, obtenção ou', 70, 630, 8.5);
  p3.drawTxt('exigência, para si e para outrem, de vantagem indevida ou promessa de vantagem', 70, 644, 8.5);
  p3.drawTxt('indevida, nem qualquer oferta ou promessa de pagamento de valor pecuniário ou outros', 70, 658, 8.5);
  p3.drawTxt('benefícios, como presentes, favores, promessas ou vantagens, direta ou indiretamente,', 70, 672, 8.5);
  p3.drawTxt('com pretexto de condicionar em ato praticado por qualquer funcionário uma da outra', 70, 686, 8.5);
  p3.drawTxt('ou ainda a agentes públicos, políticos e/ou privados, partidos políticos e candidatos, ou', 70, 700, 8.5);
  p3.drawTxt('ainda qualquer pessoa que atue em nome de uma organização pública nacional ou', 70, 714, 8.5);
  p3.drawTxt('internacional, bem como seus familiares ou amigos;', 70, 728, 8.5);

  p3.drawTxt('b) Não doam fundos, financiam ou de qualquer forma subsidiam atos ou práticas', 70, 770, 8.5);
  p3.drawTxt('ilegais.', 70, 784, 8.5);

  // ===================== PÁGINA 4 =====================
  const page4 = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const p4 = createPageHelpers(page4);

  p4.drawTxt('8.1. As Partes se comprometem em combater toda e qualquer atividade que seja contra', 70, 115, 8.5);
  p4.drawTxt('livre concorrência, especialmente, mas não se limitando às iniciativas indutoras à', 70, 129, 8.5);
  p4.drawTxt('formação de cartel.', 70, 143, 8.5);

  p4.drawTxt('8.2. As Partes ficarão sujeitas a auditorias e visitas, bem como ao envio de documentos', 70, 215, 8.5);
  p4.drawTxt('e evidências para verificação do cumprimento das práticas estabelecidas nesta cláusula,', 70, 229, 8.5);
  p4.drawTxt('mediante solicitação prévia de 20 (dias), sempre precedida da assinatura de um Termo', 70, 243, 8.5);
  p4.drawTxt('de Confidencialidade (NDA – Non Disclosure Agreement).', 70, 257, 8.5);

  p4.drawTxt('8.3. Caso a Parte auditora, entenda pela necessidade de contratação de uma empresa', 70, 330, 8.5);
  p4.drawTxt('especializada para realização da auditoria descrita no caput desta cláusula, todos os', 70, 344, 8.5);
  p4.drawTxt('encargos e verbas devidas por essa contratação serão de responsabilidade da Parte que', 70, 358, 8.5);
  p4.drawTxt('deseja realizar a auditoria.', 70, 372, 8.5);

  p4.drawTxt('8.4. O não cumprimento ou violação por uma das Partes de quaisquer práticas', 70, 445, 8.5);
  p4.drawTxt('estabelecidas neste título poderá ensejar a imediata rescisão deste contrato pela outra', 70, 459, 8.5);
  p4.drawTxt('Parte.', 70, 473, 8.5);

  p4.drawTxt('8.5. Em conformidade com o objeto previsto neste Contrato, as Partes poderão ter acesso', 70, 535, 8.5);
  p4.drawTxt('a dados enviados que identifiquem ou permitam a identificação de indivíduos (“Dados', 70, 549, 8.5);
  p4.drawTxt('Pessoais”).', 70, 563, 8.5);

  p4.drawTxt('8.6. As Partes se comprometem, por meio de suas assinaturas apostas ao presente', 70, 625, 8.5);
  p4.drawTxt('instrumento, a cumprir com a legislação brasileira referente à proteção de dados', 70, 639, 8.5);
  p4.drawTxt('pessoais cadastrados junto aos seus sistemas.', 70, 653, 8.5);

  p4.drawTxt('8.7. As Partes concordam que a execução do presente Contrato será guiada pelo', 70, 715, 8.5);
  p4.drawTxt('princípio de Privacy by Design, ou seja, promovendo a privacidade e a conformidade com', 70, 729, 8.5);
  p4.drawTxt('a proteção de dados desde o desenho do serviço e ao longo de sua execução, e pelas', 70, 743, 8.5);
  p4.drawTxt('regras jurídicas de compliance aplicáveis.', 70, 757, 8.5);

  // ===================== PÁGINA 5 =====================
  const page5 = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const p5 = createPageHelpers(page5);

  p5.drawTxt('8.8. O acesso, utilização, coleta, produção, recepção, classificação, acesso, reprodução,', 70, 85, 8.5);
  p5.drawTxt('transmissão, distribuição, processamento, arquivamento, armazenamento, eliminação,', 70, 99, 8.5);
  p5.drawTxt('avaliação ou controle da informação, modificação, comunicação, transferência, difusão', 70, 113, 8.5);
  p5.drawTxt('ou extração e o compartilhamento por qualquer das Partes dos Dados Pessoais que lhe', 70, 127, 8.5);
  p5.drawTxt('forem enviados pela outra Parte (“Tratamento de Dados Pessoais”) será autorizado e', 70, 141, 8.5);
  p5.drawTxt('limitado ao estritamente necessário para a execução da prestação dos Serviços. Fica', 70, 155, 8.5);
  p5.drawTxt('vedada a utilização dos Dados Pessoais para quaisquer outras finalidades.', 70, 169, 8.5);

  p5.drawTxt('8.9. As Partes somente poderão realizar o Tratamento de Dados Pessoais recebidos por', 70, 255, 8.5);
  p5.drawTxt('força deste Contrato durante o período de sua vigência com a finalidade estrita de', 70, 269, 8.5);
  p5.drawTxt('cumprir as obrigações do presente Contrato.', 70, 283, 8.5);

  p5.drawTxt('8.10. Fica vedado às Partes transferir, no todo ou em parte, os Dados Pessoais que lhe', 70, 330, 8.5);
  p5.drawTxt('forem enviados pela outra Parte para quaisquer terceiros não relacionados com a', 70, 344, 8.5);
  p5.drawTxt('realização das Atividades, mesmo que de forma agregada e/ou anônima.', 70, 358, 8.5);

  p5.drawTxt('8.11. Caso qualquer das Partes seja obrigada a transferir ou divulgar qualquer Dado', 70, 425, 8.5);
  p5.drawTxt('Pessoal em razão de ordem administrativa ou judicial de qualquer natureza, deverá', 70, 439, 8.5);
  p5.drawTxt('informar à outra Parte em até 24 (vinte e quatro) horas, a fim de que este possa tomar', 70, 453, 8.5);
  p5.drawTxt('as medidas judiciais que entender necessárias. Além disso, as Partes comprometem-se', 70, 467, 8.5);
  p5.drawTxt('a cooperar uma com a outra a fim de limitar para limitar a extensão e o âmbito de tal', 70, 481, 8.5);
  p5.drawTxt('transferência ou divulgação de dados.', 70, 495, 8.5);

  p5.drawTxt('8.12. As Partes deverão ainda promover a exclusão definitiva de quaisquer Dados', 70, 575, 8.5);
  p5.drawTxt('Pessoais que lhe foram transmitidos por força deste contrato por solicitação dos Clientes', 70, 589, 8.5);
  p5.drawTxt('Finais ou da outra Parte.', 70, 603, 8.5);

  p5.drawTxt('8.13. As Partes se comprometem a assegurar a segurança dos Dados Pessoais, sua', 70, 670, 8.5);
  p5.drawTxt('privacidade e a adequada gestão dos Dados Pessoais recebidos e utilizados para a', 70, 684, 8.5);
  p5.drawTxt('prestação dos Serviços, valendo-se de técnicas de segurança como', 70, 698, 8.5);
  p5.drawTxt('criptografia, hardening, além de monitoramento e testes de segurança frequentes,', 70, 712, 8.5);
  p5.drawTxt('dentre outros métodos de proteção condizentes com as melhores práticas do setor para', 70, 726, 8.5);
  p5.drawTxt('a proteção de dados.', 70, 740, 8.5);

  p5.drawTxt('8.14. As Partes obrigam-se a notificar uma à outra, em até 24 (vinte e quatro) horas,', 70, 810, 8.5);
  p5.drawTxt('acerca de qualquer vazamento ou comprometimento de suas bases de dados', 70, 824, 8.5);

  // ===================== PÁGINA 6 =====================
  const page6 = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const p6 = createPageHelpers(page6);

  p6.drawTxt('relacionadas com o presente Contrato, bem como acerca de qualquer violação da', 70, 85, 8.5);
  p6.drawTxt('legislação de privacidade e de proteção de dados pessoais que tiver ciência com relação', 70, 99, 8.5);
  p6.drawTxt('aos dados em sua custódia, inclusive violação acidental ou culposa.', 70, 113, 8.5);

  p6.drawTxt('8.15. Caso qualquer das Partes sofram qualquer dano ou prejuízos em decorrência do', 70, 180, 8.5);
  p6.drawTxt('descumprimento comprovado das cláusulas de proteção de dados pessoais deste', 70, 194, 8.5);
  p6.drawTxt('Contrato ou do descumprimento legal de obrigações de proteção de dados, ocasionado', 70, 208, 8.5);
  p6.drawTxt('por ação ou omissão da outra Parte, ficará a Parte Infratora obrigada a ressarcir', 70, 222, 8.5);
  p6.drawTxt('integralmente quaisquer danos, prejuízos e lucros cessantes à Parte Inocente, como', 70, 236, 8.5);
  p6.drawTxt('como quaisquer custas judiciais, administrativas e honorários advocatícios.', 70, 250, 8.5);

  p6.drawTxt('8.16. Na hipótese de qualquer questionamento por parte de autoridades públicas ou', 70, 335, 8.5);
  p6.drawTxt('ação judicial relacionada à proteção de dados, as Partes obrigam-se a informar uma à', 70, 349, 8.5);
  p6.drawTxt('outra no prazo de 24 (vinte e quatro horas) tão logo tenha ciência, bem como obrigam-', 70, 363, 8.5);
  p6.drawTxt('se a assumir por sua própria conta a defesa relacionada a esses questionamentos,', 70, 377, 8.5);
  p6.drawTxt('indenizando a Parte Inocente com relação a quaisquer prejuízos, inclusive com relação', 70, 391, 8.5);
  p6.drawTxt('a custas judiciais, administrativas e honorários advocatícios.', 70, 405, 8.5);

  p6.drawTxt('9. Admite-se a rescisão do presente contrato, sem ônus e a qualquer tempo, por parte', 70, 490, 8.5);
  p6.drawTxt('da COMODANTE e por parte da COMODATÁRIA mediante aviso prévio de 03 (tres) dias.', 70, 504, 8.5);

  p6.drawTxt('10. O não cumprimento de qualquer das cláusulas deste contrato implicará na sua', 70, 570, 8.5);
  p6.drawTxt('imediata rescisão, perfeitamente reconhecida pelos contratantes.', 70, 584, 8.5);

  p6.drawTxt('11. Os contratantes elegem o foro da Comarca de Campinas do Estado de São Paulo', 70, 650, 8.5);
  p6.drawTxt('para dirimir dúvidas ou questões oriundas do presente contrato.', 70, 664, 8.5);

  p6.drawTxt('E assim, por estarem justos e contratados, assinam o presente instrumento em 02', 70, 725, 8.5);
  p6.drawTxt('(duas) vias de igual teor, por um só fim, na presença de testemunhas a tudo presentes.', 70, 739, 8.5);

  // Data
  p6.drawTxt('Jundiaí,', 70, 775, 8.5);
  p6.drawHLine(108, 775, 133, 0.6);
  p6.drawTxt('de', 135, 775, 8.5);
  p6.drawHLine(145, 775, 245, 0.6);
  p6.drawTxt('de', 247, 775, 8.5);
  p6.drawHLine(260, 775, 300, 0.6);
  p6.drawTxt('.', 302, 775, 8.5);

  // Pontilhado inferior
  p6.drawTxt('.................................................................................................', 140, 830, 8.5);

  // ===================== PÁGINA 7 =====================
  const page7 = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const p7 = createPageHelpers(page7);

  // Cabeçalho Assinaturas
  p7.drawTxt('CMD GW COMERCIO DE VEÍCULOS AUTOMOTORES LTDA', 120, 85, 9.5, true);
  p7.drawTxt('Comodante', 260, 125, 8.5);

  p7.drawTxt('.................................................................................................', 140, 180, 8.5);
  p7.drawHLine(180, 225, 415, 0.8);
  p7.drawTxt('Comodatária', 256, 250, 8.5);

  // Testemunhas
  p7.drawTxt('Testemunhas:', 70, 300, 8.5);

  p7.drawTxt('..........................................................', 70, 360, 8.5);
  p7.drawTxt('Nome', 70, 385, 8.5);
  p7.drawTxt('RG', 70, 420, 8.5);

  p7.drawTxt('..........................................................', 70, 485, 8.5);
  p7.drawTxt('Nome', 70, 510, 8.5);
  p7.drawTxt('RG', 70, 545, 8.5);

  return await pdfDoc.save();
}

// 8. AUTORIZAÇÃO DE PAGAMENTO
export async function generateMasterAutorizacaoPagamentoPdf(): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const drawTxt = (text: string, x: number, yFromTop: number, size = 9.5, isBold = false, color = darkText) =>
    drawTextHelper(page, fontRegular, fontBold, text, x, yFromTop, size, isBold, color);

  const drawHLine = (x1: number, yFromTop: number, x2: number, width = 0.6, color = lineColor) =>
    drawHLineHelper(page, x1, yFromTop, x2, width, color);

  // --- Title Box ---
  const titleText = 'AUTORIZAÇÃO DE PAGAMENTO';
  const titleWidth = fontBold.widthOfTextAtSize(titleText, 11);
  const boxPaddingX = 14;
  const boxPaddingY = 5;
  const boxWidth = titleWidth + boxPaddingX * 2;
  const boxHeight = 22;
  const boxX = (PAGE_WIDTH - boxWidth) / 2;
  const boxYFromTop = 85;

  // Draw rectangle box for Title
  page.drawRectangle({
    x: boxX,
    y: PAGE_HEIGHT - boxYFromTop - boxHeight,
    width: boxWidth,
    height: boxHeight,
    borderWidth: 0.8,
    borderColor: lineColor,
    color: rgb(1, 1, 1),
  });

  // Draw Title text inside box
  drawTxt(titleText, boxX + boxPaddingX, boxYFromTop + 15, 11, true);

  // --- Paragraph Lines ---
  const leftX = 75;

  // Line 1 (y: 160)
  drawTxt('Eu,', leftX, 160, 9.5);
  drawHLine(92, 160, 436, 0.6);
  drawTxt(', portador (a) da', 438, 160, 9.5);

  // Line 2 (y: 185)
  drawTxt('Cédula de Identidade nº.', leftX, 185, 9.5);
  drawHLine(194, 185, 294, 0.6);
  drawTxt(', inscrito (a) no Cadastro das Pessoas', 296, 185, 9.5);

  // Line 3 (y: 210)
  drawTxt('Físicas do Ministério da Fazenda sob o nº.', leftX, 210, 9.5);
  drawHLine(272, 210, 396, 0.6);
  drawTxt(', na qualidade de', 398, 210, 9.5);

  // Line 4 (y: 235)
  drawTxt('vendedor(a) do veículo baixo descrito, ', leftX, 235, 9.5);
  const w1 = fontRegular.widthOfTextAtSize('vendedor(a) do veículo baixo descrito, ', 9.5);
  drawTxt('Solicito e Autorizo', leftX + w1, 235, 9.5, true);
  const w2 = fontBold.widthOfTextAtSize('Solicito e Autorizo', 9.5);
  drawTxt(' que o valor acertado com a', leftX + w1 + w2, 235, 9.5);

  // Line 5 (y: 260)
  drawTxt('venda de meu veículo seja efetuado diretamente na conta corrente de titularidade da', leftX, 260, 9.5);

  // Line 6 (y: 285)
  drawTxt('empresa, inscrita no CNPJ/MF sob o n.', leftX, 285, 9.5);
  drawHLine(260, 285, 478, 0.6);
  drawTxt(',', 480, 285, 9.5);

  // --- Date Line (y: 338) ---
  drawTxt('São Paulo,', 165, 338, 9.5);
  drawHLine(222, 338, 246, 0.6);
  drawTxt('de', 250, 338, 9.5);
  drawHLine(266, 338, 336, 0.6);
  drawTxt('de', 340, 338, 9.5);
  drawHLine(356, 338, 406, 0.6);
  drawTxt('.', 408, 338, 9.5);

  // --- Signature Line (y: 390) ---
  drawHLine(75, 390, 520, 1.2, darkText);
  drawTxt('Nome do Vendedor:', 235, 408, 9.5);

  return await pdfDoc.save();
}

/**
 * Overlay field values onto the master PDF buffer with exact coordinate transformation
 */
export async function renderDocumentPdf(
  masterPdfBytes: Uint8Array,
  template: DocumentTemplate,
  values?: Record<string, string>
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(masterPdfBytes);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pages = pdfDoc.getPages();
  const safeValues = values || {};

  for (const field of (template?.fields || [])) {
    let rawVal = safeValues[field.field_key];
    
    // Check aliases if exact key is not directly provided
    if (rawVal === undefined || rawVal === null || rawVal === '') {
      if (field.field_key === 'declarante_nome' || field.field_key === 'cliente_nome' || field.field_key === 'proprietario_nome' || field.field_key === 'vendedor_nome') {
        rawVal = safeValues.vendedor_nome || safeValues.declarante_nome || safeValues.cliente_nome || safeValues.proprietario_nome || safeValues.nome_completo || safeValues.nome || '';
      } else if (field.field_key === 'declarante_cpf' || field.field_key === 'cliente_cpf' || field.field_key === 'proprietario_cpf' || field.field_key === 'vendedor_cpf') {
        rawVal = safeValues.vendedor_cpf || safeValues.declarante_cpf || safeValues.cliente_cpf || safeValues.proprietario_cpf || safeValues.cpf || safeValues.cpf_cnpj || '';
      } else if (field.field_key === 'declarante_rg' || field.field_key === 'cliente_rg' || field.field_key === 'vendedor_rg') {
        rawVal = safeValues.vendedor_rg || safeValues.declarante_rg || safeValues.cliente_rg || safeValues.rg || '';
      } else if (field.field_key === 'comprador_nome' || field.field_key === 'empresa_nome') {
        rawVal = safeValues.comprador_nome || safeValues.empresa_nome || safeValues.razao_social || '';
      } else if (field.field_key === 'empresa_cnpj') {
        rawVal = safeValues.empresa_cnpj || safeValues.cnpj || safeValues.comprador_cnpj || '';
      }
    }

    if (!rawVal && rawVal !== '0') continue;

    let textToDraw = String(rawVal).trim();
    if (field.field_type === 'checkbox') {
      const upper = textToDraw.toUpperCase();
      if (upper === 'TRUE' || upper === '1' || upper === 'X' || upper === 'SIM' || upper === 'S' || upper === 'MARCADO') {
        textToDraw = 'X';
      } else {
        continue;
      }
    }

    const pageIndex = Math.max(0, (field.page || 1) - 1);
    if (pageIndex >= pages.length) continue;
    const page = pages[pageIndex];
    const pageHeight = page.getHeight();

    const isBold = field.font_weight === 'bold';
    const font = isBold ? fontBold : fontRegular;

    let fontSize = field.font_size || 9;
    const maxBoxWidth = field.width || 100;
    const minFontSize = 6.0;

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
 * Generate standard clean filename
 */
export function generateFilename(templateName: string, values?: Record<string, string>): string {
  const sanitize = (s: string) =>
    (s || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');

  const safeVals = values || {};
  const nome = sanitize(
    safeVals.declarante_nome ||
    safeVals.cliente_nome ||
    safeVals.proprietario_nome ||
    safeVals.titular_nome ||
    safeVals.empresa_nome ||
    safeVals.nome ||
    'Documento'
  );
  const placa = sanitize(
    safeVals.veiculo_placa ||
    safeVals.usado_placa ||
    safeVals.adquirido_placa ||
    safeVals.placa ||
    ''
  );
  const templateSlug = sanitize(templateName || 'Documento');

  if (placa) {
    return `${templateSlug}_${nome}_${placa}.pdf`;
  }
  return `${templateSlug}_${nome}.pdf`;
}
