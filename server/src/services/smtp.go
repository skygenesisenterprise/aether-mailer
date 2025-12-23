package services

import (
	"bufio"
	"context"
	"crypto/tls"
	"fmt"
	"io"
	"net"
	"net/mail"
	"strings"
	"time"

	"gorm.io/gorm"

	"github.com/skygenesisenterprise/server/src/models"
)

// SMTPService represents SMTP service
type SMTPService struct {
	db *gorm.DB
}

// NewSMTPService creates a new SMTP service
func NewSMTPService(db *gorm.DB) *SMTPService {
	return &SMTPService{db: db}
}

// SMTPServer represents an SMTP server
type SMTPServer struct {
	service *SMTPService
	config  SMTPConfig
}

// SMTPConfig represents SMTP server configuration
type SMTPConfig struct {
	Hostname         string
	Port             int
	MaxClients       int
	MaxMessageSize   int64
	Timeout          time.Duration
	EnableTLS        bool
	EnableSTARTTLS   bool
	TLSCertFile      string
	TLSKeyFile       string
	RequireAuth      bool
	AuthMethods      []string
	ExternalSMTP     string
	ExternalSMTPPort int
	ExternalSMTPUser string
	ExternalSMTPPass string
}

// NewSMTPServer creates a new SMTP server
func NewSMTPServer(service *SMTPService, config SMTPConfig) *SMTPServer {
	return &SMTPServer{
		service: service,
		config:  config,
	}
}

// Start starts the SMTP server
func (s *SMTPServer) Start() error {
	addr := fmt.Sprintf("%s:%d", s.config.Hostname, s.config.Port)

	var listener net.Listener
	var err error

	if s.config.EnableTLS {
		if s.config.TLSCertFile != "" && s.config.TLSKeyFile != "" {
			cert, err := tls.LoadX509KeyPair(s.config.TLSCertFile, s.config.TLSKeyFile)
			if err != nil {
				return fmt.Errorf("failed to load TLS certificate: %w", err)
			}
			listener, err = tls.Listen("tcp", addr, &tls.Config{
				Certificates: []tls.Certificate{cert},
			})
		} else {
			return fmt.Errorf("TLS enabled but certificate files not provided")
		}
	} else {
		listener, err = net.Listen("tcp", addr)
	}

	if err != nil {
		return fmt.Errorf("failed to create listener: %w", err)
	}
	defer listener.Close()

	fmt.Printf("🚀 Starting SMTP server on %s\n", addr)

	for {
		conn, err := listener.Accept()
		if err != nil {
			fmt.Printf("Failed to accept connection: %v\n", err)
			continue
		}

		go s.handleConnection(conn)
	}
}

