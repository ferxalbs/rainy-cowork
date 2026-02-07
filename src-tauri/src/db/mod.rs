use sqlx::sqlite::{SqlitePool, SqlitePoolOptions};
use std::fs;

use tauri::AppHandle;
use tauri::Manager;

pub struct Database {
    pub pool: SqlitePool,
}

impl Database {
    pub async fn init(app_handle: &AppHandle) -> Result<Self, Box<dyn std::error::Error>> {
        let app_dir = app_handle.path().app_data_dir()?;
        fs::create_dir_all(&app_dir)?;

        let db_path = app_dir.join("rainy_cowork_v2.db");
        let db_url = format!("sqlite://{}", db_path.to_string_lossy());

        if !db_path.exists() {
            fs::File::create(&db_path)?;
        }

        let pool = SqlitePoolOptions::new()
            .max_connections(5)
            .connect(&db_url)
            .await?;

        sqlx::migrate!("./migrations").run(&pool).await?;

        Ok(Self { pool })
    }
}
