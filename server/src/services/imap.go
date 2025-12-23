package services

import (
	"bufio"
	"crypto/tls"
	"fmt"
	"net"
	"strconv"
	"strings"
	"time"

	"gorm.io/gorm"

	"github.com/skygenesisenterprise/aether-mailer/server/src/models"
)

// IMAPService represents IMAP service
type IMAPService struct {
	db *gorm.DB
}

// NewIMAPService creates a new IMAP service
func NewIMAPService(db *gorm.DB) *IMAPService {
	return &IMAPService{db: db}
}

// IMAPServer represents an IMAP server
type IMAPServer struct {
	service *IMAPService
	config  IMAPConfig
}

// IMAPConfig represents IMAP server configuration
type IMAPConfig struct {
	Hostname       string
	Port           int
	MaxClients     int
	Timeout        time.Duration
	EnableTLS      bool
	EnableSTARTTLS bool
	TLSCertFile    string
	TLSKeyFile     string
	RequireAuth    bool
	AuthMethods    []string
}

// NewIMAPServer creates a new IMAP server
func NewIMAPServer(service *IMAPService, config IMAPConfig) *IMAPServer {
	return &IMAPServer{
		service: service,
		config:  config,
	}
}

// Start starts the IMAP server
func (s *IMAPServer) Start() error {
	addr := fmt.Sprintf("%s:%d", s.config.Hostname, s.config.Port)

	var listener net.Listener
	var err error

	if s.config.EnableTLS {
		cert, err := tls.LoadX509KeyPair(s.config.TLSCertFile, s.config.TLSKeyFile)
		if err != nil {
			return fmt.Errorf("failed to load TLS certificate: %w", err)
		}

		listener, err = tls.Listen("tcp", addr, &tls.Config{
			Certificates: []tls.Certificate{cert},
		})
	} else {
		listener, err = net.Listen("tcp", addr)
	}

	if err != nil {
		return fmt.Errorf("failed to create listener: %w", err)
	}
	defer listener.Close()

	fmt.Printf("🚀 Starting IMAP server on %s\n", addr)

	for {
		conn, err := listener.Accept()
		if err != nil {
			fmt.Printf("Failed to accept connection: %v\n", err)
			continue
		}

		go s.handleConnection(conn)
	}
}

