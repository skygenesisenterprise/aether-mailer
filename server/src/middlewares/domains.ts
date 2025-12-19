import { type Request, type Response, type NextFunction } from "express";
import type {
  CreateDomainRequest,
  UpdateDomainRequest,
} from "../models/domainModels.js";

/**
 * Validation middleware for creating a domain
 */
export const validateCreateDomain = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const { name, displayName, description, mailServerConfig } =
    req.body as CreateDomainRequest;

  // Validate required fields
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Domain name is required and must be a non-empty string",
        details: { field: "name" },
      },
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Validate domain name format
  const domainRegex =
    /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/;
  if (!domainRegex.test(name.trim().toLowerCase())) {
    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid domain name format",
        details: {
          field: "name",
          format: "Must be a valid domain name (e.g., example.com)",
        },
      },
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Validate optional fields
  if (displayName && typeof displayName !== "string") {
    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Display name must be a string",
        details: { field: "displayName" },
      },
      timestamp: new Date().toISOString(),
    });
    return;
  }

  if (description && typeof description !== "string") {
    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Description must be a string",
        details: { field: "description" },
      },
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Validate mail server configuration if provided
  if (mailServerConfig) {
    if (!mailServerConfig.host || typeof mailServerConfig.host !== "string") {
      res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Mail server host is required",
          details: { field: "mailServerConfig.host" },
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (
      !mailServerConfig.port ||
      typeof mailServerConfig.port !== "number" ||
      mailServerConfig.port < 1 ||
      mailServerConfig.port > 65535
    ) {
      res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Mail server port must be a number between 1 and 65535",
          details: { field: "mailServerConfig.port" },
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (
      !["smtp", "smtps", "starttls"].includes(
        mailServerConfig.protocol || "smtp",
      )
    ) {
      res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Mail server protocol must be one of: smtp, smtps, starttls",
          details: { field: "mailServerConfig.protocol" },
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (
      !["none", "plain", "login", "crammd5"].includes(
        mailServerConfig.authType || "plain",
      )
    ) {
      res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message:
            "Mail server auth type must be one of: none, plain, login, crammd5",
          details: { field: "mailServerConfig.authType" },
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (
      mailServerConfig.maxConnections !== undefined &&
      (typeof mailServerConfig.maxConnections !== "number" ||
        mailServerConfig.maxConnections < 1)
    ) {
      res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Max connections must be a positive number",
          details: { field: "mailServerConfig.maxConnections" },
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (
      mailServerConfig.timeout !== undefined &&
      (typeof mailServerConfig.timeout !== "number" ||
        mailServerConfig.timeout < 1000)
    ) {
      res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Timeout must be a number at least 1000ms",
          details: { field: "mailServerConfig.timeout" },
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }
  }

  // Sanitize input
  req.body.name = name.trim().toLowerCase();
  if (displayName) {
    req.body.displayName = displayName.trim();
  }
  if (description) {
    req.body.description = description.trim();
  }

  next();
};

/**
 * Validation middleware for updating a domain
 */
export const validateUpdateDomain = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const { displayName, description, isActive, isVerified, mailServerConfig } =
    req.body as UpdateDomainRequest;

  // Validate that at least one field is provided
  if (
    displayName === undefined &&
    description === undefined &&
    isActive === undefined &&
    isVerified === undefined &&
    !mailServerConfig
  ) {
    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "At least one field must be provided for update",
        details: {
          availableFields: [
            "displayName",
            "description",
            "isActive",
            "isVerified",
            "mailServerConfig",
          ],
        },
      },
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Validate fields if provided
  if (displayName !== undefined && typeof displayName !== "string") {
    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Display name must be a string",
        details: { field: "displayName" },
      },
      timestamp: new Date().toISOString(),
    });
    return;
  }

  if (description !== undefined && typeof description !== "string") {
    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Description must be a string",
        details: { field: "description" },
      },
      timestamp: new Date().toISOString(),
    });
    return;
  }

  if (isActive !== undefined && typeof isActive !== "boolean") {
    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Active status must be a boolean",
        details: { field: "isActive" },
      },
      timestamp: new Date().toISOString(),
    });
    return;
  }

  if (isVerified !== undefined && typeof isVerified !== "boolean") {
    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Verified status must be a boolean",
        details: { field: "isVerified" },
      },
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Validate mail server configuration if provided
  if (mailServerConfig) {
    if (
      mailServerConfig.host !== undefined &&
      (typeof mailServerConfig.host !== "string" ||
        mailServerConfig.host.trim().length === 0)
    ) {
      res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Mail server host must be a non-empty string",
          details: { field: "mailServerConfig.host" },
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (
      mailServerConfig.port !== undefined &&
      (typeof mailServerConfig.port !== "number" ||
        mailServerConfig.port < 1 ||
        mailServerConfig.port > 65535)
    ) {
      res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Mail server port must be a number between 1 and 65535",
          details: { field: "mailServerConfig.port" },
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (
      mailServerConfig.protocol !== undefined &&
      !["smtp", "smtps", "starttls"].includes(mailServerConfig.protocol)
    ) {
      res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Mail server protocol must be one of: smtp, smtps, starttls",
          details: { field: "mailServerConfig.protocol" },
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (
      mailServerConfig.authType !== undefined &&
      !["none", "plain", "login", "crammd5"].includes(mailServerConfig.authType)
    ) {
      res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message:
            "Mail server auth type must be one of: none, plain, login, crammd5",
          details: { field: "mailServerConfig.authType" },
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (
      mailServerConfig.maxConnections !== undefined &&
      (typeof mailServerConfig.maxConnections !== "number" ||
        mailServerConfig.maxConnections < 1)
    ) {
      res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Max connections must be a positive number",
          details: { field: "mailServerConfig.maxConnections" },
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (
      mailServerConfig.timeout !== undefined &&
      (typeof mailServerConfig.timeout !== "number" ||
        mailServerConfig.timeout < 1000)
    ) {
      res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Timeout must be a number at least 1000ms",
          details: { field: "mailServerConfig.timeout" },
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }
  }

  // Sanitize input
  if (displayName !== undefined) {
    req.body.displayName = displayName.trim();
  }
  if (description !== undefined) {
    req.body.description = description.trim();
  }

  next();
};

/**
 * Validation middleware for domain ID parameter
 */
export const validateDomainId = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const { id } = req.params;

  if (!id || typeof id !== "string" || id.trim().length === 0) {
    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Domain ID is required",
        details: { field: "id" },
      },
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Validate that ID is a valid format (basic check)
  const idRegex = /^[a-zA-Z0-9_-]+$/;
  if (!idRegex.test(id)) {
    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid domain ID format",
        details: { field: "id" },
      },
      timestamp: new Date().toISOString(),
    });
    return;
  }

  next();
};

