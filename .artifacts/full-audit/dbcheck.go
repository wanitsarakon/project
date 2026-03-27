package main
import (
  "database/sql"
  "fmt"
  _ "github.com/lib/pq"
)
func main() {
 db, err := sql.Open("postgres", "postgres://postgres:1111@localhost:5432/thai_festival?sslmode=disable")
 if err != nil { panic(err) }
 defer db.Close()
 var count int
 if err := db.QueryRow(`select count(*) from rooms where code='997020'`).Scan(&count); err != nil { panic(err) }
 fmt.Println("rooms", count)
 if err := db.QueryRow(`select count(*) from players p join rooms r on r.id=p.room_id where r.code='997020'`).Scan(&count); err != nil { panic(err) }
 fmt.Println("players", count)
}
