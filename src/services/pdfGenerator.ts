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
  drawTxt('Eu,', 80, 150, 8);
  drawHLine(95, 150, 415);
  drawTxt(', inscrito no CPF sob', 418, 150, 8);

  drawTxt('o nº', 80, 164.5, 8);
  drawHLine(97, 164.5, 208);
  drawTxt(', RG. Nº', 210, 164.5, 8);
  drawHLine(248, 164.5, 345);
  drawTxt(', e CNH Nº', 348, 164.5, 8);
  drawHLine(402, 164.5, 475);
  drawTxt(', residente e', 478, 164.5, 8);

  drawTxt('domiciliado na', 80, 179, 8);
  drawHLine(140, 179, 510);
  drawTxt(',', 512, 179, 8);

  drawTxt('CEP', 80, 193.5, 8);
  drawHLine(102, 193.5, 175);
  drawTxt(', Bairro', 178, 193.5, 8);
  drawHLine(210, 193.5, 325);
  drawTxt(', Município de', 328, 193.5, 8);
  drawHLine(385, 193.5, 465);
  drawTxt(', Estado de', 468, 193.5, 8);

  drawHLine(80, 208, 105);
  drawTxt(', Telefone nº (', 108, 208, 8);
  drawHLine(162, 208, 180);
  drawTxt(')', 182, 208, 8);
  drawHLine(188, 208, 288);
  drawTxt(', DECLARO, PARA TODOS OS FINS DE', 292, 208, 7.5, true);

  drawTxt('DIREITO, QUE VENDI, NESTA DATA, O VEÍCULO ABAIXO DESCRITO, DE MINHA PROPRIEDADE,', 80, 222.5, 7.5, true);
  drawTxt('LIVRE E DESEMBARAÇADO DE QUALQUER ÔNUS, a', 80, 237, 7.5, true);
  drawHLine(308, 237, 515);

  drawTxt('inscrita no CNPJ sob o nº', 80, 251.5, 8);
  drawHLine(188, 251.5, 320);
  drawTxt(', transferindo-lhe a posse e propriedade do mesmo,', 325, 251.5, 8);

  drawTxt('bem como toda e qualquer responsabilidade civil e criminal sobre o mesmo.', 80, 266, 8);

  // Linha 1 Veículo
  drawTxt('Marca', 80, 286, 8);
  drawHLine(108, 286, 200);
  drawTxt('Modelo:', 204, 286, 8);
  drawHLine(240, 286, 350);
  drawTxt('Ano/Modelo', 354, 286, 8);
  drawHLine(406, 286, 452);
  drawTxt('/', 454, 286, 8);
  drawTxt('Cor:', 462, 286, 8);
  drawHLine(480, 286, 515);

  // Linha 2 Veículo
  drawTxt('Placa:', 80, 299, 8);
  drawHLine(106, 299, 186);
  drawTxt('Chassi:', 190, 299, 8);
  drawHLine(224, 299, 515);

  // Linha 3 Proprietário
  drawTxt('Proprietário:', 80, 312, 8);
  drawHLine(135, 312, 400);
  drawTxt('CPF:', 404, 312, 8);
  drawHLine(428, 312, 515);

  // Linha 4 Documentos Proprietário
  drawTxt('RG:', 80, 325, 8);
  drawHLine(98, 325, 230);
  drawTxt('UF:', 234, 325, 8);
  drawHLine(250, 325, 280);
  drawTxt('.', 282, 325, 8);

  // --- Termos Legais Fixos ---
  drawTxt('Declaro, ainda, que:', 80, 345, 7.5, true);
  drawTxt('- respondo civil e criminalmente pela procedência do veículo, por sua documentação, e por todos os', 80, 356, 7.2);
  drawTxt('  débitos incidentes sobre o mesmo relativos ao período anterior à data da venda;', 80, 366, 7.2);
  drawTxt('- não há impedimento de qualquer natureza, judicial ou extrajudicial, para a livre alienação do veículo,', 80, 376, 7.2);
  drawTxt('  assumindo inteira responsabilidade por eventuais ações, execuções, penhoras, bloqueios, gravames,', 80, 386, 7.2);
  drawTxt('  dentre outros, anteriores a esta data;', 80, 396, 7.2);
  drawTxt('- autorizo a compradora a proceder a pesquisas e vistorias cautelares sobre o veículo;', 80, 406, 7.2);
  drawTxt('- tenho ciência de que caso seja constatado qualquer vício, adulteração no veículo, problemas em sua', 80, 416, 7.2);
  drawTxt('  documentação, ou qualquer impedimento para a regular transferência de propriedade para a', 80, 426, 7.2);
  drawTxt('  compradora, a negociação será imediatamente desfeita, com a devolução dos valores pagos, sem prejuízo', 80, 436, 7.2);
  drawTxt('  da apuração de perdas e danos;', 80, 446, 7.2);
  drawTxt('- me comprometo a entregar o CRV (Certificado de Registro de Veículo) devidamente preenchido;', 80, 456, 7.2);
  drawTxt('- me comprometo a pagar os valores relativos aos débitos incidentes sobre o veículo relativos a', 80, 466, 7.2);
  drawTxt('  período anterior a esta data, assim que cientificado para tal fim, informando, para tanto, o endereço,', 80, 476, 7.2);
  drawTxt('  telefone e e-mail abaixo, obrigando-me a informar qualquer alteração, ou, de todo modo,', 80, 486, 7.2);
  drawTxt('  autorizando, desde já, a cobrança por meio de instituição financeira, mediante emissão de boleto', 80, 496, 7.2);
  drawTxt('  bancário, bem como, em caso de não pagamento ou não localização para envio da cobrança,', 80, 506, 7.2);
  drawTxt('  protesto e negativação;', 80, 516, 7.2);
  drawTxt('- no caso de serem os débitos quitados pelo comprador, estou ciente de que este ficará sub-rogado no', 80, 526, 7.2);
  drawTxt('  direito ao crédito, ficando expressamente convencionado que, se tiver de promover execução judicial ou', 80, 536, 7.2);
  drawTxt('  cobrança dos valores, estes serão corrigidos e acrescidos de juros moratórios de 1% (um por cento) ao', 80, 546, 7.2);
  drawTxt('  mês.', 80, 556, 7.2);

  // --- Data ---
  drawTxt('Por ser verdade, firmo o presente.', 80, 570, 7.5, true);
  drawTxt('Campinas,', 80, 584, 8);
  drawHLine(124, 584, 150);
  drawTxt('de', 154, 584, 8);
  drawHLine(166, 584, 242);
  drawTxt('de 20', 246, 584, 8);
  drawHLine(266, 584, 288);
  drawTxt('.', 290, 584, 8);

  // Assinatura Proprietário
  drawHLine(80, 618, 280, 0.6);
  drawTxt('Proprietário (RECONHECER POR AUTENTICIDADE)', 80, 630, 7.5, true);

  // Box Bottom: Comunicações e Cobranças
  page.drawRectangle({
    x: 75,
    y: PAGE_HEIGHT - 775,
    width: 440,
    height: 130,
    borderColor: lineColor,
    borderWidth: 0.6,
  });

  drawTxt('DADOS PARA EVENTUAIS COMUNICAÇÕES E COBRANÇAS RELATIVAS AO VEÍCULO AQUI', 80, 655, 7.2, true);
  drawTxt('DESCRITO (não serão utilizados em hipótese alguma para outra finalidade)', 80, 665, 7.2, true);
  drawHLine(75, 668, 515, 0.6);

  drawTxt('Endereço residencial:', 80, 680, 7.5, true);
  drawHLine(168, 680, 510);

  drawTxt('Endereço comercial:', 80, 695, 7.5, true);
  drawHLine(165, 695, 510);

  drawTxt('Telefone com DDD:', 80, 710, 7.5, true);
  drawHLine(155, 710, 315);
  drawTxt('WhatsApp:', 320, 710, 7.5, true);
  drawHLine(368, 710, 510);

  drawTxt('e-mails:', 80, 725, 7.5, true);
  drawHLine(115, 725, 510);

  drawTxt('Principal condutor:', 80, 740, 7.5, true);
  drawHLine(152, 740, 510);

  drawTxt('CNH do principal condutor:', 80, 755, 7.5, true);
  drawHLine(182, 755, 342);
  drawTxt('CPF:', 346, 755, 7.5, true);
  drawHLine(368, 755, 510);

  drawTxt('*arquivar cópia dos documentos e comprovantes', 80, 767, 6);

  // Assinatura Declarante
  drawHLine(210, 792, 385, 0.6);
  drawTxt('Nome e assinatura do declarante', 228, 802, 7.5, true);

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
  drawHLine(308, 295, 506, 0.6);
  drawTxt('.', 508, 295, 9.5);

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

  const boxX = 60;
  const boxWidth = 475;
  const splitColX = 82;

  // 1. Moldura externa com cantos arredondados cobrindo toda a página
  // Desenha moldura perimetral precisa
  const frameX = 45;
  const frameY = 32;
  const frameW = PAGE_WIDTH - 90;
  const frameH = PAGE_HEIGHT - 64;
  const cornerR = 24;

  // Top line (interrompida no centro para o badge)
  page.drawLine({
    start: { x: frameX + cornerR, y: PAGE_HEIGHT - frameY },
    end: { x: 175, y: PAGE_HEIGHT - frameY },
    thickness: 1.0,
    color: lineColor,
  });
  page.drawLine({
    start: { x: 420, y: PAGE_HEIGHT - frameY },
    end: { x: frameX + frameW - cornerR, y: PAGE_HEIGHT - frameY },
    thickness: 1.0,
    color: lineColor,
  });
  // Right line
  page.drawLine({
    start: { x: frameX + frameW, y: PAGE_HEIGHT - (frameY + cornerR) },
    end: { x: frameX + frameW, y: frameY + cornerR },
    thickness: 1.0,
    color: lineColor,
  });
  // Bottom line
  page.drawLine({
    start: { x: frameX + cornerR, y: frameY },
    end: { x: frameX + frameW - cornerR, y: frameY },
    thickness: 1.0,
    color: lineColor,
  });
  // Left line
  page.drawLine({
    start: { x: frameX, y: PAGE_HEIGHT - (frameY + cornerR) },
    end: { x: frameX, y: frameY + cornerR },
    thickness: 1.0,
    color: lineColor,
  });

  // Arcos dos 4 cantos da moldura externa
  const drawCornerArc = (cx: number, cy: number, startAngle: number) => {
    const steps = 10;
    for (let i = 0; i < steps; i++) {
      const a1 = startAngle + (i * Math.PI) / (2 * steps);
      const a2 = startAngle + ((i + 1) * Math.PI) / (2 * steps);
      page.drawLine({
        start: { x: cx + cornerR * Math.cos(a1), y: cy + cornerR * Math.sin(a1) },
        end: { x: cx + cornerR * Math.cos(a2), y: cy + cornerR * Math.sin(a2) },
        thickness: 1.0,
        color: lineColor,
      });
    }
  };
  drawCornerArc(frameX + cornerR, PAGE_HEIGHT - (frameY + cornerR), Math.PI / 2); // Top-Left
  drawCornerArc(frameX + frameW - cornerR, PAGE_HEIGHT - (frameY + cornerR), 0); // Top-Right
  drawCornerArc(frameX + frameW - cornerR, frameY + cornerR, (3 * Math.PI) / 2); // Bottom-Right
  drawCornerArc(frameX + cornerR, frameY + cornerR, Math.PI); // Bottom-Left

  // 2. Title Pill Badge no topo
  const badgeW = 240;
  const badgeH = 22;
  const badgeX = (PAGE_WIDTH - badgeW) / 2;
  const badgeY = frameY - 11;

  page.drawRectangle({
    x: badgeX,
    y: PAGE_HEIGHT - (badgeY + badgeH),
    width: badgeW,
    height: badgeH,
    color: rgb(1, 1, 1), // fundo branco
    borderColor: lineColor,
    borderWidth: 1.0,
  });
  drawTxt('DECLARAÇÃO DE DAÇÃO EM PAGAMENTO DE VEÍCULO', badgeX + 10, badgeY + 15, 8.5, true);

  // 3. BOX 1: PROPRIETÁRIO
  const b1Y = 70;
  const b1H = 66;
  page.drawRectangle({
    x: boxX,
    y: PAGE_HEIGHT - (b1Y + b1H),
    width: boxWidth,
    height: b1H,
    borderColor: lineColor,
    borderWidth: 0.8,
  });
  // Linha vertical do identificador
  page.drawLine({
    start: { x: splitColX, y: PAGE_HEIGHT - b1Y },
    end: { x: splitColX, y: PAGE_HEIGHT - (b1Y + b1H) },
    thickness: 0.8,
    color: lineColor,
  });
  // Texto vertical 'proprietário'
  page.drawText('proprietário', {
    x: 74,
    y: PAGE_HEIGHT - (b1Y + 58),
    size: 7.5,
    font: fontBold,
    color: darkText,
    rotate: { type: 'degrees' as any, angle: 90 },
  });

  // Linhas horizontais e verticais internas do Box 1
  drawHLine(splitColX, b1Y + 22, boxX + boxWidth, 0.6);
  drawHLine(splitColX, b1Y + 44, boxX + boxWidth, 0.6);

  // Linhas verticais separadoras
  page.drawLine({
    start: { x: 310, y: PAGE_HEIGHT - (b1Y + 22) },
    end: { x: 310, y: PAGE_HEIGHT - (b1Y + 44) },
    thickness: 0.6,
    color: lineColor,
  });
  page.drawLine({
    start: { x: 310, y: PAGE_HEIGHT - (b1Y + 44) },
    end: { x: 310, y: PAGE_HEIGHT - (b1Y + b1H) },
    thickness: 0.6,
    color: lineColor,
  });

  // Labels Box 1
  drawTxt('Eu,', splitColX + 5, b1Y + 15, 8);
  drawTxt('portador do RG nº:', splitColX + 5, b1Y + 36, 8);
  drawTxt('e do CPF nº', 315, b1Y + 36, 8);
  drawTxt('Estado Civil', splitColX + 5, b1Y + 58, 8);
  drawTxt('Profissão:', 315, b1Y + 58, 8);

  // 4. Section 1 Header
  drawTxt('DECLARO sob minha total responsabilidade dar em pagamento o veículo', boxX, b1Y + b1H + 13, 8, true);

  // 5. BOX 2: VEÍCULO USADO
  const b2Y = b1Y + b1H + 18;
  const b2H = 46;
  page.drawRectangle({
    x: boxX,
    y: PAGE_HEIGHT - (b2Y + b2H),
    width: boxWidth,
    height: b2H,
    borderColor: lineColor,
    borderWidth: 0.8,
  });
  page.drawLine({
    start: { x: splitColX, y: PAGE_HEIGHT - b2Y },
    end: { x: splitColX, y: PAGE_HEIGHT - (b2Y + b2H) },
    thickness: 0.8,
    color: lineColor,
  });
  page.drawText('veículo usado', {
    x: 74,
    y: PAGE_HEIGHT - (b2Y + 42),
    size: 7,
    font: fontBold,
    color: darkText,
    rotate: { type: 'degrees' as any, angle: 90 },
  });

  drawHLine(splitColX, b2Y + 23, boxX + boxWidth, 0.6);
  // Verticais na linha 1 do usado
  page.drawLine({
    start: { x: 195, y: PAGE_HEIGHT - b2Y },
    end: { x: 195, y: PAGE_HEIGHT - (b2Y + 23) },
    thickness: 0.6,
    color: lineColor,
  });
  page.drawLine({
    start: { x: 310, y: PAGE_HEIGHT - b2Y },
    end: { x: 310, y: PAGE_HEIGHT - (b2Y + 23) },
    thickness: 0.6,
    color: lineColor,
  });

  drawTxt('Placa:', splitColX + 5, b2Y + 15, 8);
  drawTxt('Ano Fabricação:', 200, b2Y + 15, 8);
  drawTxt('Marca', 315, b2Y + 15, 8);
  drawTxt('Chassi:', splitColX + 5, b2Y + 38, 8);

  // 6. Section 2 Header
  drawTxt('objetivando realizar o pagamento parcial do veículo', boxX, b2Y + b2H + 13, 8, true);

  // 7. BOX 3: VEÍCULO ADQUIRIDO
  const b3Y = b2Y + b2H + 18;
  const b3H = 46;
  page.drawRectangle({
    x: boxX,
    y: PAGE_HEIGHT - (b3Y + b3H),
    width: boxWidth,
    height: b3H,
    borderColor: lineColor,
    borderWidth: 0.8,
  });
  page.drawLine({
    start: { x: splitColX, y: PAGE_HEIGHT - b3Y },
    end: { x: splitColX, y: PAGE_HEIGHT - (b3Y + b3H) },
    thickness: 0.8,
    color: lineColor,
  });
  page.drawText('veículo adquirido', {
    x: 74,
    y: PAGE_HEIGHT - (b3Y + 44),
    size: 6.8,
    font: fontBold,
    color: darkText,
    rotate: { type: 'degrees' as any, angle: 90 },
  });

  drawHLine(splitColX, b3Y + 23, boxX + boxWidth, 0.6);
  page.drawLine({
    start: { x: 195, y: PAGE_HEIGHT - b3Y },
    end: { x: 195, y: PAGE_HEIGHT - (b3Y + 23) },
    thickness: 0.6,
    color: lineColor,
  });
  page.drawLine({
    start: { x: 310, y: PAGE_HEIGHT - b3Y },
    end: { x: 310, y: PAGE_HEIGHT - (b3Y + 23) },
    thickness: 0.6,
    color: lineColor,
  });

  drawTxt('Placa:', splitColX + 5, b3Y + 15, 8);
  drawTxt('Ano:', 200, b3Y + 15, 8);
  drawTxt('Marca / Modelo:', 315, b3Y + 15, 8);
  drawTxt('Chassi:', splitColX + 5, b3Y + 38, 8);

  // 8. BOX 4: COMPRADOR
  const b4Y = b3Y + b3H + 6;
  const b4H = 22;
  page.drawRectangle({
    x: boxX,
    y: PAGE_HEIGHT - (b4Y + b4H),
    width: boxWidth,
    height: b4H,
    borderColor: lineColor,
    borderWidth: 0.8,
  });
  page.drawLine({
    start: { x: 195, y: PAGE_HEIGHT - b4Y },
    end: { x: 195, y: PAGE_HEIGHT - (b4Y + b4H) },
    thickness: 0.8,
    color: lineColor,
  });
  drawTxt('neste ato adquirido por', boxX + 10, b4Y + 15, 8, true);
  drawTxt('Comprador:', 200, b4Y + 15, 8);

  // 9. Legal Paragraphs
  const legY = b4Y + b4H + 14;
  drawTxt(', que conjuntamente assume ampla responsabilidade solidária e é autorizado a receber eventuais valores provenientes da', boxX, legY, 7.3);
  drawTxt('negociação junto à DAHRUJ MOTORS LTDA , seja a que título for.', boxX, legY + 11, 7.3);

  drawTxt('Declaro, também, sob as penas da lei, que o veículo objeto da dação em pagamento se encontra totalmente livre e desembaraçado', boxX, legY + 26, 7.3);
  drawTxt('de quaisquer ônus, dívida real, pessoal, fiscal ou extrajudicial, penhora, arresto ou sequestro, ou ainda restrições ou constrições de', boxX, legY + 37, 7.3);
  drawTxt('qualquer natureza, em especial em razão de qualquer processo judicial.', boxX, legY + 48, 7.3);

  drawTxt('Assumo em meu nome, pelo veículo dado em pagamento, a mais ampla e irrestrita responsabilidade, especialmente, mas não', boxX, legY + 63, 7.3);
  drawTxt('limitado, quanto aos seguintes ônus:', boxX, legY + 74, 7.3);

  // Bullet 1
  page.drawCircle({ x: boxX + 12, y: PAGE_HEIGHT - (legY + 95), size: 2.2, color: darkText });
  drawTxt('Débito ou dívida direta ou indireta contraída por mim e que pese ou venha a pesar sobre o mesmo; multas de', boxX + 22, legY + 92, 7.3, true);
  drawTxt('trânsito de qualquer gravidade e ou valor que tenham sido geradas até a presente data;', boxX + 22, legY + 103, 7.3, true);

  // Bullet 2
  page.drawCircle({ x: boxX + 12, y: PAGE_HEIGHT - (legY + 121), size: 2.2, color: darkText });
  drawTxt('Penhora, arrestos, sequestros ou quaisquer outras constrições que possam vir a pesar sobre o veículo, seja a', boxX + 22, legY + 118, 7.3, true);
  drawTxt('que título ou tempo for, decorrente ou não de processo judicial;', boxX + 22, legY + 129, 7.3, true);

  // Bullet 3
  page.drawCircle({ x: boxX + 12, y: PAGE_HEIGHT - (legY + 147), size: 2.2, color: darkText });
  drawTxt('Toda e qualquer responsabilidade civil ou criminal.', boxX + 22, legY + 144, 7.3, true);

  // Long legal paragraph
  const pY = legY + 162;
  drawTxt('Em recaindo sobre o veículo qualquer tipo de cobrança (judicial ou extrajudicial) ou qualquer tipo de constrição judicial e ou', boxX, pY, 7.1);
  drawTxt('administrativa, que venha de qualquer forma, ainda que parcialmente, comprometer ou limitar sua plena, livre e ilimitada', boxX, pY + 10, 7.1);
  drawTxt('disposição, utilização ou comercialização, obrigo-me a adotar todas as providências necessárias e indicadas para sua IMEDIATA', boxX, pY + 20, 7.1);
  drawTxt('liberação e completa isenção de responsabilidade da DAHRUJ MOTORS LTDA, seja pagando a integridade do débito, seja através de', boxX, pY + 30, 7.1);
  drawTxt('qualquer outro meio eficaz, providências estas que deverão ocorrer dentro de um prazo máximo de 24 horas da efetivação da', boxX, pY + 40, 7.1);
  drawTxt('cientificação, o que ocorrerá por qualquer meio de comunicação, sob pena de responder por todas as perdas e danos decorrentes, além', boxX, pY + 50, 7.1);
  drawTxt('de multa diária ora estabelecida no valor de R$1.000,00(hum mil reais), além de juros mensais de 1%, correção monetária com base', boxX, pY + 60, 7.1);
  drawTxt('no índice CDI e honorários advocatícios de 20% se necessária providência judicial. Pelas obrigações acima assumidas, ofereço ainda', boxX, pY + 70, 7.1);
  drawTxt('ampla garantia fidejussória. Estas obrigações constituem-se em direito líquido, certo e exigível da DAHRUJ MOTORS LTDA , podendo', boxX, pY + 80, 7.1);
  drawTxt('ser exercido através de ação executiva.', boxX, pY + 90, 7.1);

  // 10. Date Box
  const dateBoxX = 295;
  const dateBoxY = pY + 106;
  const dateBoxW = 240;
  const dateBoxH = 19;
  page.drawRectangle({
    x: dateBoxX,
    y: PAGE_HEIGHT - (dateBoxY + dateBoxH),
    width: dateBoxW,
    height: dateBoxH,
    borderColor: lineColor,
    borderWidth: 0.7,
  });
  drawTxt('Data:', dateBoxX + 4, dateBoxY + 8, 5.5);
  drawTxt('Campinas,', dateBoxX + 22, dateBoxY + 13, 7.5);

  // 11. Signature Block
  const sigY = dateBoxY + 58;
  drawHLine(145, sigY, 395, 0.8);
  drawTxt('Assinatura - do proprietário', 215, sigY + 12, 8.5, true);
  drawTxt('reconhecer por autenticidade', 222, sigY + 22, 7.2);

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
      if (field.field_key === 'declarante_nome' || field.field_key === 'cliente_nome' || field.field_key === 'proprietario_nome') {
        rawVal = safeValues.declarante_nome || safeValues.cliente_nome || safeValues.proprietario_nome || safeValues.nome_completo || safeValues.nome || '';
      } else if (field.field_key === 'declarante_cpf' || field.field_key === 'cliente_cpf' || field.field_key === 'proprietario_cpf') {
        rawVal = safeValues.declarante_cpf || safeValues.cliente_cpf || safeValues.proprietario_cpf || safeValues.cpf || safeValues.cpf_cnpj || '';
      } else if (field.field_key === 'comprador_nome' || field.field_key === 'empresa_nome') {
        rawVal = safeValues.comprador_nome || safeValues.empresa_nome || safeValues.razao_social || '';
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