// handleConnection handles an IMAP connection
func (s *IMAPServer) handleConnection(conn net.Conn) {
	defer conn.Close()

	session := s.service.NewIMAPSessionImpl()
	session.clientIP = conn.RemoteAddr().String()
	session.state = IMAPStateNonAuthenticated

	reader := bufio.NewReader(conn)
	writer := bufio.NewWriter(conn)

	// Send greeting
	writer.WriteString("* OK [CAPABILITY IMAP4rev1 STARTTLS AUTH=PLAIN] Aether Mailer IMAP Ready\r\n")
	writer.Flush()

	for {
		line, err := reader.ReadString('\n')
		if err != nil {
			break
		}

		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}

		// Parse command with tag
		parts := strings.Fields(line)
		if len(parts) < 2 {
			s.sendError(writer, parts[0], "BAD Command syntax")
			continue
		}

		tag := parts[0]
		command := strings.ToUpper(parts[1])

		switch command {
		case "CAPABILITY":
			s.handleCapability(writer, tag)

		case "LOGIN":
			if len(parts) < 4 {
				s.sendError(writer, tag, "BAD LOGIN requires username and password")
				continue
			}
			username := strings.Trim(parts[2], `"`)
			password := strings.Trim(parts[3], `"`)
			s.handleLogin(writer, tag, session, username, password)

		case "LOGOUT":
			s.handleLogout(writer, tag, session)
			return

		case "SELECT":
			if len(parts) < 3 {
				s.sendError(writer, tag, "BAD SELECT requires mailbox name")
				continue
			}
			mailbox := strings.Trim(parts[2], `"`)
			s.handleSelect(writer, tag, session, mailbox)

		case "EXAMINE":
			if len(parts) < 3 {
				s.sendError(writer, tag, "BAD EXAMINE requires mailbox name")
				continue
			}
			mailbox := strings.Trim(parts[2], `"`)
			s.handleExamine(writer, tag, session, mailbox)

		case "LIST":
			if len(parts) < 4 {
				s.sendError(writer, tag, "BAD LIST requires reference name and mailbox name")
				continue
			}
			reference := strings.Trim(parts[2], `"`)
			mailbox := strings.Trim(parts[3], `"`)
			s.handleList(writer, tag, session, reference, mailbox)

		case "FETCH":
			if len(parts) < 4 {
				s.sendError(writer, tag, "BAD FETCH requires message set and data items")
				continue
			}
			messageSet := parts[2]
			dataItems := strings.Join(parts[3:], " ")
			s.handleFetch(writer, tag, session, messageSet, dataItems)

		case "SEARCH":
			if len(parts) < 4 {
				s.sendError(writer, tag, "BAD SEARCH requires charset and criteria")
				continue
			}
			charset := parts[2]
			criteria := strings.Join(parts[3:], " ")
			s.handleSearch(writer, tag, session, charset, criteria)

		case "STORE":
			if len(parts) < 5 {
				s.sendError(writer, tag, "BAD STORE requires message set, data item name, and value")
				continue
			}
			messageSet := parts[2]
			dataItem := parts[3]
			value := strings.Join(parts[4:], " ")
			s.handleStore(writer, tag, session, messageSet, dataItem, value)

		case "EXPUNGE":
			s.handleExpunge(writer, tag, session)

		case "CREATE":
			if len(parts) < 3 {
				s.sendError(writer, tag, "BAD CREATE requires mailbox name")
				continue
			}
			mailbox := strings.Trim(parts[2], `"`)
			s.handleCreate(writer, tag, session, mailbox)

		case "DELETE":
			if len(parts) < 3 {
				s.sendError(writer, tag, "BAD DELETE requires mailbox name")
				continue
			}
			mailbox := strings.Trim(parts[2], `"`)
			s.handleDelete(writer, tag, session, mailbox)

		case "RENAME":
			if len(parts) < 4 {
				s.sendError(writer, tag, "BAD RENAME requires old and new mailbox names")
				continue
			}
			oldName := strings.Trim(parts[2], `"`)
			newName := strings.Trim(parts[3], `"`)
			s.handleRename(writer, tag, session, oldName, newName)

		default:
			s.sendError(writer, tag, "BAD Command not recognized")
		}
	}
}

// IMAPState represents IMAP connection state
type IMAPState int

const (
	IMAPStateNonAuthenticated IMAPState = iota
	IMAPStateAuthenticated
	IMAPStateSelected
	IMAPStateLogout
)

// IMAPSessionImpl represents an IMAP session implementation
type IMAPSessionImpl struct {
	sessionID       string
	clientIP        string
	username        string
	userID          uint
	state           IMAPState
	selectedMailbox string
	mailboxes       map[string]*models.IMAPMailbox
	sequenceNum     map[string]uint
	startedAt       time.Time
	lastActivity    time.Time
}

// NewIMAPSessionImpl creates a new IMAP session implementation
func (s *IMAPService) NewIMAPSessionImpl() *IMAPSessionImpl {
	sessionID := generateSessionID()

	// Create session record
	session := &models.IMAPSession{
		SessionID:    sessionID,
		ClientIP:     "127.0.0.1", // TODO: Get actual client IP
		Username:     "",
		State:        models.IMAPStateNonAuthenticated,
		StartedAt:    time.Now(),
		LastActivity: time.Now(),
	}

	s.db.Create(session)

	return &IMAPSessionImpl{
		sessionID:    sessionID,
		state:        IMAPStateNonAuthenticated,
		mailboxes:    make(map[string]*models.IMAPMailbox),
		sequenceNum:  make(map[string]uint),
		startedAt:    time.Now(),
		lastActivity: time.Now(),
	}
}

// Command handlers

