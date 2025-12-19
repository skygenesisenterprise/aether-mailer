import type {
  Domain,
  CreateDomainRequest,
  UpdateDomainRequest,
  DomainListResponse,
  DomainQueryParams,
  DnsRecord,
  MailServerConfig,
} from "../models/domainModels.js";

// Mock database for demonstration - replace with actual database implementation
let domains: Domain[] = [
  {
    id: "1",
    name: "example.com",
    displayName: "Example Domain",
    description: "Primary example domain",
    isActive: true,
    isVerified: true,
    dnsRecords: [],
    mailServerConfig: {
      id: "mail-1",
      domainId: "1",
      host: "mail.example.com",
      port: 587,
      protocol: "starttls",
      authType: "plain",
      username: "postmaster@example.com",
      password: "encrypted-password",
      maxConnections: 10,
      timeout: 30000,
      isSecure: true,
      isActive: true,
      createdAt: new Date("2025-01-01"),
      updatedAt: new Date("2025-01-01"),
    },
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
    createdBy: "admin",
  },
  {
    id: "2",
    name: "test.org",
    displayName: "Test Organization",
    description: "Testing domain for development",
    isActive: false,
    isVerified: false,
    dnsRecords: [],
    createdAt: new Date("2025-01-15"),
    updatedAt: new Date("2025-01-15"),
    createdBy: "admin",
  },
];

let nextId = 3;

export class DomainService {
  /**
   * Get all domains with optional filtering and pagination
   */
  async getAllDomains(
    params: DomainQueryParams = {},
  ): Promise<DomainListResponse> {
    const {
      page = 1,
      limit = 10,
      search,
      isActive,
      isVerified,
      sortBy = "name",
      sortOrder = "asc",
    } = params;

    let filteredDomains = [...domains];

    // Apply filters
    if (search) {
      filteredDomains = filteredDomains.filter(
        (domain) =>
          domain.name.toLowerCase().includes(search.toLowerCase()) ||
          domain.displayName?.toLowerCase().includes(search.toLowerCase()) ||
          domain.description?.toLowerCase().includes(search.toLowerCase()),
      );
    }

    if (isActive !== undefined) {
      filteredDomains = filteredDomains.filter(
        (domain) => domain.isActive === isActive,
      );
    }

    if (isVerified !== undefined) {
      filteredDomains = filteredDomains.filter(
        (domain) => domain.isVerified === isVerified,
      );
    }

    // Sort domains
    filteredDomains.sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];

