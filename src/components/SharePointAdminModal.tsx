import React, { useState, useEffect } from 'react';
import {
  Cloud,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Users,
  Settings,
  FileSpreadsheet,
  History,
  Shield,
  ExternalLink,
  Plus,
  Trash2,
  Edit2,
  Key,
  Globe,
  FolderTree,
  FolderCheck,
  RefreshCw,
  Check,
  Lock,
  Eye,
  EyeOff,
  UserCheck
} from 'lucide-react';
import {
  SharePointConfig,
  DahrujUnit,
  UserProfile,
  DocumentTypeOption,
  SharePointAuditLog,
  SharePointDocumentRecord,
} from '../types/sharepoint';
import { sharePointClient } from '../services/sharePointClientService';

interface SharePointAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserChanged?: (user: UserProfile) => void;
}

type AdminTab = 'integration' | 'units' | 'users' | 'doctypes' | 'audit';

export const SharePointAdminModal: React.FC<SharePointAdminModalProps> = ({
  isOpen,
  onClose,
  onUserChanged,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('integration');

  // SharePoint Config state
  const [config, setConfig] = useState<SharePointConfig>(() => sharePointClient.getConfig());
  const [clientSecretInput, setClientSecretInput] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [testStatus, setTestStatus] = useState<{
    testing: boolean;
    success?: boolean;
    message?: string;
  }>({ testing: false });
  const [isSavedMessage, setIsSavedMessage] = useState(false);

  // Units state
  const [units, setUnits] = useState<DahrujUnit[]>(() => sharePointClient.getUnits());
  const [editingUnit, setEditingUnit] = useState<DahrujUnit | null>(null);
  const [newUnitName, setNewUnitName] = useState('');
  const [unitError, setUnitError] = useState('');

  // Users state
  const [users, setUsers] = useState<UserProfile[]>(() => sharePointClient.getUsers());
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => sharePointClient.getCurrentUser());
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'gestor' | 'vendedor'>('vendedor');
  const [newUserUnit, setNewUserUnit] = useState('Jundiaí');

  // Document types state
  const [docTypes, setDocTypes] = useState<DocumentTypeOption[]>(() => sharePointClient.getDocumentTypes());
  const [newDocTypeName, setNewDocTypeName] = useState('');

  // Audit Logs state
  const [logs, setLogs] = useState<SharePointAuditLog[]>(() => sharePointClient.getAuditLogs());
  const [savedDocs, setSavedDocs] = useState<SharePointDocumentRecord[]>(() => sharePointClient.getSavedDocuments());

  // Reload data on open
  useEffect(() => {
    if (isOpen) {
      setConfig(sharePointClient.getConfig());
      setUnits(sharePointClient.getUnits());
      setUsers(sharePointClient.getUsers());
      setCurrentUser(sharePointClient.getCurrentUser());
      setDocTypes(sharePointClient.getDocumentTypes());
      setLogs(sharePointClient.getAuditLogs());
      setSavedDocs(sharePointClient.getSavedDocuments());
      setUnitError('');
      setIsSavedMessage(false);
    }
  }, [isOpen]);

  // Listen to postMessage from OAuth popup
  useEffect(() => {
    const handleAuthMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost')) {
        return;
      }
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        const updated = sharePointClient.saveConfig({ connected: true });
        setConfig(updated);
        setTestStatus({
          testing: false,
          success: true,
          message: 'Autenticação com Microsoft 365 concluída com sucesso via Entra ID!',
        });
      }
    };

    window.addEventListener('message', handleAuthMessage);
    return () => window.removeEventListener('message', handleAuthMessage);
  }, []);

  if (!isOpen) return null;

  // Handle Save SharePoint Config
  const handleSaveConfig = () => {
    const updated = sharePointClient.saveConfig(config);
    setConfig(updated);
    setIsSavedMessage(true);
    setTimeout(() => setIsSavedMessage(false), 3000);
  };

  // Handle Test Connection
  const handleTestConnection = async () => {
    setTestStatus({ testing: true });
    try {
      const result = await sharePointClient.testConnection();
      setTestStatus({
        testing: false,
        success: result.success,
        message: result.message,
      });
      setConfig(sharePointClient.getConfig());
      setLogs(sharePointClient.getAuditLogs());
    } catch (err: any) {
      setTestStatus({
        testing: false,
        success: false,
        message: err?.message || 'Falha ao testar conexão com o SharePoint.',
      });
    }
  };

  // Handle Microsoft 365 OAuth Popup Connection
  const handleConnectMicrosoft = async () => {
    try {
      const res = await fetch('/api/sharepoint/auth-url').catch(() => null);
      if (res && res.ok) {
        const { url } = await res.json();
        const authWindow = window.open(url, 'microsoft_auth_popup', 'width=600,height=720');
        if (!authWindow) {
          alert('Por favor, permita popups para este site para autenticar no Microsoft 365.');
        }
      } else {
        // Fallback popup if endpoint not yet reachable
        await handleTestConnection();
      }
    } catch (e) {
      console.error('Error starting Microsoft OAuth:', e);
      await handleTestConnection();
    }
  };

  // Units management
  const handleAddUnit = () => {
    if (!newUnitName.trim()) return;
    const updated = sharePointClient.saveUnit({
      name: newUnitName.trim(),
      path: `${config.rootFolder || 'Vendas'}/${newUnitName.trim()}`,
      status: 'active',
    });
    setUnits(updated);
    setNewUnitName('');
    setUnitError('');
  };

  const handleDeleteUnit = (unitId: string) => {
    const res = sharePointClient.deleteUnit(unitId);
    if (!res.success) {
      setUnitError(res.error || 'Erro ao excluir unidade.');
    } else {
      setUnits(sharePointClient.getUnits());
      setUnitError('');
    }
  };

  const handleToggleUnitStatus = (unit: DahrujUnit) => {
    const nextStatus = unit.status === 'active' ? 'inactive' : 'active';
    const updated = sharePointClient.saveUnit({ ...unit, status: nextStatus });
    setUnits(updated);
  };

  // User switch
  const handleSwitchUser = (user: UserProfile) => {
    sharePointClient.setCurrentUser(user);
    setCurrentUser(user);
    if (onUserChanged) onUserChanged(user);
  };

  const handleAddUser = () => {
    if (!newUserName.trim() || !newUserEmail.trim()) return;
    const updated = sharePointClient.saveUser({
      name: newUserName.trim(),
      email: newUserEmail.trim(),
      role: newUserRole,
      unit: newUserUnit,
      status: 'active',
    });
    setUsers(updated);
    setNewUserName('');
    setNewUserEmail('');
  };

  // Document types
  const handleAddDocType = () => {
    if (!newDocTypeName.trim()) return;
    const newTypes = [
      ...docTypes,
      {
        id: `dt-${Date.now()}`,
        name: newDocTypeName.trim(),
        code: newDocTypeName.trim().toUpperCase(),
        isDefault: false,
      },
    ];
    sharePointClient.saveDocumentTypes(newTypes);
    setDocTypes(newTypes);
    setNewDocTypeName('');
  };

  const handleDeleteDocType = (id: string) => {
    const newTypes = docTypes.filter((dt) => dt.id !== id);
    sharePointClient.saveDocumentTypes(newTypes);
    setDocTypes(newTypes);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-xs">
              <Cloud className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight">Administração • SharePoint Dahruj GWM</h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  Painel Corporativo
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Gerencie integração Microsoft 365, unidades, permissões e histórico corporativo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors text-lg leading-none cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('integration')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'integration'
                ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Cloud className="w-4 h-4" />
            <span>Integração SharePoint</span>
            {config.connected && (
              <span className="w-2 h-2 rounded-full bg-emerald-500" title="Conectado" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('units')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'units'
                ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Unidades Dahruj ({units.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'users'
                ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Usuários & Perfis ({users.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('doctypes')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'doctypes'
                ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Tipos de Documento ({docTypes.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'audit'
                ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Auditoria & Logs</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* ================= TAB 1: INTEGRAÇÃO SHAREPOINT (Item 17) ================= */}
          {activeTab === 'integration' && (
            <div className="space-y-6">
              {/* Connection Status Header Box */}
              <div className="p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 border-slate-200">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${
                      config.connected
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {config.connected ? '🟢' : '🟡'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs uppercase tracking-wider text-slate-500 font-bold">
                        Status da Conexão:
                      </span>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          config.connected
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {config.connected ? 'CONECTADO' : 'NÃO CONFIGURADO'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {config.lastConnectedAt
                        ? `Última sincronização com Microsoft Graph: ${new Date(config.lastConnectedAt).toLocaleString('pt-BR')}`
                        : 'Aguardando validação com Microsoft Entra ID'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleConnectMicrosoft}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Conectar Microsoft 365</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={testStatus.testing}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 border border-slate-300 transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${testStatus.testing ? 'animate-spin text-blue-600' : ''}`} />
                    <span>{testStatus.testing ? 'Testando...' : 'Testar Conexão'}</span>
                  </button>
                </div>
              </div>

              {testStatus.message && (
                <div
                  className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 ${
                    testStatus.success
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}
                >
                  {testStatus.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{testStatus.message}</span>
                </div>
              )}

              {/* Form Config */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                  Parâmetros do Microsoft Entra ID e SharePoint Online
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Tenant ID (Diretório):</label>
                    <input
                      type="text"
                      value={config.tenantId}
                      onChange={(e) => setConfig({ ...config, tenantId: e.target.value })}
                      placeholder="Ex: dahruj-gwm-tenant-id-ms365 ou ID do Azure"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Client ID (Aplicação):</label>
                    <input
                      type="text"
                      value={config.clientId}
                      onChange={(e) => setConfig({ ...config, clientId: e.target.value })}
                      placeholder="Ex: 0b2e88a3-gwm-dahruj-sharepoint-app"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Site SharePoint:</label>
                    <input
                      type="text"
                      value={config.siteUrl}
                      onChange={(e) => setConfig({ ...config, siteUrl: e.target.value })}
                      placeholder="Ex: https://dahruj.sharepoint.com/sites/gwm"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Biblioteca de Documentos:</label>
                    <input
                      type="text"
                      value={config.driveName}
                      onChange={(e) => setConfig({ ...config, driveName: e.target.value })}
                      placeholder="Ex: Vendas ou Documentos Compartilhados"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-semibold focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Pasta Raiz:</label>
                    <input
                      type="text"
                      value={config.rootFolder}
                      onChange={(e) => setConfig({ ...config, rootFolder: e.target.value })}
                      placeholder="Ex: Vendas"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-semibold focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Client Secret (Confidencial / Servidor):
                    </label>
                    <div className="relative">
                      <input
                        type={showSecret ? 'text' : 'password'}
                        value={clientSecretInput}
                        onChange={(e) => setClientSecretInput(e.target.value)}
                        placeholder="••••••••••••••••••••••••••••••••"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-3 pr-9 py-2 text-slate-900 font-mono focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSecret(!showSecret)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Segurança: Armazenado com segurança apenas no backend server-side.
                    </span>
                  </div>
                </div>

                {/* Opções de automação e regras corporativas */}
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <span className="font-bold text-slate-800 text-xs block">Políticas de Armazenamento:</span>

                  <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={config.autoUpload}
                      onChange={(e) => setConfig({ ...config, autoUpload: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                    />
                    <div>
                      <span className="font-semibold text-slate-900">Salvar automaticamente no SharePoint</span>
                      <p className="text-[11px] text-slate-500">
                        Quando ativado, grava diretamente no SharePoint Dahruj GWM assim que o documento for gerado, sem exigir confirmação manual.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={config.includeDateInName}
                      onChange={(e) => setConfig({ ...config, includeDateInName: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                    />
                    <div>
                      <span className="font-semibold text-slate-900">Incluir data no nome do arquivo</span>
                      <p className="text-[11px] text-slate-500">
                        Padrão: <code>[CLIENTE] - [TIPO] - V[VERSÃO].pdf</code>. Ativado: <code>[CLIENTE] - [TIPO] - [DATA] - V[VERSÃO].pdf</code>.
                      </p>
                    </div>
                  </label>
                </div>

                <div className="pt-3 flex items-center justify-between border-t border-slate-100">
                  {isSavedMessage ? (
                    <span className="text-xs text-emerald-600 font-bold flex items-center gap-1.5">
                      <Check className="w-4 h-4" /> Configuração salva com sucesso!
                    </span>
                  ) : <span />}

                  <button
                    type="button"
                    onClick={handleSaveConfig}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-lg flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Salvar Configuração</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 2: CONFIGURAÇÃO DAS UNIDADES (Item 18) ================= */}
          {activeTab === 'units' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Unidades Dahruj GWM</h3>
                  <p className="text-xs text-slate-500">
                    Estrutura de diretórios por filial para organização dos clientes e documentos
                  </p>
                </div>

                {/* Add Unit Input */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newUnitName}
                    onChange={(e) => setNewUnitName(e.target.value)}
                    placeholder="Nome da nova unidade (ex: Santos)"
                    className="text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 w-48 sm:w-56 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <button
                    type="button"
                    onClick={handleAddUnit}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2 rounded-lg flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar</span>
                  </button>
                </div>
              </div>

              {unitError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{unitError}</span>
                </div>
              )}

              {/* Units Table */}
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4">Unidade</th>
                      <th className="py-3 px-4">Caminho no SharePoint</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Documentos</th>
                      <th className="py-3 px-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {units.map((unit) => (
                      <tr key={unit.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-blue-600" />
                          <span>{unit.name}</span>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600">
                          {unit.path}
                        </td>
                        <td className="py-3 px-4">
                          <button
                            type="button"
                            onClick={() => handleToggleUnitStatus(unit)}
                            className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] cursor-pointer ${
                              unit.status === 'active'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {unit.status === 'active' ? 'Ativa' : 'Inativa'}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-mono font-semibold">
                          {unit.documentCount || 0} docs
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteUnit(unit.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                            title="Excluir unidade (somente se não houver documentos vinculados)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= TAB 3: USUÁRIOS E PERFIS (Itens 13 e 14) ================= */}
          {activeTab === 'users' && (
            <div className="space-y-5">
              <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-blue-600" />
                    <span className="font-bold text-blue-950">Usuário Ativo Atual da Sessão:</span>
                  </div>
                  <p className="text-blue-800 font-semibold mt-0.5">
                    {currentUser.name} ({currentUser.email}) • Perfil: <strong>{currentUser.role.toUpperCase()}</strong> • Unidade: <strong>{currentUser.unit}</strong>
                  </p>
                </div>
                <span className="text-[11px] text-blue-600 font-medium">
                  Selecione outro usuário abaixo para alternar a visão do sistema
                </span>
              </div>

              {/* Add User */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                <span className="text-xs font-bold text-slate-900 block">Cadastrar Novo Usuário</span>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs">
                  <input
                    type="text"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    placeholder="Nome completo"
                    className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <input
                    type="email"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="e-mail corporativo"
                    className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <select
                    value={newUserRole}
                    onChange={(e: any) => setNewUserRole(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="vendedor">Vendedor</option>
                    <option value="gestor">Gestor</option>
                    <option value="admin">Master/Admin</option>
                  </select>
                  <select
                    value={newUserUnit}
                    onChange={(e) => setNewUserUnit(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    {units.map((u) => (
                      <option key={u.id} value={u.name}>
                        {u.name}
                      </option>
                    ))}
                    <option value="Todas as Unidades">Todas as Unidades</option>
                  </select>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleAddUser}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Cadastrar Usuário</span>
                  </button>
                </div>
              </div>

              {/* Users Table */}
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4">Nome</th>
                      <th className="py-3 px-4">E-mail</th>
                      <th className="py-3 px-4">Perfil</th>
                      <th className="py-3 px-4">Unidade</th>
                      <th className="py-3 px-4 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.map((u) => {
                      const isCurrent = u.id === currentUser.id;
                      return (
                        <tr key={u.id} className={isCurrent ? 'bg-blue-50/40' : 'hover:bg-slate-50/80'}>
                          <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                            <span>{u.name}</span>
                            {isCurrent && (
                              <span className="text-[10px] font-bold bg-blue-600 text-white px-2 py-0.5 rounded-full">
                                Ativo
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-600">{u.email}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                u.role === 'admin'
                                  ? 'bg-purple-100 text-purple-800'
                                  : u.role === 'gestor'
                                  ? 'bg-indigo-100 text-indigo-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {u.role === 'admin' ? 'Master/Admin' : u.role === 'gestor' ? 'Gestor' : 'Vendedor'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-700 font-semibold">{u.unit}</td>
                          <td className="py-3 px-4 text-right">
                            {!isCurrent && (
                              <button
                                type="button"
                                onClick={() => handleSwitchUser(u)}
                                className="text-xs text-blue-600 hover:text-blue-800 font-semibold hover:underline cursor-pointer"
                              >
                                Alternar para este perfil
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= TAB 4: TIPOS DE DOCUMENTO (Item 7) ================= */}
          {activeTab === 'doctypes' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Tipos de Documento Cadastrados</h3>
                  <p className="text-xs text-slate-500">
                    Nomes homologados que compõem a padronização oficial no SharePoint: <code>[CLIENTE] - [TIPO] - V[VERSÃO].pdf</code>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newDocTypeName}
                    onChange={(e) => setNewDocTypeName(e.target.value)}
                    placeholder="Novo tipo (ex: Laudo Cautelar)"
                    className="text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 w-52 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <button
                    type="button"
                    onClick={handleAddDocType}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2 rounded-lg flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar</span>
                  </button>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4">Nome Amigável</th>
                      <th className="py-3 px-4">Código na Nomenclatura</th>
                      <th className="py-3 px-4 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {docTypes.map((dt) => (
                      <tr key={dt.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                          <span>{dt.name}</span>
                          {dt.isDefault && (
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                              padrão
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold text-slate-700">
                          {dt.code || dt.name.toUpperCase()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteDocType(dt.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= TAB 5: AUDITORIA & LOGS ================= */}
          {activeTab === 'audit' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Histórico de Uploads e Auditoria do SharePoint</h3>
                  <p className="text-xs text-slate-500">
                    Rastreabilidade completa de todas as operações, versionamento e integrações com o Microsoft Graph
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    sharePointClient.clearAuditLogs();
                    setLogs([]);
                  }}
                  className="text-xs text-slate-400 hover:text-rose-600 cursor-pointer"
                >
                  Limpar logs
                </button>
              </div>

              {/* Logs List */}
              <div className="bg-slate-900 text-slate-200 rounded-xl p-4 font-mono text-xs max-h-96 overflow-y-auto space-y-2 border border-slate-800">
                {logs.length === 0 ? (
                  <p className="text-slate-500 text-center py-6">Nenhum log registrado ainda.</p>
                ) : (
                  logs.map((log) => (
                    <div key={log.id} className="border-b border-slate-800/80 pb-2 text-[11px] space-y-0.5">
                      <div className="flex items-center justify-between text-slate-400">
                        <span className="text-blue-400 font-bold">[{log.action}]</span>
                        <span>{new Date(log.timestamp).toLocaleTimeString('pt-BR')}</span>
                      </div>
                      <p className="text-slate-200">{log.details}</p>
                      {log.durationMs && (
                        <span className="text-[10px] text-slate-500">Tempo de execução: {log.durationMs}ms</span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Shield className="w-3.5 h-3.5 text-blue-600" />
            <span>Controle Corporativo Dahruj GWM • SharePoint Online</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-5 py-2 rounded-lg transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
