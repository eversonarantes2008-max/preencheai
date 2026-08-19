import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const PORT = 3000;

// Memory log buffer for diagnostics
interface ServerLogEntry {
  id: string;
  timestamp: string;
  level: "info" | "warn" | "error" | "build";
  message: string;
  category: "system" | "api" | "gemini" | "build";
}

const serverLogs: ServerLogEntry[] = [
  {
    id: "init-1",
    timestamp: new Date().toISOString(),
    level: "info",
    category: "system",
    message: "Servidor Preenchendo AI inicializado na porta 3000.",
  },
  {
    id: "init-2",
    timestamp: new Date().toISOString(),
    level: "build",
    category: "build",
    message: "Verificação de artefatos estáticos e suporte SSR/API ativo.",
  }
];

function logEvent(level: "info" | "warn" | "error" | "build", category: "system" | "api" | "gemini" | "build", message: string) {
  const entry: ServerLogEntry = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    level,
    category,
    message,
  };
  serverLogs.unshift(entry);
  if (serverLogs.length > 50) {
    serverLogs.pop();
  }
}

async function startServer() {
  const app = express();

  // Middleware for request logging into diagnostics
  app.use((req, _res, next) => {
    if (req.path.startsWith("/api") && req.path !== "/api/diagnostics") {
      logEvent("info", "api", `Requisição recebida: ${req.method} ${req.path}`);
    }
    next();
  });

  // Support JSON and base64 document payloads
  app.use(express.json({ limit: "25mb" }));
  app.use(express.urlencoded({ extended: true, limit: "25mb" }));

  // Initialize Gemini AI lazily
  let aiClient: GoogleGenAI | null = null;
  function getAI() {
    if (!aiClient) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not configured");
      }
      aiClient = new GoogleGenAI({ apiKey });
    }
    return aiClient;
  }

  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      service: "PREENCHENDO AI API",
      timestamp: new Date().toISOString(),
    });
  });

  // Diagnostic Endpoint for Deployment Status, Logs, and Env Config
  app.get("/api/diagnostics", (_req, res) => {
    try {
      const distDir = path.resolve(process.cwd(), "dist");
      const distServer = path.resolve(distDir, "server.cjs");
      const distIndex = path.resolve(distDir, "index.html");

      const hasDist = fs.existsSync(distDir);
      const hasServerBundle = fs.existsSync(distServer);
      const hasIndexHtml = fs.existsSync(distIndex);

      let distFilesCount = 0;
      if (hasDist) {
        try {
          distFilesCount = fs.readdirSync(distDir).length;
        } catch (_) {}
      }

      const apiKey = process.env.GEMINI_API_KEY || "";
      const isApiKeyConfigured = Boolean(apiKey && apiKey.trim().length > 5);

      const mem = process.memoryUsage();

      res.json({
        success: true,
        deploymentStatus: {
          appStatus: "ONLINE",
          ingressPort: PORT,
          portConfigured: "3000 (Fixo Ingress)",
          runtimeMode: process.env.NODE_ENV === "production" ? "Produção (Cloud Run/Nginx)" : "Desenvolvimento",
          uptimeSeconds: Math.floor(process.uptime()),
          nodeVersion: process.version,
          platform: process.platform,
          timestamp: new Date().toISOString(),
        },
        environmentConfig: [
          {
            key: "PORT",
            configured: true,
            currentValue: "3000",
            status: "OK",
            description: "Porta padrão de Ingress do Google Cloud Run / Nginx",
          },
          {
            key: "NODE_ENV",
            configured: true,
            currentValue: process.env.NODE_ENV || "development",
            status: "OK",
            description: "Modo de execução da aplicação",
          },
          {
            key: "GEMINI_API_KEY",
            configured: isApiKeyConfigured,
            currentValue: isApiKeyConfigured ? `Configurado (${apiKey.slice(0, 4)}...${apiKey.slice(-4)})` : "Não detectada (utilizando heurística offline inteligente)",
            status: isApiKeyConfigured ? "OK" : "AVISO",
            description: "Chave da API do Google Gemini para IA generativa avançada",
          },
          {
            key: "DISABLE_HMR",
            configured: Boolean(process.env.DISABLE_HMR),
            currentValue: process.env.DISABLE_HMR || "não definido",
            status: "OK",
            description: "Variável do container AI Studio para controle de hot-reload",
          },
        ],
        buildArtifacts: {
          distFolder: hasDist,
          serverBundle: hasServerBundle,
          indexHtml: hasIndexHtml,
          distFilesCount,
          buildReady: hasDist && hasIndexHtml,
          lastBuildCheck: new Date().toISOString(),
        },
        serverLogs,
        systemMetrics: {
          rssMb: (mem.rss / (1024 * 1024)).toFixed(1),
          heapUsedMb: (mem.heapUsed / (1024 * 1024)).toFixed(1),
          heapTotalMb: (mem.heapTotal / (1024 * 1024)).toFixed(1),
        },
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err?.message || "Erro ao consultar diagnósticos",
      });
    }
  });

  // Smart Data Extraction via Gemini AI (Document Intelligence)
  app.post("/api/extract", async (req, res) => {
    try {
      const { text, imageBase64, mimeType, templateFields } = req.body;

      if (!text && !imageBase64) {
        return res.status(400).json({ error: "Nenhum texto ou arquivo fornecido para extração." });
      }

      const fieldList = Array.isArray(templateFields) && templateFields.length > 0
        ? templateFields.map((f: any) => `- ${f.field_key} (${f.label}): tipo ${f.field_type}`).join("\n")
        : `
- declarante_nome (Nome do declarante)
- declarante_cpf (CPF do declarante)
- declarante_rg (RG do declarante)
- declarante_cnh (CNH do declarante)
- declarante_endereco (Endereço do declarante)
- declarante_cep (CEP do declarante)
- declarante_bairro (Bairro do declarante)
- declarante_municipio (Município do declarante)
- declarante_estado (Estado/UF do declarante)
- declarante_telefone (Telefone do declarante)
- comprador_nome (Nome do comprador)
- comprador_cnpj (CNPJ do comprador)
- veiculo_marca (Marca do veículo)
- veiculo_modelo (Modelo do veículo)
- veiculo_ano (Ano de fabricação)
- veiculo_modelo_ano (Ano do modelo)
- veiculo_cor (Cor do veículo)
- veiculo_placa (Placa do veículo)
- veiculo_chassi (Chassi do veículo)
- proprietario_nome (Nome do proprietário anterior)
- proprietario_rg (RG do proprietário)
- proprietario_rg_uf (UF do RG)
- proprietario_cpf (CPF do proprietário)
- endereco_residencial (Endereço residencial de cobrança)
- endereco_comercial (Endereço comercial)
- telefone_comunicacao (Telefone para comunicações)
- whatsapp (WhatsApp)
- email (E-mail)
- principal_condutor (Nome do principal condutor)
- cnh_principal_condutor (CNH do condutor)
- cpf_principal_condutor (CPF do condutor)
- data_dia (Dia atual)
- data_mes (Mês por extenso ou número)
- data_ano (Ano com 2 ou 4 dígitos)
`;

      const prompt = `Você é um motor de Inteligência Documental (Document Intelligence) para o sistema PREENCHENDO AI.
Sua missão é analisar os dados de entrada (texto, CNH, CRLV, ficha cadastral ou formulário) e extrair com rigor as informações para preencher os campos do documento.

Campos alvo a identificar:
${fieldList}

REGRAS DE FORMATAÇÃO E CONFIANÇA:
1. Para cada campo identificado, retorne o valor limpo e apropriado.
2. Atribua uma pontuação de confiança (confidence) de 0 a 100 para cada campo.
3. Se um campo não puder ser determinado com segurança, retorne confidence abaixo de 50 ou deixe null.
4. Formate placas no padrão Mercosul (ex: ABC1D23) ou tradicional (ABC1234).
5. Formate CPF com 11 dígitos numéricos ou pontuado.
6. Formate Chassi em letras maiúsculas (17 caracteres).
7. Para a data, se não informada explicitamente, forneça a data de hoje (${new Date().toLocaleDateString('pt-BR')}) com alta confiança.

Retorne EXCLUSIVAMENTE um objeto JSON válido no seguinte formato:
{
  "fields": {
    "declarante_nome": { "value": "João da Silva", "confidence": 98 },
    "declarante_cpf": { "value": "123.456.789-00", "confidence": 99 },
    ...
  },
  "summary": "Resumo das informações extraídas com sucesso",
  "warnings": ["Aviso sobre campo duvidoso se houver"]
}`;

      try {
        const ai = getAI();
        const parts: any[] = [];

        if (imageBase64) {
          parts.push({
            inlineData: {
              data: imageBase64.replace(/^data:[^;]+;base64,/, ""),
              mimeType: mimeType || "image/jpeg",
            },
          });
        }

        if (text) {
          parts.push({ text: `Texto bruto para análise:\n${text}` });
        }

        parts.push({ text: prompt });

        const response = await ai.models.generateContent({
          model: "gemini-3.7-flash",
          contents: parts,
          config: {
            responseMimeType: "application/json",
          },
        });

        const responseText = response.text || "{}";
        const parsed = JSON.parse(responseText);
        return res.json(parsed);
      } catch (geminiError: any) {
        console.warn("Gemini API call failed or missing key, using intelligent regex extraction fallback:", geminiError?.message);
        
        // Intelligent local regex heuristic fallback
        const fallbackResults = extractViaHeuristics(text || "");
        return res.json(fallbackResults);
      }
    } catch (error: any) {
      console.error("Error in /api/extract:", error);
      res.status(500).json({ error: error?.message || "Falha interna ao processar extração." });
    }
  });

  // Auto-detection of fields for "ENSINAR DOCUMENTO"
  app.post("/api/detect-fields", async (req, res) => {
    try {
      const { textContent, pageInfo } = req.body;
      const ai = getAI();

      const prompt = `Você é um especialista em OCR e análise de layout de documentos em PDF para o PREENCHENDO AI.
Analise a estrutura deste documento para sugerir o mapeamento de campos editáveis (coordenadas relativas, labels, chaves e tipos).

Dimensões da página: Largura ${pageInfo?.width || 595.32}, Altura ${pageInfo?.height || 841.92}.
Texto / Estrutura encontrada no PDF:
${textContent || "Documento com lacunas para preenchimento de dados pessoais e veiculares"}

Retorne um JSON com a lista de sugestões de campos:
{
  "detected_fields": [
    {
      "field_key": "campo_identificado",
      "label": "Rótulo amigável",
      "field_type": "text|cpf|cnpj|rg|cnh|phone|whatsapp|email|cep|plate|chassis|date|number|textarea",
      "page": 1,
      "x": 100,
      "y": 200,
      "width": 200,
      "height": 18,
      "confidence": 95,
      "required": true,
      "group": "declarante|comprador|veiculo|proprietario|comunicacoes|data|outros"
    }
  ],
  "document_title": "Título sugerido do documento",
  "document_type": "termo|contrato|declaracao|recibo|outro"
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: [{ text: prompt }],
        config: {
          responseMimeType: "application/json",
        },
      });

      const parsed = JSON.parse(response.text || "{}");
      res.json(parsed);
    } catch (error: any) {
      console.warn("Fallback detection triggered:", error?.message);
      res.json({
        detected_fields: [],
        document_title: "Documento Personalizado",
        document_type: "termo",
        fallback: true,
      });
    }
  });

  // Vite middleware in dev or static dist serving in prod
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`PREENCHENDO AI Server listening on http://0.0.0.0:${PORT}`);
  });
}

