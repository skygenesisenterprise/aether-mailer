package services

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	_ "github.com/jackc/pgx/v5"
	"github.com/skygenesisenterprise/aether-mailer/server/src/config"
	"github.com/skygenesisenterprise/aether-mailer/server/src/models"
	"golang.org/x/crypto/bcrypt"
)

type PrismaService struct {
	DB *sql.DB
}

var prismaInstance *PrismaService

func NewPrismaService(cfg *config.Config) (*PrismaService, error) {
	if prismaInstance != nil {
		return prismaInstance, nil
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	db, err := sql.Open("postgres", cfg.DatabaseURL)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(5 * time.Minute)

	if err := db.PingContext(ctx); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	prismaInstance = &PrismaService{
		DB: db,
	}

	if err := prismaInstance.initTables(); err != nil {
		fmt.Printf("\033[1;33m[!] Warning: Failed to initialize tables: %v\033[0m\n", err)
	}

	return prismaInstance, nil
}

func (p *PrismaService) initTables() error {
	schema := `
	CREATE TABLE IF NOT EXISTS users (
		id VARCHAR(255) PRIMARY KEY,
		email VARCHAR(255) UNIQUE NOT NULL,
		password_hash VARCHAR(255),
		first_name VARCHAR(255),
		last_name VARCHAR(255),
		phone VARCHAR(50),
		avatar_url TEXT,
		role VARCHAR(50) DEFAULT 'USER',
		is_active BOOLEAN DEFAULT true,
		email_verified TIMESTAMP,
		created_at TIMESTAMP DEFAULT NOW(),
		updated_at TIMESTAMP DEFAULT NOW()
	);
	`
	_, err := p.DB.Exec(schema)
	return err
}

func GetPrismaService() *PrismaService {
	return prismaInstance
}

func (p *PrismaService) Close() {
	if p.DB != nil {
		p.DB.Close()
	}
}

func (p *PrismaService) ListArticles(status, category, search string, page, pageSize int) ([]models.Article, int, error) {
	ctx := context.Background()

	query := "SELECT id, title, slug, COALESCE(excerpt, ''), content, content_html, status, featured, published_at, scheduled_at, view_count, read_time, COALESCE(image_url, ''), COALESCE(image_alt, ''), COALESCE(seo_title, ''), COALESCE(seo_description, ''), COALESCE(seo_keywords, ''), COALESCE(locale, 'fr'), author_id, COALESCE(category_id, ''), created_at, updated_at FROM articles WHERE 1=1"
	countQuery := "SELECT COUNT(*) FROM articles WHERE 1=1"
	args := []interface{}{}
	argIndex := 1

	if status != "" {
		query += fmt.Sprintf(" AND status = $%d", argIndex)
		countQuery += fmt.Sprintf(" AND status = $%d", argIndex)
		args = append(args, status)
		argIndex++
	}

	if category != "" {
		query += fmt.Sprintf(" AND category_id = $%d", argIndex)
		countQuery += fmt.Sprintf(" AND category_id = $%d", argIndex)
		args = append(args, category)
		argIndex++
	}

	if search != "" {
		query += fmt.Sprintf(" AND (title ILIKE $%d OR excerpt ILIKE $%d)", argIndex, argIndex)
		countQuery += fmt.Sprintf(" AND (title ILIKE $%d OR excerpt ILIKE $%d)", argIndex, argIndex)
		args = append(args, "%"+search+"%")
		argIndex++
	}

	var total int
	err := p.DB.QueryRowContext(ctx, countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count articles: %w", err)
	}

	offset := (page - 1) * pageSize
	query += fmt.Sprintf(" ORDER BY created_at DESC LIMIT $%d OFFSET $%d", argIndex, argIndex+1)
	args = append(args, pageSize, offset)

	rows, err := p.DB.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to query articles: %w", err)
	}
	defer rows.Close()

	articles := []models.Article{}
	for rows.Next() {
		var a models.Article
		err := rows.Scan(
			&a.ID, &a.Title, &a.Slug, &a.Excerpt, &a.Content, &a.ContentHtml, &a.Status,
			&a.Featured, &a.PublishedAt, &a.ScheduledAt, &a.ViewCount, &a.ReadTime,
			&a.ImageUrl, &a.ImageAlt, &a.SeoTitle, &a.SeoDescription, &a.SeoKeywords,
			&a.Locale, &a.AuthorID, &a.CategoryID, &a.CreatedAt, &a.UpdatedAt,
		)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to scan article: %w", err)
		}
		articles = append(articles, a)
	}

	return articles, total, nil
}

