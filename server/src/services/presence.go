package services

import (
	"context"
	"encoding/json"
	"log/slog"
	"strings"
	"sync"
	"time"

	redisclient "github.com/skygenesisenterprise/aether-account/server/internal/redis"
	"github.com/skygenesisenterprise/aether-account/server/src/interfaces"
	"github.com/skygenesisenterprise/aether-account/server/src/utils"
)

type PresenceRecord struct {
	UserID      string    `json:"userId"`
	WorkspaceID string    `json:"workspaceId"`
	State       string    `json:"state"`
	LastSeenAt  time.Time `json:"lastSeenAt"`
	DeviceCount int       `json:"deviceCount"`
}

type PresenceService struct {
	logger  *slog.Logger
	redis   *redisclient.Client
	bus     interfaces.EventBus
	users   interfaces.UserRepository
	ttl     time.Duration
	records map[string]PresenceRecord
	mu      sync.RWMutex
	stop    chan struct{}
}

func normalizePresenceState(state string) string {
	switch strings.ToLower(strings.TrimSpace(state)) {
	case "busy":
		return "busy"
	case "away":
		return "away"
	case "offline":
		return "offline"
	case "online":
		return "online"
	default:
		return ""
	}
}

func NewPresenceService(logger *slog.Logger, redis *redisclient.Client, bus interfaces.EventBus, users interfaces.UserRepository, ttl time.Duration) *PresenceService {
	svc := &PresenceService{
		logger: logger, redis: redis, bus: bus, users: users, ttl: ttl,
		records: map[string]PresenceRecord{},
		stop:    make(chan struct{}),
	}
	go svc.cleanupLoop()
	return svc
}

func (s *PresenceService) Close() error {
	close(s.stop)
	return nil
}

func (s *PresenceService) Set(ctx context.Context, workspaceID, userID, state string, deviceCount int) error {
	state = normalizePresenceState(state)
	if state == "" {
		state = "offline"
	}
	record := PresenceRecord{
		UserID: userID, WorkspaceID: workspaceID, State: state, LastSeenAt: time.Now().UTC(), DeviceCount: deviceCount,
	}
	key := workspaceID + ":" + userID
	if s.redis != nil && s.redis.Raw != nil {
		payload, _ := json.Marshal(record)
		if err := s.redis.Raw.Set(ctx, s.presenceKey(key), payload, s.ttl).Err(); err != nil {
			return err
		}
	} else {
		s.mu.Lock()
		s.records[key] = record
		s.mu.Unlock()
	}
	return s.bus.Publish(ctx, interfaces.Event{
		ID:          utils.NewID(),
		Topic:       "workspace." + workspaceID,
		Type:        "presence.updated",
		WorkspaceID: workspaceID,
		ActorID:     userID,
		Timestamp:   time.Now().UTC().Format(time.RFC3339),
		Payload:     map[string]any{"state": state, "deviceCount": deviceCount},
	})
}

func (s *PresenceService) SetSessionState(ctx context.Context, workspaceID, userID string, connected bool, deviceCount int) error {
	if !connected {
		return s.Set(ctx, workspaceID, userID, "offline", 0)
	}

	state := "online"
	if s.users != nil {
		user, err := s.users.GetByID(ctx, userID)
		if err == nil {
			if preferred := normalizePresenceState(user.PresenceStatus); preferred != "" {
				state = preferred
			}
		}
	}

	return s.Set(ctx, workspaceID, userID, state, deviceCount)
}

func (s *PresenceService) RefreshUserState(ctx context.Context, userID string) error {
	records, err := s.listRecords(ctx)
	if err != nil {
		return err
	}

	for _, record := range records {
		if record.UserID != userID {
			continue
		}
		deviceCount := record.DeviceCount
		if deviceCount < 1 {
			deviceCount = 1
		}
		if err := s.SetSessionState(ctx, record.WorkspaceID, userID, true, deviceCount); err != nil {
			return err
		}
	}

	return nil
}

