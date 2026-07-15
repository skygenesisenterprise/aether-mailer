package interfaces

import (
	"context"
	"io"
	"time"
)

type Principal struct {
	UserID      string   `json:"userId"`
	WorkspaceID string   `json:"workspaceId,omitempty"`
	Roles       []string `json:"roles,omitempty"`
	Permissions []string `json:"permissions,omitempty"`
	SessionID   string   `json:"sessionId,omitempty"`
}

type IdentityProvider interface {
	Authenticate(ctx context.Context, token string) (*Principal, error)
	IssueToken(ctx context.Context, principal Principal) (string, error)
}

type Object struct {
	Key         string
	ContentType string
	Body        io.Reader
	Size        int64
}

type ObjectStorage interface {
	Put(ctx context.Context, object Object) error
	Get(ctx context.Context, key string) (io.ReadCloser, error)
	Delete(ctx context.Context, key string) error
	SignedURL(ctx context.Context, key string, ttl time.Duration) (string, error)
}
