package database

import (
	"fmt"
	"time"

	"github.com/skygenesisenterprise/aether-mailer/services/config"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// DatabaseManager manages database connections and operations
type DatabaseManager struct {
	db     *gorm.DB
	config *config.DatabaseConfig
}

// NewDatabaseManager creates a new DatabaseManager instance
func NewDatabaseManager(cfg *config.DatabaseConfig) *DatabaseManager {
	return &DatabaseManager{
		config: cfg,
	}
}

// Connect establishes a database connection
func (dm *DatabaseManager) Connect() error {
	var err error

	// Configure GORM logger
	gormConfig := &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
		NowFunc: func() time.Time {
			return time.Now().UTC()
		},
	}

	// Open database connection
	dm.db, err = gorm.Open(postgres.Open(dm.config.URL), gormConfig)
	if err != nil {
		return fmt.Errorf("failed to connect to database: %w", err)
	}

	// Get underlying SQL DB for connection pool configuration
	sqlDB, err := dm.db.DB()
	if err != nil {
		return fmt.Errorf("failed to get underlying SQL DB: %w", err)
	}

	// Configure connection pool
	sqlDB.SetMaxOpenConns(dm.config.PoolSize)
	sqlDB.SetMaxIdleConns(dm.config.PoolSize / 2)
	sqlDB.SetConnMaxLifetime(time.Hour)
	sqlDB.SetConnMaxIdleTime(time.Minute * 30)

	return nil
}

// Disconnect closes the database connection
func (dm *DatabaseManager) Disconnect() error {
	if dm.db != nil {
		sqlDB, err := dm.db.DB()
		if err != nil {
			return fmt.Errorf("failed to get underlying SQL DB: %w", err)
		}
		return sqlDB.Close()
	}
	return nil
}

// GetDB returns the GORM database instance
func (dm *DatabaseManager) GetDB() *gorm.DB {
	return dm.db
}

// HealthCheck performs a database health check
func (dm *DatabaseManager) HealthCheck() bool {
	if dm.db == nil {
		return false
	}

	sqlDB, err := dm.db.DB()
	if err != nil {
		return false
	}

	err = sqlDB.Ping()
	return err == nil
}

// Transaction executes a function within a database transaction
func (dm *DatabaseManager) Transaction(fn func(*gorm.DB) error) error {
	return dm.db.Transaction(fn)
}

