package interfaces

import "context"

type Event struct {
	ID             string         `json:"id"`
	Topic          string         `json:"topic,omitempty"`
	Type           string         `json:"type"`
	WorkspaceID    string         `json:"workspaceId,omitempty"`
	ConversationID string         `json:"conversationId,omitempty"`
	ActorID        string         `json:"actorId,omitempty"`
	Timestamp      string         `json:"timestamp"`
	Payload        map[string]any `json:"payload,omitempty"`
}

type EventHandler func(ctx context.Context, event Event) error

type EventBus interface {
	Publish(ctx context.Context, event Event) error
	Subscribe(ctx context.Context, topic string, handler EventHandler) error
	Close() error
	Healthy(ctx context.Context) error
}
