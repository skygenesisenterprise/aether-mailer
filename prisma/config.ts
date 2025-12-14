import { PrismaClient } from '@prisma/client'

// Configuration dynamique selon l'environnement
const getDatabaseConfig = () => {
  const databaseUrl = process.env.DATABASE_URL
  
  if (!databaseUrl) {
    // Développement local avec SQLite
    return {
      datasources: {
        db: {
          url: 'file:./dev.db',
        },
      },
    }
  }
  
  // Production avec PostgreSQL
  if (databaseUrl.includes('postgresql://')) {
    return {
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
    }
  }
  
  // Développement avec URL explicite
  return {
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  }
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient(getDatabaseConfig())

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Helper pour détecter le type de base de données
export const getDatabaseType = (): 'sqlite' | 'postgresql' => {
  const databaseUrl = process.env.DATABASE_URL || 'file:./dev.db'
  return databaseUrl.includes('postgresql://') ? 'postgresql' : 'sqlite'
}

// Helper pour savoir si on est en production
export const isProduction = (): boolean => {
  return process.env.NODE_ENV === 'production'
}

// Helper pour obtenir l'URL de la base de données
export const getDatabaseUrl = (): string => {
  return process.env.DATABASE_URL || 'file:./dev.db'
}