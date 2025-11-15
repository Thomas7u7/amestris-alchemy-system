package main

import (
	"log"

	"amestris-backend/handlers"
	"amestris-backend/middleware"
	"amestris-backend/models"

	"github.com/gin-gonic/gin"
)

func main() {
	// Configuración de la base de datos
	dsn := "host=postgres user=alchemist password=equivalent_exchange dbname=amestris_db port=5432 sslmode=disable TimeZone=UTC"

	if err := models.ConnectDatabase(dsn); err != nil {
		log.Fatal("Error conectando a la base de datos:", err)
	}

	// Migraciones
	if err := models.AutoMigrate(); err != nil {
		log.Fatal("Error en migraciones:", err)
	}

	// Insertar datos iniciales
	seedData()

	// Iniciar verificaciones automáticas en background
	handlers.StartBackgroundAudits()

	// Configurar rutas
	router := gin.Default()

	// Configurar CORS
	router.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	// Rutas PÚBLICAS
	router.POST("/login", handlers.Login)
	router.POST("/register", handlers.Register)
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "message": "Sistema de Alquimia operativo"})
	})

	router.GET("/debug-users", func(c *gin.Context) {
		var users []models.User
		models.DB.Find(&users)

		var result []gin.H
		for _, user := range users {
			result = append(result, gin.H{
				"id":              user.ID,
				"username":        user.Username,
				"role":            user.Role,
				"password_length": len(user.Password),
				"has_password":    len(user.Password) > 0,
			})
		}

		c.JSON(200, gin.H{
			"total_users": len(users),
			"users":       result,
		})
	})

	// Grupo de rutas PROTEGIDAS
	auth := router.Group("/api")
	auth.Use(middleware.AuthMiddleware())
	{
		// Alquimistas
		auth.GET("/alchemists", handlers.GetAlchemists)
		auth.GET("/alchemists/:id", handlers.GetAlchemist)
		auth.POST("/alchemists", middleware.RoleMiddleware("supervisor", "admin"), handlers.CreateAlchemist)
		auth.PUT("/alchemists/:id", middleware.RoleMiddleware("supervisor", "admin"), handlers.UpdateAlchemist)
		auth.POST("/alchemists/register", middleware.RoleMiddleware("supervisor", "admin"), handlers.RegisterAlchemist)

		// Misiones
		auth.GET("/missions", handlers.GetMissions)
		auth.GET("/missions/my", handlers.GetMyMissions) // Nueva ruta
		auth.POST("/missions", middleware.RoleMiddleware("supervisor", "admin"), handlers.CreateMission)
		auth.PUT("/missions/:id/status", handlers.UpdateMissionStatus)

		// Experimentos
		auth.GET("/experiments", handlers.GetExperimentRequests)
		auth.POST("/experiments", handlers.CreateExperimentRequest)
		auth.PUT("/experiments/:id/status", middleware.RoleMiddleware("supervisor", "admin"), handlers.UpdateExperimentStatus)

		// Transmutaciones
		auth.POST("/transmute", handlers.HandleTransmutation)
		auth.POST("/transmute/simulate", handlers.SimulateTransmutation)

		// Materiales
		auth.GET("/materials", handlers.GetMaterials)
		auth.POST("/materials", middleware.RoleMiddleware("supervisor", "admin"), handlers.CreateMaterial)
		auth.PUT("/materials/:id", middleware.RoleMiddleware("supervisor", "admin"), handlers.UpdateMaterial)
		auth.DELETE("/materials/:id", middleware.RoleMiddleware("supervisor", "admin"), handlers.DeleteMaterial)

		// Auditoría
		auth.GET("/audit-logs", handlers.GetAuditLogs)

		// Perfil de usuario
		auth.GET("/profile", handlers.GetProfile)
	}

	log.Println("🚀 Servidor de Alquimia de Amestris iniciado en puerto 8080")
	if err := router.Run(":8080"); err != nil {
		log.Fatal("Error iniciando servidor:", err)
	}
}

