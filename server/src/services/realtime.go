package services

import (
	"context"
	"encoding/json"
	"fmt"
	"sync"

	redisclient "github.com/skygenesisenterprise/aether-account/server/internal/redis"
	"github.com/skygenesisenterprise/aether-account/server/src/config"
	"github.com/skygenesisenterprise/aether-account/server/src/interfaces"
)

type InMemoryEventBus struct {
	mu       sync.RWMutex
	handlers map[string][]interfaces.EventHandler
}

func NewInMemoryEventBus() *InMemoryEventBus {
	return &InMemoryEventBus{handlers: map[string][]interfaces.EventHandler{}}
}

func (b *InMemoryEventBus) Publish(ctx context.Context, event interfaces.Event) error {
	b.mu.RLock()
	handlers := append([]interfaces.EventHandler{}, b.handlers[event.Topic]...)
	handlers = append(handlers, b.handlers["*"]...)
	b.mu.RUnlock()
	for _, handler := range handlers {
		if err := handler(ctx, event); err != nil {
			return err
		}
	}
	return nil
}

func (b *InMemoryEventBus) Subscribe(ctx context.Context, topic string, handler interfaces.EventHandler) error {
	b.mu.Lock()
	b.handlers[topic] = append(b.handlers[topic], handler)
	b.mu.Unlock()
	go func() {
		<-ctx.Done()
		b.mu.Lock()
		defer b.mu.Unlock()
		handlers := b.handlers[topic]
		for i, item := range handlers {
			if fmt.Sprintf("%p", item) == fmt.Sprintf("%p", handler) {
				b.handlers[topic] = append(handlers[:i], handlers[i+1:]...)
				break
			}
		}
	}()
	return nil
}

func (b *InMemoryEventBus) Close() error                  { return nil }
func (b *InMemoryEventBus) Healthy(context.Context) error { return nil }

type RedisEventBus struct {
	redis  *redisclient.Client
	prefix string
	pubsub sync.Map
}

func NewRedisEventBus(redis *redisclient.Client, prefix string) *RedisEventBus {
	return &RedisEventBus{redis: redis, prefix: prefix}
}

func (b *RedisEventBus) Publish(ctx context.Context, event interfaces.Event) error {
	payload, err := json.Marshal(event)
	if err != nil {
		return err
	}
	return b.redis.Raw.Publish(ctx, b.channel(event.Topic), payload).Err()
}

func (b *RedisEventBus) Subscribe(ctx context.Context, topic string, handler interfaces.EventHandler) error {
	pattern := b.channel(topic)
	pubsub := b.redis.Raw.PSubscribe(ctx, pattern)
	go func() {
		defer b.pubsub.Delete(pattern)
		go func() {
			<-ctx.Done()
			_ = pubsub.Close()
		}()
		ch := pubsub.Channel()
		for message := range ch {
			var event interfaces.Event
			if err := json.Unmarshal([]byte(message.Payload), &event); err == nil {
				_ = handler(ctx, event)
			}
		}
	}()
	b.pubsub.Store(pattern, pubsub)
	return nil
}

func (b *RedisEventBus) Close() error {
	b.pubsub.Range(func(_, value any) bool {
		if pubsub, ok := value.(interface{ Close() error }); ok {
			_ = pubsub.Close()
		}
		return true
	})
	return nil
}

func (b *RedisEventBus) Healthy(ctx context.Context) error {
	return b.redis.Raw.Ping(ctx).Err()
}

func (b *RedisEventBus) channel(topic string) string {
	if topic == "" || topic == "*" {
		return b.prefix + ":events:*"
	}
	return b.prefix + ":events:" + topic
}

func NewEventBus(cfg config.Config, redis *redisclient.Client) interfaces.EventBus {
	if redis != nil && redis.Raw != nil {
		return NewRedisEventBus(redis, cfg.Redis.KeyPrefix)
	}
	return NewInMemoryEventBus()
}
