use bazcut_core::ProjectStore;
use serde_json::Value;
use std::sync::Mutex;
use tauri::{Manager, State};
type Store = Mutex<ProjectStore>;
#[tauri::command]
fn validate_project(project: Value) -> Result<(), String> {
    bazcut_core::validate_project(&project)
}
#[tauri::command]
fn save_project(
    store: State<Store>,
    project: Value,
    expected_revision: Option<u64>,
    label: Option<String>,
    history: Option<Value>,
) -> Result<(), String> {
    store.lock().map_err(|_| "Storage lock unavailable")?.save_with_history(
        &project,
        expected_revision,
        label.as_deref(),
        history.as_ref(),
    )
}
#[tauri::command]
fn load_history(store: State<Store>, id: String) -> Result<Option<Value>, String> {
    store.lock().map_err(|_| "Storage lock unavailable")?.history(&id)
}
#[tauri::command]
fn list_projects(store: State<Store>) -> Result<Vec<Value>, String> {
    store.lock().map_err(|_| "Storage lock unavailable")?.list()
}
#[tauri::command]
fn list_versions(store: State<Store>, id: String) -> Result<Vec<Value>, String> {
    store
        .lock()
        .map_err(|_| "Storage lock unavailable")?
        .versions(&id)
}
#[tauri::command]
fn begin_media(store: State<Store>, id: String) -> Result<(), String> {
    store
        .lock()
        .map_err(|_| "Storage lock unavailable")?
        .begin(&id)
}
#[tauri::command]
fn append_media(store: State<Store>, id: String, offset: u64, data: Vec<u8>) -> Result<(), String> {
    store
        .lock()
        .map_err(|_| "Storage lock unavailable")?
        .append(&id, offset, &data)
}
#[tauri::command]
fn finish_media(store: State<Store>, id: String, hash: String, size: u64) -> Result<(), String> {
    store
        .lock()
        .map_err(|_| "Storage lock unavailable")?
        .finish(&id, &hash, size)
}
#[tauri::command]
fn cancel_media(store: State<Store>, id: String) -> Result<(), String> {
    store
        .lock()
        .map_err(|_| "Storage lock unavailable")?
        .cancel(&id)
}
#[tauri::command]
fn media_path(store: State<Store>, id: String) -> Result<Option<String>, String> {
    store
        .lock()
        .map_err(|_| "Storage lock unavailable")?
        .media_path(&id)
}
#[tauri::command]
fn discard_export(store: State<Store>, id: String) -> Result<(), String> {
    store.lock().map_err(|_| "Storage lock unavailable")?.discard_export(&id)
}
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default().plugin(tauri_plugin_bazcut_share::init());
    #[cfg(desktop)]
    let builder = builder.plugin(tauri_plugin_dialog::init());
    builder
        .setup(|app| {
            let root = app.path().app_data_dir()?;
            let store = ProjectStore::open(&root).map_err(std::io::Error::other)?;
            app.manage(Mutex::new(store));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            validate_project,
            save_project,
            list_projects,
            load_history,
            list_versions,
            begin_media,
            append_media,
            finish_media,
            cancel_media,
            media_path,
            discard_export
        ])
        .run(tauri::generate_context!())
        .expect("BazCut could not start");
}
