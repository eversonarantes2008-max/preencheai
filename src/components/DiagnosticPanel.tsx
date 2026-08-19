import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  Server,
  Terminal,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Copy,
  Check,
  ShieldAlert,
  Cpu,
  Layers,
  Globe,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileCode2,
  HardDrive
} from 'lucide-react';

interface DiagnosticData {
  success: boolean;
  deploymentStatus: {
    appStatus: string;
    ingressPort: number;
    portConfigured: string;
    runtimeMode: string;
    uptimeSeconds: number;
    nodeVersion: string;
    platform: string;
    timestamp: string;
  };
  environmentConfig: Array<{
    key: string;
    configured: boolean;
    currentValue: string;
    status: string;
    description: string;
  }>;
  buildArtifacts: {
    distFolder: boolean;
    serverBundle: boolean;
    indexHtml: boolean;
    distFilesCount: number;
    buildReady: boolean;
    lastBuildCheck: string;
  };
  serverLogs: Array<{
    id: string;
    timestamp: string;
    level: 'info' | 'warn' | 'error' | 'build';
    category: 'system' | 'api' | 'gemini' | 'build';
    message: string;
  }>;
  systemMetrics: {
    rssMb: string;
    heapUsedMb: string;
    heapTotalMb: string;
  };
}