func (s *IMAPServer) handleCapability(writer *bufio.Writer, tag string) {
	capabilities := []string{"IMAP4rev1", "STARTTLS", "AUTH=PLAIN", "SELECT", "EXAMINE", "LIST", "FETCH", "SEARCH", "STORE", "EXPUNGE", "CREATE", "DELETE", "RENAME"}

	writer.WriteString(fmt.Sprintf("* CAPABILITY %s\r\n", strings.Join(capabilities, " ")))
	writer.WriteString(fmt.Sprintf("%s OK CAPABILITY completed\r\n", tag))
	writer.Flush()
}

func (s *IMAPServer) handleLogin(writer *bufio.Writer, tag string, session *IMAPSessionImpl, username, password string) {
	// Authenticate user
	_, err := s.service.authenticateUser(username, password)
	if err != nil {
		s.sendError(writer, tag, "NO Authentication failed")
		return
	}

	// Update session
	session.username = username
	session.userID = 1 // TODO: Convert string ID to uint properly
	session.state = IMAPStateAuthenticated

	// Load user mailboxes
	if err := s.service.loadUserMailboxes(session); err != nil {
		s.sendError(writer, tag, "NO Failed to load mailboxes")
		return
	}

	// Update session in database
	s.service.updateSession(session, models.IMAPStateAuthenticated, username)

	writer.WriteString(fmt.Sprintf("%s OK LOGIN completed\r\n", tag))
	writer.Flush()
}

func (s *IMAPServer) handleLogout(writer *bufio.Writer, tag string, session *IMAPSessionImpl) {
	session.state = IMAPStateLogout

	writer.WriteString("* BYE IMAP4rev1 Server logging out\r\n")
	writer.WriteString(fmt.Sprintf("%s OK LOGOUT completed\r\n", tag))
	writer.Flush()
}

func (s *IMAPServer) handleSelect(writer *bufio.Writer, tag string, session *IMAPSessionImpl, mailbox string) {
	if session.state != IMAPStateAuthenticated {
		s.sendError(writer, tag, "NO Not authenticated")
		return
	}

	mbox, exists := session.mailboxes[mailbox]
	if !exists {
		s.sendError(writer, tag, "NO Mailbox does not exist")
		return
	}

	session.selectedMailbox = mailbox
	session.state = IMAPStateSelected

	// Get mailbox stats
	flags := "\\Seen \\Answered \\Flagged \\Deleted \\Draft"
	uidNext := mbox.UIDNext
	uidValidity := mbox.UIDValidity

	writer.WriteString(fmt.Sprintf("* %d EXISTS\r\n", mbox.MessageCount))
	writer.WriteString(fmt.Sprintf("* %d RECENT\r\n", mbox.RecentCount))
	writer.WriteString(fmt.Sprintf("* OK [UIDVALIDITY %d] UIDs valid\r\n", uidValidity))
	writer.WriteString(fmt.Sprintf("* OK [UIDNEXT %d] Predicted next UID\r\n", uidNext))
	writer.WriteString(fmt.Sprintf("* FLAGS (%s)\r\n", flags))
	writer.WriteString(fmt.Sprintf("* OK [PERMANENTFLAGS (%s \\*)] Limited\r\n", flags))
	writer.WriteString(fmt.Sprintf("%s OK [READ-WRITE] SELECT completed\r\n", tag))
	writer.Flush()
}

func (s *IMAPServer) handleExamine(writer *bufio.Writer, tag string, session *IMAPSessionImpl, mailbox string) {
	if session.state != IMAPStateAuthenticated {
		s.sendError(writer, tag, "NO Not authenticated")
		return
	}

	mbox, exists := session.mailboxes[mailbox]
	if !exists {
		s.sendError(writer, tag, "NO Mailbox does not exist")
		return
	}

	session.selectedMailbox = mailbox
	// State remains AUTHENTICATED for EXAMINE (read-only)

	flags := "\\Seen \\Answered \\Flagged \\Deleted \\Draft"
	uidNext := mbox.UIDValidity + 1
	uidValidity := mbox.UIDValidity

	writer.WriteString(fmt.Sprintf("* %d EXISTS\r\n", mbox.MessageCount))
	writer.WriteString(fmt.Sprintf("* %d RECENT\r\n", mbox.RecentCount))
	writer.WriteString(fmt.Sprintf("* OK [UIDVALIDITY %d] UIDs valid\r\n", uidValidity))
	writer.WriteString(fmt.Sprintf("* OK [UIDNEXT %d] Predicted next UID\r\n", uidNext))
	writer.WriteString(fmt.Sprintf("* FLAGS (%s)\r\n", flags))
	writer.WriteString(fmt.Sprintf("* OK [PERMANENTFLAGS (%s)] Limited\r\n", flags))
	writer.WriteString(fmt.Sprintf("%s OK [READ-ONLY] EXAMINE completed\r\n", tag))
	writer.Flush()
}

