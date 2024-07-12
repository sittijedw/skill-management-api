package main

import (
	"context"
	"database/sql"
	"errors"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/lib/pq"
)

type Skill struct {
	Key         string   `json:"id"`
	Name        string   `json:"name"`
	Description string   `json:"description"`
	Logo        string   `json:"logo"`
	Tags        []string `json:"tags"`
}

type GetSkillsResponse struct {
	Status string  `json:"status"`
	Data   []Skill `json:"data"`
}

var DB *sql.DB

func main() {
	ctx, cancel := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer cancel()

	DB = connectDB()
	defer DB.Close()

	r := gin.Default()
	v1 := r.Group("/api/v1")
	{
		v1.GET("/skills", getSkillsHandler)
		// v1.GET("/skills/:key", getSkillByKeyHandler)
		// v1.POST("/skills", createSkillHandler)
		// v1.PUT("/skills/:key", updateSkillByKeyHandler)
		// v1.PATCH("/api/v1/skills/:key/actions/name", updateSkillNameByKeyHandler)
		// v1.PATCH("/api/v1/skills/:key/actions/description", updateSkillDescriptionByKeyHandler)
		// v1.PATCH("/api/v1/skills/:key/actions/logo", updateSkillLogoByKeyHandler)
		// v1.PATCH("/api/v1/skills/:key/actions/tags", updateSkillTagsByKeyHandler)
		// v1.DELETE("/skills/:key", deleteSkillByKeyHandler)
	}

	srv := http.Server{
		Addr:    ":" + os.Getenv("PORT"),
		Handler: r,
	}

	closedChan := make(chan struct{})

	go func() {
		<-ctx.Done()
		log.Println("Shutting down...")

		ctx, cancel = context.WithTimeout(context.Background(), 3*time.Second)
		defer cancel()

		if err := srv.Shutdown(ctx); err != nil {
			if !errors.Is(err, http.ErrServerClosed) {
				log.Println(err)
			}
		}
		close(closedChan)
	}()

	if err := srv.ListenAndServe(); err != nil {
		log.Println(err)
	}

	<-closedChan
}

func connectDB() *sql.DB {
	dbUrl := os.Getenv("DATABASE_URL")
	db, err := sql.Open("postgres", dbUrl)

	if err != nil {
		log.Println("Error: Can't connect to database", err)
	} else {
		log.Println("Connect database success")
	}

	return db
}

func getSkillsHandler(ctx *gin.Context) {
	rows, err := DB.Query("SELECT key, name, description, logo, tags FROM skill")

	if err != nil {
		log.Println("Error: Can't get skills")
		return
	}

	var skills []Skill
	for rows.Next() {
		var skill Skill

		err := rows.Scan(&skill.Key, &skill.Name, &skill.Description, &skill.Logo, pq.Array(&skill.Tags))

		if err != nil {
			log.Println("Error: Can't scan row to skill struct")
			return
		}

		skills = append(skills, skill)
	}

	var getSkillsResponse GetSkillsResponse
	getSkillsResponse.Status = "success"
	getSkillsResponse.Data = skills

	ctx.JSON(http.StatusOK, getSkillsResponse)
	log.Println("Get skills success")
}
