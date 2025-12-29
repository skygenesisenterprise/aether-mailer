import { AuthService } from "../auth/index.js";

// Mock HttpClient for testing
const mockHttpClient = {
  post: jest.fn(),
  get: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  clearAuth: jest.fn(),
} as any;

describe("AuthService", () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService(mockHttpClient);
    jest.clearAllMocks();
  });

  describe("Constructor", () => {
    it("should create instance", () => {
      expect(authService).toBeInstanceOf(AuthService);
    });
  });

  describe("validateApiKey", () => {
    it("should validate correct API key", () => {
      const validKey = "sk_live_1234567890abcdef1234567890abcdef";
      expect(() => authService.validateApiKey(validKey)).not.toThrow();
    });

    it("should throw error with invalid API key", () => {
      const invalidKey = "invalid-key";
      expect(() => authService.validateApiKey(invalidKey)).toThrow();
    });
  });

  describe("getApiKeyEnvironment", () => {
    it("should return live environment", () => {
      const key = "sk_live_1234567890abcdef1234567890abcdef";
      expect(authService.getApiKeyEnvironment(key)).toBe("live");
    });

    it("should return test environment", () => {
      const key = "sk_test_1234567890abcdef1234567890abcdef";
      expect(authService.getApiKeyEnvironment(key)).toBe("test");
    });

    it("should return system environment", () => {
      const key = "sk_sys_1234567890abcdef1234567890abcdef";
      expect(authService.getApiKeyEnvironment(key)).toBe("system");
    });

    it("should return null for invalid key", () => {
      const key = "invalid_key_format";
      expect(authService.getApiKeyEnvironment(key)).toBe(null);
    });
  });
});
