package handlers

import (
	"fmt"
	"net/http"

	"amestris-backend/models"

	"github.com/gin-gonic/gin"
)

func CreateExperimentRequest(c *gin.Context) {
	userID, _ := c.Get("userID")

	var experiment models.ExperimentRequest
	if err := c.BindJSON(&experiment); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos"})
		return
	}

	experiment.AlchemistID = userID.(uint)
	experiment.Status = "pending"

	if err := models.DB.Create(&experiment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error creando solicitud"})
		return
	}

	// Log de auditoría
	CreateAuditLog(experiment.AlchemistID, "EXPERIMENT_REQUEST", "experiment",
		fmt.Sprintf("Nueva solicitud: %s - Riesgo: %s", experiment.Title, experiment.RiskLevel))

	c.JSON(http.StatusCreated, experiment)
}

func GetExperimentRequests(c *gin.Context) {
	userRole, _ := c.Get("role")
	userID, _ := c.Get("userID")

	var experiments []models.ExperimentRequest
	query := models.DB.Preload("Alchemist")

	// Solo supervisores y admin ven todas las solicitudes
	if userRole == "alchemist" {
		query = query.Where("alchemist_id = ?", userID)
	}

	if err := query.Find(&experiments).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error obteniendo solicitudes"})
		return
	}

	c.JSON(http.StatusOK, experiments)
}

func UpdateExperimentStatus(c *gin.Context) {
	id := c.Param("id")

	var updateData struct {
		Status string `json:"status"`
		Notes  string `json:"notes"`
	}

	if err := c.BindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos"})
		return
	}

	var experiment models.ExperimentRequest
	if err := models.DB.First(&experiment, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Solicitud no encontrada"})
		return
	}

	experiment.Status = updateData.Status
	models.DB.Save(&experiment)

	// Log de auditoría
	CreateAuditLog(experiment.AlchemistID, "EXPERIMENT_UPDATE", "experiment",
		fmt.Sprintf("Solicitud %s actualizada a: %s - %s", experiment.Title, updateData.Status, updateData.Notes))

	c.JSON(http.StatusOK, experiment)
}