func (s *IMAPServer) handleList(writer *bufio.Writer, tag string, session *IMAPSessionImpl, reference, mailbox string) {
	if session.state != IMAPStateAuthenticated {
		s.sendError(writer, tag, "NO Not authenticated")
		return
	}

	for name, mbox := range session.mailboxes {
		if s.matchMailbox(name, mailbox) {
			flags := "\\Noinferiors"
			if mbox.IsSelectable {
				flags = "\\Marked \\Noinferiors"
			}
			if len(mbox.Children) > 0 {
				flags += "\\HasChildren"
			} else {
				flags += "\\HasNoChildren"
			}

			writer.WriteString(fmt.Sprintf("* LIST (%s) \"/\" \"%s\"\r\n", flags, name))
		}
	}

	writer.WriteString(fmt.Sprintf("%s OK LIST completed\r\n", tag))
	writer.Flush()
}

func (s *IMAPServer) handleFetch(writer *bufio.Writer, tag string, session *IMAPSessionImpl, messageSet, dataItems string) {
	if session.state != IMAPStateSelected {
		s.sendError(writer, tag, "NO No mailbox selected")
		return
	}

	// Parse message set (simplified - supports single numbers and ranges)
	sequenceNumbers := s.parseMessageSet(messageSet)

	for _, seqNum := range sequenceNumbers {
		email, err := s.service.getEmailBySequence(session, seqNum)
		if err != nil {
			continue
		}

		// Build response based on requested data items
		response := s.buildFetchResponse(email, seqNum, dataItems)
		writer.WriteString(response)
	}

	writer.WriteString(fmt.Sprintf("%s OK FETCH completed\r\n", tag))
	writer.Flush()
}

func (s *IMAPServer) handleSearch(writer *bufio.Writer, tag string, session *IMAPSessionImpl, charset, criteria string) {
	if session.state != IMAPStateSelected {
		s.sendError(writer, tag, "NO No mailbox selected")
		return
	}

	// Parse search criteria and find matching emails
	emails, err := s.service.searchEmails(session, criteria)
	if err != nil {
		s.sendError(writer, tag, "NO Search failed")
		return
	}

	// Return matching sequence numbers
	var sequenceNumbers []string
	for _, email := range emails {
		seqNum := s.service.getSequenceNumber(session, email.ID)
		sequenceNumbers = append(sequenceNumbers, strconv.Itoa(int(seqNum)))
	}

	if len(sequenceNumbers) > 0 {
		writer.WriteString(fmt.Sprintf("* SEARCH %s\r\n", strings.Join(sequenceNumbers, " ")))
	}

	writer.WriteString(fmt.Sprintf("%s OK SEARCH completed\r\n", tag))
	writer.Flush()
}

func (s *IMAPServer) handleStore(writer *bufio.Writer, tag string, session *IMAPSessionImpl, messageSet, dataItem, value string) {
	if session.state != IMAPStateSelected {
		s.sendError(writer, tag, "NO No mailbox selected")
		return
	}

	// Parse message set
	sequenceNumbers := s.parseMessageSet(messageSet)

	for _, seqNum := range sequenceNumbers {
		email, err := s.service.getEmailBySequence(session, seqNum)
		if err != nil {
			continue
		}

		// Update flags based on data item
		if err := s.service.updateEmailFlags(email, dataItem, value); err != nil {
			continue
		}

		// Send response
		flags := s.service.formatEmailFlags(email)
		writer.WriteString(fmt.Sprintf("* %d FETCH (FLAGS (%s))\r\n", seqNum, flags))
	}

	writer.WriteString(fmt.Sprintf("%s OK STORE completed\r\n", tag))
	writer.Flush()
}

