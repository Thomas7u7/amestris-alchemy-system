package models

import (
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type Alchemist struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Name      string    `json:"name"`
	Title     string    `json:"title"`
	Specialty string    `json:"specialty"`
	Rank      string    `json:"rank"`
	Status    string    `json:"status"`
	Automail  bool      `json:"automail"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	User      *User     `json:"user" gorm:"foreignKey:AlchemistID"`
}

type Mission struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	AlchemistID uint      `json:"alchemist_id"`
	Alchemist   Alchemist `json:"alchemist" gorm:"foreignKey:AlchemistID"`
	Status      string    `json:"status"`
	Priority    string    `json:"priority"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type ExperimentRequest struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	AlchemistID uint      `json:"alchemist_id"`
	Alchemist   Alchemist `json:"alchemist" gorm:"foreignKey:AlchemistID"`
	Materials   string    `json:"materials"`
	Objective   string    `json:"objective"`
	Status      string    `json:"status"`
	RiskLevel   string    `json:"risk_level"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type TransmutationLog struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	AlchemistID  uint      `json:"alchemist_id"`
	Alchemist    Alchemist `json:"alchemist" gorm:"foreignKey:AlchemistID"`
	Input        string    `json:"input"`
	Output       string    `json:"output"`
	Success      bool      `json:"success"`
	Cost         float64   `json:"cost"`
	EnergyUsed   float64   `json:"energy_used"`
	LawRespected bool      `json:"law_respected"`
	CreatedAt    time.Time `json:"created_at"`
}

type AuditLog struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	AlchemistID uint      `json:"alchemist_id"`
	Alchemist   Alchemist `json:"alchemist" gorm:"foreignKey:AlchemistID"`
	Action      string    `json:"action"`
	Resource    string    `json:"resource"`
	Details     string    `json:"details"`
	Severity    string    `json:"severity"`
	Checked     bool      `json:"checked" gorm:"default:false"`
	CreatedAt   time.Time `json:"created_at"`
}

type Material struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	Name        string    `json:"name" gorm:"uniqueIndex"`
	Type        string    `json:"type"`
	Rarity      string    `json:"rarity"`
	BaseValue   float64   `json:"base_value"`
	DangerLevel string    `json:"danger_level"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type User struct {
	ID          uint       `gorm:"primaryKey" json:"id"`
	Username    string     `json:"username" gorm:"uniqueIndex"`
	Password    string     `json:"-"`
	Role        string     `json:"role"`
	AlchemistID *uint      `json:"alchemist_id"`
	Alchemist   *Alchemist `json:"alchemist" gorm:"foreignKey:AlchemistID"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type Claims struct {
	UserID   uint   `json:"user_id"`
	Role     string `json:"role"`
	Username string `json:"username"`
	jwt.RegisteredClaims
}
