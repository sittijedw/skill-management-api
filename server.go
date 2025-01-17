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
	Key         string   `json:"key"`
	Name        string   `json:"name"`
	Description string   `json:"description"`
	Logo        string   `json:"logo"`
	Tags        []string `json:"tags"`
}

type GetSkillsResponse struct {
	Status string  `json:"status"`
	Data   []Skill `json:"data"`
}

type SkillResponse struct {
	Status string `json:"status"`
	Data   Skill  `json:"data"`
}

type Response struct {
	Status  string `json:"status"`
	Message string `json:"message"`
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
		v1.GET("/skills/:key", getSkillByKeyHandler)
		v1.POST("/skills", createSkillHandler)
		v1.PUT("/skills/:key", updateSkillByKeyHandler)
		v1.PATCH("skills/:key/actions/name", updateSkillNameByKeyHandler)
		v1.PATCH("skills/:key/actions/description", updateSkillDescriptionByKeyHandler)
		v1.PATCH("skills/:key/actions/logo", updateSkillLogoByKeyHandler)
		v1.PATCH("skills/:key/actions/tags", updateSkillTagsByKeyHandler)
		v1.DELETE("/skills/:key", deleteSkillByKeyHandler)
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

	var skills = make([]Skill, 0)
	for rows.Next() {
		var skill Skill

		err := rows.Scan(&skill.Key, &skill.Name, &skill.Description, &skill.Logo, pq.Array(&skill.Tags))

		if err != nil {
			log.Println("Error: Can't scan row to skill struct")
			return
		}

		skills = append(skills, skill)
	}

	getSkillsResponse := GetSkillsResponse{Status: "success", Data: skills}

	ctx.JSON(http.StatusOK, getSkillsResponse)
}

func getSkillByKeyHandler(ctx *gin.Context) {
	paramKey := ctx.Param("key")

	row := DB.QueryRow("SELECT key, name, description, logo, tags FROM skill where key=$1", paramKey)

	var skill Skill

	err := row.Scan(&skill.Key, &skill.Name, &skill.Description, &skill.Logo, pq.Array(&skill.Tags))

	if err != nil {
		log.Println("Error: Skill not found")
		Response := Response{Status: "error", Message: "Skill not found"}
		ctx.JSON(http.StatusNotFound, Response)
		return
	}

	getSkillResponse := SkillResponse{Status: "success", Data: skill}
	ctx.JSON(http.StatusOK, getSkillResponse)
}

func createSkillHandler(ctx *gin.Context) {
	var skill Skill

	if err := ctx.BindJSON(&skill); err != nil {
		ctx.Error(err)
	}

	row := DB.QueryRow("INSERT INTO skill (key, name, description, logo, tags) VALUES ($1, $2, $3, $4, $5) RETURNING key, name, description, logo, tags", skill.Key, skill.Name, skill.Description, skill.Logo, pq.Array(skill.Tags))

	err := row.Scan(&skill.Key, &skill.Name, &skill.Description, &skill.Logo, pq.Array(&skill.Tags))

	if err != nil {
		log.Println("Error: Skill already exists")
		Response := Response{Status: "error", Message: "Skill already exists"}
		ctx.JSON(http.StatusConflict, Response)
		return
	}

	createSkillResponse := SkillResponse{Status: "success", Data: skill}
	ctx.JSON(http.StatusOK, createSkillResponse)
}

func updateSkill(ctx *gin.Context, updateField string) {
	var skill Skill
	var row *sql.Row

	err := ctx.BindJSON(&skill)

	if err != nil {
		ctx.Error(err)
	}

	skill.Key = ctx.Param("key")

	if updateField == "all" {
		row = DB.QueryRow("UPDATE skill SET name=$1, description=$2, logo=$3, tags=$4 WHERE key=$5 RETURNING key, name, description, logo, tags", skill.Name, skill.Description, skill.Logo, pq.Array(skill.Tags), skill.Key)
	} else if updateField == "name" {
		row = DB.QueryRow("UPDATE skill SET name=$1 WHERE key=$2 RETURNING key, name, description, logo, tags", skill.Name, skill.Key)
	} else if updateField == "description" {
		row = DB.QueryRow("UPDATE skill SET description=$1 WHERE key=$2 RETURNING key, name, description, logo, tags", skill.Description, skill.Key)
	} else if updateField == "logo" {
		row = DB.QueryRow("UPDATE skill SET logo=$1 WHERE key=$2 RETURNING key, name, description, logo, tags", skill.Logo, skill.Key)
	} else if updateField == "tags" {
		row = DB.QueryRow("UPDATE skill SET tags=$1 WHERE key=$2 RETURNING key, name, description, logo, tags", pq.Array(skill.Tags), skill.Key)
	}

	err = row.Scan(&skill.Key, &skill.Name, &skill.Description, &skill.Logo, pq.Array(&skill.Tags))

	if err != nil {
		var message string
		if updateField == "all" {
			message = "not be able to update skill"
		} else {
			message = "not be able to update skill " + updateField
		}
		log.Println("Error:", message)
		Response := Response{Status: "error", Message: message}
		ctx.JSON(http.StatusBadRequest, Response)
		return
	}

	updateSkillResponse := SkillResponse{Status: "success", Data: skill}
	ctx.JSON(http.StatusOK, updateSkillResponse)
}

func updateSkillByKeyHandler(ctx *gin.Context) {
	updateSkill(ctx, "all")
}

func updateSkillNameByKeyHandler(ctx *gin.Context) {
	updateSkill(ctx, "name")
}

func updateSkillDescriptionByKeyHandler(ctx *gin.Context) {
	updateSkill(ctx, "description")
}

func updateSkillLogoByKeyHandler(ctx *gin.Context) {
	updateSkill(ctx, "logo")
}

func updateSkillTagsByKeyHandler(ctx *gin.Context) {
	updateSkill(ctx, "tags")
}

func deleteSkillByKeyHandler(ctx *gin.Context) {
	var skill Skill
	paramKey := ctx.Param("key")

	row := DB.QueryRow("DELETE FROM skill WHERE key=$1 RETURNING key, name, description, logo, tags", paramKey)

	err := row.Scan(&skill.Key, &skill.Name, &skill.Description, &skill.Logo, pq.Array(&skill.Tags))

	if err != nil {
		log.Println("Error:", err)
		Response := Response{Status: "error", Message: "not be able to delete skill"}
		ctx.JSON(http.StatusBadRequest, Response)
		return
	}

	Response := Response{Status: "success", Message: "Skill deleted"}
	ctx.JSON(http.StatusOK, Response)
}
