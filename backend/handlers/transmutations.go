package handlers

import (
	"math"
	"net/http"
	"strings"
	"time"

	"amestris-backend/models"

	"github.com/gin-gonic/gin"
)

func HandleTransmutation(c *gin.Context) {
	var request struct {
		InputMaterials []string `json:"input_materials"`
		OutputMaterial string   `json:"output_material"`
		AlchemistID    uint     `json:"alchemist_id"`
	}

	if err := c.BindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Intercambio equivalente violado - datos inválidos"})
		return
	}

	if len(request.InputMaterials) == 0 || request.OutputMaterial == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Se requieren materiales de entrada y salida"})
		return
	}

	// Simular procesamiento asíncrono
	go func() {
		time.Sleep(2 * time.Second)

		// Crear log de la transmutación
		transmutationLog := models.TransmutationLog{
			AlchemistID:  request.AlchemistID,
			Input:        strings.Join(request.InputMaterials, ","),
			Output:       request.OutputMaterial,
			Success:      true,
			Cost:         calculateTransmutationCost(request.InputMaterials, "moderate"),
			EnergyUsed:   calculateEnergyRequired("moderate"),
			LawRespected: verifyEquivalentExchange(request.InputMaterials, request.OutputMaterial),
		}
		models.DB.Create(&transmutationLog)
	}()

	c.JSON(http.StatusOK, gin.H{
		"message":              "Transmutación exitosa - Ley del Intercambio Equivalente respetada",
		"result":               request.OutputMaterial,
		"law_respected":        true,
		"input_materials_used": request.InputMaterials,
	})
}

func SimulateTransmutation(c *gin.Context) {
	var request struct {
		InputMaterials []string `json:"input_materials"`
		OutputMaterial string   `json:"output_material"`
		Complexity     string   `json:"complexity"`
	}

	if err := c.BindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos"})
		return
	}

	// Calcular costo basado en materiales y complejidad
	cost := calculateTransmutationCost(request.InputMaterials, request.Complexity)
	successRate := calculateSuccessRate(request.Complexity, len(request.InputMaterials))
	energyRequired := calculateEnergyRequired(request.Complexity)

	// Verificar ley de intercambio equivalente
	lawRespected := verifyEquivalentExchange(request.InputMaterials, request.OutputMaterial)

	c.JSON(http.StatusOK, gin.H{
		"simulation":      true,
		"cost":            cost,
		"success_rate":    successRate,
		"energy_required": energyRequired,
		"law_respected":   lawRespected,
		"risk_assessment": assessRisk(request.InputMaterials),
		"estimated_time":  estimateCompletionTime(request.Complexity),
	})
}

// Funciones de cálculo
func calculateTransmutationCost(materials []string, complexity string) float64 {
	baseCost := float64(len(materials)) * 10.0

	switch complexity {
	case "simple":
		return baseCost
	case "moderate":
		return baseCost * 2.5
	case "complex":
		return baseCost * 5.0
	default:
		return baseCost
	}
}

func calculateSuccessRate(complexity string, materialCount int) float64 {
	baseRate := 100.0

	switch complexity {
	case "simple":
		baseRate -= float64(materialCount) * 2
	case "moderate":
		baseRate -= float64(materialCount) * 5
	case "complex":
		baseRate -= float64(materialCount) * 10
	}

	return math.Max(baseRate, 10.0)
}

func calculateEnergyRequired(complexity string) float64 {
	switch complexity {
	case "simple":
		return 50.0
	case "moderate":
		return 150.0
	case "complex":
		return 400.0
	default:
		return 100.0
	}
}

func verifyEquivalentExchange(inputs []string, output string) bool {
	inputValue := len(inputs) * 10
	outputValue := len(output) * 8
	return inputValue >= outputValue
}

func assessRisk(materials []string) string {
	forbiddenMaterials := []string{"human", "soul", "philosopher_stone"}
	for _, material := range materials {
		for _, forbidden := range forbiddenMaterials {
			if strings.Contains(strings.ToLower(material), forbidden) {
				return "FORBIDDEN - Transmutación humana detectada"
			}
		}
	}

	if len(materials) > 5 {
		return "HIGH - Demasiados materiales"
	}

	return "LOW - Transmutación segura"
}

func estimateCompletionTime(complexity string) string {
	switch complexity {
	case "simple":
		return "5-15 minutos"
	case "moderate":
		return "30-60 minutos"
	case "complex":
		return "2-4 horas"
	default:
		return "Tiempo desconocido"
	}
}