func (p *PrismaService) GetArticle(id string) (*models.Article, error) {
	ctx := context.Background()

	query := "SELECT id, title, slug, COALESCE(excerpt, ''), content, content_html, status, featured, published_at, scheduled_at, view_count, read_time, COALESCE(image_url, ''), COALESCE(image_alt, ''), COALESCE(seo_title, ''), COALESCE(seo_description, ''), COALESCE(seo_keywords, ''), COALESCE(locale, 'fr'), author_id, COALESCE(category_id, ''), created_at, updated_at FROM articles WHERE id = $1"

	var a models.Article
	err := p.DB.QueryRowContext(ctx, query, id).Scan(
		&a.ID, &a.Title, &a.Slug, &a.Excerpt, &a.Content, &a.ContentHtml, &a.Status,
		&a.Featured, &a.PublishedAt, &a.ScheduledAt, &a.ViewCount, &a.ReadTime,
		&a.ImageUrl, &a.ImageAlt, &a.SeoTitle, &a.SeoDescription, &a.SeoKeywords,
		&a.Locale, &a.AuthorID, &a.CategoryID, &a.CreatedAt, &a.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to get article: %w", err)
	}

	return &a, nil
}

func (p *PrismaService) CreateArticle(req *models.CreateArticleRequest, authorID string) (*models.Article, error) {
	ctx := context.Background()

	id := fmt.Sprintf("art_%d", time.Now().UnixNano())
	slug := generateSlug(req.Title)
	now := time.Now()
	status := models.ArticleStatusDraft

	query := `INSERT INTO articles (id, title, slug, excerpt, content, status, featured, view_count, read_time, image_url, image_alt, seo_title, seo_description, seo_keywords, locale, author_id, category_id, created_at, updated_at)
			  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
			  RETURNING id, title, slug, COALESCE(excerpt, ''), content, content_html, status, featured, published_at, scheduled_at, view_count, read_time, COALESCE(image_url, ''), COALESCE(image_alt, ''), COALESCE(seo_title, ''), COALESCE(seo_description, ''), COALESCE(seo_keywords, ''), COALESCE(locale, 'fr'), author_id, COALESCE(category_id, ''), created_at, updated_at`

	var a models.Article
	err := p.DB.QueryRowContext(ctx, query,
		id, req.Title, slug, req.Excerpt, req.Content, status, false, 0, 5,
		req.ImageUrl, req.ImageAlt, req.SeoTitle, req.SeoDescription, req.SeoKeywords,
		"fr", authorID, req.CategoryID, now, now,
	).Scan(
		&a.ID, &a.Title, &a.Slug, &a.Excerpt, &a.Content, &a.ContentHtml, &a.Status,
		&a.Featured, &a.PublishedAt, &a.ScheduledAt, &a.ViewCount, &a.ReadTime,
		&a.ImageUrl, &a.ImageAlt, &a.SeoTitle, &a.SeoDescription, &a.SeoKeywords,
		&a.Locale, &a.AuthorID, &a.CategoryID, &a.CreatedAt, &a.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create article: %w", err)
	}

	return &a, nil
}

