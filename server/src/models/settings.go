package models

type UserSettings struct {
	Common
	UserID        string  `gorm:"column:user_id;type:text;uniqueIndex;not null" json:"userId"`
	Theme         string  `gorm:"column:theme;type:text;not null;default:'system'" json:"theme"`
	Language      string  `gorm:"column:language;type:text;not null;default:'fr'" json:"language"`
	Locale        string  `gorm:"column:locale;type:text;not null;default:'fr'" json:"locale"`
	TimeZone      string  `gorm:"column:time_zone;type:text;not null;default:'Europe/Paris'" json:"timeZone"`
	StatusMessage *string `gorm:"column:status_message;type:text" json:"statusMessage,omitempty"`
	Density       string  `gorm:"column:density;type:text;not null;default:'comfortable'" json:"density"`
	Contrast      string  `gorm:"column:contrast;type:text;not null;default:'default'" json:"contrast"`
	SoundEnabled  bool    `gorm:"column:sound_enabled;not null;default:true" json:"soundEnabled"`
	SecureSession bool    `gorm:"column:secure_session;not null;default:true" json:"secureSession"`
}

func (UserSettings) TableName() string {
	return "user_settings"
}

type NotificationPreference struct {
	Common
	UserID                      string `gorm:"column:user_id;type:text;uniqueIndex;not null" json:"userId"`
	DirectMessageNotifications  bool   `gorm:"column:direct_message_notifications;not null;default:true" json:"directMessageNotifications"`
	MentionNotifications        bool   `gorm:"column:mention_notifications;not null;default:true" json:"mentionNotifications"`
	ChannelMessageNotifications bool   `gorm:"column:channel_message_notifications;not null;default:true" json:"channelMessageNotifications"`
	MeetingReminders            bool   `gorm:"column:meeting_reminders;not null;default:true" json:"meetingReminders"`
	CallNotifications           bool   `gorm:"column:call_notifications;not null;default:true" json:"callNotifications"`
	EmailNotifications          bool   `gorm:"column:email_notifications;not null;default:true" json:"emailNotifications"`
	SoundEnabled                bool   `gorm:"column:sound_enabled;not null;default:true" json:"soundEnabled"`
	DesktopNotifications        bool   `gorm:"column:desktop_notifications;not null;default:true" json:"desktopNotifications"`
}

func (NotificationPreference) TableName() string {
	return "notification_preferences"
}
