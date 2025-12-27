// Basic usage example
import { Mailer } from "../src/index.js";

async function basicExample() {
  // Initialize with API key
  const mailer = new Mailer({
    apiKey: "sk_live_your_api_key_here",
    baseURL: "https://api.aethermailer.com",
  });

  try {
    // Send a simple email
    const result = await mailer.email.sendEmail({
      to: "recipient@example.com",
      subject: "Hello from Aether Mailer!",
      bodyText: "This is a plain text email.",
      bodyHTML:
        "<h1>This is an HTML email</h1><p>Sent via Aether Mailer SDK.</p>",
    });

    console.log("Email sent successfully:", result.data);
  } catch (error) {
    console.error("Failed to send email:", error.message);
  }
}

async function authenticationExample() {
  // Using factory methods
  const apiKeyMailer = Mailer.withApiKey("sk_live_your_api_key_here");
  const jwtMailer = Mailer.withJwt("your_jwt_token_here");

  // Or with custom config
  const customMailer = Mailer.withConfig({
    apiKey: "sk_test_test_key_here",
    baseURL: "https://api-staging.aethermailer.com",
    timeout: 10000,
    retryAttempts: 5,
  });

  // Check authentication method
  console.log("Auth method:", apiKeyMailer.getAuthMethod()); // 'api-key'
  console.log("Auth method:", jwtMailer.getAuthMethod()); // 'jwt'

  // Switch authentication method
  apiKeyMailer.setJwt("new_jwt_token");
  console.log("Auth method after switch:", apiKeyMailer.getAuthMethod()); // 'jwt'

  // Clear authentication
  apiKeyMailer.clearAuth();
  console.log("Auth method after clear:", apiKeyMailer.getAuthMethod()); // 'none'
}

async function bulkEmailExample() {
  const mailer = Mailer.withApiKey("sk_live_your_api_key_here");

  try {
    const result = await mailer.email.sendBulkEmail({
      emails: [
        {
          to: "user1@example.com",
          subject: "Welcome User 1",
          bodyText: "Welcome to our service!",
        },
        {
          to: "user2@example.com",
          subject: "Welcome User 2",
          bodyText: "Welcome to our service!",
        },
        {
          to: ["user3a@example.com", "user3b@example.com"],
          subject: "Welcome Users 3a and 3b",
          bodyText: "Welcome to our service!",
        },
      ],
      options: {
        sendSequentially: false, // Send in parallel
        stopOnError: false, // Continue even if some fail
      },
    });

    console.log("Bulk email result:", result.data);
    console.log(
      `Success: ${result.data?.successful}, Failed: ${result.data?.failed}`,
    );
  } catch (error) {
    console.error("Bulk email failed:", error.message);
  }
}

async function emailWithAttachmentsExample() {
  const mailer = Mailer.withApiKey("sk_live_your_api_key_here");

  try {
    const result = await mailer.email.sendEmail({
      to: "recipient@example.com",
      subject: "Email with Attachments",
      bodyText: "Please find the attachments below.",
      bodyHTML: "<p>Please find the attachments below.</p>",
      attachments: [
        {
          filename: "document.pdf",
          content: Buffer.from("PDF content here"), // Or base64 string
          contentType: "application/pdf",
          disposition: "attachment",
        },
        {
          filename: "logo.png",
          content: Buffer.from("PNG content here"),
          contentType: "image/png",
          contentId: "logo",
          disposition: "inline",
        },
      ],
    });

    console.log("Email with attachments sent:", result.data);
  } catch (error) {
    console.error("Failed to send email with attachments:", error.message);
  }
}

