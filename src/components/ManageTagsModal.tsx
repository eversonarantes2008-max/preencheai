import React, { useState, useEffect, useRef } from 'react';
import { X, Tag, Plus, Check } from 'lucide-react';
import { DocumentTemplate } from '../types/document';

interface ManageTagsModalProps {
  isOpen: boolean;
  template: DocumentTemplate | null;
  allExistingTags?: string[];
  onClose: () => void;
  onSaveTags: (templateId: string, tags: string[]) => void;
}

const PRESET_TAG_SUGGESTIONS = [
  'Legal',
  'HR',
  'Sales',
  'Finance',
  'Operations',
  'Compliance',
  'Contratos',
];

export const ManageTagsModal: React.FC<ManageTagsModalProps> = ({
  isOpen,
  template,
  allExistingTags = [],
  onClose,
  onSaveTags,
}) => {
  const [tags, setTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (template) {
      setTags(template.tags ? [...template.tags] : []);
      setNewTagInput('');
    }
  }, [template, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  if (!isOpen || !template) return null;

  const handleAddTag = (rawTag: string) => {
    const trimmed = rawTag.trim();
    if (!trimmed) return;
    // Avoid duplicates case-insensitively
    const exists = tags.some((t) => t.toLowerCase() === trimmed.toLowerCase());
    if (!exists) {
      setTags((prev) => [...prev, trimmed]);
    }
    setNewTagInput('');
    inputRef.current?.focus();
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((t) => t !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag(newTagInput);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleSave = () => {
    onSaveTags(template.id, tags);
    onClose();
  };

  // Combine default suggestions and existing tags
  const combinedSuggestions = Array.from(
    new Set([...PRESET_TAG_SUGGESTIONS, ...allExistingTags])
  ).filter((s) => !tags.some((t) => t.toLowerCase() === s.toLowerCase()));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Gerenciar Etiquetas</h3>
              <p className="text-xs text-slate-500 truncate max-w-[260px]" title={template.name}>
                {template.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Active Tags */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Etiquetas Atuais ({tags.length})
            </label>
            {tags.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 rounded-lg border border-slate-100 min-h-[44px] items-center">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-white text-slate-800 border border-slate-200 shadow-2xs group"
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title={`Remover etiqueta ${tag}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <div className="p-3 bg-slate-50 rounded-lg border border-dashed border-slate-200 text-center text-xs text-slate-400">
                Nenhuma etiqueta associada a este documento ainda.
              </div>
            )}
          </div>

          {/* Add Custom Tag */}
          <div>
            <label
              htmlFor="custom-tag-input"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2"
            >
              Adicionar Nova Etiqueta
            </label>
            <div className="flex gap-2">
              <input
                id="custom-tag-input"
                ref={inputRef}
                type="text"
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ex: Legal, HR, Sales, Operações..."
                className="flex-1 px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
              />
              <button
                type="button"
                onClick={() => handleAddTag(newTagInput)}
                disabled={!newTagInput.trim()}
                className="px-3 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-lg text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar</span>
              </button>
            </div>
          </div>

          {/* Suggestions */}
          {combinedSuggestions.length > 0 && (
            <div>
              <span className="block text-[11px] font-medium text-slate-500 mb-1.5">
                Sugestões Rápidas:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {combinedSuggestions.slice(0, 8).map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => handleAddTag(suggestion)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-200 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3 h-3 text-slate-400 group-hover:text-blue-600" />
                    <span>{suggestion}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-lg transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Salvar Etiquetas</span>
          </button>
        </div>
      </div>
    </div>
  );
};