// handleConnection handles an SMTP connection
func (s *SMTPServer) handleConnection(conn net.Conn) {
	defer conn.Close()

	session := s.service.NewSMTPSessionImpl()
	session.clientIP = conn.RemoteAddr().String()

	// Simple SMTP protocol implementation
	reader := bufio.NewReader(conn)
	writer := bufio.NewWriter(conn)

	// Send greeting
	writer.WriteString("220 Aether Mailer SMTP Ready\r\n")
	writer.Flush()

	for {
		line, err := reader.ReadString('\n')
		if err != nil {
			break
		}

		line = strings.TrimSpace(line)
		parts := strings.Fields(line)
		if len(parts) == 0 {
			continue
		}

		command := strings.ToUpper(parts[0])

		switch command {
		case "EHLO", "HELO":
			writer.WriteString("250-Hello\r\n")
			writer.WriteString("250-SIZE 52428800\r\n")
			writer.WriteString("250 HELP\r\n")
			writer.Flush()

		case "MAIL":
			if len(parts) > 1 && strings.HasPrefix(parts[1], "FROM:") {
				from := strings.TrimPrefix(parts[1], "FROM:")
				from = strings.Trim(from, "<>")
				session.from = from
				writer.WriteString("250 OK\r\n")
			} else {
				writer.WriteString("501 Syntax error\r\n")
			}
			writer.Flush()

		case "RCPT":
			if len(parts) > 1 && strings.HasPrefix(parts[1], "TO:") {
				to := strings.TrimPrefix(parts[1], "TO:")
				to = strings.Trim(to, "<>")
				session.to = append(session.to, to)
				writer.WriteString("250 OK\r\n")
			} else {
				writer.WriteString("501 Syntax error\r\n")
			}
			writer.Flush()

		case "DATA":
			writer.WriteString("354 Start mail input\r\n")
			writer.Flush()

			// Read message data
			var messageData strings.Builder
			for {
				dataLine, err := reader.ReadString('\n')
				if err != nil {
					break
				}

				if strings.TrimSpace(dataLine) == "." {
					break
				}

				messageData.WriteString(dataLine)
			}

			// Process message
			if err := s.service.processMessage(session, messageData.String()); err != nil {
				writer.WriteString("550 Message rejected\r\n")
			} else {
				writer.WriteString("250 OK\r\n")
			}
			writer.Flush()

		case "QUIT":
			writer.WriteString("221 Bye\r\n")
			writer.Flush()
			return

		default:
			writer.WriteString("500 Command not recognized\r\n")
			writer.Flush()
		}
	}
}

// SMTPSessionImpl represents an SMTP session implementation
type SMTPSessionImpl struct {
	sessionID    string
	clientIP     string
	hostname     string
	username     string
	auth         bool
	from         string
	to           []string
	data         []string
	startedAt    time.Time
	lastActivity time.Time
}

// NewSMTPSessionImpl creates a new SMTP session implementation
func (s *SMTPService) NewSMTPSessionImpl() *SMTPSessionImpl {
	sessionID := generateSessionID()

	// Create session record
	session := &models.SMTPSession{
		SessionID:    sessionID,
		ClientIP:     "127.0.0.1", // TODO: Get actual client IP
		Hostname:     "unknown",
		Status:       models.SMTPStatusActive,
		StartedAt:    time.Now(),
		LastActivity: time.Now(),
	}

	s.db.Create(session)

	return &SMTPSessionImpl{
		sessionID:    sessionID,
		startedAt:    time.Now(),
		lastActivity: time.Now(),
	}
}

// processMessage processes an SMTP message
func (s *SMTPService) processMessage(session *SMTPSessionImpl, messageData string) error {
	// Create message record
	message := &models.SMTPMessage{
		SessionID:   session.sessionID,
		MessageID:   generateMessageID(),
		FromAddress: session.from,
		ToAddresses: strings.Join(session.to, ","),
		Data:        messageData,
		Size:        int64(len(messageData)),
		Status:      models.SMTPMessageStatusPending,
		QueuedAt:    time.Now(),
	}

	if err := s.db.Create(message).Error; err != nil {
		return fmt.Errorf("failed to create SMTP message: %w", err)
	}

	// Parse and store email
	if err := s.processIncomingEmail(message); err != nil {
		return fmt.Errorf("failed to process incoming email: %w", err)
	}

	return nil
}

