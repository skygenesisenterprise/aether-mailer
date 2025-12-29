import { REGEX } from "../types/index.js";
import { ValidationResult, EmailValidationResult } from "../types/index.js";

// Email validation utilities
export class EmailValidator {
  // Basic RFC 5322 email format validation
  public static isValidFormat(email: string): boolean {
    if (!email || typeof email !== "string") {
      return false;
    }
    return REGEX.EMAIL.test(email.trim().toLowerCase());
  }

  // Extract domain from email address
  public static extractDomain(email: string): string {
    const cleanEmail = email.trim().toLowerCase();
    const atIndex = cleanEmail.lastIndexOf("@");
    if (atIndex === -1 || atIndex === cleanEmail.length - 1) {
      return "";
    }
    return cleanEmail.slice(atIndex + 1);
  }

  // Validate email format and structure
  public static validateFormat(email: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    if (!email) {
      errors.push("Email address is required");
      return { isValid: false, errors, warnings, suggestions };
    }

    if (typeof email !== "string") {
      errors.push("Email must be a string");
      return { isValid: false, errors, warnings, suggestions };
    }

    const trimmedEmail = email.trim();

    if (trimmedEmail !== email) {
      warnings.push("Email address has leading/trailing whitespace");
      suggestions.push(`Use: "${trimmedEmail}"`);
    }

    if (trimmedEmail.length > 254) {
      errors.push("Email address is too long (max 254 characters)");
    }

    if (!REGEX.EMAIL.test(trimmedEmail)) {
      errors.push("Invalid email format");

      // Common issues and suggestions
      if (trimmedEmail.includes("..")) {
        suggestions.push("Remove consecutive dots");
      }

      if (trimmedEmail.startsWith(".") || trimmedEmail.endsWith(".")) {
        suggestions.push("Remove leading or trailing dots");
      }

      if (!trimmedEmail.includes("@")) {
        suggestions.push("Add @ symbol");
      }

      if (trimmedEmail.split("@").length > 2) {
        suggestions.push("Only one @ symbol is allowed");
      }
    }

    const domain = this.extractDomain(trimmedEmail);

    // Check for common disposable email providers
    if (this.isDisposableProvider(domain)) {
      warnings.push("Using disposable email provider");
    }

    // Check for common free email providers
    if (this.isFreeProvider(domain)) {
      warnings.push("Using free email provider");
    }

    const isValid = errors.length === 0;
    return { isValid, errors, warnings, suggestions };
  }

  // Comprehensive email validation
  public static async validate(email: string): Promise<EmailValidationResult> {
    const formatValidation = this.validateFormat(email);

    if (!formatValidation.isValid) {
      return {
        ...formatValidation,
        email,
        domain: this.extractDomain(email),
        isDisposable: false,
        isFreeProvider: false,
        hasMxRecords: false,
      };
    }

    const domain = this.extractDomain(email);
    const isDisposable = this.isDisposableProvider(domain);
    const isFreeProvider = this.isFreeProvider(domain);

    // Check domain validity
    const domainValidation = this.validateDomain(domain);
    let hasMxRecords = false;
    let mxRecords: string[] = [];

    try {
      // Note: In a real implementation, you would perform DNS lookup here
      // For now, we'll simulate it
      const dnsResult = await this.checkMxRecords(domain);
      hasMxRecords = dnsResult.hasRecords;
      mxRecords = dnsResult.records;
    } catch (error) {
      domainValidation.warnings.push("Could not verify MX records");
    }

    const allErrors = [...formatValidation.errors, ...domainValidation.errors];
    const allWarnings = [
      ...formatValidation.warnings,
      ...domainValidation.warnings,
    ];
    const allSuggestions = [
      ...formatValidation.suggestions,
      ...domainValidation.suggestions,
    ];

    return {
      isValid: allErrors.length === 0 && hasMxRecords,
      errors: allErrors,
      warnings: allWarnings,
      suggestions: allSuggestions,
      email,
      domain,
      isDisposable,
      isFreeProvider,
      hasMxRecords,
      mxRecords,
    };
  }