func (p *PrismaService) UpdateArticle(id string, req *models.UpdateArticleRequest) (*models.Article, error) {
	ctx := context.Background()

	query := `UPDATE articles SET title = COALESCE(NULLIF($2, ''), title), excerpt = COALESCE(NULLIF($3, ''), excerpt), 
			  content = COALESCE(NULLIF($4, ''), content), category_id = COALESCE(NULLIF($5, ''), category_id),
			  image_url = COALESCE(NULLIF($6, ''), image_url), updated_at = $7
			  WHERE id = $1
			  RETURNING id, title, slug, COALESCE(excerpt, ''), content, content_html, status, featured, published_at, scheduled_at, view_count, read_time, COALESCE(image_url, ''), COALESCE(image_alt, ''), COALESCE(seo_title, ''), COALESCE(seo_description, ''), COALESCE(seo_keywords, ''), COALESCE(locale, 'fr'), author_id, COALESCE(category_id, ''), created_at, updated_at`

	var a models.Article
	err := p.DB.QueryRowContext(ctx, query,
		id, req.Title, req.Excerpt, req.Content, req.CategoryID, req.ImageUrl, time.Now(),
	).Scan(
		&a.ID, &a.Title, &a.Slug, &a.Excerpt, &a.Content, &a.ContentHtml, &a.Status,
		&a.Featured, &a.PublishedAt, &a.ScheduledAt, &a.ViewCount, &a.ReadTime,
		&a.ImageUrl, &a.ImageAlt, &a.SeoTitle, &a.SeoDescription, &a.SeoKeywords,
		&a.Locale, &a.AuthorID, &a.CategoryID, &a.CreatedAt, &a.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to update article: %w", err)
	}

	return &a, nil
}

func (p *PrismaService) DeleteArticle(id string) error {
	ctx := context.Background()

	_, err := p.DB.ExecContext(ctx, "DELETE FROM articles WHERE id = $1", id)
	if err != nil {
		return fmt.Errorf("failed to delete article: %w", err)
	}
	return nil
}

func (p *PrismaService) PublishArticle(id string) error {
	ctx := context.Background()

	now := time.Now()
	_, err := p.DB.ExecContext(ctx, "UPDATE articles SET status = $1, published_at = $2, updated_at = $2 WHERE id = $3",
		models.ArticleStatusPublished, now, id)
	if err != nil {
		return fmt.Errorf("failed to publish article: %w", err)
	}
	return nil
}

func (p *PrismaService) ArchiveArticle(id string) error {
	ctx := context.Background()

	_, err := p.DB.ExecContext(ctx, "UPDATE articles SET status = $1, updated_at = $2 WHERE id = $3",
		models.ArticleStatusArchived, time.Now(), id)
	if err != nil {
		return fmt.Errorf("failed to archive article: %w", err)
	}
	return nil
}

func generateSlug(title string) string {
	slug := ""
	for i := 0; i < len(title); i++ {
		c := title[i]
		if (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9') {
			slug += string(c)
		} else if c == ' ' || c == '-' {
			slug += "-"
		}
	}
	if slug == "" {
		slug = "article"
	}
	return slug
}

func (p *PrismaService) ListUsers(search string, page, pageSize int) ([]models.EtheriaUser, int, error) {
	ctx := context.Background()

	query := "SELECT id, email, COALESCE(first_name, ''), COALESCE(last_name, ''), COALESCE(phone, ''), COALESCE(avatar_url, ''), role, is_active, email_verified, created_at, updated_at FROM users WHERE 1=1"
	countQuery := "SELECT COUNT(*) FROM users WHERE 1=1"
	args := []interface{}{}
	argIndex := 1

	if search != "" {
		query += fmt.Sprintf(" AND (email ILIKE $%d OR first_name ILIKE $%d OR last_name ILIKE $%d)", argIndex, argIndex, argIndex)
		countQuery += fmt.Sprintf(" AND (email ILIKE $%d OR first_name ILIKE $%d OR last_name ILIKE $%d)", argIndex, argIndex, argIndex)
		args = append(args, "%"+search+"%")
		argIndex++
	}

	var total int
	err := p.DB.QueryRowContext(ctx, countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count users: %w", err)
	}

	offset := (page - 1) * pageSize
	query += fmt.Sprintf(" ORDER BY created_at DESC LIMIT $%d OFFSET $%d", argIndex, argIndex+1)
	args = append(args, pageSize, offset)

	rows, err := p.DB.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to query users: %w", err)
	}
	defer rows.Close()

	users := []models.EtheriaUser{}
	for rows.Next() {
		var u models.EtheriaUser
		err := rows.Scan(
			&u.ID, &u.Email, &u.FirstName, &u.LastName, &u.Phone, &u.AvatarUrl, &u.Role,
			&u.IsActive, &u.EmailVerified, &u.CreatedAt, &u.UpdatedAt,
		)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to scan user: %w", err)
		}
		users = append(users, u)
	}

	return users, total, nil
}

