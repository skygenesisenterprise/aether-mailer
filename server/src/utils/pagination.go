package utils

import (
	"encoding/base64"
	"fmt"
	"strings"
	"time"
)

func EncodeCursor(createdAt time.Time, id string) string {
	raw := fmt.Sprintf("%d|%s", createdAt.UTC().UnixNano(), id)
	return base64.RawURLEncoding.EncodeToString([]byte(raw))
}

func DecodeCursor(cursor string) (time.Time, string, error) {
	decoded, err := base64.RawURLEncoding.DecodeString(cursor)
	if err != nil {
		return time.Time{}, "", err
	}
	parts := strings.SplitN(string(decoded), "|", 2)
	if len(parts) != 2 {
		return time.Time{}, "", fmt.Errorf("invalid cursor")
	}
	var unixNano int64
	_, err = fmt.Sscanf(parts[0], "%d", &unixNano)
	if err != nil {
		return time.Time{}, "", err
	}
	return time.Unix(0, unixNano).UTC(), parts[1], nil
}
