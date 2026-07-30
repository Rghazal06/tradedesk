export function sanitizeString(str: string, maxLength = 500): string {
  if (!str || typeof str !== 'string') return '';
  return str.trim().slice(0, maxLength);
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePhone(phone: string): boolean {
  return /^[\d\s\-\+\(\)]{7,15}$/.test(phone);
}

export function validateAmount(amount: any): number {
  const num = parseFloat(amount);
  if (isNaN(num) || num < 0 || num > 1000000) return 0;
  return Math.round(num * 100) / 100;
}