  // Validate domain name
  public static validateDomain(domain: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    if (!domain) {
      errors.push("Domain is required");
      return { isValid: false, errors, warnings, suggestions };
    }

    const trimmedDomain = domain.trim().toLowerCase();

    if (trimmedDomain !== domain) {
      warnings.push("Domain has leading/trailing whitespace");
      suggestions.push(`Use: "${trimmedDomain}"`);
    }

    if (trimmedDomain.length > 253) {
      errors.push("Domain is too long (max 253 characters)");
    }

    if (!REGEX.DOMAIN.test(trimmedDomain)) {
      errors.push("Invalid domain format");

      if (trimmedDomain.startsWith("-") || trimmedDomain.endsWith("-")) {
        suggestions.push("Domain cannot start or end with hyphen");
      }

      if (trimmedDomain.includes("--")) {
        suggestions.push("Avoid consecutive hyphens in domain");
      }

      if (!trimmedDomain.includes(".")) {
        suggestions.push("Domain should include at least one dot");
      }
    }

    // Check for TLD
    const lastDot = trimmedDomain.lastIndexOf(".");
    if (lastDot === -1 || lastDot === trimmedDomain.length - 1) {
      errors.push("Domain must have a top-level domain (TLD)");
    }

    const tld = trimmedDomain.slice(lastDot + 1);
    if (tld.length < 2) {
      errors.push("TLD is too short (min 2 characters)");
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
    };
  }

  // Check if domain is from disposable email provider
  public static isDisposableProvider(domain: string): boolean {
    const disposableProviders = [
      "10minutemail.com",
      "tempmail.org",
      "guerrillamail.com",
      "mailinator.com",
      "yopmail.com",
      "throwaway.email",
      "temp-mail.org",
      "maildrop.cc",
      "mailcatch.com",
      "mohmal.com",
      "tempmail.net",
      "coolmail.com",
      "mailtemp.com",
      "temp-mail.com",
      "fakemail.com",
      "spam4.me",
      "discard.email",
      "tempmailaddress.com",
      "mailpoof.com",
      "yomail.info",
    ];

    return disposableProviders.some((provider) => domain.endsWith(provider));
  }

  // Check if domain is from free email provider
  public static isFreeProvider(domain: string): boolean {
    const freeProviders = [
      "gmail.com",
      "yahoo.com",
      "hotmail.com",
      "outlook.com",
      "aol.com",
      "icloud.com",
      "protonmail.com",
      "tutanota.com",
      "zoho.com",
      "gmx.com",
      "mail.com",
      "inbox.com",
      "yandex.com",
      "qq.com",
      "163.com",
      "sina.com",
      "126.com",
      "yeah.net",
      "foxmail.com",
      "mail.ru",
      "web.de",
      "gmx.net",
      "t-online.de",
      "freemail.hu",
      "citromail.hu",
    ];

    return freeProviders.some((provider) => domain === provider);
  }

  // Simulate MX record lookup
  private static async checkMxRecords(
    domain: string,
  ): Promise<{ hasRecords: boolean; records: string[] }> {
    // In a real implementation, you would use a DNS library like 'dns' or 'node-dns'
    // For now, we'll simulate a basic check

    // Common domains that usually have MX records
    const knownMxDomains = [
      "gmail.com",
      "yahoo.com",
      "outlook.com",
      "hotmail.com",
      "aol.com",
      "icloud.com",
      "example.com",
    ];

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 10));

    const hasRecords =
      knownMxDomains.some((known) => domain === known) ||
      !this.isDisposableProvider(domain);

    const records = hasRecords ? [`mx1.${domain}`, `mx2.${domain}`] : [];

    return { hasRecords, records };
  }

  // Normalize email address
  public static normalize(email: string): string {
    if (!email || typeof email !== "string") {
      return "";
    }

    return email.trim().toLowerCase();
  }

  // Batch validate multiple emails
  public static async validateMultiple(
    emails: string[],
  ): Promise<EmailValidationResult[]> {
    const promises = emails.map((email) => this.validate(email));
    return Promise.all(promises);
  }

  // Extract emails from text
  public static extractFromText(text: string): string[] {
    if (!text || typeof text !== "string") {
      return [];
    }

    const emailRegex = REGEX.EMAIL;
    const matches = text.match(emailRegex);

    if (!matches) {
      return [];
    }

    // Remove duplicates and normalize
    const uniqueEmails = [
      ...new Set(matches.map((email) => this.normalize(email))),
    ];
    return uniqueEmails;
  }
}

