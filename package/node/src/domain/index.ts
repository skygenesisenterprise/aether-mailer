import {
  ApiResponse,
  Domain,
  CreateDomainRequest,
  UpdateDomainRequest,
  DomainStats,
  DomainQueryParams,
  DnsRecord,
  MailServerConfig,
  Pagination,
  API_ENDPOINTS,
} from "../types/index.js";
import { HttpClient } from "../client/index.js";
import {
  ValidationError,
  DomainNotFoundError,
  DomainExistsError,
  MissingFieldError,
  InvalidDnsRecordError,
  ValidationUtils,
} from "../errors/index.js";

export class DomainService {
  constructor(private client: HttpClient) {}

  // List all domains
  public async listDomains(
    params?: DomainQueryParams,
  ): Promise<ApiResponse<{ domains: Domain[]; pagination: Pagination }>> {
    const queryParams = new URLSearchParams();

    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.search) queryParams.append("search", params.search);
    if (params?.isActive !== undefined)
      queryParams.append("isActive", params.isActive.toString());
    if (params?.isVerified !== undefined)
      queryParams.append("isVerified", params.isVerified.toString());
    if (params?.sortBy) queryParams.append("sortBy", params.sortBy);
    if (params?.sortOrder) queryParams.append("sortOrder", params.sortOrder);

    const url = queryParams.toString()
      ? `${API_ENDPOINTS.DOMAINS}?${queryParams.toString()}`
      : API_ENDPOINTS.DOMAINS;

