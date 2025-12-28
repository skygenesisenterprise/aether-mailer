package domain

import (
	"context"
	"time"
)

// Event represents a domain event
type Event interface {
	ID() string
	AggregateID() string
	EventType() string
	OccurredAt() time.Time
	Data() interface{}
}

// BaseEvent provides common event functionality
type BaseEvent struct {
	id          string
	aggregateID string
	eventType   string
	occurredAt  time.Time
	data        interface{}
}

func NewBaseEvent(id, aggregateID, eventType string, data interface{}) *BaseEvent {
	return &BaseEvent{
		id:          id,
		aggregateID: aggregateID,
		eventType:   eventType,
		occurredAt:  time.Now(),
		data:        data,
	}
}

func (e *BaseEvent) ID() string            { return e.id }
func (e *BaseEvent) AggregateID() string   { return e.aggregateID }
func (e *BaseEvent) EventType() string     { return e.eventType }
func (e *BaseEvent) OccurredAt() time.Time { return e.occurredAt }
func (e *BaseEvent) Data() interface{}     { return e.data }

// Event types
const (
	EventTypeUserCreated     = "USER_CREATED"
	EventTypeUserUpdated     = "USER_UPDATED"
	EventTypeUserDeleted     = "USER_DELETED"
	EventTypeDomainCreated   = "DOMAIN_CREATED"
	EventTypeDomainUpdated   = "DOMAIN_UPDATED"
	EventTypeDomainDeleted   = "DOMAIN_DELETED"
	EventTypeMessageReceived = "MESSAGE_RECEIVED"
	EventTypeMessageSent     = "MESSAGE_SENT"
	EventTypeQuotaExceeded   = "QUOTA_EXCEEDED"
	EventTypePolicyTriggered = "POLICY_TRIGGERED"
)

// EventPublisher defines the contract for publishing events
type EventPublisher interface {
	Publish(ctx context.Context, event Event) error
	PublishBatch(ctx context.Context, events []Event) error
}

// EventHandler defines the contract for handling events
type EventHandler interface {
	Handle(ctx context.Context, event Event) error
	CanHandle(eventType string) bool
}

// EventStore defines the contract for storing and retrieving events
type EventStore interface {
	Save(ctx context.Context, event Event) error
	GetByAggregateID(ctx context.Context, aggregateID string, limit int) ([]Event, error)
	GetByEventType(ctx context.Context, eventType string, limit int) ([]Event, error)
}
