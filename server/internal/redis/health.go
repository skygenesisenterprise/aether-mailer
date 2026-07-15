package redisclient

import (
	"context"
	"time"
)

type HealthStatus string

const (
	StatusHealthy     HealthStatus = "healthy"
	StatusUnhealthy   HealthStatus = "unhealthy"
	StatusUnavailable HealthStatus = "unavailable"
	StatusDisabled    HealthStatus = "disabled"
)

type HealthResult struct {
	Status  HealthStatus `json:"status"`
	Latency string       `json:"latency,omitempty"`
	Error   string       `json:"error,omitempty"`
}

func (c *Client) Health(ctx context.Context) HealthResult {
	if c == nil || c.Raw == nil {
		return HealthResult{Status: StatusDisabled}
	}

	start := time.Now()
	err := c.Raw.Ping(ctx).Err()
	latency := time.Since(start).String()

	if err != nil {
		return HealthResult{
			Status:  StatusUnhealthy,
			Latency: latency,
			Error:   err.Error(),
		}
	}

	return HealthResult{
		Status:  StatusHealthy,
		Latency: latency,
	}
}
