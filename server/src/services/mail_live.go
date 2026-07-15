package services

import (
	"context"
	"io"
	"sync"
	"sync/atomic"
)

var subscriberID int64

type liveSubscription struct {
	id   int64
	ch   chan string
	key  string
	svc  *LiveService
}

func (sub *liveSubscription) C() <-chan string { return sub.ch }

func (sub *liveSubscription) Close() {
	sub.svc.mu.Lock()
	defer sub.svc.mu.Unlock()
	if subs, ok := sub.svc.subscribers[sub.key]; ok {
		delete(subs, sub.id)
		if len(subs) == 0 {
			delete(sub.svc.subscribers, sub.key)
		}
	}
	close(sub.ch)
}

type LiveService struct {
	mu          sync.RWMutex
	subscribers map[string]map[int64]*liveSubscription
}

func NewLiveService() *LiveService {
	return &LiveService{
		subscribers: make(map[string]map[int64]*liveSubscription),
	}
}

func (s *LiveService) IssueToken(_ context.Context, _ any, streamType, _ string) (string, error) {
	return streamType + "-token-placeholder", nil
}

func (s *LiveService) Subscribe(_ context.Context, streamType, target string) *liveSubscription {
	key := streamType + ":" + target
	id := atomic.AddInt64(&subscriberID, 1)
	sub := &liveSubscription{
		id:  id,
		ch:  make(chan string, 64),
		key: key,
		svc: s,
	}
	s.mu.Lock()
	if s.subscribers[key] == nil {
		s.subscribers[key] = make(map[int64]*liveSubscription)
	}
	s.subscribers[key][id] = sub
	s.mu.Unlock()
	return sub
}

func (s *LiveService) Publish(streamType, target, event string) {
	key := streamType + ":" + target
	s.mu.RLock()
	defer s.mu.RUnlock()
	if subs, ok := s.subscribers[key]; ok {
		for _, sub := range subs {
			select {
			case sub.ch <- event:
			default:
			}
		}
	}
}

func (s *LiveService) StreamDelivery(_ context.Context, _ string, writer io.Writer) error {
	return nil
}

func (s *LiveService) StreamTracing(_ context.Context, writer io.Writer) error {
	return nil
}

func (s *LiveService) StreamMetrics(_ context.Context, writer io.Writer) error {
	return nil
}