/**
 * Validation middleware for query parameters
 */
export const validateDomainQueryParams = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const { page, limit, search, isActive, isVerified, sortBy, sortOrder } =
    req.query;

  // Validate page
  if (page !== undefined) {
    const pageNum = parseInt(page as string, 10);
    if (isNaN(pageNum) || pageNum < 1) {
      res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Page must be a positive integer",
          details: { field: "page" },
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }
  }

  // Validate limit
  if (limit !== undefined) {
    const limitNum = parseInt(limit as string, 10);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Limit must be a number between 1 and 100",
          details: { field: "limit" },
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }
  }

  // Validate search string length
  if (
    search !== undefined &&
    (typeof search !== "string" || search.length > 100)
  ) {
    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Search query must be a string with max 100 characters",
        details: { field: "search" },
      },
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Validate boolean parameters
  if (isActive !== undefined && isActive !== "true" && isActive !== "false") {
    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: 'isActive must be either "true" or "false"',
        details: { field: "isActive" },
      },
      timestamp: new Date().toISOString(),
    });
    return;
  }

  if (
    isVerified !== undefined &&
    isVerified !== "true" &&
    isVerified !== "false"
  ) {
    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: 'isVerified must be either "true" or "false"',
        details: { field: "isVerified" },
      },
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Validate sort options
  if (
    sortBy !== undefined &&
    !["name", "createdAt", "updatedAt"].includes(sortBy as string)
  ) {
    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "sortBy must be one of: name, createdAt, updatedAt",
        details: { field: "sortBy" },
      },
      timestamp: new Date().toISOString(),
    });
    return;
  }

  if (
    sortOrder !== undefined &&
    !["asc", "desc"].includes(sortOrder as string)
  ) {
    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: 'sortOrder must be either "asc" or "desc"',
        details: { field: "sortOrder" },
      },
      timestamp: new Date().toISOString(),
    });
    return;
  }

  next();
};
