package handlers

import (
	"net/http"
	"strings"

	"amestris-backend/models"

	"github.com/gin-gonic/gin"
)

func GetAlchemists(c *gin.Context) {
	var alchemists []models.Alchemist
	if err := models.DB.Find(&alchemists).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error obteniendo alquimistas"})
		return
	}
	c.JSON(http.StatusOK, alchemists)
}

func GetAlchemist(c *gin.Context) {
	id := c.Param("id")
	var alchemist models.Alchemist
	if err := models.DB.Preload("User").First(&alchemist, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Alquimista no encontrado"})
		return
	}
	c.JSON(http.StatusOK, alchemist)
}

func CreateAlchemist(c *gin.Context) {
	var alchemist models.Alchemist
	if err := c.BindJSON(&alchemist); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos"})
		return
	}

	if err := models.DB.Create(&alchemist).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error creando alquimista"})
		return
	}

	c.JSON(http.StatusCreated, alchemist)
}

func UpdateAlchemist(c *gin.Context) {
	id := c.Param("id")
	var alchemist models.Alchemist

	if err := models.DB.First(&alchemist, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Alquimista no encontrado"})
		return
	}

	if err := c.BindJSON(&alchemist); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos"})
		return
	}

	if err := models.DB.Save(&alchemist).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error actualizando alquimista"})
		return
	}

	c.JSON(http.StatusOK, alchemist)
}

// Registrar nuevo alquimista con usuario automático
func RegisterAlchemist(c *gin.Context) {
	var request struct {
		Name      string `json:"name" binding:"required"`
		Title     string `json:"title" binding:"required"`
		Specialty string `json:"specialty" binding:"required"`
		Rank      string `json:"rank" binding:"required"`
		Status    string `json:"status"`
		Automail  bool   `json:"automail"`
	}

	if err := c.BindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos: " + err.Error()})
		return
	}

	// Verificar que no exista un alquimista con el mismo nombre
	var existing models.Alchemist
	if err := models.DB.Where("name = ?", request.Name).First(&existing).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Ya existe un alquimista con ese nombre"})
		return
	}

	alchemist := models.Alchemist{
		Name:      request.Name,
		Title:     request.Title,
		Specialty: request.Specialty,
		Rank:      request.Rank,
		Status:    "Activo",
		Automail:  request.Automail,
	}

	if err := models.DB.Create(&alchemist).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error registrando alquimista: " + err.Error()})
		return
	}

	// Crear usuario automáticamente
	hashedPassword, _ := HashPassword("password123")
	username := strings.ToLower(strings.ReplaceAll(request.Name, " ", "_"))

	user := models.User{
		Username:    username,
		Password:    hashedPassword,
		Role:        "alchemist",
		AlchemistID: &alchemist.ID,
	}

	if err := models.DB.Create(&user).Error; err != nil {
		// Si falla crear el usuario, eliminar el alquimista
		models.DB.Delete(&alchemist)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error creando usuario: " + err.Error()})
		return
	}

	// Log de auditoría
	adminID, _ := c.Get("userID")
	CreateAuditLog(adminID.(uint), "ALCHEMIST_REGISTER", "alchemist",
		"Nuevo alquimista registrado: "+alchemist.Name+" - "+alchemist.Title)

	c.JSON(http.StatusCreated, gin.H{
		"message":   "Alquimista registrado exitosamente",
		"alchemist": alchemist,
		"user_credentials": gin.H{
			"username": username,
			"password": "password123",
			"role":     "alchemist",
		},
	})
}