func (s *IMAPServer) handleExpunge(writer *bufio.Writer, tag string, session *IMAPSessionImpl) {
	if session.state != IMAPStateSelected {
		s.sendError(writer, tag, "NO No mailbox selected")
		return
	}

	// Find and delete emails with \\Deleted flag
	deletedEmails, err := s.service.expungeDeletedEmails(session)
	if err != nil {
		s.sendError(writer, tag, "NO Expunge failed")
		return
	}

	// Send sequence numbers of deleted emails
	for _, email := range deletedEmails {
		seqNum := s.service.getSequenceNumber(session, email.ID)
		writer.WriteString(fmt.Sprintf("* %d EXPUNGE\r\n", seqNum))
	}

	writer.WriteString(fmt.Sprintf("%s OK EXPUNGE completed\r\n", tag))
	writer.Flush()
}

func (s *IMAPServer) handleCreate(writer *bufio.Writer, tag string, session *IMAPSessionImpl, mailbox string) {
	if session.state != IMAPStateAuthenticated {
		s.sendError(writer, tag, "NO Not authenticated")
		return
	}

	if err := s.service.createMailbox(session, mailbox); err != nil {
		s.sendError(writer, tag, "NO CREATE failed")
		return
	}

	writer.WriteString(fmt.Sprintf("%s OK CREATE completed\r\n", tag))
	writer.Flush()
}

func (s *IMAPServer) handleDelete(writer *bufio.Writer, tag string, session *IMAPSessionImpl, mailbox string) {
	if session.state != IMAPStateAuthenticated {
		s.sendError(writer, tag, "NO Not authenticated")
		return
	}

	if err := s.service.deleteMailbox(session, mailbox); err != nil {
		s.sendError(writer, tag, "NO DELETE failed")
		return
	}

	writer.WriteString(fmt.Sprintf("%s OK DELETE completed\r\n", tag))
	writer.Flush()
}

func (s *IMAPServer) handleRename(writer *bufio.Writer, tag string, session *IMAPSessionImpl, oldName, newName string) {
	if session.state != IMAPStateAuthenticated {
		s.sendError(writer, tag, "NO Not authenticated")
		return
	}

	if err := s.service.renameMailbox(session, oldName, newName); err != nil {
		s.sendError(writer, tag, "NO RENAME failed")
		return
	}

	writer.WriteString(fmt.Sprintf("%s OK RENAME completed\r\n", tag))
	writer.Flush()
}

// Helper methods

func (s *IMAPServer) sendError(writer *bufio.Writer, tag, message string) {
	writer.WriteString(fmt.Sprintf("%s %s\r\n", tag, message))
	writer.Flush()
}

func (s *IMAPServer) matchMailbox(name, pattern string) bool {
	// Simple wildcard matching
	if pattern == "*" {
		return true
	}
	if pattern == name {
		return true
	}
	// TODO: Implement more sophisticated pattern matching
	return false
}

func (s *IMAPServer) parseMessageSet(messageSet string) []uint {
	var numbers []uint

	// Handle ranges (e.g., "1:10")
	if strings.Contains(messageSet, ":") {
		parts := strings.Split(messageSet, ":")
		if len(parts) == 2 {
			start, err1 := strconv.ParseUint(parts[0], 10, 32)
			end, err2 := strconv.ParseUint(parts[1], 10, 32)
			if err1 == nil && err2 == nil {
				for i := start; i <= end; i++ {
					numbers = append(numbers, uint(i))
				}
				return numbers
			}
		}
	}

	// Handle single numbers or comma-separated lists
	parts := strings.Split(messageSet, ",")
	for _, part := range parts {
		if num, err := strconv.ParseUint(strings.TrimSpace(part), 10, 32); err == nil {
			numbers = append(numbers, uint(num))
		}
	}

	return numbers
}