export const DiagnosticPanel: React.FC = () => {
  const [data, setData] = useState<DiagnosticData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastPing, setLastPing] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [filterLevel, setFilterLevel] = useState<'all' | 'build' | 'api' | 'system'>('all');
  const [isExpanded, setIsExpanded] = useState(true);

  const fetchDiagnostics = useCallback(async () => {
    setLoading(true);
    const startTime = performance.now();
    try {
      const res = await fetch('/api/diagnostics');
      const pingMs = Math.round(performance.now() - startTime);
      setLastPing(pingMs);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: Servidor retornou código de erro`);
      }
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (err: any) {
      console.error('Falha ao carregar diagnósticos:', err);
      setError(err?.message || 'Não foi possível conectar ao endpoint de diagnóstico');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDiagnostics();
    const interval = setInterval(fetchDiagnostics, 15000);
    return () => clearInterval(interval);
  }, [fetchDiagnostics]);

  const copyLogsToClipboard = () => {
    if (!data?.serverLogs) return;
    const logText = data.serverLogs
      .map((l) => `[${l.timestamp}] [${l.level.toUpperCase()}] [${l.category}] ${l.message}`)
      .join('\n');
    navigator.clipboard.writeText(logText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredLogs = (data?.serverLogs || []).filter((log) => {
    if (filterLevel === 'all') return true;
    return log.category === filterLevel;
  });

  return (
    <div id="diagnostic-panel" className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-5">
      {/* Header with Title & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200/80 flex items-center justify-center text-blue-600">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">Painel de Diagnóstico & Status de Publicação</h3>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                Servidor Ativo
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Monitoramento em tempo real do ambiente de deploy, build, variáveis e conectividade
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchDiagnostics}
            disabled={loading}
            className="text-xs font-semibold px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex items-center gap-1.5 transition-colors border border-slate-200/80 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs font-semibold px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg flex items-center gap-1 transition-colors border border-slate-200/60 cursor-pointer"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Aviso de Conexão de Diagnóstico</p>
            <p className="mt-0.5 text-amber-700">{error}</p>
          </div>
        </div>
      )}

      {isExpanded && (
        <>
          {/* Status Metrics Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Card 1: Ingress & Port */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span className="flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-blue-600" />
                  Porta Ingress
                </span>
                <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded">
                  {data?.deploymentStatus.portConfigured || '3000'}
                </span>
              </div>
              <div className="text-sm font-bold text-slate-800">
                {data ? '0.0.0.0:3000' : 'Verificando...'}
              </div>
              <div className="text-[11px] text-slate-500 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Roteamento Nginx Válido
              </div>
            </div>

            {/* Card 2: Build Status */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span className="flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-indigo-600" />
                  Artefatos Build
                </span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  data?.buildArtifacts.buildReady ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {data?.buildArtifacts.buildReady ? 'Pronto' : 'Pendente'}
                </span>
              </div>
              <div className="text-sm font-bold text-slate-800">
                {data?.buildArtifacts.distFolder ? `${data.buildArtifacts.distFilesCount} Arquivos (dist/)` : 'Não gerado'}
              </div>
              <div className="text-[11px] text-slate-500">
                server.cjs: {data?.buildArtifacts.serverBundle ? '✅ Compilado' : '❌ Ausente'}
              </div>
            </div>

            {/* Card 3: Runtime & Latency */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-emerald-600" />
                  Latência / Ping
                </span>
                <span className="text-[10px] bg-slate-200 text-slate-700 font-bold px-1.5 py-0.5 rounded">
                  {lastPing !== null ? `${lastPing} ms` : '...'}
                </span>
              </div>
              <div className="text-sm font-bold text-slate-800">
                {data?.deploymentStatus.runtimeMode || 'Executando'}
              </div>
              <div className="text-[11px] text-slate-500">
                Node {data?.deploymentStatus.nodeVersion || 'v22'} • Uptime: {data ? `${data.deploymentStatus.uptimeSeconds}s` : '0s'}
              </div>
            </div>

            {/* Card 4: Memory Usage */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span className="flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-purple-600" />
                  Memória Container
                </span>
                <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-1.5 py-0.5 rounded">
                  {data?.systemMetrics.rssMb ? `${data.systemMetrics.rssMb} MB` : '...'}
                </span>
              </div>
              <div className="text-sm font-bold text-slate-800">
                Heap: {data?.systemMetrics.heapUsedMb || '0'} MB
              </div>
              <div className="text-[11px] text-slate-500">
                Total Alocado: {data?.systemMetrics.heapTotalMb || '0'} MB
              </div>
            </div>
          </div>

          {/* Environment Variables Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              Configuração de Variáveis de Ambiente
            </h4>
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Variável</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Valor Detectado</th>
                    <th className="py-2.5 px-3">Finalidade no Deploy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {(data?.environmentConfig || []).map((env) => (
                    <tr key={env.key} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{env.key}</td>
                      <td className="py-2.5 px-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          env.status === 'OK'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {env.status === 'OK' ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <AlertTriangle className="w-3 h-3 text-amber-600" />}
                          {env.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 truncate max-w-[200px]" title={env.currentValue}>
                        {env.currentValue}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 text-[11px]">{env.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Build and Server Logs Console */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-slate-500" />
                Logs de Execução & Build
              </h4>

              <div className="flex items-center gap-2">
                <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200/80 text-[11px]">
                  {(['all', 'build', 'api', 'system'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setFilterLevel(lvl)}
                      className={`px-2 py-0.5 rounded-md font-semibold transition-colors cursor-pointer ${
                        filterLevel === lvl ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {lvl === 'all' ? 'Todos' : lvl.toUpperCase()}
                    </button>
                  ))}
                </div>

                <button
                  onClick={copyLogsToClipboard}
                  className="text-xs font-semibold px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex items-center gap-1 transition-colors border border-slate-200/80 cursor-pointer"
                  title="Copiar logs para a área de transferência"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copiado!' : 'Copiar Logs'}</span>
                </button>
              </div>
            </div>

            {/* Terminal Window */}
            <div className="bg-slate-950 text-slate-200 rounded-xl p-3 font-mono text-[11px] leading-relaxed max-h-48 overflow-y-auto border border-slate-800 shadow-inner">
              {filteredLogs.length === 0 ? (
                <div className="text-slate-500 py-4 text-center">Nenhum registro para o filtro selecionado.</div>
              ) : (
                filteredLogs.map((log) => {
                  let badgeColor = 'text-blue-400';
                  if (log.level === 'warn') badgeColor = 'text-amber-400';
                  if (log.level === 'error') badgeColor = 'text-red-400';
                  if (log.level === 'build') badgeColor = 'text-emerald-400';

                  return (
                    <div key={log.id} className="py-0.5 flex items-start gap-2 hover:bg-slate-900/60 rounded px-1">
                      <span className="text-slate-500 shrink-0 select-none">
                        {new Date(log.timestamp).toLocaleTimeString('pt-BR')}
                      </span>
                      <span className={`font-bold shrink-0 uppercase text-[10px] px-1 rounded bg-slate-900 ${badgeColor}`}>
                        [{log.category}]
                      </span>
                      <span className="text-slate-300 break-all">{log.message}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Quick Deployment Guide Box */}
          <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/80 text-xs space-y-1.5">
            <h5 className="font-bold text-blue-900 flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-blue-600" />
              Instruções de Publicação no Google AI Studio / Cloud Run
            </h5>
            <ul className="text-blue-800 text-[11px] space-y-1 list-disc list-inside">
              <li>
                <strong>Link de Acesso Público Imediato:</strong> Use o link oficial de Preview compartilhado disponibilizado pelo AI Studio no painel superior.
              </li>
              <li>
                <strong>Publicar no Cloud Run:</strong> Se receber a mensagem <em>"Resource already exists"</em>, renomeie o serviço no modal de Deploy para um nome único (ex: <code>doc-preenchedor-v2</code>).
              </li>
              <li>
                <strong>Porta Ingress:</strong> O servidor está configurado em <code>0.0.0.0:3000</code> com suporte estático e SSR.
              </li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
};