// Robust fallback heuristic parser for offline or instant pre-fill
function extractViaHeuristics(rawText: string) {
  const fields: Record<string, { value: string; confidence: number }> = {};
  const clean = rawText || "";

  // CPF
  const cpfMatch = clean.match(/\b(\d{3}\.?\d{3}\.?\d{3}-?\d{2})\b/);
  if (cpfMatch) {
    fields.declarante_cpf = { value: cpfMatch[1], confidence: 95 };
  }

  // CNPJ
  const cnpjMatch = clean.match(/\b(\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2})\b/);
  if (cnpjMatch) {
    fields.comprador_cnpj = { value: cnpjMatch[1], confidence: 95 };
  }

  // Placa
  const placaMatch = clean.match(/\b([A-Z]{3}-?[0-9][A-Z0-9][0-9]{2})\b/i);
  if (placaMatch) {
    fields.veiculo_placa = { value: placaMatch[1].toUpperCase(), confidence: 92 };
  }

  // CEP
  const cepMatch = clean.match(/\b(\d{5}-?\d{3})\b/);
  if (cepMatch) {
    fields.declarante_cep = { value: cepMatch[1], confidence: 90 };
  }

  // Phone
  const phoneMatch = clean.match(/\b(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?(?:9?\d{4}[-\s]?\d{4})\b/);
  if (phoneMatch) {
    fields.declarante_telefone = { value: phoneMatch[0], confidence: 85 };
  }

  // Email
  const emailMatch = clean.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
  if (emailMatch) {
    fields.email = { value: emailMatch[0], confidence: 95 };
  }

  // Current Date
  const now = new Date();
  fields.data_dia = { value: String(now.getDate()).padStart(2, "0"), confidence: 100 };
  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];
  fields.data_mes = { value: months[now.getMonth()], confidence: 100 };
  fields.data_ano = { value: String(now.getFullYear()), confidence: 100 };

  return {
    fields,
    summary: "Dados identificados via motor heurístico de extração documental.",
    warnings: [],
  };
}

startServer();