async function domainManagementExample() {
  const mailer = Mailer.withApiKey("sk_live_your_api_key_here");

  try {
    // Create a new domain
    const domain = await mailer.domain.createDomain({
      name: "example.com",
      displayName: "Example Domain",
      description: "Primary domain for example.com",
      maxUsers: 100,
      maxEmailsPerDay: 10000,
      maxStorageMB: 50000,
    });

    console.log("Domain created:", domain.data);

    // List all domains
    const domains = await mailer.domain.listDomains({
      page: 1,
      limit: 10,
      sortBy: "createdAt",
      sortOrder: "desc",
    });

    console.log("Domains:", domains.data?.domains);
    console.log("Pagination:", domains.data?.pagination);

    // Get domain statistics
    const stats = await mailer.domain.getDomainStats();
    console.log("Domain statistics:", stats.data);

    // Verify domain
    const verification = await mailer.domain.verifyDomain(
      domain.data?.id || "",
    );
    console.log("Domain verification:", verification.data);

    // Add DNS records
    const dnsRecord = await mailer.domain.addDnsRecord(domain.data?.id || "", {
      type: "TXT",
      name: "@",
      value: "v=spf1 include:_spf.google.com ~all",
      ttl: 3600,
      priority: 0,
    });

    console.log("DNS record added:", dnsRecord.data);
  } catch (error) {
    console.error("Domain management failed:", error.message);
  }
}

async function authenticationManagementExample() {
  const mailer = Mailer.withApiKey("sk_sys_your_system_key_here");

  try {
    // Login with user credentials
    const loginResult = await mailer.auth.login(
      "user@example.com",
      "password123",
    );
    console.log("Login successful:", loginResult.data);

    // Create API key
    const apiKey = await mailer.auth.createApiKey({
      name: "Production API Key",
      permissions: ["email:read", "email:write", "domain:read"],
      expiresAt: "2024-12-31T23:59:59Z",
    });

    console.log("API key created:", apiKey.data);
    console.log("Masked key:", mailer.auth.maskApiKey(apiKey.data?.key || ""));

    // List API keys
    const apiKeys = await mailer.auth.listApiKeys();
    console.log("API keys:", apiKeys.data?.apiKeys);

    // Get API key usage stats
    const usageStats = await mailer.auth.getApiKeyUsageStats(
      apiKey.data?.id || "",
      {
        startDate: "2024-01-01T00:00:00Z",
        endDate: "2024-01-31T23:59:59Z",
      },
    );

    console.log("API key usage stats:", usageStats.data);

    // Validate API key
    const validation = await mailer.auth.validateApiKey(
      "sk_live_test_key_here",
    );
    console.log("API key validation:", validation.data);

    // Logout
    await mailer.auth.logout();
    console.log("Logged out successfully");
  } catch (error) {
    console.error("Authentication management failed:", error.message);
  }
}

async function statisticsExample() {
  const mailer = Mailer.withApiKey("sk_live_your_api_key_here");

  try {
    // Get email statistics
    const emailStats = await mailer.stats.getEmailStats({
      period: "month",
      startDate: "2024-01-01T00:00:00Z",
      endDate: "2024-01-31T23:59:59Z",
    });

    console.log("Email statistics:", emailStats.data);

    // Get queue status
    const queueStatus = await mailer.stats.getQueueStatus();
    console.log("Queue status:", queueStatus.data);

    // Get SMTP sessions
    const sessions = await mailer.stats.getSmtpSessions({
      page: 1,
      limit: 20,
      status: "active",
    });

    console.log("SMTP sessions:", sessions.data?.sessions);

    // Test SMTP connection
    const connectionTest = await mailer.stats.testSmtpConnection({
      host: "smtp.gmail.com",
      port: 587,
      tls: true,
      username: "test@gmail.com",
      password: "app_password",
    });

    console.log("SMTP connection test:", connectionTest.data);

    // Get real-time metrics
    const realTimeMetrics = await mailer.stats.getRealTimeMetrics();
    console.log("Real-time metrics:", realTimeMetrics.data);
  } catch (error) {
    console.error("Statistics failed:", error.message);
  }
}

async function validationExample() {
  const mailer = new Mailer(); // No auth needed for validation

  try {
    // Validate email format
    const formatValidation =
      await mailer.email.validateEmail("user@example.com");
    console.log("Email validation:", formatValidation.data);

    // Validate multiple emails
    const multipleValidation = await mailer.email.validateMultipleEmails([
      "valid@example.com",
      "invalid-email",
      "another@valid.com",
    ]);

    console.log("Multiple email validation:", multipleValidation.data);

    // Extract emails from text
    const extractedEmails = Mailer.EmailValidator.extractFromText(
      "Contact us at support@example.com or sales@example.com for help.",
    );
    console.log("Extracted emails:", extractedEmails);

    // Check domain availability
    const availability =
      await mailer.domain.checkAvailability("newdomain12345.com");
    console.log("Domain availability:", availability.data);
  } catch (error) {
    console.error("Validation failed:", error.message);
  }
}