    try {
      const response = await this.client.get(url);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Get domain by ID
  public async getDomain(id: string): Promise<ApiResponse<Domain>> {
    if (!id || typeof id !== "string") {
      throw new MissingFieldError("Domain ID is required");
    }

    const url = API_ENDPOINTS.DOMAIN.replace(":id", id);

    try {
      const response = await this.client.get(url);
      return response;
    } catch (error) {
      if (
        error instanceof ValidationError &&
        error.message.includes("not found")
      ) {
        throw new DomainNotFoundError(id);
      }
      throw error;
    }
  }

  // Create a new domain
  public async createDomain(
    request: CreateDomainRequest,
  ): Promise<ApiResponse<Domain>> {
    this.validateCreateDomainRequest(request);

    try {
      const response = await this.client.post(API_ENDPOINTS.DOMAINS, request);
      return response;
    } catch (error) {
      if (
        error instanceof ValidationError &&
        error.message.includes("already exists")
      ) {
        throw new DomainExistsError(request.name);
      }
      throw error;
    }
  }

  // Update an existing domain
  public async updateDomain(
    id: string,
    request: UpdateDomainRequest,
  ): Promise<ApiResponse<Domain>> {
    if (!id || typeof id !== "string") {
      throw new MissingFieldError("Domain ID is required");
    }

    this.validateUpdateDomainRequest(request);

    const url = API_ENDPOINTS.DOMAIN.replace(":id", id);

    try {
      const response = await this.client.put(url, request);
      return response;
    } catch (error) {
      if (
        error instanceof ValidationError &&
        error.message.includes("not found")
      ) {
        throw new DomainNotFoundError(id);
      }
      throw error;
    }
  }

  // Delete a domain
  public async deleteDomain(
    id: string,
  ): Promise<ApiResponse<{ message: string }>> {
    if (!id || typeof id !== "string") {
      throw new MissingFieldError("Domain ID is required");
    }

    const url = API_ENDPOINTS.DOMAIN.replace(":id", id);

    try {
      const response = await this.client.delete(url);
      return response;
    } catch (error) {
      if (
        error instanceof ValidationError &&
        error.message.includes("not found")
      ) {
        throw new DomainNotFoundError(id);
      }
      throw error;
    }
  }

  // Verify domain ownership
  public async verifyDomain(id: string): Promise<ApiResponse<Domain>> {
    if (!id || typeof id !== "string") {
      throw new MissingFieldError("Domain ID is required");
    }

    const url = API_ENDPOINTS.DOMAIN_VERIFY.replace(":id", id);

    try {
      const response = await this.client.post(url);
      return response;
    } catch (error) {
      if (
        error instanceof ValidationError &&
        error.message.includes("not found")
      ) {
        throw new DomainNotFoundError(id);
      }
      throw error;
    }
  }

  // Get domain statistics
  public async getDomainStats(): Promise<ApiResponse<DomainStats>> {
    try {
      const response = await this.client.get(API_ENDPOINTS.DOMAIN_STATS);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Check domain availability
  public async checkAvailability(
    name: string,
  ): Promise<
    ApiResponse<{ available: boolean; domain?: string; suggestions?: string[] }>
  > {
    if (!name || typeof name !== "string") {
      throw new MissingFieldError("Domain name is required");
    }

    const validation = ValidationUtils.validateStringLength(
      name,
      "Domain name",
      1,
      253,
    );
    if (!validation.isValid) {
      throw new ValidationError(
        `Invalid domain name: ${validation.errors.join(", ")}`,
      );
    }

    const domainValidation = ValidationUtils.validateDomain(name);
    if (!domainValidation.isValid) {
      throw new ValidationError(
        `Invalid domain name: ${domainValidation.errors.join(", ")}`,
      );
    }

    const queryParams = new URLSearchParams();
    queryParams.append("name", name.toLowerCase().trim());

    const url = `${API_ENDPOINTS.DOMAIN_AVAILABILITY}?${queryParams.toString()}`;

    try {
      const response = await this.client.get(url);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Get DNS records for a domain
  public async getDnsRecords(
    id: string,
  ): Promise<ApiResponse<{ records: DnsRecord[] }>> {
    if (!id || typeof id !== "string") {
      throw new MissingFieldError("Domain ID is required");
    }

    const url = API_ENDPOINTS.DOMAIN_DNS.replace(":id", id);

    try {
      const response = await this.client.get(url);
      return response;
    } catch (error) {
      if (
        error instanceof ValidationError &&
        error.message.includes("not found")
      ) {
        throw new DomainNotFoundError(id);
      }
      throw error;
    }
  }

  // Add DNS record to a domain
  public async addDnsRecord(
    id: string,
    record: Omit<
      DnsRecord,
      "id" | "domainId" | "createdAt" | "updatedAt" | "isActive"
    >,
  ): Promise<ApiResponse<DnsRecord>> {
    if (!id || typeof id !== "string") {
      throw new MissingFieldError("Domain ID is required");
    }

    this.validateDnsRecord(record);

    const url = API_ENDPOINTS.DOMAIN_DNS.replace(":id", id);

    try {
      const response = await this.client.post(url, record);
      return response;
    } catch (error) {
      if (
        error instanceof ValidationError &&
        error.message.includes("not found")
      ) {
        throw new DomainNotFoundError(id);
      }
      throw error;
    }
  }

  // Get mail server configuration for a domain
  public async getMailServerConfig(
    id: string,
  ): Promise<ApiResponse<MailServerConfig>> {
    if (!id || typeof id !== "string") {
      throw new MissingFieldError("Domain ID is required");
    }

    const url = API_ENDPOINTS.DOMAIN_MAIL_CONFIG.replace(":id", id);

    try {
      const response = await this.client.get(url);
      return response;
    } catch (error) {
      if (
        error instanceof ValidationError &&
        error.message.includes("not found")
      ) {
        throw new DomainNotFoundError(id);
      }
      throw error;
    }
  }

  // Update mail server configuration for a domain
  public async updateMailServerConfig(
    id: string,
    config: MailServerConfig,
  ): Promise<ApiResponse<MailServerConfig>> {
    if (!id || typeof id !== "string") {
      throw new MissingFieldError("Domain ID is required");
    }

    this.validateMailServerConfig(config);

    const url = API_ENDPOINTS.DOMAIN_MAIL_CONFIG.replace(":id", id);

    try {
      const response = await this.client.put(url, config);
      return response;
    } catch (error) {
      if (
        error instanceof ValidationError &&
        error.message.includes("not found")
      ) {
        throw new DomainNotFoundError(id);
      }
      throw error;
    }
  }

  // Private validation methods
  private validateCreateDomainRequest(request: CreateDomainRequest): void {
    if (!request) {
      throw new ValidationError("Domain request is required");
    }

    if (!request.name || typeof request.name !== "string") {
      throw new MissingFieldError("name");
    }

    const nameValidation = ValidationUtils.validateStringLength(
      request.name,
      "Domain name",
      1,
      253,
    );
    if (!nameValidation.isValid) {
      throw new ValidationError(
        `Invalid domain name: ${nameValidation.errors.join(", ")}`,
      );
    }

    const domainValidation = ValidationUtils.validateDomain(request.name);
    if (!domainValidation.isValid) {
      throw new ValidationError(
        `Invalid domain name: ${domainValidation.errors.join(", ")}`,
      );
    }

    if (request.displayName) {
      const displayNameValidation = ValidationUtils.validateStringLength(
        request.displayName,
        "Display name",
        0,
        255,
      );
      if (!displayNameValidation.isValid) {
        throw new ValidationError(
          `Invalid display name: ${displayNameValidation.errors.join(", ")}`,
        );
      }
    }

    if (request.description) {
      const descriptionValidation = ValidationUtils.validateStringLength(
        request.description,
        "Description",
        0,
        1000,
      );
      if (!descriptionValidation.isValid) {
        throw new ValidationError(
          `Invalid description: ${descriptionValidation.errors.join(", ")}`,
        );
      }
    }

    if (request.maxUsers !== undefined) {
      if (
        typeof request.maxUsers !== "number" ||
        request.maxUsers < 1 ||
        request.maxUsers > 10000
      ) {
        throw new ValidationError("Max users must be between 1 and 10000");
      }
    }

    if (request.maxEmailsPerDay !== undefined) {
      if (
        typeof request.maxEmailsPerDay !== "number" ||
        request.maxEmailsPerDay < 1 ||
        request.maxEmailsPerDay > 1000000
      ) {
        throw new ValidationError(
          "Max emails per day must be between 1 and 1000000",
        );
      }
    }

    if (request.maxStorageMB !== undefined) {
      if (
        typeof request.maxStorageMB !== "number" ||
        request.maxStorageMB < 1 ||
        request.maxStorageMB > 1000000
      ) {
        throw new ValidationError(
          "Max storage MB must be between 1 and 1000000",
        );
      }
    }
  }

  private validateUpdateDomainRequest(request: UpdateDomainRequest): void {
    if (!request) {
      throw new ValidationError("Domain request is required");
    }

    if (request.displayName !== undefined) {
      const displayNameValidation = ValidationUtils.validateStringLength(
        request.displayName,
        "Display name",
        0,
        255,
      );
      if (!displayNameValidation.isValid) {
        throw new ValidationError(
          `Invalid display name: ${displayNameValidation.errors.join(", ")}`,
        );
      }
    }

    if (request.description !== undefined) {
      const descriptionValidation = ValidationUtils.validateStringLength(
        request.description,
        "Description",
        0,
        1000,
      );
      if (!descriptionValidation.isValid) {
        throw new ValidationError(
          `Invalid description: ${descriptionValidation.errors.join(", ")}`,
        );
      }
    }

    if (request.maxUsers !== undefined) {
      if (
        typeof request.maxUsers !== "number" ||
        request.maxUsers < 1 ||
        request.maxUsers > 10000
      ) {
        throw new ValidationError("Max users must be between 1 and 10000");
      }
    }

    if (request.maxEmailsPerDay !== undefined) {
      if (
        typeof request.maxEmailsPerDay !== "number" ||
        request.maxEmailsPerDay < 1 ||
        request.maxEmailsPerDay > 1000000
      ) {
        throw new ValidationError(
          "Max emails per day must be between 1 and 1000000",
        );
      }
    }

    if (request.maxStorageMB !== undefined) {
      if (
        typeof request.maxStorageMB !== "number" ||
        request.maxStorageMB < 1 ||
        request.maxStorageMB > 1000000
      ) {
        throw new ValidationError(
          "Max storage MB must be between 1 and 1000000",
        );
      }
    }
  }

  private validateDnsRecord(
    record: Omit<
      DnsRecord,
      "id" | "domainId" | "createdAt" | "updatedAt" | "isActive"
    >,
  ): void {
    if (!record) {
      throw new ValidationError("DNS record is required");
    }

    if (!record.type || typeof record.type !== "string") {
      throw new MissingFieldError("type");
    }

    const validTypes = ["A", "AAAA", "MX", "TXT", "CNAME", "SRV", "CAA"];
    if (!validTypes.includes(record.type)) {
      throw new InvalidDnsRecordError(
        record.type,
        `Type must be one of: ${validTypes.join(", ")}`,
      );
    }

    if (!record.name || typeof record.name !== "string") {
      throw new MissingFieldError("name");
    }

    const nameValidation = ValidationUtils.validateStringLength(
      record.name,
      "DNS record name",
      1,
      255,
    );
    if (!nameValidation.isValid) {
      throw new ValidationError(
        `Invalid DNS record name: ${nameValidation.errors.join(", ")}`,
      );
    }

    if (!record.value || typeof record.value !== "string") {
      throw new MissingFieldError("value");
    }

    const valueValidation = ValidationUtils.validateStringLength(
      record.value,
      "DNS record value",
      1,
      65535,
    );
    if (!valueValidation.isValid) {
      throw new ValidationError(
        `Invalid DNS record value: ${valueValidation.errors.join(", ")}`,
      );
    }

    if (record.ttl !== undefined) {
      if (
        typeof record.ttl !== "number" ||
        record.ttl < 1 ||
        record.ttl > 86400
      ) {
        throw new ValidationError("TTL must be between 1 and 86400 seconds");
      }
    }

    if (record.priority !== undefined) {
      if (
        typeof record.priority !== "number" ||
        record.priority < 0 ||
        record.priority > 65535
      ) {
        throw new ValidationError("Priority must be between 0 and 65535");
      }
    }

    // Type-specific validations
    if (record.type === "MX" && record.priority === undefined) {
      throw new ValidationError("MX records require a priority");
    }

    if (record.type === "SRV") {
      if (record.priority === undefined) {
        throw new ValidationError("SRV records require a priority");
      }
      // Additional SRV validation would go here
    }

    if (record.type === "CAA") {
      // Additional CAA validation would go here
    }
  }

  private validateMailServerConfig(config: MailServerConfig): void {
    if (!config) {
      throw new ValidationError("Mail server configuration is required");
    }

    if (!config.host || typeof config.host !== "string") {
      throw new MissingFieldError("host");
    }

    const hostValidation = ValidationUtils.validateStringLength(
      config.host,
      "Host",
      1,
      255,
    );
    if (!hostValidation.isValid) {
      throw new ValidationError(
        `Invalid host: ${hostValidation.errors.join(", ")}`,
      );
    }

    if (
      typeof config.port !== "number" ||
      config.port < 1 ||
      config.port > 65535
    ) {
      throw new ValidationError("Port must be between 1 and 65535");
    }

    if (typeof config.tls !== "boolean") {
      throw new ValidationError("TLS must be a boolean");
    }

    if (!config.auth || typeof config.auth !== "object") {
      throw new MissingFieldError("auth");
    }

    if (!config.auth.username || typeof config.auth.username !== "string") {
      throw new MissingFieldError("auth.username");
    }

    const usernameValidation = ValidationUtils.validateStringLength(
      config.auth.username,
      "Username",
      1,
      255,
    );
    if (!usernameValidation.isValid) {
      throw new ValidationError(
        `Invalid username: ${usernameValidation.errors.join(", ")}`,
      );
    }

    if (!config.auth.password || typeof config.auth.password !== "string") {
      throw new MissingFieldError("auth.password");
    }

    const passwordValidation = ValidationUtils.validateStringLength(
      config.auth.password,
      "Password",
      1,
      255,
    );
    if (!passwordValidation.isValid) {
      throw new ValidationError(
        `Invalid password: ${passwordValidation.errors.join(", ")}`,
      );
    }

    if (config.maxConnections !== undefined) {
      if (
        typeof config.maxConnections !== "number" ||
        config.maxConnections < 1 ||
        config.maxConnections > 1000
      ) {
        throw new ValidationError("Max connections must be between 1 and 1000");
      }
    }

    if (config.timeout !== undefined) {
      if (
        typeof config.timeout !== "number" ||
        config.timeout < 1000 ||
        config.timeout > 300000
      ) {
        throw new ValidationError(
          "Timeout must be between 1000ms and 300000ms",
        );
      }
    }
  }
}
