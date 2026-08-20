/**
 * Brazilian input masks and strict verification algorithms for PREENCHENDO AI
 */

import { FieldType, FieldValidationResult } from '../types/document';

// --- Helper to check if field is filled with filler dashes or exempted ---
export function isDashFiller(val: string): boolean {
  if (!val) return false;
  const trimmed = val.trim();
  return /^[-–—_\s/NnAa.EeXx]+$/.test(trimmed) || trimmed.startsWith('-') || /^isento$/i.test(trimmed) || /^sem$/i.test(trimmed);
}

// --- CPF Checksum Validation (Algorithm Mod 11) ---
export function validateCPF(cpfRaw: string): boolean {
  if (!cpfRaw) return false;
  if (isDashFiller(cpfRaw)) return true;
  const cpf = cpfRaw.replace(/\D/g, '');
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false; // Reject all identical digits

  let sum = 0;
  let remainder: number;

  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cpf.substring(i - 1, i), 10) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.substring(9, 10), 10)) return false;

  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cpf.substring(i - 1, i), 10) * (12 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.substring(10, 11), 10)) return false;

  return true;
}

// --- CNPJ Checksum Validation (Algorithm Mod 11) ---
export function validateCNPJ(cnpjRaw: string): boolean {
  if (!cnpjRaw) return false;
  if (isDashFiller(cnpjRaw)) return true;
  const cnpj = cnpjRaw.replace(/\D/g, '');
  if (cnpj.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(cnpj)) return false;

  let length = cnpj.length - 2;
  let numbers = cnpj.substring(0, length);
  const digits = cnpj.substring(length);
  let sum = 0;
  let pos = length - 7;

  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i), 10) * pos--;
    if (pos < 2) pos = 9;
  }

  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0), 10)) return false;

  length = length + 1;
  numbers = cnpj.substring(0, length);
  sum = 0;
  pos = length - 7;

  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i), 10) * pos--;
    if (pos < 2) pos = 9;
  }

  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1), 10)) return false;

  return true;
}

// --- Placa Validation (Mercosul or Traditional) ---
export function validatePlaca(placaRaw: string): boolean {
  if (!placaRaw) return false;
  if (isDashFiller(placaRaw)) return true;
  const clean = placaRaw.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  if (clean.length !== 7) return false;
  // Traditional: ABC1234
  const traditional = /^[A-Z]{3}[0-9]{4}$/;
  // Mercosul: ABC1D23
  const mercosul = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/;
  return traditional.test(clean) || mercosul.test(clean);
}

// --- Chassi Validation ---
export function validateChassi(chassiRaw: string): boolean {
  if (!chassiRaw) return false;
  if (isDashFiller(chassiRaw)) return true;
  const clean = chassiRaw.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  // Standard VIN/Chassi is 17 alphanumeric characters, excluding I, O, Q
  if (clean.length !== 17) return false;
  if (/[IOQ]/i.test(clean)) return false;
  return true;
}

// --- Email Validation ---
export function validateEmail(email: string): boolean {
  if (!email) return false;
  if (isDashFiller(email)) return true;
  return /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email.trim());
}

// --- CEP Validation ---
export function validateCEP(cepRaw: string): boolean {
  if (!cepRaw) return false;
  if (isDashFiller(cepRaw)) return true;
  const clean = cepRaw.replace(/\D/g, '');
  return clean.length === 8;
}

// --- Phone Validation ---
export function validatePhone(phoneRaw: string): boolean {
  if (!phoneRaw) return false;
  if (isDashFiller(phoneRaw)) return true;
  const clean = phoneRaw.replace(/\D/g, '');
  return clean.length === 10 || clean.length === 11;
}

// --- Generic Field Validator ---
export function validateField(type: FieldType, value: string, required: boolean): FieldValidationResult {
  const trimmed = (value || '').trim();

  if (required && !trimmed) {
    return { isValid: false, message: 'Campo obrigatório' };
  }

  if (!trimmed) {
    return { isValid: true };
  }

  // Allow dashed fillers (e.g. ----) in any field / lacuna
  if (isDashFiller(trimmed)) {
    return { isValid: true };
  }

  switch (type) {
    case 'cpf':
      return validateCPF(trimmed)
        ? { isValid: true }
        : { isValid: false, message: 'CPF inválido (dígitos verificadores incorretos)' };
    case 'cnpj':
      return validateCNPJ(trimmed)
        ? { isValid: true }
        : { isValid: false, message: 'CNPJ inválido (dígitos verificadores incorretos)' };
    case 'plate':
      return validatePlaca(trimmed)
        ? { isValid: true }
        : { isValid: false, message: 'Placa deve ser Mercosul (ABC1D23) ou Padrão (ABC1234)' };
    case 'chassis':
      return validateChassi(trimmed)
        ? { isValid: true }
        : { isValid: false, message: 'Chassi deve conter 17 caracteres alfanuméricos válidos' };
    case 'email':
      return validateEmail(trimmed)
        ? { isValid: true }
        : { isValid: false, message: 'Formato de e-mail inválido' };
    case 'cep':
      return validateCEP(trimmed)
        ? { isValid: true }
        : { isValid: false, message: 'CEP deve ter 8 dígitos' };
    case 'phone':
    case 'whatsapp':
      return validatePhone(trimmed)
        ? { isValid: true }
        : { isValid: false, message: 'Telefone deve conter DDD + 8 ou 9 dígitos' };
    default:
      return { isValid: true };
  }
}

// --- Input Masking Helpers ---
export function applyMask(type: FieldType, rawValue: string): string {
  if (!rawValue) return '';
  
  // Do not format if the user is inputting dashes/fillers like ---- or -
  if (isDashFiller(rawValue) || rawValue.includes('-') && rawValue.replace(/\D/g, '').length === 0) {
    return rawValue;
  }

  const digitsOnly = rawValue.replace(/\D/g, '');

  switch (type) {
    case 'cpf': {
      const d = digitsOnly.slice(0, 11);
      if (d.length <= 3) return d;
      if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
      if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
      return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9, 11)}`;
    }
    case 'cnpj': {
      const d = digitsOnly.slice(0, 14);
      if (d.length <= 2) return d;
      if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
      if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
      if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
      return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12, 14)}`;
    }
    case 'cep': {
      const d = digitsOnly.slice(0, 8);
      if (d.length <= 5) return d;
      return `${d.slice(0, 5)}-${d.slice(5, 8)}`;
    }
    case 'phone':
    case 'whatsapp': {
      const d = digitsOnly.slice(0, 11);
      if (d.length === 0) return '';
      if (d.length <= 2) return `(${d}`;
      if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
      if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
      return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7, 11)}`;
    }
    case 'plate': {
      const clean = rawValue.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 7);
      return clean;
    }
    case 'chassis': {
      return rawValue.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 17);
    }
    case 'date': {
      const d = digitsOnly.slice(0, 8);
      if (d.length <= 2) return d;
      if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
      return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4, 8)}`;
    }
    default:
      return rawValue;
  }
}
