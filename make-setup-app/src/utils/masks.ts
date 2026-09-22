export const maskCurrency = (value: string | number): string => {
  if (value === undefined || value === null) return '';
  const stringValue = typeof value === 'number' ? value.toFixed(2).replace('.', ',') : value.toString();
  let onlyNumbers = stringValue.replace(/\D/g, '');
  if (!onlyNumbers) return '';
  
  // Convert to integer (cents)
  const intValue = parseInt(onlyNumbers, 10);
  if (isNaN(intValue)) return '';

  const formatted = (intValue / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2
  });

  return formatted; // e.g. R$ 1.500,00
};

export const unmaskCurrency = (value: string | number): number => {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  // Remove everything except numbers, comma, and minus sign
  let cleaned = value.replace(/[^\d,-]/g, '');
  // Replace comma with dot for parseFloat
  cleaned = cleaned.replace(',', '.');
  const floatVal = parseFloat(cleaned);
  return isNaN(floatVal) ? 0 : floatVal;
};

export const maskPlaca = (value: string): string => {
  if (!value) return '';
  // Limit to 7 chars logic
  const cleaned = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().substring(0, 7);
  
  // Format: ABC-1234 or ABC1D23
  if (cleaned.length <= 3) {
    return cleaned;
  }
  
  const letters = cleaned.substring(0, 3).replace(/[^A-Z]/g, ''); // Ensure first 3 are letters
  const remainder = cleaned.substring(3);
  
  // Placa trad: ABC-1234 (all remaining are numbers)
  // Placa mercosul: ABC1D23 (number, letter, number, number)
  // It's safer to just add the hyphen if it's the traditional format, 
  // but to support both, we can just hyphenate after 3 chars if length > 3
  // Mercosul format doesn't technically use the hyphen, but visually many systems use it anyway (ABC-1D23).
  // Let's use the hyphen for both to keep it clean.
  return `${letters}-${remainder}`;
};

export const maskCPF = (value: string): string => {
  if (!value) return '';
  const cleaned = value.replace(/\D/g, '').substring(0, 11);
  return cleaned
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2');
};

export const validateCPF = (cpf: string): boolean => {
  const cleanCPF = cpf.replace(/\D/g, '');
  if (cleanCPF.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(cleanCPF.charAt(9))) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(cleanCPF.charAt(10))) return false;

  return true;
};


export const maskKM = (value: string | number): string => {
  if (value === undefined || value === null) return '';
  const stringValue = value.toString();
  const onlyNumbers = stringValue.replace(/\D/g, '');
  if (!onlyNumbers) return '';

  const formatted = parseInt(onlyNumbers, 10).toLocaleString('pt-BR');
  return `${formatted} km`;
};

export const unmaskKM = (value: string): number => {
  if (!value) return 0;
  const onlyNumbers = value.replace(/\D/g, '');
  return parseInt(onlyNumbers, 10) || 0;
};

export const maskLitros = (value: string | number): string => {
  if (value === undefined || value === null) return '';
  const stringValue = typeof value === 'number' ? value.toFixed(2).replace('.', ',') : value.toString();
  let onlyNumbers = stringValue.replace(/\D/g, '');
  if (!onlyNumbers) return '';
  
  const intValue = parseInt(onlyNumbers, 10);
  if (isNaN(intValue)) return '';

  const formatted = (intValue / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  return `${formatted} L`;
};

export const unmaskLitros = (value: string): number => {
  if (!value) return 0;
  let cleaned = value.replace(/[^\d,]/g, '');
  cleaned = cleaned.replace(',', '.');
  const floatVal = parseFloat(cleaned);
  return isNaN(floatVal) ? 0 : floatVal;
};

export const maskNumbersOnly = (value: string, maxLength?: number): string => {
  if (!value) return '';
  let cleaned = value.replace(/\D/g, '');
  if (maxLength) {
    cleaned = cleaned.substring(0, maxLength);
  }
  return cleaned;
};
