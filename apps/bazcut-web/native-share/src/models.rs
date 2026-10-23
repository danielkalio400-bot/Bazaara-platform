use serde::{Deserialize, Serialize};
#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ShareRequest {
    pub id: String,
    pub name: String,
    pub mime: String,
}
#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ShareResponse {
    pub saved: bool,
    pub path: Option<String>,
}
