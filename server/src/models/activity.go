package models

import "time"

type ActivityOverview struct {
	ID          string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Date        time.Time `gorm:"type:date;not null" json:"date"`
	TotalUsers  int       `gorm:"default:0;column:total_users" json:"totalUsers"`
	ActiveUsers int       `gorm:"default:0;column:active_users" json:"activeUsers"`
	Logins      int       `gorm:"default:0" json:"logins"`
	Signups     int       `gorm:"default:0" json:"signups"`
}

type DailyActiveUsers struct {
	ID        string      `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Date      time.Time   `gorm:"type:date;not null" json:"date"`
	Count     int         `gorm:"default:0" json:"count"`
	Breakdown interface{} `gorm:"type:jsonb" json:"breakdown,omitempty"`
}

type UserRetention struct {
	ID          string  `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	CohortMonth string  `gorm:"size:10;not null;column:cohort_month" json:"cohortMonth"`
	Period      int     `gorm:"not null" json:"period"` // weeks/months
	Retained    int     `gorm:"default:0" json:"retained"`
	Churned     int     `gorm:"default:0" json:"churned"`
	Rate        float64 `gorm:"default:0" json:"rate"`
}

type SignupData struct {
	ID        string      `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Date      time.Time   `gorm:"type:date;not null" json:"date"`
	Count     int         `gorm:"default:0" json:"count"`
	Breakdown interface{} `gorm:"type:jsonb" json:"breakdown,omitempty"`
}

type FailedLoginData struct {
	ID        string      `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Date      time.Time   `gorm:"type:date;not null" json:"date"`
	Count     int         `gorm:"default:0" json:"count"`
	Breakdown interface{} `gorm:"type:jsonb" json:"breakdown,omitempty"`
}

type DashboardStats struct {
	ID            string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Date          time.Time `gorm:"type:date;not null" json:"date"`
	TotalUsers    int       `gorm:"default:0;column:total_users" json:"totalUsers"`
	ActiveUsers   int       `gorm:"default:0;column:active_users" json:"activeUsers"`
	TotalLogins   int       `gorm:"default:0;column:total_logins" json:"totalLogins"`
	TotalSessions int       `gorm:"default:0;column:total_sessions" json:"totalSessions"`
}

type UserStats struct {
	ID      string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Date    time.Time `gorm:"type:date;not null" json:"date"`
	Total   int       `gorm:"default:0" json:"total"`
	Active  int       `gorm:"default:0" json:"active"`
	Blocked int       `gorm:"default:0" json:"blocked"`
	Pending int       `gorm:"default:0" json:"pending"`
	WithMFA int       `gorm:"default:0;column:with_mfa" json:"withMfa"`
}

type SessionStats struct {
	ID      string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Date    time.Time `gorm:"type:date;not null" json:"date"`
	Total   int       `gorm:"default:0" json:"total"`
	Active  int       `gorm:"default:0" json:"active"`
	Expired int       `gorm:"default:0" json:"expired"`
}

type LoginStats struct {
	ID      string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Date    time.Time `gorm:"type:date;not null" json:"date"`
	Success int       `gorm:"default:0" json:"success"`
	Failed  int       `gorm:"default:0" json:"failed"`
	MFAUsed int       `gorm:"default:0;column:mfa_used" json:"mfaUsed"`
}
