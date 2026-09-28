export type UserRole = 'admin' | 'gestor' | 'vendedor';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  unit: string;
  status: 'active' | 'inactive';
}

export interface DahrujUnit {
  id: string;
  name: string;
  path: string;
  status: 'active' | 'inactive';
  documentCount?: number;
}

export interface DocumentTypeOption {
  id: string;
  name: string;
  code: string;
  description?: string;
  isDefault?: boolean;
}

export interface SharePointConfig {
  tenantId: string;
  clientId: string;
  clientSecretConfigured: boolean;
  siteUrl: string;
  siteName: string;
  driveName: string;
  rootFolder: string;
  autoUpload: boolean;
  includeDateInName: boolean;
  allowAutoCreateUnitFolder: boolean;
  connected: boolean;
  lastConnectedAt?: string;
}

export interface SharePointDocumentRecord {
  id: string;
  fileName: string;
  clientName: string;
  normalizedClientName: string;
  clientCpfCnpj?: string;
  unit: string;
  documentType: string;
  version: string;
  sharepointPath: string;
  webUrl: string;
  directDownloadUrl?: string;
  uploadedAt: string;
  uploadedBy: string;
  status: 'success' | 'failed' | 'pending';
  fileSizeBytes: number;
  driveItemId?: string;
}

export interface SharePointAuditLog {
  id: string;
  timestamp: string;
  action: 'AUTHENTICATE' | 'CHECK_FOLDER' | 'CREATE_FOLDER' | 'CHECK_VERSION' | 'UPLOAD_FILE' | 'TEST_CONNECTION' | 'CONFIG_UPDATE';
  status: 'SUCCESS' | 'ERROR' | 'INFO';
  unit?: string;
  client?: string;
  details: string;
  durationMs?: number;
}

export interface SharePointUploadStep {
  id: string;
  label: string;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  progress?: number;
}
