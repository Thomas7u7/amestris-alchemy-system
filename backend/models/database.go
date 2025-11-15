package models

import (
	"log"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB
var JWTSecret = []byte("amestris_secret_key_2024")

func ConnectDatabase(dsn string) error {
	var db *gorm.DB
	var err error

	for i := 0; i < 10; i++ {
		db, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
		if err != nil {
			log.Printf("Intento %d: Error conectando a la base de datos, reintentando...", i+1)
			time.Sleep(2 * time.Second)
			continue
		}

		sqlDB, err := db.DB()
		if err == nil {
			err = sqlDB.Ping()
		}

		if err == nil {
			log.Println("✅ Conexión a la base de datos establecida")
			DB = db
			break
		}

		log.Printf("Intento %d: Ping falló, reintentando...", i+1)
		time.Sleep(2 * time.Second)
	}

	return err
}

func AutoMigrate() error {
	return DB.AutoMigrate(
		&Alchemist{},
		&Mission{},
		&User{},
		&ExperimentRequest{},
		&TransmutationLog{},
		&AuditLog{},
		&Material{},
	)
}