      if (aValue instanceof Date && bValue instanceof Date) {
        return sortOrder === "asc"
          ? aValue.getTime() - bValue.getTime()
          : bValue.getTime() - aValue.getTime();
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortOrder === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (typeof aValue === "boolean" && typeof bValue === "boolean") {
        return sortOrder === "asc" ? (aValue ? 1 : -1) : bValue ? 1 : -1;
      }

      return 0;
    });

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedDomains = filteredDomains.slice(startIndex, endIndex);

    return {
      domains: paginatedDomains,
      total: filteredDomains.length,
      page,
      limit,
    };
  }

  /**
   * Get domain by ID
   */
  async getDomainById(id: string): Promise<Domain | null> {
    const domain = domains.find((d) => d.id === id);
    return domain || null;
  }

  /**
   * Create a new domain
   */
  async createDomain(
    data: CreateDomainRequest,
    createdBy?: string,
  ): Promise<Domain> {
    // Check if domain name already exists
    const existingDomain = domains.find(
      (d) => d.name.toLowerCase() === data.name.toLowerCase(),
    );
    if (existingDomain) {
      throw new Error("Domain with this name already exists");
    }

    const newDomain: Domain = {
      id: nextId.toString(),
      name: data.name.toLowerCase(),
      displayName: data.displayName,
      description: data.description,
      isActive: true,
      isVerified: false,
      dnsRecords: [],
      mailServerConfig: data.mailServerConfig
        ? {
            id: `mail-${nextId}`,
            domainId: nextId.toString(),
            ...data.mailServerConfig,
            createdAt: new Date(),
            updatedAt: new Date(),
          }
        : undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy,
    };

    domains.push(newDomain);
    nextId++;

    return newDomain;
  }

  /**
   * Update an existing domain
   */
  async updateDomain(
    id: string,
    data: UpdateDomainRequest,
    updatedBy?: string,
  ): Promise<Domain | null> {
    const domainIndex = domains.findIndex((d) => d.id === id);
    if (domainIndex === -1) {
      return null;
    }

    const existingDomain = domains[domainIndex];
    const updatedDomain: Domain = {
      ...existingDomain,
      displayName: data.displayName ?? existingDomain.displayName,
      description: data.description ?? existingDomain.description,
      isActive: data.isActive ?? existingDomain.isActive,
      isVerified: data.isVerified ?? existingDomain.isVerified,
      updatedAt: new Date(),
      updatedBy,
    };

    // Handle mail server config update if provided
    if (data.mailServerConfig && updatedDomain.mailServerConfig) {
      updatedDomain.mailServerConfig = {
        ...updatedDomain.mailServerConfig,
        ...data.mailServerConfig,
        updatedAt: new Date(),
      };
    }

    domains[domainIndex] = updatedDomain;
    return updatedDomain;
  }

  /**
   * Delete a domain
   */
  async deleteDomain(id: string): Promise<boolean> {
    const domainIndex = domains.findIndex((d) => d.id === id);
    if (domainIndex === -1) {
      return false;
    }

    domains.splice(domainIndex, 1);
    return true;
  }

  /**
   * Verify domain ownership (mock implementation)
   */
  async verifyDomain(id: string): Promise<Domain | null> {
    const domain = await this.getDomainById(id);
    if (!domain) {
      return null;
    }

    // Mock verification - in real implementation, this would check DNS records
    const updatedDomain = await this.updateDomain(id, { isVerified: true });
    return updatedDomain;
  }

  /**
   * Get domain statistics
   */
  async getDomainStats(): Promise<{
    total: number;
    active: number;
    verified: number;
    inactive: number;
    unverified: number;
  }> {
    const total = domains.length;
    const active = domains.filter((d) => d.isActive).length;
    const verified = domains.filter((d) => d.isVerified).length;
    const inactive = total - active;
    const unverified = total - verified;

    return {
      total,
      active,
      verified,
      inactive,
      unverified,
    };
  }

  /**
   * Check if domain name is available
   */
  async checkDomainAvailability(
    name: string,
  ): Promise<{ available: boolean; reason?: string }> {
    const normalizedName = name.toLowerCase();
    const existingDomain = domains.find(
      (d) => d.name.toLowerCase() === normalizedName,
    );

    if (existingDomain) {
      return {
        available: false,
        reason: "Domain name is already registered",
      };
    }

    // Basic domain validation
    const domainRegex =
      /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/;
    if (!domainRegex.test(normalizedName)) {
      return {
        available: false,
        reason: "Invalid domain name format",
      };
    }

    return { available: true };
  }

  /**
   * Add DNS record to domain
   */
  async addDnsRecord(
    domainId: string,
    record: Omit<DnsRecord, "id" | "domainId" | "createdAt" | "updatedAt">,
  ): Promise<DnsRecord | null> {
    const domain = await this.getDomainById(domainId);
    if (!domain) {
      return null;
    }

    const newRecord: DnsRecord = {
      id: `dns-${Date.now()}`,
      domainId,
      ...record,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (!domain.dnsRecords) {
      domain.dnsRecords = [];
    }
    domain.dnsRecords.push(newRecord);

    return newRecord;
  }

  /**
   * Update mail server configuration
   */
  async updateMailServerConfig(
    domainId: string,
    config: Partial<MailServerConfig>,
  ): Promise<MailServerConfig | null> {
    const domain = await this.getDomainById(domainId);
    if (!domain) {
      return null;
    }

    if (!domain.mailServerConfig) {
      // Create new mail server config
      domain.mailServerConfig = {
        id: `mail-${Date.now()}`,
        domainId,
        host: config.host || "",
        port: config.port || 587,
        protocol: config.protocol || "starttls",
        authType: config.authType || "plain",
        maxConnections: config.maxConnections || 10,
        timeout: config.timeout || 30000,
        isSecure: config.isSecure ?? true,
        isActive: config.isActive ?? true,
        username: config.username,
        password: config.password,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } else {
      // Update existing config
      domain.mailServerConfig = {
        ...domain.mailServerConfig,
        ...config,
        updatedAt: new Date(),
      };
    }

    domain.updatedAt = new Date();
    return domain.mailServerConfig;
  }
}
