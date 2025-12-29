import { EmailService } from "../email/index.js";
import {
  ValidationError,
  InvalidEmailError,
  MissingFieldError,
} from "../errors/index.js";

// Mock HttpClient for testing
const mockHttpClient = {
  post: jest.fn(),
  get: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  clearAuth: jest.fn(),
} as any;

describe("EmailService", () => {
  let emailService: EmailService;

  beforeEach(() => {
    emailService = new EmailService(mockHttpClient);
    jest.clearAllMocks();
  });

  describe("Constructor", () => {
    it("should create instance", () => {
      expect(emailService).toBeInstanceOf(EmailService);
    });
  });

  describe("validateSendEmailOptions", () => {
    it("should pass validation with valid options", () => {
      const validOptions = {
        to: "test@example.com",
        subject: "Test Subject",
        bodyText: "Test body",
      };
      expect(() =>
        (emailService as any).validateSendEmailOptions(validOptions),
      ).not.toThrow();
    });

    it("should throw error with missing required fields", () => {
      const invalidOptions = {
        to: "",
        subject: "Test Subject",
      };
      expect(() =>
        (emailService as any).validateSendEmailOptions(invalidOptions),
      ).toThrow(MissingFieldError);
    });

    it("should throw error with invalid email format", () => {
      const invalidOptions = {
        to: "invalid-email",
        subject: "Test Subject",
        bodyText: "Test body",
      };
      expect(() =>
        (emailService as any).validateSendEmailOptions(invalidOptions),
      ).toThrow(InvalidEmailError);
    });
  });

  describe("validateBulkEmailOptions", () => {
    it("should pass validation with valid bulk options", () => {
      const validOptions = {
        emails: [
          { to: "test1@example.com", subject: "Test 1", bodyText: "Body 1" },
          { to: "test2@example.com", subject: "Test 2", bodyText: "Body 2" },
        ],
      };
      expect(() =>
        (emailService as any).validateBulkEmailOptions(validOptions),
      ).not.toThrow();
    });

    it("should throw error with empty emails array", () => {
      const invalidOptions = {
        emails: [],
      };
      expect(() =>
        (emailService as any).validateBulkEmailOptions(invalidOptions),
      ).toThrow(ValidationError);
    });
  });

  describe("estimateEmailSize", () => {
    it("should estimate size for simple email", () => {
      const options = {
        to: "test@example.com",
        subject: "Test",
        bodyText: "Hello World",
      };
      const size = (emailService as any).estimateEmailSize(options);
      expect(size).toBeGreaterThan(0);
    });

    it("should include attachments in size calculation", () => {
      const options = {
        to: "test@example.com",
        subject: "Test",
        bodyText: "Hello World",
        attachments: [{ filename: "test.txt", content: "test content" }],
      };
      const size = (emailService as any).estimateEmailSize(options);
      expect(size).toBeGreaterThan(0);
    });
  });

  describe("validateEmailAddress", () => {
    it("should return true for valid single email", () => {
      const result = (emailService as any).validateEmailAddress(
        "test@example.com",
      );
      expect(result.isValid).toBe(true);
    });

    it("should return true for valid multiple emails", () => {
      const result = (emailService as any).validateEmailAddress([
        "test1@example.com",
        "test2@example.com",
      ]);
      expect(result.isValid).toBe(true);
    });

    it("should return false for invalid email", () => {
      const result = (emailService as any).validateEmailAddress(
        "invalid-email",
      );
      expect(result.isValid).toBe(false);
    });
  });

  describe("formatSendEmailPayload", () => {
    it("should format payload correctly", () => {
      const options = {
        to: "test@example.com",
        subject: "Test Subject",
        bodyText: "Test Body",
        priority: "high",
      };
      const payload = (emailService as any).formatSendEmailPayload(options);

      expect(payload.to).toBe("test@example.com");
      expect(payload.subject).toBe("Test Subject");
      expect(payload.bodyText).toBe("Test Body");
      expect(payload.priority).toBe("high");
    });
  });
});
