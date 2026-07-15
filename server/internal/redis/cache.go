package redisclient

import (
	"context"
	"encoding/json"
	"time"

	redis "github.com/redis/go-redis/v9"
)

type Cache interface {
	Get(ctx context.Context, key string, dest any) error
	Set(ctx context.Context, key string, value any, ttl time.Duration) error
	Delete(ctx context.Context, keys ...string) error
}

type RedisCache struct {
	client     *redis.Client
	defaultTTL time.Duration
}

var _ Cache = (*RedisCache)(nil)

func NewCache(client *Client, defaultTTL time.Duration) Cache {
	if client == nil || client.Raw == nil {
		return &noopCache{}
	}
	return &RedisCache{
		client:     client.Raw,
		defaultTTL: defaultTTL,
	}
}

func (rc *RedisCache) Get(ctx context.Context, key string, dest any) error {
	data, err := rc.client.Get(ctx, key).Bytes()
	if err != nil {
		return err
	}
	return json.Unmarshal(data, dest)
}

func (rc *RedisCache) Set(ctx context.Context, key string, value any, ttl time.Duration) error {
	if ttl <= 0 {
		ttl = rc.defaultTTL
	}
	data, err := json.Marshal(value)
	if err != nil {
		return err
	}
	return rc.client.Set(ctx, key, data, ttl).Err()
}

func (rc *RedisCache) Delete(ctx context.Context, keys ...string) error {
	return rc.client.Del(ctx, keys...).Err()
}

type noopCache struct{}

func (nc *noopCache) Get(_ context.Context, _ string, _ any) error {
	return redis.Nil
}

func (nc *noopCache) Set(_ context.Context, _ string, _ any, _ time.Duration) error {
	return nil
}

func (nc *noopCache) Delete(_ context.Context, _ ...string) error {
	return nil
}
