package handlers

import (
	"net/http"

	"amestris-backend/models"

	"github.com/gin-gonic/gin"
)

func GetMissions(c *gin.Context) {
	var missions []models.Mission
	if err := models.DB.Preload("Alchemist").Find(&missions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error obteniendo misiones"})
		return
	}
	c.JSON(http.StatusOK, missions)
}

func CreateMission(c *gin.Context) {
	var mission struct {
		Title       string `json:"title" binding:"required"`
		Description string `json:"description" binding:"required"`
		AlchemistID uint   `json:"alchemist_id" binding:"required"`
		Status      string `json:"status"`
		Priority    string `json:"priority" binding:"required"`
	}

	if err := c.BindJSON(&mission); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos: " + err.Error()})
		return
	}

	// Verificar que el alquimista existe
	var alchemist models.Alchemist
	if err := models.DB.First(&alchemist, mission.AlchemistID).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Alquimista no encontrado"})
		return
	}

	newMission := models.Mission{
		Title:       mission.Title,
		Description: mission.Description,
		AlchemistID: mission.AlchemistID,
		Status:      "pending",
		Priority:    mission.Priority,
	}

	if err := models.DB.Create(&newMission).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error creando misión: " + err.Error()})
		return
	}

	// Cargar la relación del alquimista
	models.DB.Preload("Alchemist").First(&newMission, newMission.ID)

	// Log de auditoría
	userID, _ := c.Get("userID")
	CreateAuditLog(userID.(uint), "MISSION_CREATE", "mission",
		"Nueva misión creada: "+newMission.Title+" para "+newMission.Alchemist.Name)

	c.JSON(http.StatusCreated, gin.H{
		"message": "Misión creada exitosamente",
		"mission": newMission,
	})
}

func UpdateMissionStatus(c *gin.Context) {
	id := c.Param("id")
	var mission models.Mission

	if err := models.DB.Preload("Alchemist").First(&mission, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Misión no encontrada"})
		return
	}

	var updateData struct {
		Status string `json:"status"`
	}

	if err := c.BindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos"})
		return
	}

	mission.Status = updateData.Status
	models.DB.Save(&mission)

	// Log de auditoría
	CreateAuditLog(mission.AlchemistID, "MISSION_UPDATE", "mission",
		"Misión actualizada: "+mission.Title+" - Nuevo estado: "+updateData.Status)

	c.JSON(http.StatusOK, mission)
}

// Nueva función para obtener misiones del usuario actual
func GetMyMissions(c *gin.Context) {
	userID, _ := c.Get("userID")

	var missions []models.Mission
	if err := models.DB.Preload("Alchemist").Where("alchemist_id = ?", userID).Find(&missions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error obteniendo misiones"})
		return
	}

	c.JSON(http.StatusOK, missions)
}
