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
	_ "github.com/lib/pq"
)

var DB *sql.DB

func main() {
	ctx, cancel := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer cancel()

	DB = connectDB()
	defer DB.Close()

	r := gin.Default()
	r.GET("/", helloWorldHandler)

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
	}

	return db
}

func helloWorldHandler(ctx *gin.Context) {
	ctx.JSON(http.StatusOK, "Hello, World")
}
