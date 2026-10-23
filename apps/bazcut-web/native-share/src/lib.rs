use tauri::{
    Manager, Runtime,
    plugin::{Builder, TauriPlugin},
};

pub use models::*;

#[cfg(desktop)]
mod desktop;
#[cfg(mobile)]
mod mobile;

mod commands;
mod error;
mod models;

pub use error::{Error, Result};

#[cfg(desktop)]
use desktop::BazcutShare;
#[cfg(mobile)]
use mobile::BazcutShare;

/// Extensions to [`tauri::App`], [`tauri::AppHandle`] and [`tauri::Window`] to access the bazcut-share APIs.
pub trait BazcutShareExt<R: Runtime> {
    fn bazcut_share(&self) -> &BazcutShare<R>;
}

impl<R: Runtime, T: Manager<R>> crate::BazcutShareExt<R> for T {
    fn bazcut_share(&self) -> &BazcutShare<R> {
        self.state::<BazcutShare<R>>().inner()
    }
}

/// Initializes the plugin.
pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("bazcut-share")
        .invoke_handler(tauri::generate_handler![commands::share])
        .setup(|app, api| {
            #[cfg(mobile)]
            let bazcut_share = mobile::init(app, api)?;
            #[cfg(desktop)]
            let bazcut_share = desktop::init(app, api)?;
            app.manage(bazcut_share);
            Ok(())
        })
        .build()
}

pub(crate) fn validate(p: &models::ShareRequest) -> Result<()> {
    if !p.id.starts_with("export-")
        || !p.id.bytes().all(|b| b.is_ascii_alphanumeric() || b == b'-')
        || p.id.len() > 80
        || p.name.is_empty()
        || p.name.len() > 240
        || p.name
            .chars()
            .any(|c| c.is_control() || "<>:\"/\\|?*".contains(c))
        || p.name == "."
        || p.name == ".."
    {
        return Err(std::io::Error::new(
            std::io::ErrorKind::InvalidInput,
            "Invalid export identity",
        )
        .into());
    }
    Ok(())
}
