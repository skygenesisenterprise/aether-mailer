export class Validator {
  static isEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static isDomain(domain: string): boolean {
    const domainRegex = /^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/i;
    return domainRegex.test(domain);
  }

  static isUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  static isPositiveNumber(value: any): boolean {
    const num = Number(value);
    return !isNaN(num) && num > 0;
  }

  static isBoolean(value: any): boolean {
    return value === 'true' || value === 'false' || typeof value === 'boolean';
  }

  static toBoolean(value: any): boolean {
    if (typeof value === 'boolean') return value;
    return value === 'true';
  }

  static isValidStatus(status: string): boolean {
    return ['active', 'inactive', 'suspended'].includes(status);
  }

  static isValidLogLevel(level: string): boolean {
    return ['error', 'warn', 'info', 'debug'].includes(level);
  }

  static isValidFormat(format: string): boolean {
    return ['table', 'json', 'csv', 'text', 'prometheus'].includes(format);
  }

  static isValidService(service: string): boolean {
    return ['api', 'smtp', 'imap', 'all'].includes(service);
  }

  static isValidMetricType(type: string): boolean {
    return ['system', 'email', 'users', 'all'].includes(type);
  }

  static isValidBackupType(type: string): boolean {
    return ['full', 'incremental'].includes(type);
  }

  static validateRequired(value: any, fieldName: string): void {
    if (value === undefined || value === null || value === '') {
      throw new Error(`${fieldName} is required`);
    }
  }

  static validateEmail(email: string): void {
    if (!this.isEmail(email)) {
      throw new Error(`Invalid email address: ${email}`);
    }
  }

  static validateDomain(domain: string): void {
    if (!this.isDomain(domain)) {
      throw new Error(`Invalid domain: ${domain}`);
    }
  }

  static validateUrl(url: string): void {
    if (!this.isUrl(url)) {
      throw new Error(`Invalid URL: ${url}`);
    }
  }

  static validatePositiveNumber(value: any, fieldName: string): void {
    if (!this.isPositiveNumber(value)) {
      throw new Error(`${fieldName} must be a positive number`);
    }
  }

  static validateStatus(status: string): void {
    if (!this.isValidStatus(status)) {
      throw new Error(`Invalid status: ${status}. Must be one of: active, inactive, suspended`);
    }
  }

  static validateFormat(format: string): void {
    if (!this.isValidFormat(format)) {
      throw new Error(`Invalid format: ${format}. Must be one of: table, json, csv, text, prometheus`);
    }
  }
}

export default Validator;
