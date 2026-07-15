package interfaces

import (
	"context"

	"gorm.io/gorm"
)

type Database interface {
	Gorm() *gorm.DB
	Ping(ctx context.Context) error
	Close() error
	Transaction(ctx context.Context, fn func(tx *gorm.DB) error) error
}
