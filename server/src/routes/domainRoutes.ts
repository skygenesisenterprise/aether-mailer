import { Router } from "express";
import {
  getAllDomains,
  getDomainById,
  createDomain,
  updateDomain,
  deleteDomain,
  verifyDomain,
  getDomainStats,
  checkDomainAvailability,
  addDnsRecord,
  updateMailServerConfig,
} from "../controllers/domainsController.js";
import {
  validateCreateDomain,
  validateUpdateDomain,
  validateDomainId,
  validateDomainQueryParams,
} from "../middlewares/domains.js";
import { authenticateToken } from "../middlewares/auth.js";

const router = Router();

/**
 * Apply authentication middleware to all domain routes
 */
router.use(authenticateToken);

/**
 * GET /api/v1/domains
 * List all domains with filtering and pagination
 *
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Number of items per page (default: 10, max: 100)
 * - search: Search query for domain names
 * - isActive: Filter by active status (true/false)
 * - isVerified: Filter by verification status (true/false)
 * - sortBy: Sort field (name, createdAt, updatedAt)
 * - sortOrder: Sort order (asc, desc)
 */
router.get("/", validateDomainQueryParams, getAllDomains);

/**
 * GET /api/v1/domains/stats
 * Get domain statistics
 */
router.get("/stats", getDomainStats);

/**
 * GET /api/v1/domains/check-availability
 * Check if a domain name is available
 *
 * Query Parameters:
 * - name: Domain name to check
 */
router.get("/check-availability", checkDomainAvailability);

/**
 * GET /api/v1/domains/:id
 * Get a specific domain by ID
 */
router.get("/:id", validateDomainId, getDomainById);

/**
 * POST /api/v1/domains
 * Create a new domain
 *
 * Request Body:
 * - name (required): Domain name
 * - displayName (optional): Display name for the domain
 * - description (optional): Domain description
 * - mailServerConfig (optional): Mail server configuration
 */
router.post("/", validateCreateDomain, createDomain);

/**
 * PUT /api/v1/domains/:id
 * Update an existing domain
 *
 * Request Body:
 * - displayName (optional): Display name for the domain
 * - description (optional): Domain description
 * - isActive (optional): Active status
 * - isVerified (optional): Verification status
 * - mailServerConfig (optional): Mail server configuration
 */
router.put("/:id", validateDomainId, validateUpdateDomain, updateDomain);

/**
 * DELETE /api/v1/domains/:id
 * Delete a domain
 */
router.delete("/:id", validateDomainId, deleteDomain);

/**
 * POST /api/v1/domains/:id/verify
 * Verify domain ownership
 */
router.post("/:id/verify", validateDomainId, verifyDomain);

/**
 * POST /api/v1/domains/:id/dns-records
 * Add DNS record to domain
 *
 * Request Body:
 * - type (required): DNS record type (MX, TXT, A, AAAA, CNAME, SRV)
 * - name (required): Record name
 * - value (required): Record value
 * - ttl (optional): TTL value
 * - priority (optional): Priority (for MX records)
 * - isActive (optional): Active status
 */
router.post("/:id/dns-records", validateDomainId, addDnsRecord);

/**
 * PUT /api/v1/domains/:id/mail-server-config
 * Update mail server configuration
 *
 * Request Body:
 * - host (optional): Mail server host
 * - port (optional): Mail server port
 * - protocol (optional): Protocol (smtp, smtps, starttls)
 * - authType (optional): Authentication type (none, plain, login, crammd5)
 * - username (optional): Username for authentication
 * - password (optional): Password for authentication
 * - maxConnections (optional): Maximum connections
 * - timeout (optional): Connection timeout
 * - isSecure (optional): Secure connection flag
 * - isActive (optional): Active status
 */
router.put("/:id/mail-server-config", validateDomainId, updateMailServerConfig);

export default router;