async function eventHandlingExample() {
  const mailer = Mailer.withApiKey("sk_live_your_api_key_here");

  // Add event listeners
  mailer.addEventListener("request", (event) => {
    console.log("Request:", event.data.method, event.data.url);
  });

  mailer.addEventListener("response", (event) => {
    console.log(
      "Response:",
      event.data.status,
      event.data.method,
      event.data.url,
    );
  });

  mailer.addEventListener("retry", (event) => {
    console.log(
      "Retry attempt:",
      event.data.attempt,
      "of",
      event.data.maxAttempts,
    );
  });

  mailer.addEventListener("error", (event) => {
    console.error("Request error:", event.data.message, event.data.status);
  });

  try {
    // Make some requests to see events
    await mailer.email.sendEmail({
      to: "test@example.com",
      subject: "Test Email",
      bodyText: "Testing event handling",
    });

    // Remove event listeners
    // mailer.removeEventListener('request', requestHandler);
    // mailer.removeEventListener('response', responseHandler);
    // mailer.removeEventListener('retry', retryHandler);
    // mailer.removeEventListener('error', errorHandler);
  } catch (error) {
    console.error("Event handling example failed:", error.message);
  }
}

async function errorHandlingExample() {
  const mailer = new Mailer({
    apiKey: "sk_invalid_key",
    baseURL: "https://api.aethermailer.com",
  });

  try {
    // This will fail with authentication error
    await mailer.email.sendEmail({
      to: "test@example.com",
      subject: "Test",
      bodyText: "Test",
    });
  } catch (error) {
    // Handle different error types
    if (error.code === "INVALID_API_KEY") {
      console.error("Invalid API key provided");
    } else if (error.code === "RATE_LIMITED") {
      console.error(
        "Rate limit exceeded, retry after:",
        error.details?.retryAfter,
      );
    } else if (error.code === "INVALID_EMAIL") {
      console.error("Invalid email address:", error.details?.email);
    } else {
      console.error("Unknown error:", error.message);
    }

    // Error metadata
    console.error("Error code:", error.code);
    console.error("Status code:", error.statusCode);
    console.error("Details:", error.details);
  }

  try {
    // This will fail with validation error
    await mailer.email.sendEmail({
      to: "", // Invalid
      subject: "", // Invalid
      bodyText: "", // Invalid
    });
  } catch (error) {
    console.error("Validation error:", error.message);
    console.error("Validation errors:", error.details);
  }
}

// Run examples
async function runExamples() {
  console.log("=== Aether Mailer SDK Examples ===\n");

  console.log("1. Basic Email Sending:");
  await basicExample();
  console.log("");

  console.log("2. Authentication:");
  await authenticationExample();
  console.log("");

  console.log("3. Bulk Email:");
  await bulkEmailExample();
  console.log("");

  console.log("4. Email with Attachments:");
  await emailWithAttachmentsExample();
  console.log("");

  console.log("5. Domain Management:");
  await domainManagementExample();
  console.log("");

  console.log("6. Authentication Management:");
  await authenticationManagementExample();
  console.log("");

  console.log("7. Statistics:");
  await statisticsExample();
  console.log("");

  console.log("8. Validation:");
  await validationExample();
  console.log("");

  console.log("9. Event Handling:");
  await eventHandlingExample();
  console.log("");

  console.log("10. Error Handling:");
  await errorHandlingExample();
  console.log("");
}

// Export functions for individual testing
export {
  basicExample,
  authenticationExample,
  bulkEmailExample,
  emailWithAttachmentsExample,
  domainManagementExample,
  authenticationManagementExample,
  statisticsExample,
  validationExample,
  eventHandlingExample,
  errorHandlingExample,
  runExamples,
};

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runExamples().catch(console.error);
}
