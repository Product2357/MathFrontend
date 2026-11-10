package main

import (
	"context"
	"crypto/subtle"
	"database/sql"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/joho/godotenv"
)

type course struct {
	ID          string   `json:"id"`
	Slug        string   `json:"slug"`
	Title       string   `json:"title"`
	Description *string  `json:"description"`
	CoverImage  *string  `json:"coverImage"`
	Level       *string  `json:"level"`
	Price       *float64 `json:"price"`
	Modules     []module `json:"modules"`
}

type module struct {
	ID      string   `json:"id"`
	Title   string   `json:"title"`
	Order   int      `json:"order"`
	Lessons []lesson `json:"lessons"`
}

type lesson struct {
	ID       string  `json:"id"`
	Title    string  `json:"title"`
	Order    int     `json:"order"`
	VideoURL *string `json:"videoUrl"`
}

type moduleLocation struct {
	courseIndex int
	moduleIndex int
}

func main() {
	_ = godotenv.Load("../.env")

	databaseURL := strings.TrimSpace(os.Getenv("DATABASE_URL"))
	if databaseURL == "" {
		log.Fatal("DATABASE_URL is required")
	}
	parsedURL, err := url.Parse(databaseURL)
	if err != nil {
		log.Fatalf("parse DATABASE_URL: %v", err)
	}
	query := parsedURL.Query()
	query.Del("schema")
	parsedURL.RawQuery = query.Encode()
	databaseURL = parsedURL.String()

	apiToken := strings.TrimSpace(os.Getenv("GO_BACKEND_API_TOKEN"))
	if apiToken == "" {
		log.Fatal("GO_BACKEND_API_TOKEN is required")
	}

	db, err := sql.Open("pgx", databaseURL)
	if err != nil {
		log.Fatalf("open database: %v", err)
	}
	defer db.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	err = db.PingContext(ctx)
	cancel()
	if err != nil {
		log.Fatalf("connect database: %v", err)
	}

	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", healthHandler(db))
	mux.Handle("GET /api/v1/courses", requireAPIToken(apiToken, coursesHandler(db)))

	address := os.Getenv("GO_BACKEND_ADDR")
	if address == "" {
		address = ":8080"
	}

	server := &http.Server{
		Addr:              address,
		Handler:           mux,
		ReadHeaderTimeout: 5 * time.Second,
	}
	log.Printf("Go API listening on %s", address)
	if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
		log.Fatalf("serve HTTP: %v", err)
	}
}

func requireAPIToken(expectedToken string, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		const bearerPrefix = "Bearer "
		authorization := r.Header.Get("Authorization")
		providedToken := strings.TrimPrefix(authorization, bearerPrefix)
		if !strings.HasPrefix(authorization, bearerPrefix) ||
			subtle.ConstantTimeCompare([]byte(providedToken), []byte(expectedToken)) != 1 {
			writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "Unauthorized"})
			return
		}

		next.ServeHTTP(w, r)
	})
}

func healthHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
		defer cancel()

		if err := db.PingContext(ctx); err != nil {
			writeJSON(w, http.StatusServiceUnavailable, map[string]string{"status": "unavailable"})
			return
		}
		writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
	}
}

func coursesHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
		defer cancel()

		courses, err := listPublishedCourses(ctx, db)
		if err != nil {
			log.Printf("list courses: %v", err)
			writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Unable to load courses"})
			return
		}
		writeJSON(w, http.StatusOK, map[string][]course{"courses": courses})
	}
}

func listPublishedCourses(ctx context.Context, db *sql.DB) ([]course, error) {
	rows, err := db.QueryContext(ctx, `
		SELECT id, slug, title, description, "coverImage", level, price
		FROM "Course"
		WHERE "isPublished" = TRUE
		ORDER BY "createdAt" DESC
	`)
	if err != nil {
		return nil, err
	}

	courses := make([]course, 0)
	courseIndexes := make(map[string]int)
	courseIDs := make([]string, 0)
	for rows.Next() {
		var item course
		var description, coverImage, level sql.NullString
		var price sql.NullFloat64
		if err := rows.Scan(&item.ID, &item.Slug, &item.Title, &description, &coverImage, &level, &price); err != nil {
			rows.Close()
			return nil, err
		}
		item.Description = nullStringPointer(description)
		item.CoverImage = nullStringPointer(coverImage)
		item.Level = nullStringPointer(level)
		item.Price = nullFloatPointer(price)
		item.Modules = make([]module, 0)
		courseIndexes[item.ID] = len(courses)
		courseIDs = append(courseIDs, item.ID)
		courses = append(courses, item)
	}
	if err := rows.Err(); err != nil {
		rows.Close()
		return nil, err
	}
	if err := rows.Close(); err != nil {
		return nil, err
	}
	if len(courseIDs) == 0 {
		return courses, nil
	}

	moduleRows, err := db.QueryContext(ctx, `
		SELECT id, "courseId", title, "order"
		FROM "Module"
		WHERE "courseId" = ANY($1)
		ORDER BY "order"
	`, courseIDs)
	if err != nil {
		return nil, err
	}
	moduleIndexes := make(map[string]moduleLocation)
	moduleIDs := make([]string, 0)
	for moduleRows.Next() {
		var item module
		var courseID string
		if err := moduleRows.Scan(&item.ID, &courseID, &item.Title, &item.Order); err != nil {
			moduleRows.Close()
			return nil, err
		}
		item.Lessons = make([]lesson, 0)
		courseIndex := courseIndexes[courseID]
		moduleIndex := len(courses[courseIndex].Modules)
		moduleIndexes[item.ID] = moduleLocation{courseIndex: courseIndex, moduleIndex: moduleIndex}
		moduleIDs = append(moduleIDs, item.ID)
		courses[courseIndex].Modules = append(courses[courseIndex].Modules, item)
	}
	if err := moduleRows.Err(); err != nil {
		moduleRows.Close()
		return nil, err
	}
	if err := moduleRows.Close(); err != nil {
		return nil, err
	}
	if len(moduleIDs) == 0 {
		return courses, nil
	}

	lessonRows, err := db.QueryContext(ctx, `
		SELECT id, "moduleId", title, "order", "videoUrl"
		FROM "Lesson"
		WHERE "moduleId" = ANY($1)
		ORDER BY "order"
	`, moduleIDs)
	if err != nil {
		return nil, err
	}
	defer lessonRows.Close()
	for lessonRows.Next() {
		var item lesson
		var moduleID string
		var videoURL sql.NullString
		if err := lessonRows.Scan(&item.ID, &moduleID, &item.Title, &item.Order, &videoURL); err != nil {
			return nil, err
		}
		item.VideoURL = nullStringPointer(videoURL)
		location := moduleIndexes[moduleID]
		courses[location.courseIndex].Modules[location.moduleIndex].Lessons = append(
			courses[location.courseIndex].Modules[location.moduleIndex].Lessons,
			item,
		)
	}
	if err := lessonRows.Err(); err != nil {
		return nil, err
	}

	return courses, nil
}

func nullStringPointer(value sql.NullString) *string {
	if !value.Valid {
		return nil
	}
	return &value.String
}

func nullFloatPointer(value sql.NullFloat64) *float64 {
	if !value.Valid {
		return nil
	}
	return &value.Float64
}

func writeJSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(value); err != nil {
		log.Printf("write JSON response: %v", err)
	}
}
