import { Mailer } from "../index.js";
import { ValidationError } from "../errors/index.js";

describe("Mailer", () => {
  describe("Constructor", () => {
    it("should create instance with default config", () => {
      const mailer = new Mailer();
      expect(mailer).toBeInstanceOf(Mailer);
      expect(mailer.email).toBeDefined();
      expect(mailer.domain).toBeDefined();
      expect(mailer.auth).toBeDefined();
      expect(mailer.stats).toBeDefined();
    });

    it("should create instance with API key config", () => {
      const config = {
        apiKey: "sk_live_1234567890abcdef1234567890abcdef",
        baseURL: "https://api.test.com",
      };
      const mailer = new Mailer(config);
      expect(mailer).toBeInstanceOf(Mailer);
    });

    it("should create instance with JWT config", () => {
      const config = {
        jwt: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test",
        baseURL: "https://api.test.com",
      };
      const mailer = new Mailer(config);
      expect(mailer).toBeInstanceOf(Mailer);
    });

    it("should throw error with both API key and JWT", () => {
      const config = {
        apiKey: "sk_live_1234567890abcdef1234567890abcdef",
        jwt: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test",
      };
      expect(() => new Mailer(config)).toThrow(ValidationError);
    });
  });

  describe("Static factory methods", () => {
    it("should create instance with withApiKey", () => {
      const mailer = Mailer.withApiKey(
        "sk_live_1234567890abcdef1234567890abcdef",
      );
      expect(mailer).toBeInstanceOf(Mailer);
    });

    it("should create instance with withJwt", () => {
      const mailer = Mailer.withJwt(
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test",
      );
      expect(mailer).toBeInstanceOf(Mailer);
    });

    it("should create instance with withConfig", () => {
      const config = { apiKey: "sk_live_1234567890abcdef1234567890abcdef" };
      const mailer = Mailer.withConfig(config);
      expect(mailer).toBeInstanceOf(Mailer);
    });
  });
});
