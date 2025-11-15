package handlers

import (
	"net/http"

	"amestris-backend/models"

	"github.com/gin-gonic/gin"
)

func GetMaterials(c *gin.Context) {
	var materials []models.Material
	if err := models.DB.Find(&materials).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error obteniendo materiales"})
		return
	}
	c.JSON(http.StatusOK, materials)
}

func CreateMaterial(c *gin.Context) {
	var material models.Material
	if err := c.BindJSON(&material); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos"})
		return
	}

	// Verificar si el material ya existe
	var existing models.Material
	if err := models.DB.Where("name = ?", material.Name).First(&existing).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Ya existe un material con ese nombre"})
		return
	}

	if err := models.DB.Create(&material).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error creando material"})
		return
	}

	// Log de auditoría
	userID, _ := c.Get("userID")
	CreateAuditLog(userID.(uint), "MATERIAL_CREATE", "material",
		"Nuevo material creado: "+material.Name)

	c.JSON(http.StatusCreated, material)
}

func UpdateMaterial(c *gin.Context) {
	id := c.Param("id")
	var material models.Material

	if err := models.DB.First(&material, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Material no encontrado"})
		return
	}

	if err := c.BindJSON(&material); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos"})
		return
	}

	if err := models.DB.Save(&material).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error actualizando material"})
		return
	}

	// Log de auditoría
	userID, _ := c.Get("userID")
	CreateAuditLog(userID.(uint), "MATERIAL_UPDATE", "material",
		"Material actualizado: "+material.Name)

	c.JSON(http.StatusOK, material)
}

func DeleteMaterial(c *gin.Context) {
	id := c.Param("id")
	var material models.Material

	if err := models.DB.First(&material, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Material no encontrado"})
		return
	}

	if err := models.DB.Delete(&material).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error eliminando material"})
		return
	}

	// Log de auditoría
	userID, _ := c.Get("userID")
	CreateAuditLog(userID.(uint), "MATERIAL_DELETE", "material",
		"Material eliminado: "+material.Name)

	c.JSON(http.StatusOK, gin.H{"message": "Material eliminado exitosamente"})
}
