package protocols

import (
	"github.com/skygenesisenterprise/aether-mailer/services/monitoring"
)

// BaseProtocol provides common functionality for all protocol implementations
type BaseProtocol struct {
	name   string
	logger *monitoring.Logger
}

// NewBaseProtocol creates a new base protocol
func NewBaseProtocol(name string, logger *monitoring.Logger) *BaseProtocol {
	return &BaseProtocol{
		name:   name,
		logger: logger,
	}
}

// GetName returns the protocol name
func (bp *BaseProtocol) GetName() string {
	return bp.name
}

// Log logs a message with protocol context
func (bp *BaseProtocol) Log(message string, metadata map[string]interface{}) {
	bp.logger.Info(message, "", metadata)
}

// LogError logs an error with protocol context
func (bp *BaseProtocol) LogError(message string, err error, metadata map[string]interface{}) {
	bp.logger.Error(message, err, "", metadata)
}

// LogConnection logs connection events
func (bp *BaseProtocol) LogConnection(clientID, action string) {
	bp.logger.LogConnection(clientID, bp.name, action)
}
