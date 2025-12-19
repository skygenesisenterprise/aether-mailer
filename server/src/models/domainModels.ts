export interface Domain {
  id: string;
  name: string;
  displayName?: string;
  description?: string;
  isActive: boolean;
  isVerified: boolean;
  dnsRecords?: DnsRecord[];
  mailServerConfig?: MailServerConfig;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}

export interface DnsRecord {
  id: string;
  domainId: string;
  type: "MX" | "TXT" | "A" | "AAAA" | "CNAME" | "SRV";
  name: string;
  value: string;
  ttl: number;
  priority?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MailServerConfig {
  id: string;
  domainId: string;
  host: string;
  port: number;
  protocol: "smtp" | "smtps" | "starttls";
  authType: "none" | "plain" | "login" | "crammd5";
  username?: string;
  password?: string;
  maxConnections: number;
  timeout: number;
  isSecure: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDomainRequest {
  name: string;
  displayName?: string;
  description?: string;
  mailServerConfig?: Omit<
    MailServerConfig,
    "id" | "domainId" | "createdAt" | "updatedAt"
  >;
}

export interface UpdateDomainRequest {
  displayName?: string;
  description?: string;
  isActive?: boolean;
  isVerified?: boolean;
  mailServerConfig?: Partial<
    Omit<MailServerConfig, "id" | "domainId" | "createdAt" | "updatedAt">
  >;
}

export interface DomainListResponse {
  domains: Domain[];
  total: number;
  page: number;
  limit: number;
}

export interface DomainQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  isVerified?: boolean;
  sortBy?: "name" | "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
}
