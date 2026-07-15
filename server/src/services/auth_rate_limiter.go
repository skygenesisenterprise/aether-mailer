package services

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"sync"
	"time"

	redisclient "github.com/skygenesisenterprise/aether-account/server/internal/redis"
)

type AuthRateLimiter struct {
	redis *redisclient.Client
	mu    sync.Mutex
	items map[string]rateLimitEntry
}

type rateLimitEntry struct {
	count   int
	expires time.Time
}

func NewAuthRateLimiter(redis *redisclient.Client) *AuthRateLimiter {
	return &AuthRateLimiter{redis: redis, items: map[string]rateLimitEntry{}}
}

func (r *AuthRateLimiter) Allow(ctx context.Context, endpoint, ip, email string, limit int, window time.Duration) (bool, error) {
	key := r.key(endpoint, ip, email)
	if r.redis != nil && r.redis.Raw != nil {
		counter := r.redis.Keys.Cache("auth-rate", key)
		count, err := r.redis.Raw.Incr(ctx, counter).Result()
		if err != nil {
			return false, err
		}
		if count == 1 {
			_ = r.redis.Raw.Expire(ctx, counter, window).Err()
		}
		return count <= int64(limit), nil
	}

	r.mu.Lock()
	defer r.mu.Unlock()
	now := time.Now().UTC()
	entry := r.items[key]
	if entry.expires.Before(now) {
		entry = rateLimitEntry{expires: now.Add(window)}
	}
	entry.count++
	r.items[key] = entry
	return entry.count <= limit, nil
}

func (r *AuthRateLimiter) key(endpoint, ip, email string) string {
	sum := sha256.Sum256([]byte(email))
	return fmt.Sprintf("%s:%s:%s", endpoint, ip, hex.EncodeToString(sum[:8]))
}