func seedData() {
	// Verificar y crear alquimistas
	var alchemistCount int64
	models.DB.Model(&models.Alchemist{}).Count(&alchemistCount)

	if alchemistCount == 0 {
		log.Println("🔄 Creando datos iniciales de alquimistas...")

		alchemists := []models.Alchemist{
			{
				Name:      "Edward Elric",
				Title:     "Alquimista de Acero",
				Specialty: "Transmutación sin círculo",
				Rank:      "Mayor",
				Status:    "Activo",
				Automail:  true,
			},
			{
				Name:      "Alphonse Elric",
				Title:     "Alquimista",
				Specialty: "Alquimia defensiva",
				Rank:      "N/A",
				Status:    "Activo",
				Automail:  false,
			},
			{
				Name:      "Roy Mustang",
				Title:     "Alquimista de Fuego",
				Specialty: "Manipulación de oxígeno",
				Rank:      "Coronel",
				Status:    "Activo",
				Automail:  false,
			},
		}

		for i := range alchemists {
			if err := models.DB.Create(&alchemists[i]).Error; err != nil {
				log.Printf("Error creando alquimista: %v", err)
			} else {
				log.Printf("✅ Alquimista creado: %s", alchemists[i].Name)
			}
		}

		// Crear misiones
		missions := []models.Mission{
			{
				Title:       "Investigación de transmutación humana",
				Description: "Investigar casos reportados de transmutación humana ilegal en el este de Amestris",
				AlchemistID: 1,
				Status:      "in_progress",
				Priority:    "high",
			},
			{
				Title:       "Protección de la frontera con Xing",
				Description: "Patrullar la frontera este y establecer relaciones diplomáticas",
				AlchemistID: 3,
				Status:      "pending",
				Priority:    "medium",
			},
		}

		for i := range missions {
			if err := models.DB.Create(&missions[i]).Error; err != nil {
				log.Printf("Error creando misión: %v", err)
			}
		}
	}

	// Verificar y crear usuarios
	var userCount int64
	models.DB.Model(&models.User{}).Count(&userCount)

	if userCount == 0 {
		log.Println("🔄 Creando usuarios iniciales...")

		// Obtener IDs de alquimistas recién creados
		var edward, alphonse, roy models.Alchemist
		models.DB.Where("name = ?", "Edward Elric").First(&edward)
		models.DB.Where("name = ?", "Alphonse Elric").First(&alphonse)
		models.DB.Where("name = ?", "Roy Mustang").First(&roy)

		// Hashear la contraseña una sola vez
		hashedPassword, err := handlers.HashPassword("password123")
		if err != nil {
			log.Fatal("Error hasheando password:", err)
		}

		users := []models.User{
			{
				Username:    "edward_elric",
				Password:    hashedPassword,
				Role:        "alchemist",
				AlchemistID: &edward.ID,
			},
			{
				Username:    "alphonse_elric",
				Password:    hashedPassword,
				Role:        "alchemist",
				AlchemistID: &alphonse.ID,
			},
			{
				Username:    "roy_mustang",
				Password:    hashedPassword,
				Role:        "supervisor",
				AlchemistID: &roy.ID,
			},
			{
				Username: "admin",
				Password: hashedPassword,
				Role:     "admin",
			},
		}

		for i := range users {
			if err := models.DB.Create(&users[i]).Error; err != nil {
				log.Printf("Error creando usuario %s: %v", users[i].Username, err)
			} else {
				log.Printf("✅ Usuario creado: %s / password123", users[i].Username)
			}
		}

		// Crear materiales iniciales
		materials := []models.Material{
			{Name: "Hierro", Type: "metal", Rarity: "common", BaseValue: 10.0, DangerLevel: "safe"},
			{Name: "Oro", Type: "metal", Rarity: "uncommon", BaseValue: 100.0, DangerLevel: "safe"},
			{Name: "Plata", Type: "metal", Rarity: "uncommon", BaseValue: 50.0, DangerLevel: "safe"},
			{Name: "Carbón", Type: "mineral", Rarity: "common", BaseValue: 5.0, DangerLevel: "safe"},
			{Name: "Agua", Type: "liquid", Rarity: "common", BaseValue: 2.0, DangerLevel: "safe"},
		}

		for i := range materials {
			models.DB.Create(&materials[i])
		}

		log.Println("🎉 Todos los datos iniciales creados exitosamente!")
		log.Println("📋 Credenciales de prueba:")
		log.Println("   edward_elric / password123")
		log.Println("   alphonse_elric / password123")
		log.Println("   roy_mustang / password123")
		log.Println("   admin / password123")
	} else {
		log.Println("✅ Los datos ya existen en la base de datos")
	}
}
