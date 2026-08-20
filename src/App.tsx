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
  ALL_BUILT_IN_TEMPLATES,
  loadDocumentHistory,
  saveDocumentToHistory,
  deleteDocumentFromHistory,
  clearAllDocumentHistory,
  getMasterPdfBytes,
} from './services/templateStore';
import {
  renderDocumentPdf,
  generateFilename,
} from './services/pdfGenerator';
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
    const exampleValues: Record<string, string> = {};
    const exampleConfidences: Record<string, number> = {};

    // Populate all fields dynamically from active template definitions
    activeTemplate.fields.forEach((field) => {
      if (field.test_value !== undefined) {
        exampleValues[field.field_key] = field.test_value;
        exampleConfidences[field.field_key] = 99;
      }
    });

    // Ensure dates are fresh if not already present
    const now = new Date();
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    if (!exampleValues['data_dia']) exampleValues['data_dia'] = String(now.getDate()).padStart(2, '0');
    if (!exampleValues['data_mes']) exampleValues['data_mes'] = months[now.getMonth()];
    if (!exampleValues['data_ano']) exampleValues['data_ano'] = String(now.getFullYear()).slice(-2);
    if (!exampleValues['data_ano_completo']) exampleValues['data_ano_completo'] = String(now.getFullYear());

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
    const defaultTemplate =
      ALL_BUILT_IN_TEMPLATES.find((t) => t.id === activeTemplate.id) ||
      BUILT_IN_TEMPLATE_RESPONSABILIDADE;
    saveTemplate({ ...defaultTemplate });
    setTemplates(loadAllTemplates());
    setActiveTemplate({ ...defaultTemplate });
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

  const handleClearAllHistory = () => {
    clearAllDocumentHistory();
    setRecentDocuments([]);
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

  const handleConfirmPreview = () => {
    setIsReviewOpen(false);
    setCurrentView('preview');
  };

  const handleDirectGenerate = async () => {
    setIsReviewOpen(false);
    try {
      const masterBytes = await getMasterPdfBytes(activeTemplate);
      const overlaidBytes = await renderDocumentPdf(masterBytes, activeTemplate, formValues);
      const fileName = generateFilename(activeTemplate.name, formValues);
      const blob = new Blob([overlaidBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      // Trigger instantaneous browser download
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Save to document history
      handleSaveToHistory(fileName, url, overlaidBytes.byteLength);

      // Switch to preview view for visual confirmation
      setCurrentView('preview');
    } catch (err) {
      console.error('Error generating document:', err);
      setCurrentView('preview');
    }
  };

  const handleJumpToField = (fieldKey: string) => {
    setIsReviewOpen(false);
    setCurrentView('form');
    // Allow React to mount the form view then focus field
    setTimeout(() => {
      const el = document.querySelector(`[name="${fieldKey}"]`) as HTMLElement | null;
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.focus();
      }
    }, 100);
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
            onDeleteHistoryDoc={handleDeleteHistoryDoc}
            onClearAllHistory={handleClearAllHistory}
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
            onClearAll={handleClearAllHistory}
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
        confidenceScores={confidenceScores}
        onConfirmPreview={handleConfirmPreview}
        onDirectGenerate={handleDirectGenerate}
        onJumpToField={handleJumpToField}
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
