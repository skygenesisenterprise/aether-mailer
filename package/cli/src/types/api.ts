export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  domain: string;
  quota: number;
  status: 'active' | 'inactive' | 'suspended';
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Domain {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  defaultQuota: number;
  userCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ServerStatus {
  status: 'online' | 'offline' | 'degraded';
  uptime: number;
  version: string;
  services: {
    api: boolean;
    smtp: boolean;
    imap: boolean;
    database: boolean;
    redis?: boolean;
  };
}

export interface HealthCheck {
  service: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  message?: string;
  responseTime?: number;
}

export interface LogEntry {
  timestamp: string;
  level: 'error' | 'warn' | 'info' | 'debug';
  service: string;
  message: string;
  metadata?: any;
}

export interface Metrics {
  system?: {
    cpu: number;
    memory: number;
    disk: number;
  };
  email?: {
    sent: number;
    received: number;
    queued: number;
    failed: number;
  };
  users?: {
    total: number;
    active: number;
    inactive: number;
  };
}

export interface Backup {
  id: string;
  type: 'full' | 'incremental';
  size: number;
  path: string;
  createdAt: string;
  compressed: boolean;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  name?: string;
  domain?: string;
  quota?: number;
  active?: boolean;
  isAdmin?: boolean;
}

export interface UpdateUserRequest {
  password?: string;
  name?: string;
  quota?: number;
  status?: 'active' | 'inactive' | 'suspended';
  isAdmin?: boolean;
}

export interface CreateDomainRequest {
  name: string;
  description?: string;
  active?: boolean;
  defaultQuota?: number;
}