// User model represents a user in the system
type User struct {
	ID        string    `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	Email     string    `gorm:"uniqueIndex;not null" json:"email"`
	Username  string    `gorm:"uniqueIndex;not null" json:"username"`
	Password  string    `gorm:"not null" json:"-"`
	FirstName *string   `json:"firstName,omitempty"`
	LastName  *string   `json:"lastName,omitempty"`
	Role      string    `gorm:"default:'user'" json:"role"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// Domain model represents a domain in the system
type Domain struct {
	ID        string    `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	Name      string    `gorm:"uniqueIndex;not null" json:"name"`
	OwnerID   string    `gorm:"not null" json:"ownerId"`
	MaxUsers  *int      `json:"maxUsers,omitempty"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`

	// Relationships
	Owner User `gorm:"foreignKey:OwnerID" json:"owner,omitempty"`
}

// EmailAccount model represents an email account
type EmailAccount struct {
	ID        string    `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	Email     string    `gorm:"uniqueIndex;not null" json:"email"`
	DomainID  string    `gorm:"not null" json:"domainId"`
	UserID    string    `gorm:"not null" json:"userId"`
	Password  string    `gorm:"not null" json:"-"`
	Quota     *int64    `json:"quota,omitempty"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`

	// Relationships
	Domain Domain `gorm:"foreignKey:DomainID" json:"domain,omitempty"`
	User   User   `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

// Session model represents a user session
type Session struct {
	ID        string    `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	UserID    string    `gorm:"not null" json:"userId"`
	Token     string    `gorm:"uniqueIndex;not null" json:"token"`
	ExpiresAt time.Time `gorm:"not null" json:"expiresAt"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`

	// Relationships
	User User `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

// EmailMessage model represents an email message
type EmailMessage struct {
	ID         string    `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	MessageID  string    `gorm:"uniqueIndex;not null" json:"messageId"`
	AccountID  string    `gorm:"not null" json:"accountId"`
	From       string    `gorm:"not null" json:"from"`
	To         string    `gorm:"type:text" json:"to"`
	CC         *string   `gorm:"type:text" json:"cc,omitempty"`
	BCC        *string   `gorm:"type:text" json:"bcc,omitempty"`
	Subject    string    `json:"subject"`
	BodyText   *string   `gorm:"type:text" json:"bodyText,omitempty"`
	BodyHTML   *string   `gorm:"type:text" json:"bodyHtml,omitempty"`
	Size       int64     `json:"size"`
	IsRead     bool      `gorm:"default:false" json:"isRead"`
	IsDeleted  bool      `gorm:"default:false" json:"isDeleted"`
	Folder     string    `gorm:"default:'INBOX'" json:"folder"`
	ReceivedAt time.Time `json:"receivedAt"`
	CreatedAt  time.Time `json:"createdAt"`
	UpdatedAt  time.Time `json:"updatedAt"`

	// Relationships
	Account EmailAccount `gorm:"foreignKey:AccountID" json:"account,omitempty"`
}

// AutoMigrate runs database auto-migration for all models
func (dm *DatabaseManager) AutoMigrate() error {
	return dm.db.AutoMigrate(
		&User{},
		&Domain{},
		&EmailAccount{},
		&Session{},
		&EmailMessage{},
	)
}

// User operations

// CreateUser creates a new user
func (dm *DatabaseManager) CreateUser(user *User) error {
	return dm.db.Create(user).Error
}

// FindUserByEmail finds a user by email
func (dm *DatabaseManager) FindUserByEmail(email string) (*User, error) {
	var user User
	err := dm.db.Where("email = ?", email).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// FindUserByUsername finds a user by username
func (dm *DatabaseManager) FindUserByUsername(username string) (*User, error) {
	var user User
	err := dm.db.Where("username = ?", username).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// Domain operations

// CreateDomain creates a new domain
func (dm *DatabaseManager) CreateDomain(domain *Domain) error {
	return dm.db.Create(domain).Error
}

// FindDomainByName finds a domain by name
func (dm *DatabaseManager) FindDomainByName(name string) (*Domain, error) {
	var domain Domain
	err := dm.db.Where("name = ?", name).First(&domain).Error
	if err != nil {
		return nil, err
	}
	return &domain, nil
}

// EmailAccount operations

// CreateEmailAccount creates a new email account
func (dm *DatabaseManager) CreateEmailAccount(account *EmailAccount) error {
	return dm.db.Create(account).Error
}

// FindEmailAccountByEmail finds an email account by email
func (dm *DatabaseManager) FindEmailAccountByEmail(email string) (*EmailAccount, error) {
	var account EmailAccount
	err := dm.db.Where("email = ?", email).First(&account).Error
	if err != nil {
		return nil, err
	}
	return &account, nil
}

// Session operations

// CreateSession creates a new session
func (dm *DatabaseManager) CreateSession(session *Session) error {
	return dm.db.Create(session).Error
}

// FindSessionByToken finds a session by token
func (dm *DatabaseManager) FindSessionByToken(token string) (*Session, error) {
	var session Session
	err := dm.db.Where("token = ?", token).First(&session).Error
	if err != nil {
		return nil, err
	}
	return &session, nil
}

// DeleteSession deletes a session by token
func (dm *DatabaseManager) DeleteSession(token string) error {
	return dm.db.Where("token = ?", token).Delete(&Session{}).Error
}

// CleanupExpiredSessions removes expired sessions
func (dm *DatabaseManager) CleanupExpiredSessions() error {
	return dm.db.Where("expires_at < ?", time.Now()).Delete(&Session{}).Error
}

// EmailMessage operations

// CreateEmailMessage creates a new email message
func (dm *DatabaseManager) CreateEmailMessage(message *EmailMessage) error {
	return dm.db.Create(message).Error
}

// FindEmailMessageByMessageID finds an email message by message ID
func (dm *DatabaseManager) FindEmailMessageByMessageID(messageID string) (*EmailMessage, error) {
	var message EmailMessage
	err := dm.db.Where("message_id = ?", messageID).First(&message).Error
	if err != nil {
		return nil, err
	}
	return &message, nil
}

// GetEmailMessagesByAccount gets email messages for an account
func (dm *DatabaseManager) GetEmailMessagesByAccount(accountID string, limit, offset int) ([]EmailMessage, error) {
	var messages []EmailMessage
	query := dm.db.Where("account_id = ? AND is_deleted = ?", accountID, false)

	if limit > 0 {
		query = query.Limit(limit)
	}
	if offset > 0 {
		query = query.Offset(offset)
	}

	err := query.Order("received_at DESC").Find(&messages).Error
	return messages, err
}

// MarkEmailAsRead marks an email message as read
func (dm *DatabaseManager) MarkEmailAsRead(messageID string) error {
	return dm.db.Model(&EmailMessage{}).Where("message_id = ?", messageID).Update("is_read", true).Error
}

// DeleteEmailMessage soft deletes an email message
func (dm *DatabaseManager) DeleteEmailMessage(messageID string) error {
	return dm.db.Model(&EmailMessage{}).Where("message_id = ?", messageID).Update("is_deleted", true).Error
}