func (s *IMAPServer) buildFetchResponse(email *models.Email, seqNum uint, dataItems string) string {
	var response strings.Builder

	response.WriteString(fmt.Sprintf("* %d FETCH (", seqNum))

	// Parse requested data items
	items := strings.Fields(dataItems)
	first := true

	for _, item := range items {
		if !first {
			response.WriteString(" ")
		}
		first = false

		switch strings.ToUpper(item) {
		case "UID":
			response.WriteString(fmt.Sprintf("UID %s", email.ID))
		case "FLAGS":
			flags := s.service.formatEmailFlags(email)
			response.WriteString(fmt.Sprintf("FLAGS (%s)", flags))
		case "INTERNALDATE":
			response.WriteString(fmt.Sprintf("INTERNALDATE \"%s\"", email.ReceivedAt.Format(time.RFC1123Z)))
		case "RFC822.SIZE":
			response.WriteString(fmt.Sprintf("RFC822.SIZE %d", email.Size))
		case "RFC822":
			response.WriteString(fmt.Sprintf("RFC822 {%d}\r\n%s", len(email.BodyText), email.BodyText))
		case "BODY":
			response.WriteString(fmt.Sprintf("BODY {%d}\r\n%s", len(email.BodyText), email.BodyText))
		case "BODY[HEADER]":
			response.WriteString(fmt.Sprintf("BODY[HEADER] {%d}\r\n%s", len(email.Headers), email.Headers))
		case "BODY[TEXT]":
			response.WriteString(fmt.Sprintf("BODY[TEXT] {%d}\r\n%s", len(email.BodyText), email.BodyText))
		case "ENVELOPE":
			envelope := s.service.buildEnvelope(email)
			response.WriteString(fmt.Sprintf("ENVELOPE (%s)", envelope))
		}
	}

	response.WriteString(")\r\n")
	return response.String()
}

// Service methods

func (s *IMAPService) authenticateUser(username, password string) (*models.User, error) {
	var user models.User
	if err := s.db.Where("username = ? OR email = ?", username, username).First(&user).Error; err != nil {
		return nil, fmt.Errorf("user not found: %w", err)
	}

	// TODO: Implement proper password verification (hashing)
	// For now, skip password check
	_ = password

	return &user, nil
}

func (s *IMAPService) loadUserMailboxes(session *IMAPSessionImpl) error {
	var mailboxes []models.IMAPMailbox
	if err := s.db.Where("user_id = ?", session.userID).Find(&mailboxes).Error; err != nil {
		return fmt.Errorf("failed to load mailboxes: %w", err)
	}

	for _, mbox := range mailboxes {
		session.mailboxes[mbox.Name] = &mbox
		session.sequenceNum[mbox.Name] = 1
	}

	return nil
}

func (s *IMAPService) updateSession(session *IMAPSessionImpl, state models.IMAPState, username string) {
	s.db.Model(&models.IMAPSession{}).Where("session_id = ?", session.sessionID).Updates(map[string]interface{}{
		"state":         state,
		"username":      username,
		"last_activity": time.Now(),
	})
}

func (s *IMAPService) getEmailBySequence(session *IMAPSessionImpl, seqNum uint) (*models.Email, error) {
	if session.selectedMailbox == "" {
		return nil, fmt.Errorf("no mailbox selected")
	}

	var email models.Email
	offset := seqNum - 1
	if err := s.db.Where("user_id = ? AND mailbox = ?", session.userID, session.selectedMailbox).
		Offset(int(offset)).Limit(1).First(&email).Error; err != nil {
		return nil, fmt.Errorf("email not found: %w", err)
	}

	return &email, nil
}

func (s *IMAPService) getSequenceNumber(session *IMAPSessionImpl, emailID string) uint {
	var count int64
	s.db.Model(&models.Email{}).Where("user_id = ? AND id <= ?",
		session.userID, emailID).Count(&count)
	return uint(count)
}

