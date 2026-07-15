package utils

import (
	"path/filepath"
	"regexp"
	"strings"
)

var slugPattern = regexp.MustCompile(`^[a-z0-9]+(?:-[a-z0-9]+)*$`)

func ValidWorkspaceSlug(slug string) bool {
	return slugPattern.MatchString(strings.TrimSpace(slug))
}

func ValidChannelName(name string) bool {
	name = strings.TrimSpace(name)
	return len(name) >= 2 && len(name) <= 80
}

func ValidRole(role string) bool {
	switch role {
	case "owner", "admin", "member", "guest":
		return true
	default:
		return false
	}
}

func ValidMessageType(messageType string) bool {
	switch messageType {
	case "text", "system", "file", "meeting", "integration":
		return true
	default:
		return false
	}
}

func ValidProvider(provider string) bool {
	switch provider {
	case "github", "gitlab", "forgejo", "vercel", "grafana", "proxmox", "webhook", "aether":
		return true
	default:
		return false
	}
}

func ValidateStoragePath(path string) bool {
	if strings.TrimSpace(path) == "" {
		return false
	}
	cleaned := filepath.Clean(path)
	return cleaned == path || cleaned == filepath.Clean(path)
}
