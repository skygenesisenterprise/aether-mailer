package redisclient

import (
	"context"
	"fmt"
	"net"
	"strings"
	"time"

	redis "github.com/redis/go-redis/v9"
)

type Client struct {
	Raw  *redis.Client
	Keys *KeyBuilder
}

type Config struct {
	URL       string
	Host      string
	Port      string
	Password  string
	DB        int
	Enabled   bool
	Required  bool
	KeyPrefix string

	DefaultTTL     time.Duration
	ConnectTimeout time.Duration
	ReadTimeout    time.Duration
	WriteTimeout   time.Duration
	MaxRetries     int
}

func DefaultConfig() Config {
	return Config{
		Host:           "localhost",
		Port:           "6379",
		DB:             0,
		Enabled:        false,
		Required:       false,
		KeyPrefix:      "company-website:v1",
		DefaultTTL:     5 * time.Minute,
		ConnectTimeout: 5 * time.Second,
		ReadTimeout:    3 * time.Second,
		WriteTimeout:   3 * time.Second,
		MaxRetries:     3,
	}
}

func New(cfg Config) (*Client, error) {
	if !cfg.Enabled {
		return nil, nil
	}

	options, err := parseRedisConfig(cfg)
	if err != nil {
		if cfg.Required {
			return nil, fmt.Errorf("parse redis config: %w", err)
		}
		return nil, nil
	}

	options.DialTimeout = cfg.ConnectTimeout
	options.ReadTimeout = cfg.ReadTimeout
	options.WriteTimeout = cfg.WriteTimeout
	options.PoolTimeout = cfg.ConnectTimeout
	options.MaxRetries = cfg.MaxRetries

	client := redis.NewClient(options)

	ctx, cancel := context.WithTimeout(context.Background(), cfg.ConnectTimeout)
	defer cancel()

	if err := client.Ping(ctx).Err(); err != nil {
		_ = client.Close()
		if cfg.Required {
			return nil, fmt.Errorf("ping redis: %w", err)
		}
		return nil, nil
	}

	return &Client{
		Raw:  client,
		Keys: NewKeyBuilder(cfg.KeyPrefix),
	}, nil
}

func (c *Client) Close() error {
	if c == nil || c.Raw == nil {
		return nil
	}
	return c.Raw.Close()
}

func (c *Client) IsAvailable() bool {
	if c == nil || c.Raw == nil {
		return false
	}
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()
	return c.Raw.Ping(ctx).Err() == nil
}

func parseRedisConfig(cfg Config) (*redis.Options, error) {
	url := strings.TrimSpace(cfg.URL)

	if url != "" && !strings.Contains(url, "${") {
		options, err := redis.ParseURL(url)
		if err == nil {
			return options, nil
		}
		if cfg.Required {
			return nil, fmt.Errorf("parse redis URL: %w", err)
		}
	}

	options := &redis.Options{
		Addr:         net.JoinHostPort(cfg.Host, cfg.Port),
		Password:     cfg.Password,
		DB:           cfg.DB,
		DialTimeout:  cfg.ConnectTimeout,
		ReadTimeout:  cfg.ReadTimeout,
		WriteTimeout: cfg.WriteTimeout,
		PoolTimeout:  cfg.ConnectTimeout,
		MaxRetries:   cfg.MaxRetries,
	}

	if options.Addr == ":" {
		options.Addr = "localhost:6379"
	}

	return options, nil
}