func (s *IMAPService) searchEmails(session *IMAPSessionImpl, criteria string) ([]*models.Email, error) {
	// TODO: Implement proper search criteria parsing
	var emails []*models.Email

	if err := s.db.Where("user_id = ? AND mailbox = ?", session.userID, session.selectedMailbox).
		Find(&emails).Error; err != nil {
		return nil, fmt.Errorf("search failed: %w", err)
	}

	return emails, nil
}

func (s *IMAPService) updateEmailFlags(email *models.Email, dataItem, value string) error {
	// TODO: Implement flag updates based on data item and value
	return s.db.Save(email).Error
}

func (s *IMAPService) formatEmailFlags(email *models.Email) string {
	var flags []string

	if email.IsRead {
		flags = append(flags, "\\Seen")
	}
	// TODO: Add flagged and answered fields to Email model
	// if email.IsFlagged {
	// 	flags = append(flags, "\\Flagged")
	// }
	// if email.IsAnswered {
	// 	flags = append(flags, "\\Answered")
	// }
	if email.IsDeleted {
		flags = append(flags, "\\Deleted")
	}
	if email.IsDraft {
		flags = append(flags, "\\Draft")
	}

	if len(flags) == 0 {
		return "()"
	}

	return strings.Join(flags, " ")
}

func (s *IMAPService) expungeDeletedEmails(session *IMAPSessionImpl) ([]*models.Email, error) {
	var emails []*models.Email

	if err := s.db.Where("user_id = ? AND mailbox = ? AND is_deleted = ?",
		session.userID, session.selectedMailbox, true).Find(&emails).Error; err != nil {
		return nil, fmt.Errorf("failed to find deleted emails: %w", err)
	}

	// Delete the emails
	if len(emails) > 0 {
		emailIDs := make([]string, len(emails))
		for i, email := range emails {
			emailIDs[i] = email.ID
		}

		if err := s.db.Delete(&models.Email{}, emailIDs).Error; err != nil {
			return nil, fmt.Errorf("failed to delete emails: %w", err)
		}
	}

	return emails, nil
}

func (s *IMAPService) createMailbox(session *IMAPSessionImpl, name string) error {
	mailbox := &models.IMAPMailbox{
		UserID:       "1", // TODO: Convert session.userID to string
		Name:         name,
		IsSelectable: true,
		MessageCount: 0,
		RecentCount:  0,
		UIDValidity:  uint32(time.Now().Unix()),
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	return s.db.Create(mailbox).Error
}

func (s *IMAPService) deleteMailbox(session *IMAPSessionImpl, name string) error {
	// Check if mailbox exists
	var mailbox models.IMAPMailbox
	if err := s.db.Where("user_id = ? AND name = ?", "1", name).First(&mailbox).Error; err != nil {
		return fmt.Errorf("mailbox not found: %w", err)
	}

	// Check if mailbox has messages
	var count int64
	s.db.Model(&models.IMAPMessage{}).Where("mailbox_id = ?", mailbox.ID).Count(&count)
	if count > 0 {
		return fmt.Errorf("mailbox not empty")
	}

	// Delete mailbox
	return s.db.Delete(&mailbox).Error
}

func (s *IMAPService) renameMailbox(session *IMAPSessionImpl, oldName, newName string) error {
	// Check if old mailbox exists
	var mailbox models.IMAPMailbox
	if err := s.db.Where("user_id = ? AND name = ?", "1", oldName).First(&mailbox).Error; err != nil {
		return fmt.Errorf("mailbox not found: %w", err)
	}

	// Check if new name already exists
	var existing models.IMAPMailbox
	result := s.db.Where("user_id = ? AND name = ?", "1", newName).First(&existing)
	if result.Error == nil {
		return fmt.Errorf("mailbox already exists")
	}

	// Rename mailbox
	return s.db.Model(&mailbox).Update("name", newName).Error
}

func (s *IMAPService) buildEnvelope(email *models.Email) string {
	// Build IMAP envelope structure
	// TODO: Implement proper envelope parsing
	return fmt.Sprintf("\"%s\" NIL NIL NIL NIL NIL NIL NIL NIL %d",
		email.Subject, email.Size)
}