// SendEmail sends an email via SMTP
func (s *SMTPService) SendEmail(ctx context.Context, from string, to []string, subject, bodyText, bodyHTML string) error {
	// Create email message
	messageID := generateMessageID()

	// Build message
	var message strings.Builder
	message.WriteString(fmt.Sprintf("From: %s\r\n", from))
	message.WriteString(fmt.Sprintf("To: %s\r\n", strings.Join(to, ", ")))
	message.WriteString(fmt.Sprintf("Subject: %s\r\n", subject))
	message.WriteString(fmt.Sprintf("Message-ID: %s\r\n", messageID))
	message.WriteString(fmt.Sprintf("Date: %s\r\n", time.Now().Format(time.RFC1123Z)))
	message.WriteString("\r\n")

	if bodyHTML != "" {
		message.WriteString(fmt.Sprintf("Content-Type: text/html; charset=UTF-8\r\n\r\n%s", bodyHTML))
	} else {
		message.WriteString(fmt.Sprintf("Content-Type: text/plain; charset=UTF-8\r\n\r\n%s", bodyText))
	}

	// Send via external SMTP or queue for local delivery
	for _, recipient := range to {
		if s.isLocalDomain(recipient) {
			// Queue for local delivery
			if err := s.queueLocalEmail(from, recipient, message.String()); err != nil {
				return fmt.Errorf("failed to queue local email: %w", err)
			}
		} else {
			// Send via external SMTP
			if err := s.sendExternalEmail(from, recipient, message.String()); err != nil {
				return fmt.Errorf("failed to send external email: %w", err)
			}
		}
	}

	return nil
}

// processIncomingEmail processes an incoming email
func (s *SMTPService) processIncomingEmail(message *models.SMTPMessage) error {
	// Parse email
	msg, err := mail.ReadMessage(strings.NewReader(message.Data))
	if err != nil {
		return fmt.Errorf("failed to parse email: %w", err)
	}

	// Extract headers
	headers := make(map[string]string)
	for k, v := range msg.Header {
		if len(v) > 0 {
			headers[k] = v[0]
		}
	}

	// Read body
	bodyBytes, err := io.ReadAll(msg.Body)
	if err != nil {
		return fmt.Errorf("failed to read email body: %w", err)
	}
	body := string(bodyBytes)

	// Create email record
	email := &models.Email{
		MessageID:   message.MessageID,
		FromAddress: message.FromAddress,
		ToAddresses: message.ToAddresses,
		Subject:     headers["Subject"],
		BodyText:    body,
		Headers:     formatHeaders(headers),
		Size:        message.Size,
		Priority:    models.EmailPriorityNormal,
		IsRead:      false,
		IsSpam:      s.isSpam(message),
		ReceivedAt:  time.Now(),
	}

	// Find user and domain
	user, domain, err := s.findRecipientUser(message.ToAddresses)
	if err != nil {
		return fmt.Errorf("failed to find recipient: %w", err)
	}

	email.UserID = user.ID
	if domain != nil {
		email.DomainID = &domain.ID
	}

	// Save email
	if err := s.db.Create(email).Error; err != nil {
		return fmt.Errorf("failed to save email: %w", err)
	}

	// Update message status
	message.Status = models.SMTPMessageStatusSent
	sentAt := time.Now()
	message.SentAt = &sentAt
	s.db.Save(message)

	return nil
}

// queueLocalEmail queues an email for local delivery
func (s *SMTPService) queueLocalEmail(from, to, message string) error {
	queue := &models.SMTPQueue{
		MessageID:   generateMessageID(),
		FromAddress: from,
		ToAddress:   to,
		Status:      models.SMTPQueueStatusPending,
		QueuedAt:    time.Now(),
		NextAttempt: time.Now(),
	}

	return s.db.Create(queue).Error
}

// sendExternalEmail sends an email via external SMTP
func (s *SMTPService) sendExternalEmail(from, to, message string) error {
	// TODO: Implement external SMTP sending with proper configuration
	// For now, just log
	fmt.Printf("Sending external email from %s to %s\n", from, to)
	return nil
}

// isLocalDomain checks if a domain is local
func (s *SMTPService) isLocalDomain(emailAddr string) bool {
	addr, err := mail.ParseAddress(emailAddr)
	if err != nil {
		return false
	}

	parts := strings.Split(addr.Address, "@")
	if len(parts) != 2 {
		return false
	}

	domain := parts[1]

	// Check if domain exists in our database
	var count int64
	s.db.Model(&models.Domain{}).Where("name = ?", domain).Count(&count)

	return count > 0
}

