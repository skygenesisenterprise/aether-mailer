import { ValidationUtils } from "../utils/validation.js";

describe("ValidationUtils", () => {
  describe("validateRequired", () => {
    it("should pass validation with all required fields", () => {
      const obj = { name: "John", email: "john@example.com" };
      const result = ValidationUtils.validateRequired(obj, ["name", "email"]);
      expect(result.isValid).toBe(true);
    });

    it("should fail validation with missing field", () => {
      const obj = { name: "John" };
      const result = ValidationUtils.validateRequired(obj, ["name", "email"]);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Missing required field: email");
    });
  });

  describe("validateStringLength", () => {
    it("should pass validation with correct length", () => {
      const result = ValidationUtils.validateStringLength(
        "test",
        "field",
        2,
        10,
      );
      expect(result.isValid).toBe(true);
    });

    it("should fail validation with too short string", () => {
      const result = ValidationUtils.validateStringLength("t", "field", 2, 10);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("field is too short (min 2 characters)");
    });

    it("should fail validation with too long string", () => {
      const result = ValidationUtils.validateStringLength(
        "toolongstring",
        "field",
        2,
        5,
      );
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("field is too long (max 5 characters)");
    });
  });

  describe("validateApiKey", () => {
    it("should pass validation with valid API key", () => {
      const validKey = "sk_live_1234567890abcdef1234567890abcdef";
      const result = ValidationUtils.validateApiKey(validKey);
      expect(result.isValid).toBe(true);
    });

    it("should fail validation with invalid API key", () => {
      const invalidKey = "invalid-key";
      const result = ValidationUtils.validateApiKey(invalidKey);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Invalid API key format");
    });
  });

  describe("validateDomain", () => {
    it("should pass validation with valid domain", () => {
      const result = ValidationUtils.validateDomain("example.com");
      expect(result.isValid).toBe(true);
    });

    it("should fail validation with invalid domain", () => {
      const result = ValidationUtils.validateDomain("invalid..domain");
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});
