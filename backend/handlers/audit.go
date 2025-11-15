package handlers

import (
	"fmt"
	"net/http"
	"time"

	"amestris-backend/models"

	"github.com/gin-gonic/gin"
)

func CreateAuditLog(alchemistID uint, action, resource, details string) {
	audit := models.AuditLog{
		AlchemistID: alchemistID,
		Action:      action,
		Resource:    resource,
		Details:     details,
		Severity:    getSeverityLevel(action),
	}
	models.DB.Create(&audit)
}

func GetAuditLogs(c *gin.Context) {
	userRole, _ := c.Get("role")

	var audits []models.AuditLog
	query := models.DB.Preload("Alchemist").Order("created_at DESC")

	if userRole == "supervisor" {
		query = query.Where("severity IN ?", []string{"warning", "danger"})
	} else if userRole == "alchemist" {
		userID, _ := c.Get("userID")
		query = query.Where("alchemist_id = ?", userID)
	}

	if err := query.Limit(100).Find(&audits).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error obteniendo logs"})
		return
	}

	c.JSON(http.StatusOK, audits)
}

func getSeverityLevel(action string) string {
	switch action {
	case "HUMAN_TRANSMUTATION", "FORBIDDEN_EXPERIMENT":
		return "danger"
	case "UNAUTHORIZED_ACCESS", "RESOURCE_MISUSE":
		return "warning"
	default:
		return "info"
	}
}

func StartBackgroundAudits() {
	go func() {
		for {
			time.Sleep(5 * time.Minute)

			// Verificar experimentos de alto riesgo
			var highRiskExperiments []models.ExperimentRequest
			models.DB.Where("risk_level = ? AND status = ?", "high", "approved").Find(&highRiskExperiments)

			for _, exp := range highRiskExperiments {
				CreateAuditLog(exp.AlchemistID, "RISK_MONITOR", "experiment",
					fmt.Sprintf("Experimento de alto riesgo monitoreado: %s", exp.Title))
			}

			// Verificar transmutaciones frecuentes
			var recentTransmutations []models.TransmutationLog
			models.DB.Where("created_at > ?", time.Now().Add(-1*time.Hour)).Find(&recentTransmutations)

			if len(recentTransmutations) > 10 {
				CreateAuditLog(recentTransmutations[0].AlchemistID, "FREQUENT_ACTIVITY", "transmutation",
					"Actividad de transmutación inusualmente frecuente detectada")
			}
		}
	}()
}
