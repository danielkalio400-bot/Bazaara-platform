use serde::de::DeserializeOwned;
use tauri::{
    AppHandle, Manager, Runtime,
    plugin::{PluginApi, PluginHandle},
};

use crate::models::*;

#[cfg(target_os = "ios")]
tauri::ios_plugin_binding!(init_plugin_bazcut_share);

// initializes the Kotlin or Swift plugin classes
pub fn init<R: Runtime, C: DeserializeOwned>(
    app: &AppHandle<R>,
    api: PluginApi<R, C>,
) -> crate::Result<BazcutShare<R>> {
    #[cfg(target_os = "android")]
    let handle = api.register_android_plugin("app.bazaara.bazcut.share", "BazCutSharePlugin")?;
    #[cfg(target_os = "ios")]
    let handle = api.register_ios_plugin(init_plugin_bazcut_share)?;
    Ok(BazcutShare(handle, app.clone()))
}

/// Access to the bazcut-share APIs.
pub struct BazcutShare<R: Runtime>(PluginHandle<R>, AppHandle<R>);

impl<R: Runtime> BazcutShare<R> {
    pub fn share(&self, payload: ShareRequest) -> crate::Result<ShareResponse> {
        crate::validate(&payload)?;
        let path = self
            .1
            .path()
            .app_data_dir()
            .map_err(|e| std::io::Error::other(e.to_string()))?
            .join("exports")
            .join(&payload.id);
        let native = serde_json::json!({"id":payload.id,"name":payload.name,"mime":payload.mime,"path":path});
        self.0
            .run_mobile_plugin("share", native)
            .map_err(Into::into)
    }
}
