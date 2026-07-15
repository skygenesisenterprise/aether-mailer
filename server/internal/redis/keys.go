package redisclient

import "fmt"

type KeyBuilder struct {
	prefix string
}

func NewKeyBuilder(prefix string) *KeyBuilder {
	if prefix == "" {
		prefix = "company-website:v1"
	}
	return &KeyBuilder{prefix: prefix}
}

func (kb *KeyBuilder) Cache(resource, id string) string {
	return fmt.Sprintf("%s:cache:%s:%s", kb.prefix, resource, id)
}

func (kb *KeyBuilder) Session(sessionID string) string {
	return fmt.Sprintf("%s:session:%s", kb.prefix, sessionID)
}

func (kb *KeyBuilder) RateLimit(ip, route string) string {
	return fmt.Sprintf("%s:ratelimit:%s:%s", kb.prefix, ip, route)
}

func (kb *KeyBuilder) Lock(resource, id string) string {
	return fmt.Sprintf("%s:lock:%s:%s", kb.prefix, resource, id)
}

func (kb *KeyBuilder) Challenge(challengeID string) string {
	return fmt.Sprintf("%s:challenge:%s", kb.prefix, challengeID)
}

func (kb *KeyBuilder) RefreshToken(tokenHash string) string {
	return fmt.Sprintf("%s:refresh:%s", kb.prefix, tokenHash)
}
