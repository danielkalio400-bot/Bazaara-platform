use crate::models::*;
use serde::de::DeserializeOwned;
use tauri::{AppHandle, Manager, Runtime, plugin::PluginApi};
use tauri_plugin_dialog::DialogExt;
pub fn init<R: Runtime, C: DeserializeOwned>(
    app: &AppHandle<R>,
    _api: PluginApi<R, C>,
) -> crate::Result<BazcutShare<R>> {
    Ok(BazcutShare(app.clone()))
}
pub struct BazcutShare<R: Runtime>(AppHandle<R>);
impl<R: Runtime> BazcutShare<R> {
    pub fn share(&self, payload: ShareRequest) -> crate::Result<ShareResponse> {
        crate::validate(&payload)?;
        let source = self
            .0
            .path()
            .app_data_dir()
            .map_err(|e| std::io::Error::other(e.to_string()))?
            .join("exports")
            .join(&payload.id);
        let choice = self
            .0
            .dialog()
            .file()
            .set_file_name(&payload.name)
            .blocking_save_file();
        let Some(choice) = choice else {
            return Ok(ShareResponse {
                saved: false,
                path: None,
            });
        };
        let destination = choice
            .into_path()
            .map_err(|e| std::io::Error::other(e.to_string()))?;
        std::fs::copy(source, &destination)?;
        Ok(ShareResponse {
            saved: true,
            path: Some(destination.to_string_lossy().to_string()),
        })
    }
}
