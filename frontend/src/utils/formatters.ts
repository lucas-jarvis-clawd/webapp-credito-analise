/**
 * Utilitários para formatação de dados
 */

// Formatação monetária
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

// Formatação de porcentagem
export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

// Formatação de números
export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('pt-BR').format(value);
};

// Formatação de CPF/CNPJ
export const formatDocument = (document: string): string => {
  const cleaned = document.replace(/\D/g, '');
  
  if (cleaned.length === 11) {
    // CPF
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  } else if (cleaned.length === 14) {
    // CNPJ
    return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
  
  return document;
};

// Formatação de telefone
export const formatPhone = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  
  return phone;
};

// Formatação de data
export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('pt-BR').format(date);
};

// Formatação de data e hora
export const formatDateTime = (date: Date): string => {
  return new Intl.DateTimeFormat('pt-BR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

// Formatação de tempo relativo
export const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (minutes < 60) {
    return `há ${minutes} minutos`;
  } else if (hours < 24) {
    return `há ${hours} horas`;
  } else {
    return `há ${days} dias`;
  }
};

// Abreviação de nomes
export const abbreviateName = (name: string): string => {
  const parts = name.split(' ');
  if (parts.length <= 2) return name;
  
  return `${parts[0]} ${parts[parts.length - 1]}`;
};

// Formatação de score com cor
export const getScoreInfo = (score: number) => {
  if (score >= 800) {
    return { level: 'Excelente', color: '#4caf50' };
  } else if (score >= 700) {
    return { level: 'Muito Bom', color: '#8bc34a' };
  } else if (score >= 600) {
    return { level: 'Bom', color: '#ffc107' };
  } else if (score >= 500) {
    return { level: 'Regular', color: '#ff9800' };
  } else {
    return { level: 'Ruim', color: '#f44336' };
  }
};

// Validação de CPF
export const isValidCPF = (cpf: string): boolean => {
  const cleaned = cpf.replace(/\D/g, '');
  
  if (cleaned.length !== 11) return false;
  if (/^(.)\1*$/.test(cleaned)) return false;
  
  let sum = 0;
  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cleaned.substring(i - 1, i)) * (11 - i);
  }
  
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleaned.substring(9, 10))) return false;
  
  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cleaned.substring(i - 1, i)) * (12 - i);
  }
  
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleaned.substring(10, 11))) return false;
  
  return true;
};

// Máscara para inputs
export const applyMask = (value: string, mask: string): string => {
  let result = '';
  let valueIndex = 0;
  
  for (let i = 0; i < mask.length && valueIndex < value.length; i++) {
    if (mask[i] === '#') {
      result += value[valueIndex];
      valueIndex++;
    } else {
      result += mask[i];
    }
  }
  
  return result;
};