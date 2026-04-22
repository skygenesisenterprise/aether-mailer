package models

type Password struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	Username  string `json:"username"`
	Password  string `json:"password"`
	URL       string `json:"url,omitempty"`
	Favorite  bool   `json:"favorite"`
	Category  string `json:"category"`
	Notes     string `json:"notes,omitempty"`
	CreatedAt string `json:"created_at,omitempty"`
	UpdatedAt string `json:"updated_at,omitempty"`
}

type PasswordListResponse struct {
	Success bool       `json:"success"`
	Data    []Password `json:"data,omitempty"`
	Error   string     `json:"error,omitempty"`
}

type PasswordResponse struct {
	Success bool     `json:"success"`
	Data    Password `json:"data,omitempty"`
	Error   string   `json:"error,omitempty"`
}

type CreatePasswordRequest struct {
	Name     string `json:"name" binding:"required"`
	Username string `json:"username"`
	Password string `json:"password"`
	URL      string `json:"url,omitempty"`
	Category string `json:"category"`
	Notes    string `json:"notes,omitempty"`
}

type UpdatePasswordRequest struct {
	Name     string `json:"name,omitempty"`
	Username string `json:"username,omitempty"`
	Password string `json:"password,omitempty"`
	URL      string `json:"url,omitempty"`
	Category string `json:"category,omitempty"`
	Notes    string `json:"notes,omitempty"`
	Favorite *bool  `json:"favorite,omitempty"`
}