func (s *PresenceService) Get(ctx context.Context, workspaceID, userID string) (PresenceRecord, bool) {
	key := workspaceID + ":" + userID
	if s.redis != nil && s.redis.Raw != nil {
		raw, err := s.redis.Raw.Get(ctx, s.presenceKey(key)).Result()
		if err != nil {
			return PresenceRecord{}, false
		}
		var record PresenceRecord
		if err := json.Unmarshal([]byte(raw), &record); err != nil {
			return PresenceRecord{}, false
		}
		return record, true
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	record, ok := s.records[key]
	if !ok {
		return PresenceRecord{}, false
	}
	if time.Since(record.LastSeenAt) > s.ttl {
		delete(s.records, key)
		return PresenceRecord{}, false
	}
	return record, true
}

func (s *PresenceService) presenceKey(key string) string {
	if s.redis != nil && s.redis.Keys != nil {
		return s.redis.Keys.Cache("presence", key)
	}
	return "presence:" + key
}

func (s *PresenceService) cleanupLoop() {
	ticker := time.NewTicker(s.ttl / 2)
	defer ticker.Stop()
	for {
		select {
		case <-ticker.C:
			s.mu.Lock()
			for key, record := range s.records {
				if time.Since(record.LastSeenAt) > s.ttl {
					delete(s.records, key)
				}
			}
			s.mu.Unlock()
		case <-s.stop:
			return
		}
	}
}

func (s *PresenceService) ExpireStale(ctx context.Context, limit int) error {
	if s.users == nil {
		return nil
	}
	items, err := s.users.ListStale(ctx, time.Now().UTC().Add(-s.ttl), limit)
	if err != nil {
		return err
	}
	for _, user := range items {
		if user.PresenceStatus == "offline" {
			continue
		}
		user.PresenceStatus = "offline"
		now := time.Now().UTC()
		user.UpdatedAt = now
		if err := s.users.Update(ctx, &user); err != nil {
			return err
		}
		_ = s.bus.Publish(ctx, interfaces.Event{
			ID:        utils.NewID(),
			Topic:     "workspace." + "",
			Type:      "presence.updated",
			ActorID:   user.ID,
			Timestamp: now.Format(time.RFC3339),
			Payload:   map[string]any{"state": "offline", "deviceCount": 0},
		})
	}
	return nil
}

func (s *PresenceService) PersistLastSeen(ctx context.Context) error {
	if s.users == nil {
		return nil
	}
	records, err := s.listRecords(ctx)
	if err != nil {
		return err
	}
	for _, record := range records {
		user, userErr := s.users.GetByID(ctx, record.UserID)
		if userErr != nil {
			continue
		}
		user.PresenceStatus = record.State
		user.LastSeenAt = &record.LastSeenAt
		user.UpdatedAt = time.Now().UTC()
		if err := s.users.Update(ctx, user); err != nil {
			return err
		}
	}
	return nil
}

func (s *PresenceService) listRecords(ctx context.Context) ([]PresenceRecord, error) {
	if s.redis != nil && s.redis.Raw != nil {
		pattern := s.presenceKey("*")
		keys, err := s.redis.Raw.Keys(ctx, pattern).Result()
		if err != nil {
			return nil, err
		}
		out := make([]PresenceRecord, 0, len(keys))
		for _, key := range keys {
			raw, getErr := s.redis.Raw.Get(ctx, key).Result()
			if getErr != nil {
				continue
			}
			var record PresenceRecord
			if err := json.Unmarshal([]byte(raw), &record); err == nil {
				out = append(out, record)
			}
		}
		return out, nil
	}
	s.mu.RLock()
	defer s.mu.RUnlock()
	out := make([]PresenceRecord, 0, len(s.records))
	for _, record := range s.records {
		out = append(out, record)
	}
	return out, nil
}
