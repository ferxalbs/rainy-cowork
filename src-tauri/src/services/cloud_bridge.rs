use crate::services::atm_client::ATMClient;
use serde::Serialize;
use std::sync::Arc;
use std::time::Duration;
use tauri::{AppHandle, Emitter};
use tokio::sync::Mutex;
use tokio::time::sleep;

#[derive(Clone)]
pub struct CloudBridge {
    atm_client: Arc<ATMClient>,
    app_handle: AppHandle,
    is_connected: Arc<Mutex<bool>>,
    is_stopped: Arc<Mutex<bool>>,
}

#[derive(Serialize, Clone)]
struct CloudConnectionStatus {
    connected: bool,
    mode: String,
    message: String,
}

impl CloudBridge {
    pub fn new(atm_client: Arc<ATMClient>, app_handle: AppHandle) -> Self {
        Self {
            atm_client,
            app_handle,
            is_connected: Arc::new(Mutex::new(false)),
            is_stopped: Arc::new(Mutex::new(false)),
        }
    }

    /// Stop the bridge loop. Next iteration will break and emit disconnected status.
    pub async fn stop(&self) {
        *self.is_stopped.lock().await = true;
        *self.is_connected.lock().await = false;
    }

    /// @RESERVED Restart the bridge loop after a stop (e.g. after new credentials are set).
    /// Will be used when reconnect flow is implemented.
    #[allow(dead_code)]
    pub async fn restart(&self) {
        *self.is_stopped.lock().await = false;
        self.start();
    }

    pub fn start(&self) {
        let bridge = self.clone();
        tokio::spawn(async move {
            bridge.run_loop().await;
        });
    }

    async fn run_loop(&self) {
        loop {
            // Check stop flag first
            if *self.is_stopped.lock().await {
                *self.is_connected.lock().await = false;
                let _ = self.app_handle.emit(
                    "cloud:connection-status",
                    CloudConnectionStatus {
                        connected: false,
                        mode: "http_poll".to_string(),
                        message: "Bridge stopped".to_string(),
                    },
                );
                println!("[CloudBridge] Stopped.");
                return;
            }

            // Wait for credentials first.
            if !self.atm_client.has_credentials().await {
                *self.is_connected.lock().await = false;
                let _ = self.app_handle.emit(
                    "cloud:connection-status",
                    CloudConnectionStatus {
                        connected: false,
                        mode: "http_poll".to_string(),
                        message: "Waiting for Rainy-ATM credentials".to_string(),
                    },
                );
                sleep(Duration::from_secs(5)).await;
                continue;
            }

            // Rainy-ATM currently provides authenticated HTTP APIs for desktop bridge.
            // Keep an active authenticated probe instead of attempting unsupported websocket sessions.
            match self.atm_client.verify_authenticated_connection().await {
                Ok(_) => {
                    *self.is_connected.lock().await = true;
                    let _ = self.app_handle.emit(
                        "cloud:connection-status",
                        CloudConnectionStatus {
                            connected: true,
                            mode: "http_poll".to_string(),
                            message: "Connected to Rainy-ATM".to_string(),
                        },
                    );
                    sleep(Duration::from_secs(30)).await;
                }
                Err(e) => {
                    *self.is_connected.lock().await = false;
                    let _ = self.app_handle.emit(
                        "cloud:connection-status",
                        CloudConnectionStatus {
                            connected: false,
                            mode: "http_poll".to_string(),
                            message: e.clone(),
                        },
                    );
                    eprintln!(
                        "[CloudBridge] Connection check failed: {}. Retrying in 10s...",
                        e
                    );
                    sleep(Duration::from_secs(10)).await;
                }
            }
        }
    }
}
