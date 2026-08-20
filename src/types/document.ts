export type FieldType =
  | 'text'
  | 'cpf'
  | 'cnpj'
  | 'rg'
  | 'cnh'
  | 'phone'
  | 'whatsapp'
  | 'email'
  | 'cep'
  | 'plate'
  | 'chassis'
  | 'date'
  | 'number'
  | 'currency'
  | 'year'
  | 'state'
  | 'textarea'
  | 'checkbox';

export type TemplateStatus = 'draft' | 'calibrating' | 'active' | 'archived';

export type FieldGroup =
  | 'declarante'
  | 'comprador'
  | 'veiculo'
  | 'proprietario'
  | 'comunicacoes'
  | 'data'
  | 'assinaturas'
  | 'outros';

export interface TemplateField {
  id: string;
  template_id: string;
  field_key: string;
  label: string;
  description?: string;
  page: number; // 1-based index
  x: number; // PDF points from left
  y: number; // PDF points from top of visual layout
  width: number; // in PDF points
  height: number; // in PDF points
  font_family?: string;
  font_size: number;
  font_weight: 'normal' | 'bold';
  alignment: 'left' | 'center' | 'right';
  max_length?: number;
  field_type: FieldType;
  required: boolean;
  mask?: string;
  validation_rule?: string;
  multiline?: boolean;
  auto_resize?: boolean;
  sort_order: number;
  group: FieldGroup;
  default_value?: string;
  test_value?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DocumentTemplate {
  id: string;
  name: string;
  description?: string;
  file_url?: string;
  file_hash: string;
  version: string;
  page_count: number;
  page_width: number; // 595.32 for A4
  page_height: number; // 841.92 for A4
  status: TemplateStatus;
  fields: TemplateField[];
  created_at: string;
  updated_at: string;
  is_built_in?: boolean;
  thumbnail_data?: string;
}

export interface GeneratedDocument {
  id: string;
  template_id: string;
  template_name: string;
  file_name: string;
  created_at: string;
  created_by?: string;
  status: 'draft' | 'completed' | 'archived';
  values: Record<string, string>;
  confidence_scores?: Record<string, number>;
  pdf_data_url?: string;
  pdf_size_bytes?: number;
}

export interface FieldValidationResult {
  isValid: boolean;
  message?: string;
  confidence?: number;
}

export interface DocumentExtractionResult {
  fields: Record<string, { value: string; confidence: number }>;
  summary?: string;
  warnings?: string[];
}
