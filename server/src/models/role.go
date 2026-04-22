package models

import (
	"time"

	"gorm.io/gorm"
)

type RoleType string

const (
	RoleUser   RoleType = "USER"
	RoleAdmin  RoleType = "ADMIN"
	RoleEditor RoleType = "EDITOR"
)

// Role représente un rôle dans le système RBAC
type Role struct {
	ID          string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Name        string    `gorm:"size:100;uniqueIndex;not null" json:"name"`
	Description *string   `gorm:"type:text" json:"description,omitempty"`
	IsSystem    bool      `gorm:"default:false;column:is_system" json:"isSystem"`
	CreatedAt   time.Time `gorm:"column:created_at" json:"createdAt"`
	UpdatedAt   time.Time `gorm:"column:updated_at" json:"updatedAt"`

	UserRoles       []UserRole
	RolePermissions []RolePermission
}

func (Role) TableName() string {
	return "roles"
}

// Permission représente une permission dans le système RBAC
type Permission struct {
	ID          string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Name        string    `gorm:"size:100;uniqueIndex;not null" json:"name"`
	Description *string   `gorm:"type:text" json:"description,omitempty"`
	Resource    string    `gorm:"size:100;not null" json:"resource"` // Ex: users, domains, oauth_clients
	Action      string    `gorm:"size:50;not null" json:"action"`    // Ex: read, write, delete, admin
	CreatedAt   time.Time `gorm:"column:created_at" json:"createdAt"`
	UpdatedAt   time.Time `gorm:"column:updated_at" json:"updatedAt"`

	RolePermissions []RolePermission
}

func (Permission) TableName() string {
	return "permissions"
}

// UserRole représente l'association entre un utilisateur et un rôle
type UserRole struct {
	ID         string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	UserID     string    `gorm:"type:uuid;column:user_id;not null;index" json:"userId"`
	RoleID     string    `gorm:"type:uuid;column:role_id;not null;index" json:"roleId"`
	AssignedBy *string   `gorm:"type:uuid;column:assigned_by" json:"assignedBy,omitempty"`
	AssignedAt time.Time `gorm:"column:assigned_at" json:"assignedAt"`

	User User `gorm:"foreignKey:UserID"`
	Role Role `gorm:"foreignKey:RoleID"`
}

func (UserRole) TableName() string {
	return "user_roles"
}

// RolePermission représente l'association entre un rôle et une permission
type RolePermission struct {
	ID           string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	RoleID       string    `gorm:"type:uuid;column:role_id;not null;index" json:"roleId"`
	PermissionID string    `gorm:"type:uuid;column:permission_id;not null;index" json:"permissionId"`
	CreatedAt    time.Time `gorm:"column:created_at" json:"createdAt"`

	Role       Role       `gorm:"foreignKey:RoleID"`
	Permission Permission `gorm:"foreignKey:PermissionID"`
}

func (RolePermission) TableName() string {
	return "role_permissions"
}

// Membership représente l'appartenance d'un utilisateur à une organisation
type Membership struct {
	ID             string         `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	UserID         string         `gorm:"type:uuid;column:user_id;not null;index" json:"userId"`
	OrganizationID string         `gorm:"type:uuid;column:organization_id;not null;index" json:"organizationId"`
	RoleID         *string        `gorm:"type:uuid;column:role_id;index" json:"roleId,omitempty"`
	Status         string         `gorm:"size:20;default:active" json:"status"` // active, suspended, pending, invited
	JoinedAt       time.Time      `gorm:"column:joined_at" json:"joinedAt"`
	InvitedBy      *string        `gorm:"type:uuid;column:invited_by" json:"invitedBy,omitempty"`
	LeftAt         *time.Time     `gorm:"column:left_at" json:"leftAt,omitempty"`
	CreatedAt      time.Time      `gorm:"column:created_at" json:"createdAt"`
	UpdatedAt      time.Time      `gorm:"column:updated_at" json:"updatedAt"`
	DeletedAt      gorm.DeletedAt `gorm:"index;column:deleted_at" json:"-"`

	User         User         `gorm:"foreignKey:UserID"`
	Organization Organization `gorm:"foreignKey:OrganizationID"`
	Role         *Role        `gorm:"foreignKey:RoleID"`
}

func (Membership) TableName() string {
	return "memberships"
}
