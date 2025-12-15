import { PrismaClient } from "@prisma/client";
import ConfigManager from "../config";

export class DatabaseManager {
  private static instance: DatabaseManager;
  private prisma: PrismaClient;
  private config: ConfigManager;

  private constructor() {
    this.config = ConfigManager.getInstance();
    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url: this.config.getDatabaseConfig().url,
        },
      },
      log: ["error", "warn"],
    });
  }

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  public getClient(): PrismaClient {
    return this.prisma;
  }

  public async connect(): Promise<void> {
    try {
      await this.prisma.$connect();
      console.log("Database connected successfully");
    } catch (error) {
      console.error("Failed to connect to database:", error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await this.prisma.$disconnect();
      console.log("Database disconnected successfully");
    } catch (error) {
      console.error("Failed to disconnect from database:", error);
      throw error;
    }
  }

  public async healthCheck(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      console.error("Database health check failed:", error);
      return false;
    }
  }

  public async transaction<T>(
    callback: (tx: PrismaClient) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(callback);
  }

  public async createUser(data: {
    email: string;
    username: string;
    password: string;
    firstName?: string;
    lastName?: string;
    role?: string;
  }) {
    return this.prisma.user.create({
      data,
    });
  }

  public async findUserByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  public async findUserByUsername(username: string) {
    return this.prisma.user.findUnique({
      where: { username },
    });
  }

  public async createDomain(data: {
    name: string;
    ownerId: string;
    maxUsers?: number;
  }) {
    return this.prisma.domain.create({
      data,
    });
  }

  public async findDomainByName(name: string) {
    return this.prisma.domain.findUnique({
      where: { name },
    });
  }

  public async createEmailAccount(data: {
    email: string;
    domainId: string;
    userId: string;
    password: string;
    quota?: number;
  }) {
    return this.prisma.emailAccount.create({
      data,
    });
  }

  public async findEmailAccountByEmail(email: string) {
    return this.prisma.emailAccount.findUnique({
      where: { email },
    });
  }

  public async createSession(data: {
    userId: string;
    token: string;
    expiresAt: Date;
  }) {
    return this.prisma.session.create({
      data,
    });
  }

  public async findSessionByToken(token: string) {
    return this.prisma.session.findUnique({
      where: { token },
    });
  }

  public async deleteSession(token: string) {
    return this.prisma.session.delete({
      where: { token },
    });
  }

  public async cleanupExpiredSessions() {
    return this.prisma.session.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  }
}

export default DatabaseManager;
