import {
  ApiResponse,
  SendEmailOptions,
  BulkEmailOptions,
  BulkEmailResult,
  QueuedMessage,
  QueueStatus,
  Pagination,
  API_ENDPOINTS,
} from "../types/index.js";
import { HttpClient } from "../client/index.js";
import {
  ValidationError,
  InvalidEmailError,
  EmailTooLargeError,
  MissingFieldError,
  EmailValidator,
} from "../errors/index.js";

export class EmailService {
  constructor(private client: HttpClient) {}

  // Send a single email
  public async sendEmail(
    options: SendEmailOptions,
  ): Promise<ApiResponse<{ messageId: string; status: string }>> {
    this.validateSendEmailOptions(options);

    const payload = this.formatSendEmailPayload(options);

    try {
      const response = await this.client.post(
        API_ENDPOINTS.EMAIL_SEND,
        payload,
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Send multiple emails (bulk)
  public async sendBulkEmail(
    options: BulkEmailOptions,
  ): Promise<ApiResponse<BulkEmailResult>> {
    this.validateBulkEmailOptions(options);

    const payload = {
      emails: options.emails.map((email) => this.formatSendEmailPayload(email)),
      options: options.options || {},
    };

    try {
      const response = await this.client.post(
        API_ENDPOINTS.EMAIL_BULK,
        payload,
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Get sent messages
  public async getSentMessages(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<
    ApiResponse<{ messages: QueuedMessage[]; pagination: Pagination }>
  > {
    const queryParams = new URLSearchParams();

    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.search) queryParams.append("search", params.search);
    if (params?.status) queryParams.append("status", params.status);
    if (params?.startDate) queryParams.append("startDate", params.startDate);
    if (params?.endDate) queryParams.append("endDate", params.endDate);

    const url = queryParams.toString()
      ? `${API_ENDPOINTS.EMAIL_SENT}?${queryParams.toString()}`
      : API_ENDPOINTS.EMAIL_SENT;

    try {
      const response = await this.client.get(url);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Get queue status
  public async getQueueStatus(): Promise<ApiResponse<QueueStatus>> {
    try {
      const response = await this.client.get(API_ENDPOINTS.QUEUE_STATUS);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Get queued messages
  public async getQueuedMessages(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<
    ApiResponse<{ messages: QueuedMessage[]; pagination: Pagination }>
  > {
    const queryParams = new URLSearchParams();

    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.status) queryParams.append("status", params.status);

    const url = queryParams.toString()
      ? `${API_ENDPOINTS.QUEUE_MESSAGES}?${queryParams.toString()}`
      : API_ENDPOINTS.QUEUE_MESSAGES;

    try {
      const response = await this.client.get(url);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Retry a queued message
  public async retryQueuedMessage(
    messageId: string,
  ): Promise<ApiResponse<{ message: string }>> {
    if (!messageId || typeof messageId !== "string") {
      throw new MissingFieldError("messageId");
    }

    const url = API_ENDPOINTS.QUEUE_RETRY.replace(":id", messageId);

    try {
      const response = await this.client.post(url);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Delete a queued message
  public async deleteQueuedMessage(
    messageId: string,
  ): Promise<ApiResponse<{ message: string }>> {
    if (!messageId || typeof messageId !== "string") {
      throw new MissingFieldError("messageId");
    }

    const url = API_ENDPOINTS.QUEUE_DELETE.replace(":id", messageId);

    try {
      const response = await this.client.delete(url);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Validate email addresses
  public async validateEmail(email: string): Promise<ApiResponse<any>> {
    if (!email || typeof email !== "string") {
      throw new InvalidEmailError(email, "Email is required");
    }

    const validation = EmailValidator.validateFormat(email);
    if (!validation.isValid) {
      throw new InvalidEmailError(email, validation.errors.join(", "));
    }

    // In a real implementation, you might make an API call here
    // For now, we'll just validate locally
    return {
      success: true,
      data: {
        email,
        isValid: validation.isValid,
        domain: EmailValidator.extractDomain(email),
        isDisposable: EmailValidator.isDisposableProvider(
          EmailValidator.extractDomain(email),
        ),
        isFreeProvider: EmailValidator.isFreeProvider(
          EmailValidator.extractDomain(email),
        ),
      },
    };
  }

  // Validate multiple emails
  public async validateMultipleEmails(
    emails: string[],
  ): Promise<ApiResponse<any>> {
    if (!Array.isArray(emails)) {
      throw new ValidationError("Emails must be an array");
    }

    const results = await EmailValidator.validateMultiple(emails);

    return {
      success: true,
      data: {
        results,
        total: emails.length,
        valid: results.filter((r: any) => r.isValid).length,
        invalid: results.filter((r: any) => !r.isValid).length,
      },
    };
  }

  // Estimate email size
  public estimateEmailSize(options: SendEmailOptions): number {
    let size = 0;

    // Headers (rough estimate)
    size += 500; // Basic headers

    // From address
    if (options.from) {
      size += options.from.length;
    }

    // To addresses
    const to = Array.isArray(options.to) ? options.to : [options.to];
    size += to.reduce((sum, email) => sum + email.length, 0);

    // CC addresses
    if (options.cc) {
      const cc = Array.isArray(options.cc) ? options.cc : [options.cc];
      size += cc.reduce((sum, email) => sum + email.length, 0);
    }

    // BCC addresses
    if (options.bcc) {
      const bcc = Array.isArray(options.bcc) ? options.bcc : [options.bcc];
      size += bcc.reduce((sum, email) => sum + email.length, 0);
    }

    // Subject
    if (options.subject) {
      size += options.subject.length;
    }

    // Body
    if (options.bodyText) {
      size += options.bodyText.length;
    }

    if (options.bodyHTML) {
      size += options.bodyHTML.length;
    }

    // Attachments
    if (options.attachments) {
      for (const attachment of options.attachments) {
        size += attachment.filename.length;

        if (typeof attachment.content === "string") {
          size += attachment.content.length;
        } else if (Buffer.isBuffer(attachment.content)) {
          size += attachment.content.length;
        }

        // MIME headers for attachment
        size += 200;
      }
    }

    // Additional headers
    if (options.headers) {
      for (const [key, value] of Object.entries(options.headers)) {
        size += key.length + value.length + 4; // ": " + "\r\n"
      }
    }

    // Add some overhead for MIME boundaries and encoding
    size += 1000;

    return size;
  }

  // Private validation methods
  private validateSendEmailOptions(options: SendEmailOptions): void {
    if (!options) {
      throw new ValidationError("Email options are required");
    }

    if (!options.to || (Array.isArray(options.to) && options.to.length === 0)) {
      throw new MissingFieldError("to");
    }

    // Validate recipient emails
    const to = Array.isArray(options.to) ? options.to : [options.to];
    for (const email of to) {
      const validation = EmailValidator.validateFormat(email);
      if (!validation.isValid) {
        throw new InvalidEmailError(email, validation.errors.join(", "));
      }
    }

    if (options.cc) {
      const cc = Array.isArray(options.cc) ? options.cc : [options.cc];
      for (const email of cc) {
        const validation = EmailValidator.validateFormat(email);
        if (!validation.isValid) {
          throw new InvalidEmailError(email, validation.errors.join(", "));
        }
      }
    }

    if (options.bcc) {
      const bcc = Array.isArray(options.bcc) ? options.bcc : [options.bcc];
      for (const email of bcc) {
        const validation = EmailValidator.validateFormat(email);
        if (!validation.isValid) {
          throw new InvalidEmailError(email, validation.errors.join(", "));
        }
      }
    }

    if (!options.subject || options.subject.trim() === "") {
      throw new MissingFieldError("subject");
    }

    if (!options.bodyText && !options.bodyHTML) {
      throw new ValidationError(
        "At least one of bodyText or bodyHTML is required",
      );
    }

    if (options.attachments && !Array.isArray(options.attachments)) {
      throw new ValidationError("Attachments must be an array");
    }

    if (options.attachments) {
      for (const attachment of options.attachments) {
        if (!attachment.filename || typeof attachment.filename !== "string") {
          throw new ValidationError("Attachment filename is required");
        }

        if (!attachment.content) {
          throw new ValidationError("Attachment content is required");
        }

        const attachmentSize =
          typeof attachment.content === "string"
            ? attachment.content.length
            : Buffer.isBuffer(attachment.content)
              ? attachment.content.length
              : 0;

        if (attachmentSize > 25 * 1024 * 1024) {
          // 25MB
          throw new EmailTooLargeError(attachmentSize, 25 * 1024 * 1024);
        }
      }
    }

    // Check overall email size
    const estimatedSize = this.estimateEmailSize(options);
    if (estimatedSize > 50 * 1024 * 1024) {
      // 50MB
      throw new EmailTooLargeError(estimatedSize, 50 * 1024 * 1024);
    }
  }

  private validateBulkEmailOptions(options: BulkEmailOptions): void {
    if (!options) {
      throw new ValidationError("Bulk email options are required");
    }

    if (
      !options.emails ||
      !Array.isArray(options.emails) ||
      options.emails.length === 0
    ) {
      throw new ValidationError("Emails array is required");
    }

    if (options.emails.length > 1000) {
      throw new ValidationError("Maximum 1000 emails allowed per bulk request");
    }

    // Validate each email
    for (let i = 0; i < options.emails.length; i++) {
      try {
        this.validateSendEmailOptions(options.emails[i]);
      } catch (error) {
        if (error instanceof ValidationError) {
          throw new ValidationError(`Email ${i + 1}: ${error.message}`);
        }
        throw error;
      }
    }
  }

  private formatSendEmailPayload(options: SendEmailOptions): any {
    const payload: any = {
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject.trim(),
    };

    if (options.cc) {
      payload.cc = Array.isArray(options.cc) ? options.cc : [options.cc];
    }

    if (options.bcc) {
      payload.bcc = Array.isArray(options.bcc) ? options.bcc : [options.bcc];
    }

    if (options.bodyText) {
      payload.bodyText = options.bodyText;
    }

    if (options.bodyHTML) {
      payload.bodyHTML = options.bodyHTML;
    }

    if (options.priority) {
      payload.priority = options.priority;
    }

    if (options.draft !== undefined) {
      payload.draft = options.draft;
    }

    if (options.attachments && options.attachments.length > 0) {
      payload.attachments = options.attachments.map((attachment) => ({
        filename: attachment.filename,
        content: Buffer.isBuffer(attachment.content)
          ? attachment.content.toString("base64")
          : attachment.content,
        contentType: attachment.contentType || "application/octet-stream",
        contentId: attachment.contentId,
        disposition: attachment.disposition || "attachment",
      }));
    }

    if (options.headers) {
      payload.headers = options.headers;
    }

    if (options.replyTo) {
      payload.replyTo = options.replyTo;
    }

    if (options.from) {
      payload.from = options.from;
    }

    return payload;
  }
}