// findRecipientUser finds the user for a recipient email
func (s *SMTPService) findRecipientUser(toAddresses string) (*models.User, *models.Domain, error) {
	addresses := strings.Split(toAddresses, ",")

	for _, addr := range addresses {
		email, err := mail.ParseAddress(strings.TrimSpace(addr))
		if err != nil {
			continue
		}

		parts := strings.Split(email.Address, "@")
		if len(parts) != 2 {
			continue
		}

		domainName := parts[1]

		// Find domain
		var domain models.Domain
		if err := s.db.Where("name = ?", domainName).First(&domain).Error; err != nil {
			continue
		}

		// Find user
		var user models.User
		if err := s.db.Where("email = ?", email.Address).First(&user).Error; err != nil {
			continue
		}

		return &user, &domain, nil
	}

	return nil, nil, fmt.Errorf("no valid recipient found")
}

// isSpam checks if an email is spam
func (s *SMTPService) isSpam(message *models.SMTPMessage) bool {
	// TODO: Implement spam detection
	// For now, simple heuristics
	data := strings.ToLower(message.Data)

	// Check for spam keywords
	spamKeywords := []string{
		"viagra", "cialis", "lottery", "winner", "congratulations",
		"free money", "click here", "act now", "limited time",
	}

	for _, keyword := range spamKeywords {
		if strings.Contains(data, keyword) {
			return true
		}
	}

	return false
}

// ProcessQueue processes the SMTP queue
func (s *SMTPService) ProcessQueue(ctx context.Context) error {
	var messages []models.SMTPQueue

	// Get pending messages
	if err := s.db.Where("status = ? AND next_attempt <= ?",
		models.SMTPQueueStatusPending, time.Now()).
		Limit(100).Find(&messages).Error; err != nil {
		return fmt.Errorf("failed to get queue messages: %w", err)
	}

	for _, message := range messages {
		if err := s.processQueueMessage(ctx, &message); err != nil {
			// Log error but continue with other messages
			fmt.Printf("Failed to process queue message %s: %v\n", message.MessageID, err)
		}
	}

	return nil
}

// processQueueMessage processes a single queue message
func (s *SMTPService) processQueueMessage(ctx context.Context, message *models.SMTPQueue) error {
	// Update status
	message.Status = models.SMTPQueueStatusProcessing
	message.Attempts++
	lastAttempt := time.Now()
	message.LastAttempt = &lastAttempt
	s.db.Save(message)

	// Try to send
	if err := s.sendExternalEmail(message.FromAddress, message.ToAddress, ""); err != nil {
		// Failed to send
		message.ErrorMessage = err.Error()

		if message.Attempts >= message.MaxAttempts {
			message.Status = models.SMTPQueueStatusFailed
		} else {
			message.Status = models.SMTPQueueStatusDeferred
			// Schedule next attempt (exponential backoff)
			backoff := time.Duration(message.Attempts) * time.Hour
			message.NextAttempt = time.Now().Add(backoff)
		}

		s.db.Save(message)
		return err
	}

	// Success
	message.Status = models.SMTPQueueStatusSent
	sentAt := time.Now()
	message.SentAt = &sentAt
	s.db.Save(message)

	return nil
}

// Helper functions

func generateSessionID() string {
	return fmt.Sprintf("%d-%s", time.Now().UnixNano(), randomString(8))
}

func generateMessageID() string {
	return fmt.Sprintf("<%s@%s>", randomString(32), "aether-mailer.local")
}

func randomString(length int) string {
	const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	b := make([]byte, length)
	for i := range b {
		b[i] = charset[time.Now().UnixNano()%int64(len(charset))]
	}
	return string(b)
}

func formatHeaders(headers map[string]string) string {
	var result strings.Builder
	for k, v := range headers {
		result.WriteString(fmt.Sprintf("%s: %s\r\n", k, v))
	}
	return result.String()
}
