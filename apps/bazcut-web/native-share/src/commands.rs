use crate::{BazcutShareExt, Result, models::*};
use tauri::{AppHandle, Runtime, command};
#[command]
pub(crate) async fn share<R: Runtime>(
    app: AppHandle<R>,
    payload: ShareRequest,
) -> Result<ShareResponse> {
    app.bazcut_share().share(payload)
}
