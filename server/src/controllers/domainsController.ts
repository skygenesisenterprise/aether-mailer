import { type Request, type Response, type NextFunction } from "express";
import { DomainService } from "../services/domainService.js";
import type { AuthenticatedRequest } from "../middlewares/auth.js";
import type {
  CreateDomainRequest,
  UpdateDomainRequest,
  DomainQueryParams,
} from "../models/domainModels.js";

const domainService = new DomainService();

/**
 * GET /api/v1/domains
 * List all domains with filtering and pagination
 */
export const getAllDomains = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const params: DomainQueryParams = {
      page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
      limit: req.query.limit
        ? parseInt(req.query.limit as string, 10)
        : undefined,
      search: req.query.search as string,
      isActive: req.query.isActive ? req.query.isActive === "true" : undefined,
      isVerified: req.query.isVerified
        ? req.query.isVerified === "true"
        : undefined,
      sortBy: req.query.sortBy as "name" | "createdAt" | "updatedAt",
      sortOrder: req.query.sortOrder as "asc" | "desc",
    };

    const result = await domainService.getAllDomains(params);

    res.status(200).json({
      success: true,
      data: result,
      message: "Domains retrieved successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/domains/:id
 * Get a specific domain by ID
 */
export const getDomainById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;

    const domain = await domainService.getDomainById(id);

    if (!domain) {
      res.status(404).json({
        success: false,
        error: {
          code: "DOMAIN_NOT_FOUND",
          message: "Domain not found",
          details: { id },
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: domain,
      message: "Domain retrieved successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/domains
 * Create a new domain
 */
export const createDomain = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const domainData: CreateDomainRequest = req.body;
    const createdBy = (req as AuthenticatedRequest).user?.id; // Get authenticated user info

    // Validate required fields
    if (!domainData.name || domainData.name.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Domain name is required",
          details: { field: "name" },
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const newDomain = await domainService.createDomain(domainData, createdBy);

    res.status(201).json({
      success: true,
      data: newDomain,
      message: "Domain created successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Domain with this name already exists"
    ) {
      res.status(409).json({
        success: false,
        error: {
          code: "DOMAIN_EXISTS",
          message: error.message,
          details: { name: req.body.name },
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }
    next(error);
  }
};

/**
 * PUT /api/v1/domains/:id
 * Update an existing domain
 */
export const updateDomain = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData: UpdateDomainRequest = req.body;
    const updatedBy = (req as AuthenticatedRequest).user?.id; // Get authenticated user info

    const updatedDomain = await domainService.updateDomain(
      id,
      updateData,
      updatedBy,
    );

    if (!updatedDomain) {
      res.status(404).json({
        success: false,
        error: {
          code: "DOMAIN_NOT_FOUND",
          message: "Domain not found",
          details: { id },
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: updatedDomain,
      message: "Domain updated successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/domains/:id
 * Delete a domain
 */
export const deleteDomain = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;

    const deleted = await domainService.deleteDomain(id);

    if (!deleted) {
      res.status(404).json({
        success: false,
        error: {
          code: "DOMAIN_NOT_FOUND",
          message: "Domain not found",
          details: { id },
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { id },
      message: "Domain deleted successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/domains/:id/verify
 * Verify domain ownership
 */
export const verifyDomain = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;

    const verifiedDomain = await domainService.verifyDomain(id);

    if (!verifiedDomain) {
      res.status(404).json({
        success: false,
        error: {
          code: "DOMAIN_NOT_FOUND",
          message: "Domain not found",
          details: { id },
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: verifiedDomain,
      message: "Domain verified successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/domains/stats
 * Get domain statistics
 */
export const getDomainStats = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const stats = await domainService.getDomainStats();

    res.status(200).json({
      success: true,
      data: stats,
      message: "Domain statistics retrieved successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/domains/check-availability
 * Check if a domain name is available
 */
export const checkDomainAvailability = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { name } = req.query;

    if (!name || typeof name !== "string") {
      res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Domain name is required",
          details: { field: "name" },
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const result = await domainService.checkDomainAvailability(name);

    res.status(200).json({
      success: true,
      data: result,
      message: "Domain availability checked successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/domains/:id/dns-records
 * Add DNS record to domain
 */
export const addDnsRecord = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const recordData = req.body;

    // Validate required fields
    if (!recordData.type || !recordData.name || !recordData.value) {
      res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "DNS record type, name, and value are required",
          details: { required: ["type", "name", "value"] },
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const record = await domainService.addDnsRecord(id, recordData);

    if (!record) {
      res.status(404).json({
        success: false,
        error: {
          code: "DOMAIN_NOT_FOUND",
          message: "Domain not found",
          details: { id },
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    res.status(201).json({
      success: true,
      data: record,
      message: "DNS record added successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/domains/:id/mail-server-config
 * Update mail server configuration
 */
export const updateMailServerConfig = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const configData = req.body;

    const config = await domainService.updateMailServerConfig(id, configData);

    if (!config) {
      res.status(404).json({
        success: false,
        error: {
          code: "DOMAIN_NOT_FOUND",
          message: "Domain not found",
          details: { id },
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: config,
      message: "Mail server configuration updated successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};
