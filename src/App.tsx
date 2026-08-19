import React, { useState, useEffect } from 'react';
import {
  DocumentTemplate,
  GeneratedDocument,
} from './types/document';
import {
  loadAllTemplates,
  saveTemplate,
  deleteTemplate,
  BUILT_IN_TEMPLATE_RESPONSABILIDADE,
  loadDocumentHistory,
  saveDocumentToHistory,
  deleteDocumentFromHistory,
} from './services/templateStore';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { SmartFormView } from './components/SmartFormView';
import { VisualEditorView } from './components/VisualEditorView';
import { PdfPreviewView } from './components/PdfPreviewView';
import { DocumentHistoryView } from './components/DocumentHistoryView';
import { DocumentReviewModal } from './components/DocumentReviewModal';
import { TeachDocumentModal } from './components/TeachDocumentModal';
import { DatabaseSchemaModal } from './components/DatabaseSchemaModal';

export default function App() {
  const [templates, setTemplates] = useState<DocumentTemplate[]>(() => loadAllTemplates());
  const [activeTemplate, setActiveTemplate] = useState<DocumentTemplate>(
    () => loadAllTemplates()[0] || BUILT_IN_TEMPLATE_RESPONSABILIDADE
  );
  const [currentView, setCurrentView] = useState<
    'dashboard' | 'form' | 'editor' | 'preview' | 'history'
  >('dashboard');

  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [confidenceScores, setConfidenceScores] = useState<Record<string, number>>({});
  const [recentDocuments, setRecentDocuments] = useState<GeneratedDocument[]>(() =>
    loadDocumentHistory()
  );

  const [isAdmin, setIsAdmin] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isTeachOpen, setIsTeachOpen] = useState(false);
  const [isSchemaOpen, setIsSchemaOpen] = useState(false);

  // Initialize form default values on template change
  useEffect(() => {
    if (!activeTemplate?.fields) return;
    const initial: Record<string, string> = {};
    activeTemplate.fields.forEach((f) => {
      if (f.default_value && !formValues[f.field_key]) {
        initial[f.field_key] = f.default_value;
      }
    });
    setFormValues((prev) => ({ ...initial, ...prev }));
  }, [activeTemplate]);

  // Handle single field input
  const handleValueChange = (key: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  };

  // Set all values (from AI extraction or example data)
  const handleSetAllValues = (
    values: Record<string, string>,
    confidences?: Record<string, number>
  ) => {
    setFormValues(values);
    if (confidences) setConfidenceScores(confidences);
  };

  // Fill with test data
  const handleFillExample = () => {
    const exampleValues: Record<string, string> = {
      declarante_nome: 'João da Silva',
      declarante_cpf: '123.456.789-00',
      declarante_rg: '12.345.678',
      declarante_cnh: '123456789',
      declarante_endereco: 'Rua das Flores, 100',
      declarante_cep: '13000-000',
      declarante_bairro: 'Cambuí',
      declarante_municipio: 'Campinas',
      declarante_estado: 'SP',
      declarante_telefone: '(19) 99876-5432',

      comprador_nome: 'Auto Peças & Veículos Campinas Ltda',
      comprador_cnpj: '12.345.678/0001-90',

      veiculo_marca: 'GWM',
      veiculo_modelo: 'ORA 5 Skin',
      veiculo_modelo_ano: '2026/2026',
      veiculo_cor: 'Branco',
      veiculo_placa: 'ABC1D23',
      veiculo_chassi: '9BWTESTE123456789',

      proprietario_nome: 'João da Silva',
      proprietario_rg: '12.345.678',
      proprietario_rg_uf: 'SP',
      proprietario_cpf: '123.456.789-00',

      endereco_residencial: 'Rua das Flores, 100 - Cambuí - Campinas/SP',
      endereco_comercial: 'Av. Brasil, 500 - Sala 12 - Centro',
      telefone_comunicacao: '(19) 3234-5678',
      whatsapp: '(19) 99876-5432',
      email: 'joao.silva@email.com',
      principal_condutor: 'João da Silva',
      cnh_principal_condutor: '123456789',
      cpf_principal_condutor: '123.456.789-00',

      data_dia: String(new Date().getDate()).padStart(2, '0'),
      data_mes: [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
      ][new Date().getMonth()],
      data_ano: String(new Date().getFullYear()).slice(-2),
    };

    const exampleConfidences: Record<string, number> = {};
    Object.keys(exampleValues).forEach((k) => {
      exampleConfidences[k] = 98;
    });

    setFormValues(exampleValues);
    setConfidenceScores(exampleConfidences);
    setCurrentView('form');
  };

  const handleClearForm = () => {
    const cleared: Record<string, string> = {};
    // Keep date defaults
    activeTemplate.fields.forEach((f) => {
      if (f.default_value) cleared[f.field_key] = f.default_value;
    });
    setFormValues(cleared);
    setConfidenceScores({});
  };

  const handleSaveCalibratedTemplate = (updated: DocumentTemplate) => {
    saveTemplate(updated);
    setTemplates(loadAllTemplates());
    setActiveTemplate(updated);
  };

  const handleResetDefaultTemplate = () => {
    saveTemplate(BUILT_IN_TEMPLATE_RESPONSABILIDADE);
    setTemplates(loadAllTemplates());
    setActiveTemplate(BUILT_IN_TEMPLATE_RESPONSABILIDADE);
  };

  const handleSaveToHistory = (
    fileName: string,
    pdfDataUrl: string,
    bytesLen: number
  ) => {
    const doc: GeneratedDocument = {
      id: `doc_${Date.now()}`,
      template_id: activeTemplate.id,
      template_name: activeTemplate.name,
      file_name: fileName,
      created_at: new Date().toISOString(),
      status: 'completed',
      values: formValues,
      pdf_data_url: pdfDataUrl,
      pdf_size_bytes: bytesLen,
    };
    saveDocumentToHistory(doc);
    setRecentDocuments(loadDocumentHistory());
  };

  const handleDownloadHistoryDoc = (doc: GeneratedDocument) => {
    if (doc.values) {
      setFormValues(doc.values);
      const matched = templates.find((t) => t.id === doc.template_id) || activeTemplate;
      setActiveTemplate(matched);
      setCurrentView('preview');
    }
  };

  const handleDuplicateToForm = (doc: GeneratedDocument) => {
    if (doc.values) {
      setFormValues(doc.values);
      const matched = templates.find((t) => t.id === doc.template_id) || activeTemplate;
      setActiveTemplate(matched);
      setCurrentView('form');
    }
  };

  const handleDeleteHistoryDoc = (id: string) => {
    deleteDocumentFromHistory(id);
    setRecentDocuments(loadDocumentHistory());
  };

  const handleCompleteTeachNewTemplate = (newTemplate: DocumentTemplate) => {
    saveTemplate(newTemplate);
    const updated = loadAllTemplates();
    setTemplates(updated);
    setActiveTemplate(newTemplate);
    setCurrentView('editor');
  };

  const handlePdfUploaded = (newTemplate: DocumentTemplate) => {
    const updated = loadAllTemplates();
    setTemplates(updated);
    setActiveTemplate(newTemplate);
    setFormValues({});
    setConfidenceScores({});
    setCurrentView('form');
  };

  const handleDeleteTemplate = (templateId: string) => {
    deleteTemplate(templateId);
    const updated = loadAllTemplates();
    setTemplates(updated);
    if (activeTemplate.id === templateId) {
      setActiveTemplate(updated[0] || BUILT_IN_TEMPLATE_RESPONSABILIDADE);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Main Navigation */}
      <Navbar
        currentView={currentView}
        onNavigate={setCurrentView}
        isAdmin={isAdmin}
        onToggleAdmin={() => setIsAdmin((a) => !a)}
        onOpenTeachModal={() => setIsTeachOpen(true)}
        onOpenSchemaModal={() => setIsSchemaOpen(true)}
        activeTemplateName={activeTemplate.name}
        onPdfUploaded={handlePdfUploaded}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentView === 'dashboard' && (
          <DashboardView
            templates={templates}
            recentDocuments={recentDocuments}
            onSelectTemplate={(t) => {
              setActiveTemplate(t);
              setCurrentView('form');
            }}
            onOpenTeachModal={() => setIsTeachOpen(true)}
            onOpenCalibrator={(t) => {
              setActiveTemplate(t);
              setCurrentView('editor');
            }}
            onFillExample={handleFillExample}
            onDownloadHistoryDoc={handleDownloadHistoryDoc}
            onPdfUploaded={handlePdfUploaded}
            onDeleteTemplate={handleDeleteTemplate}
          />
        )}

        {currentView === 'form' && (
          <SmartFormView
            template={activeTemplate}
            formValues={formValues}
            confidenceScores={confidenceScores}
            onValueChange={handleValueChange}
            onSetAllValues={handleSetAllValues}
            onFillExample={handleFillExample}
            onClearForm={handleClearForm}
            onProceedToReview={() => setIsReviewOpen(true)}
            onOpenCalibrator={() => setCurrentView('editor')}
          />
        )}

        {currentView === 'editor' && (
          <VisualEditorView
            template={activeTemplate}
            onSaveTemplate={handleSaveCalibratedTemplate}
            onResetDefault={handleResetDefaultTemplate}
            onNavigateToForm={() => setCurrentView('form')}
          />
        )}

        {currentView === 'preview' && (
          <PdfPreviewView
            template={activeTemplate}
            formValues={formValues}
            onBackToEdit={() => setCurrentView('form')}
            onNewDocument={() => {
              handleClearForm();
              setCurrentView('form');
            }}
            onSaveToHistory={handleSaveToHistory}
          />
        )}

        {currentView === 'history' && (
          <DocumentHistoryView
            documents={recentDocuments}
            templates={templates}
            onDownloadDoc={handleDownloadHistoryDoc}
            onDuplicateToForm={handleDuplicateToForm}
            onDeleteDoc={handleDeleteHistoryDoc}
            onNavigateToForm={() => setCurrentView('form')}
          />
        )}
      </main>

      {/* Audit & Compliance Review Modal */}
      <DocumentReviewModal
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        template={activeTemplate}
        formValues={formValues}
        onConfirmGenerate={() => {
          setIsReviewOpen(false);
          setCurrentView('preview');
        }}
      />

      {/* Teach & Ingest New PDF Template Modal */}
      <TeachDocumentModal
        isOpen={isTeachOpen}
        onClose={() => setIsTeachOpen(false)}
        existingTemplates={templates}
        onCompleteTeach={handleCompleteTeachNewTemplate}
      />

      {/* Supabase Schema Modal */}
      <DatabaseSchemaModal
        isOpen={isSchemaOpen}
        onClose={() => setIsSchemaOpen(false)}
      />
    </div>
  );
}