// Utility functions for general validation
export class ValidationUtils {
  // Validate required fields
  public static validateRequired(
    obj: Record<string, any>,
    requiredFields: string[],
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    for (const field of requiredFields) {
      if (
        obj[field] === undefined ||
        obj[field] === null ||
        obj[field] === ""
      ) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
    };
  }

  // Validate domain name (delegate to EmailValidator)
  public static validateDomain(domain: string): ValidationResult {
    return EmailValidator.validateDomain(domain);
  }

  // Validate string length
  public static validateStringLength(
    value: string,
    fieldName: string,
    minLength: number = 0,
    maxLength: number = Infinity,
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    if (value === undefined || value === null) {
      errors.push(`${fieldName} is required`);
      return { isValid: false, errors, warnings, suggestions };
    }

    if (typeof value !== "string") {
      errors.push(`${fieldName} must be a string`);
      return { isValid: false, errors, warnings, suggestions };
    }

    const length = value.length;

    if (length < minLength) {
      errors.push(`${fieldName} is too short (min ${minLength} characters)`);
    }

    if (length > maxLength) {
      errors.push(`${fieldName} is too long (max ${maxLength} characters)`);
    }

    if (length > 0 && value.trim() !== value) {
      warnings.push(`${fieldName} has leading/trailing whitespace`);
      suggestions.push(`Consider trimming: "${value.trim()}"`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
    };
  }

  // Validate URL
  public static validateUrl(
    url: string,
    fieldName: string = "URL",
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    if (!url) {
      errors.push(`${fieldName} is required`);
      return { isValid: false, errors, warnings, suggestions };
    }

    try {
      new URL(url);
    } catch {
      errors.push(`${fieldName} is not a valid URL`);
      suggestions.push("Include protocol (http:// or https://)");
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
    };
  }

  // Validate API key format
  public static validateApiKey(apiKey: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    if (!apiKey) {
      errors.push("API key is required");
      return { isValid: false, errors, warnings, suggestions };
    }

    if (!REGEX.API_KEY.test(apiKey)) {
      errors.push("Invalid API key format");
      suggestions.push("Expected format: sk_{env}_{32_char_string}");
      suggestions.push(
        "Examples: sk_live_abcdef1234567890abcdef1234567890, sk_test_1234567890abcdef1234567890abcdef",
      );
    }

    const env = apiKey.split("_")[1];
    if (env && !["live", "test", "sys"].includes(env)) {
      errors.push("Invalid API key environment");
      suggestions.push("Environment must be one of: live, test, sys");
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
    };
  }

  // Validate JWT format
  public static validateJwt(token: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    if (!token) {
      errors.push("JWT token is required");
      return { isValid: false, errors, warnings, suggestions };
    }

    if (!REGEX.JWT.test(token)) {
      errors.push("Invalid JWT format");
      suggestions.push("JWT should have 3 parts separated by dots");
    }

    try {
      const parts = token.split(".");
      if (parts.length !== 3) {
        errors.push("JWT must have exactly 3 parts");
      }

      // Try to decode header and payload
      JSON.parse(atob(parts[0]));
      JSON.parse(atob(parts[1]));
    } catch {
      errors.push("JWT contains invalid base64 encoding");
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
    };
  }
}
