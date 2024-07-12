package main

import (
	"database/sql"
	"log"
	"os"

	_ "github.com/lib/pq"
)

func main() {
	db := connectDB()
	defer db.Close()

	createSkillTable := `
		CREATE TABLE skill (
			key TEXT PRIMARY KEY,
			name TEXT NOT NULL DEFAULT '',
			description TEXT NOT NULL DEFAULT '',
			logo TEXT NOT NULL DEFAULT '',
			TAGS TEXT [] NOT NULL DEFAULT '{}'
		)
	`

	_, err := db.Exec(createSkillTable)

	if err != nil {
		log.Println("Error: Can't create skill table", err)
	} else {
		log.Println("Create skill table success")
	}
}

func connectDB() *sql.DB {
	url := os.Getenv("DATABASE_URL")
	db, err := sql.Open("postgres", url)

	if err != nil {
		log.Println("Error: Can't connect to database", err)
	} else {
		log.Println("Connect database success")
	}

	return db
}
