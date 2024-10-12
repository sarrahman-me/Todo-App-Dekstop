use std::sync::{Arc, Mutex};

use directories::ProjectDirs;
use rusqlite::{params, Connection};
use serde::Serialize;

struct AppState {
    conn: Arc<Mutex<Connection>>,
}

#[derive(Serialize)]
struct Todo {
    id: i32,
    task: String,
    completed: bool,
}

fn get_db_path() -> String {
    let project_dirs =
        ProjectDirs::from("com", "sarrahman", "todoApp").expect("Unable to get project dirs");
    let data_dir = project_dirs.data_dir();
    std::fs::create_dir_all(data_dir).expect("Failed to create directory");
    let db_path = data_dir.join("todo_app.db");
    println!("Database path {:?}", db_path);
    db_path.to_str().unwrap().to_string()
}

fn initialize_database(conn: &Connection) -> Result<(), String> {
    conn.execute(
        "CREATE TABLE IF NOT EXISTS todo (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            task TEXT NOT NULL,
            completed BOOLEAN NOT NULL DEFAULT 0
    )",
        [],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
fn add_todo(task: String, state: tauri::State<AppState>) -> Result<(), String> {
    let conn = state.conn.lock().unwrap();

    conn.execute("INSERT INTO todo (task) VALUES (?1)", params![task])
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
fn get_todos(query: Option<String>, state: tauri::State<AppState>) -> Result<Vec<Todo>, String> {
    let conn = state.conn.lock().unwrap();

    let (sql, params) = match query {
        Some(ref q) => (
            "SELECT id, task, completed FROM todo WHERE task LIKE ?",
            params!["%{}%".replace("{}", q)],
        ),
        None => ("SELECT id, task, completed FROM todo", params![]),
    };

    let mut stmt = conn.prepare(sql).map_err(|e| e.to_string())?;

    let todo_iter = stmt
        .query_map(params, |row| {
            Ok(Todo {
                id: row.get(0)?,
                task: row.get(1)?,
                completed: row.get(2)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut todos = Vec::new();

    for todo in todo_iter {
        todos.push(todo.map_err(|e| e.to_string())?);
    }

    Ok(todos)
}

#[tauri::command]
fn mark_as_complete(id: i32, state: tauri::State<AppState>) -> Result<(), String> {
    let conn = state.conn.lock().unwrap();

    conn.execute(
        "UPDATE todo SET completed = CASE WHEN completed = 0 THEN 1 ELSE 0 END WHERE id = ?1",
        params![id],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
fn delete_task(id: i32, state: tauri::State<AppState>) -> Result<(), String> {
    let conn = state.conn.lock().unwrap();

    conn.execute("DELETE FROM todo WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let db_path = get_db_path();
    let conn = Connection::open(db_path).expect("Failed to open database");
    initialize_database(&conn).unwrap();

    let app_state = AppState {
        conn: Arc::new(Mutex::new(conn)),
    };

    tauri::Builder::default()
        .manage(app_state)
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            add_todo,
            get_todos,
            mark_as_complete,
            delete_task
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