func (p *PrismaService) GetUser(id string) (*models.EtheriaUser, error) {
	ctx := context.Background()

	query := "SELECT id, email, COALESCE(first_name, ''), COALESCE(last_name, ''), COALESCE(phone, ''), COALESCE(avatar_url, ''), COALESCE(password_hash, ''), role, is_active, email_verified, created_at, updated_at FROM users WHERE id = $1"

	var u models.EtheriaUser
	err := p.DB.QueryRowContext(ctx, query, id).Scan(
		&u.ID, &u.Email, &u.FirstName, &u.LastName, &u.Phone, &u.AvatarUrl, &u.Password,
		&u.IsActive, &u.EmailVerified, &u.CreatedAt, &u.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	return &u, nil
}

func (p *PrismaService) GetUserByEmail(email string) (*models.EtheriaUser, error) {
	ctx := context.Background()

	query := "SELECT id, email, COALESCE(first_name, ''), COALESCE(last_name, ''), COALESCE(phone, ''), COALESCE(avatar_url, ''), COALESCE(password_hash, ''), role, is_active, email_verified, created_at, updated_at FROM users WHERE email = $1"

	var u models.EtheriaUser
	err := p.DB.QueryRowContext(ctx, query, email).Scan(
		&u.ID, &u.Email, &u.FirstName, &u.LastName, &u.Phone, &u.AvatarUrl, &u.Password,
		&u.IsActive, &u.EmailVerified, &u.CreatedAt, &u.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to get user by email: %w", err)
	}

	return &u, nil
}

func (p *PrismaService) CreateUser(email, firstName, lastName, role, password string) (*models.EtheriaUser, error) {
	ctx := context.Background()

	id := fmt.Sprintf("user_%d", time.Now().UnixNano())
	now := time.Now()
	defaultRole := models.RoleUser
	if role == "ADMIN" {
		defaultRole = models.RoleAdmin
	} else if role == "EDITOR" {
		defaultRole = models.RoleEditor
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	query := `INSERT INTO users (id, email, first_name, last_name, role, password_hash, is_active, created_at, updated_at)
			  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
			  RETURNING id, email, COALESCE(first_name, ''), COALESCE(last_name, ''), COALESCE(phone, ''), COALESCE(avatar_url, ''), role, is_active, email_verified, created_at, updated_at`

	var u models.EtheriaUser
	err = p.DB.QueryRowContext(ctx, query,
		id, email, firstName, lastName, defaultRole, string(hashedPassword), true, now, now,
	).Scan(
		&u.ID, &u.Email, &u.FirstName, &u.LastName, &u.Phone, &u.AvatarUrl, &u.Role,
		&u.IsActive, &u.EmailVerified, &u.CreatedAt, &u.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	return &u, nil
}

func (p *PrismaService) UpdateUser(id, firstName, lastName, role string, isActive bool) (*models.EtheriaUser, error) {
	ctx := context.Background()

	query := `UPDATE users SET first_name = COALESCE(NULLIF($2, ''), first_name), 
			  last_name = COALESCE(NULLIF($3, ''), last_name), role = COALESCE(NULLIF($4, ''), role),
			  is_active = $5, updated_at = $6
			  WHERE id = $1
			  RETURNING id, email, COALESCE(first_name, ''), COALESCE(last_name, ''), COALESCE(phone, ''), COALESCE(avatar_url, ''), role, is_active, email_verified, created_at, updated_at`

	var u models.EtheriaUser
	err := p.DB.QueryRowContext(ctx, query, id, firstName, lastName, role, isActive, time.Now()).Scan(
		&u.ID, &u.Email, &u.FirstName, &u.LastName, &u.Phone, &u.AvatarUrl, &u.Role,
		&u.IsActive, &u.EmailVerified, &u.CreatedAt, &u.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to update user: %w", err)
	}

	return &u, nil
}

func (p *PrismaService) DeleteUser(id string) error {
	ctx := context.Background()

	_, err := p.DB.ExecContext(ctx, "DELETE FROM users WHERE id = $1", id)
	if err != nil {
		return fmt.Errorf("failed to delete user: %w", err)
	}
	return nil
}
