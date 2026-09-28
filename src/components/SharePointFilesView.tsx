import React, { useState, useMemo } from 'react';
import {
  Cloud,
  Folder,
  FileText,
  Building2,
  User,
  Search,
  ExternalLink,
  Copy,
  Download,
  Trash2,
  Check,
  ChevronRight,
  Filter,
  RefreshCw,
  FolderOpen
} from 'lucide-react';
import {
  SharePointDocumentRecord,
  DahrujUnit,
  UserProfile
} from '../types/sharepoint';
import { sharePointClient } from '../services/sharePointClientService';

interface SharePointFilesViewProps {
  onOpenAdmin: () => void;
  currentUser: UserProfile;
}

export const SharePointFilesView: React.FC<SharePointFilesViewProps> = ({
  onOpenAdmin,
  currentUser,
}) => {
  const [documents, setDocuments] = useState<SharePointDocumentRecord[]>(() =>
    sharePointClient.getSavedDocuments()
  );
  const units = sharePointClient.getUnits();
  const config = sharePointClient.getConfig();

  const [selectedUnit, setSelectedUnit] = useState<string>(
    currentUser.role === 'vendedor' && currentUser.unit && currentUser.unit !== 'Todas as Unidades'
      ? currentUser.unit
      : 'all'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleRefresh = () => {
    setDocuments(sharePointClient.getSavedDocuments(selectedUnit));
  };

  const handleCopyLink = (doc: SharePointDocumentRecord) => {
    navigator.clipboard.writeText(doc.webUrl);
    setCopiedId(doc.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = (docId: string) => {
    if (window.confirm('Deseja remover este registro do SharePoint?')) {
      sharePointClient.deleteSavedDocument(docId);
      setDocuments(sharePointClient.getSavedDocuments(selectedUnit));
    }
  };

  // Filter documents
  const filteredDocs = useMemo(() => {
    return documents.filter((doc) => {
      if (selectedUnit !== 'all' && doc.unit.toLowerCase() !== selectedUnit.toLowerCase()) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          doc.fileName.toLowerCase().includes(q) ||
          doc.clientName.toLowerCase().includes(q) ||
          doc.normalizedClientName.toLowerCase().includes(q) ||
          doc.documentType.toLowerCase().includes(q) ||
          (doc.clientCpfCnpj && doc.clientCpfCnpj.includes(q));
        if (!matches) return false;
      }
      return true;
    });
  }, [documents, selectedUnit, searchQuery]);

  // Group by client
  const clientGroups = useMemo(() => {
    const groups: Record<string, { clientName: string; unit: string; docs: SharePointDocumentRecord[] }> = {};
    filteredDocs.forEach((doc) => {
      const key = `${doc.unit}__${doc.normalizedClientName}`;
      if (!groups[key]) {
        groups[key] = {
          clientName: doc.clientName,
          unit: doc.unit,
          docs: [],
        };
      }
      groups[key].docs.push(doc);
    });
    return Object.values(groups);
  }, [filteredDocs]);

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-100 text-blue-800 border border-blue-200">
              SharePoint Dahruj GWM
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Biblioteca: {config.driveName}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Repositório Corporativo de Documentos
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Navegue pelos documentos armazenados nas pastas de cada cliente organizados por filial e versão.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleRefresh}
            className="p-2 text-slate-500 hover:text-blue-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
            title="Atualizar lista"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {(currentUser.role === 'admin' || currentUser.role === 'gestor') && (
            <button
              type="button"
              onClick={onOpenAdmin}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <Cloud className="w-3.5 h-3.5" />
              <span>Configurar SharePoint</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5" /> Unidade:
          </span>

          <button
            type="button"
            onClick={() => setSelectedUnit('all')}
            disabled={currentUser.role === 'vendedor' && currentUser.unit !== 'Todas as Unidades'}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              selectedUnit === 'all'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todas as Unidades
          </button>

          {units.map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => setSelectedUnit(u.name)}
              disabled={currentUser.role === 'vendedor' && currentUser.unit !== 'Todas as Unidades' && currentUser.unit !== u.name}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedUnit.toLowerCase() === u.name.toLowerCase()
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-40'
              }`}
            >
              {u.name}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por cliente, arquivo..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
          />
        </div>
      </div>

      {/* Files Structure Container */}
      <div className="space-y-4">
        {clientGroups.length === 0 ? (
          <div className="text-center py-16 bg-white border border-slate-200 rounded-xl">
            <FolderOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-slate-700">Nenhum documento encontrado</h3>
            <p className="text-xs text-slate-400 mt-1">
              Gere novos documentos para que as pastas dos clientes sejam criadas automaticamente no SharePoint.
            </p>
          </div>
        ) : (
          clientGroups.map((group) => (
            <div
              key={`${group.unit}__${group.clientName}`}
              className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs"
            >
              {/* Folder Header for Customer */}
              <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                    <Folder className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{group.clientName}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                        {group.unit}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500">
                      SharePoint → {config.rootFolder} → {group.unit} → {group.clientName.toUpperCase()}
                    </span>
                  </div>
                </div>

                <span className="text-xs font-mono font-semibold text-slate-600">
                  {group.docs.length} arquivo(s)
                </span>
              </div>

              {/* Document List in Folder */}
              <div className="divide-y divide-slate-100">
                {group.docs.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-3.5 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-slate-900 font-mono">{doc.fileName}</p>
                          <span className="px-1.5 py-0.5 rounded font-mono font-bold text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {doc.version}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-500 text-[11px] mt-0.5">
                          <span>{doc.documentType}</span>
                          <span aria-hidden="true">•</span>
                          <span>Salvo por {doc.uploadedBy}</span>
                          <span aria-hidden="true">•</span>
                          <span>{new Date(doc.uploadedAt).toLocaleString('pt-BR')}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <a
                        href={doc.webUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 border border-blue-200 transition-colors cursor-pointer"
                        title="Abrir no SharePoint Online"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Abrir</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => handleCopyLink(doc)}
                        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                        title="Copiar link direto"
                      >
                        {copiedId === doc.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {currentUser.role === 'admin' && (
                        <button
                          type="button"
                          onClick={() => handleDelete(doc.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                          title="Remover do registro"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
