mod motion;
use rusqlite::{params, Connection, OptionalExtension, TransactionBehavior};
use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use std::{
    collections::HashSet,
    fs::{self, OpenOptions},
    io::{Read, Write},
    path::{Path, PathBuf},
};

pub const TIMEBASE: u64 = 35_280_000;
const MAX_SAFE: u64 = 9_007_199_254_740_991;
pub type Result<T> = std::result::Result<T, String>;
fn text<'a>(v: &'a Value, key: &str) -> Result<&'a str> {
    v[key].as_str().ok_or_else(|| format!("Invalid {key}"))
}
fn number(v: &Value, key: &str) -> Result<u64> {
    v[key]
        .as_u64()
        .filter(|n| *n <= MAX_SAFE)
        .ok_or_else(|| format!("Invalid {key}"))
}
fn array<'a>(v: &'a Value, key: &str) -> Result<&'a Vec<Value>> {
    v[key].as_array().ok_or_else(|| format!("Missing {key}"))
}
fn error(e: impl std::fmt::Display) -> String {
    e.to_string()
}
pub fn valid_id(id: &str) -> bool {
    !id.is_empty() && id.len() <= 80 && id.bytes().all(|b| b.is_ascii_alphanumeric() || b == b'-')
}
pub fn frame_ticks(num: u64, den: u64) -> Result<u64> {
    if num == 0 || den == 0 || num > 240 * den {
        return Err("Unsupported frame rate".into());
    }
    let n = TIMEBASE.checked_mul(den).ok_or("Frame rate overflow")?;
    if n % num != 0 {
        return Err("Frame rate is not exactly representable".into());
    }
    Ok(n / num)
}
pub fn rescale(value: i64, from_num: i64, from_den: i64, to_num: i64, to_den: i64) -> Result<i64> {
    if from_num <= 0 || from_den <= 0 || to_num <= 0 || to_den <= 0 {
        return Err("Invalid rational timebase".into());
    }
    let n = i128::from(value)
        .checked_mul(from_num.into())
        .and_then(|n| n.checked_mul(to_den.into()))
        .ok_or("Time overflow")?;
    let d = i128::from(from_den) * i128::from(to_num);
    i64::try_from((n + n.signum() * d / 2) / d).map_err(error)
}
pub fn validate_project(p: &Value) -> Result<()> {
    if number(p, "schemaVersion")? != 2 {
        return Err("Unsupported project schema; original preserved".into());
    }
    if !valid_id(text(p, "id")?) || text(p, "name")?.len() > 800 {
        return Err("Invalid project identity".into());
    }
    number(p, "revision")?;
    if number(p, "timebase")? != TIMEBASE {
        return Err("Invalid timebase".into());
    }
    let frame = frame_ticks(number(&p["fps"], "num")?, number(&p["fps"], "den")?)?;
    for key in ["width", "height"] {
        let n = number(p, key)?;
        if !(16..=8192).contains(&n) || n % 2 != 0 {
            return Err(format!("Invalid canvas {key}"));
        }
    }
    if text(p, "colorSpace")? != "srgb" || ![44100, 48000].contains(&number(p, "sampleRate")?) {
        return Err("Unsupported color/audio policy".into());
    }
    for key in [
        "tracks", "assets", "clips", "captions", "markers", "comments",
    ] {
        let mut ids = HashSet::new();
        for x in array(p, key)? {
            let id = text(x, "id")?;
            if !valid_id(id) || !ids.insert(id) {
                return Err(format!("Duplicate or invalid {key} ID"));
            }
        }
    }
    let tracks = array(p, "tracks")?;
    let assets = array(p, "assets")?;
    for t in tracks {
        if !["visual", "audio"].contains(&text(t, "kind")?) {
            return Err("Invalid track kind".into());
        }
    }
    for a in assets {
        if text(a, "id")?.starts_with("export-") {
            return Err(
                "Temporary exports cannot be project originals; import the rendered file first"
                    .into(),
            );
        }
        if number(a, "duration")? == 0 || !["video", "audio", "image"].contains(&text(a, "kind")?) {
            return Err("Invalid asset".into());
        }
    }
    for c in array(p, "clips")? {
        if !tracks.iter().any(|t| t["id"] == c["trackId"]) {
            return Err("Missing track".into());
        }
        let start = number(c, "start")?;
        let duration = number(c, "duration")?;
        let source = number(c, "sourceIn")?;
        if duration == 0
            || start
                .checked_add(duration)
                .filter(|v| *v <= MAX_SAFE)
                .is_none()
        {
            return Err("Invalid clip range".into());
        }
        let num = number(&c["speed"], "num")?;
        let den = number(&c["speed"], "den")?;
        if num == 0
            || den == 0
            || (num as f64 / den as f64) < 0.1
            || (num as f64 / den as f64) > 16.0
        {
            return Err("Invalid speed".into());
        }
        if let Some(id) = c["assetId"].as_str() {
            let a = assets
                .iter()
                .find(|a| a["id"] == id)
                .ok_or("Missing source manifest")?;
            let extent = if c["freeze"] == true {
                1
            } else {
                ((duration as u128 * num as u128 + den as u128 / 2) / den as u128) as u64
            };
            if a["kind"] != "image"
                && c["extensions"].get(motion::TIME_MAP).is_none()
                && source.checked_add(extent).ok_or("Source overflow")?
                    > number(a, "duration")? + frame
            {
                return Err("Trim exceeds source".into());
            }
        } else if !["text", "shape"].contains(&text(c, "kind")?) {
            return Err("Media source required".into());
        }
        for (key, low, high) in [
            ("scale", 0.0001, 20.0),
            ("opacity", 0.0, 1.0),
            ("volume", 0.0, 4.0),
            ("pan", -1.0, 1.0),
            ("blur", 0.0, 100.0),
        ] {
            let n = c[key]
                .as_f64()
                .filter(|n| n.is_finite())
                .ok_or("Invalid clip property")?;
            if n < low || n > high {
                return Err(format!("Property out of bounds: {key}"));
            }
        }
        for k in array(c, "keyframes")? {
            number(k, "at")?;
            if !["x", "y", "scale", "rotation", "opacity", "volume"].contains(&text(k, "property")?)
                || k["value"].as_f64().filter(|n| n.is_finite()).is_none()
            {
                return Err("Invalid keyframe".into());
            }
        }
    }
    for c in array(p, "captions")? {
        if number(c, "end")? <= number(c, "start")? {
            return Err("Invalid caption timing".into());
        }
        text(c, "text")?;
    }
    motion::validate_motion(p)?;
    Ok(())
}

/// SQLite transactions own committed revisions. Optimistic checks prevent lost updates.
/// Named versions remain immutable. Original media is never deleted by a project edit.
pub struct ProjectStore {
    conn: Connection,
    media: PathBuf,
    exports: PathBuf,
}
impl ProjectStore {
    pub fn open(root: &Path) -> Result<Self> {
        fs::create_dir_all(root).map_err(error)?;
        let media = root.join("media");
        fs::create_dir_all(&media).map_err(error)?;
        let exports = root.join("exports");
        fs::create_dir_all(&exports).map_err(error)?;
        let conn = Connection::open(root.join("bazcut.sqlite3")).map_err(error)?;
        conn.busy_timeout(std::time::Duration::from_secs(5))
            .map_err(error)?;
        conn.execute_batch("PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; PRAGMA foreign_keys=ON; CREATE TABLE IF NOT EXISTS projects(id TEXT PRIMARY KEY, revision INTEGER NOT NULL, document TEXT NOT NULL); CREATE TABLE IF NOT EXISTS versions(id INTEGER PRIMARY KEY, project_id TEXT NOT NULL, revision INTEGER NOT NULL, label TEXT NOT NULL, document TEXT NOT NULL); CREATE TABLE IF NOT EXISTS journals(project_id TEXT PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE, document TEXT NOT NULL);").map_err(error)?;
        Ok(Self {
            conn,
            media,
            exports,
        })
    }
    pub fn save(&mut self, p: &Value, expected: Option<u64>, label: Option<&str>) -> Result<()> {
        self.save_with_history(p, expected, label, None)
    }
    pub fn save_with_history(
        &mut self,
        p: &Value,
        expected: Option<u64>,
        label: Option<&str>,
        history: Option<&Value>,
    ) -> Result<()> {
        validate_project(p)?;
        if let Some(h) = history {
            if h["format"] != 1
                || h["projectId"] != p["id"]
                || h["revision"] != p["revision"]
                || serde_json::to_vec(h).map_err(error)?.len() > 8 * 1024 * 1024
            {
                return Err("Recovery journal does not match the saved project".into());
            }
            for key in ["past", "future"] {
                let snapshots = array(h, key)?;
                if snapshots.len() > 100 {
                    return Err("Recovery journal too long".into());
                }
                for snapshot in snapshots {
                    validate_project(snapshot)?;
                    if snapshot["id"] != p["id"] {
                        return Err("Recovery journal contains another project".into());
                    }
                }
            }
        }
        let id = text(p, "id")?;
        let revision = number(p, "revision")? as i64;
        let data = serde_json::to_string(p).map_err(error)?;
        if data.len() > 20 * 1024 * 1024 {
            return Err("Project exceeds metadata size limit".into());
        }
        let tx = self
            .conn
            .transaction_with_behavior(TransactionBehavior::Immediate)
            .map_err(error)?;
        let current: Option<i64> = tx
            .query_row("SELECT revision FROM projects WHERE id=?1", [id], |row| {
                row.get(0)
            })
            .optional()
            .map_err(error)?;
        if current != expected.map(|v| v as i64) {
            return Err("SAVE_CONFLICT: Another window saved this project. Export current edits before reloading.".into());
        }
        if current.is_some_and(|n| revision < n) {
            return Err("Revision must not move backwards".into());
        }
        tx.execute("INSERT INTO projects(id,revision,document) VALUES(?1,?2,?3) ON CONFLICT(id) DO UPDATE SET revision=excluded.revision,document=excluded.document",params![id,revision,data]).map_err(error)?;
        if let Some(h) = history {
            tx.execute("INSERT INTO journals(project_id,document) VALUES(?1,?2) ON CONFLICT(project_id) DO UPDATE SET document=excluded.document", params![id, serde_json::to_string(h).map_err(error)?]).map_err(error)?;
        } else {
            tx.execute("DELETE FROM journals WHERE project_id=?1", [id])
                .map_err(error)?;
        }
        if let Some(label) = label {
            if label.len() > 300 {
                return Err("Version label too long".into());
            }
            tx.execute(
                "INSERT INTO versions(project_id,revision,label,document) VALUES(?1,?2,?3,?4)",
                params![id, revision, label, data],
            )
            .map_err(error)?;
        }
        tx.commit().map_err(error)
    }
    pub fn history(&self, id: &str) -> Result<Option<Value>> {
        let value: Option<String> = self
            .conn
            .query_row(
                "SELECT document FROM journals WHERE project_id=?1",
                [id],
                |r| r.get(0),
            )
            .optional()
            .map_err(error)?;
        value
            .map(|v| serde_json::from_str(&v).map_err(error))
            .transpose()
    }
    pub fn list(&self) -> Result<Vec<Value>> {
        let mut s = self
            .conn
            .prepare("SELECT document FROM projects ORDER BY rowid DESC")
            .map_err(error)?;
        let rows = s.query_map([], |r| r.get::<_, String>(0)).map_err(error)?;
        rows.map(|r| serde_json::from_str(&r.map_err(error)?).map_err(error))
            .collect()
    }
    pub fn versions(&self, id: &str) -> Result<Vec<Value>> {
        let mut s=self.conn.prepare("SELECT label,document FROM versions WHERE project_id=?1 ORDER BY revision DESC,id DESC").map_err(error)?;
        let rows = s
            .query_map([id], |r| {
                Ok((r.get::<_, String>(0)?, r.get::<_, String>(1)?))
            })
            .map_err(error)?;
        rows.map(|r| {
            let (label, data) = r.map_err(error)?;
            let project: Value = serde_json::from_str(&data).map_err(error)?;
            Ok(json!({"label":label,"project":project}))
        })
        .collect()
    }
    fn path(&self, id: &str, partial: bool) -> Result<PathBuf> {
        if !valid_id(id) {
            return Err("Invalid media ID".into());
        }
        let directory = if id.starts_with("export-") {
            &self.exports
        } else {
            &self.media
        };
        Ok(directory.join(if partial {
            format!("{id}.part")
        } else {
            id.to_string()
        }))
    }
    pub fn begin(&self, id: &str) -> Result<()> {
        if self.path(id, false)?.exists() {
            return Err("Original already exists".into());
        }
        OpenOptions::new()
            .create(true)
            .truncate(true)
            .write(true)
            .open(self.path(id, true)?)
            .map_err(error)?;
        Ok(())
    }
    pub fn append(&self, id: &str, offset: u64, data: &[u8]) -> Result<()> {
        if data.len() > 1024 * 1024 {
            return Err("Chunk exceeds 1 MiB".into());
        }
        let path = self.path(id, true)?;
        let mut file = OpenOptions::new().append(true).open(path).map_err(error)?;
        if file.metadata().map_err(error)?.len() != offset {
            return Err("Unexpected chunk offset".into());
        }
        file.write_all(data).map_err(error)
    }
    pub fn finish(&self, id: &str, hash: &str, size: u64) -> Result<()> {
        let part = self.path(id, true)?;
        // FlushFileBuffers on Windows requires a write-capable handle.
        let mut f = OpenOptions::new()
            .read(true)
            .write(true)
            .open(&part)
            .map_err(error)?;
        if f.metadata().map_err(error)?.len() != size {
            return Err("Media size mismatch".into());
        }
        let mut hasher = Sha256::new();
        let mut buf = [0u8; 64 * 1024];
        loop {
            let n = f.read(&mut buf).map_err(error)?;
            if n == 0 {
                break;
            }
            hasher.update(&buf[..n]);
        }
        if format!("{:x}", hasher.finalize()) != hash {
            return Err("Original checksum mismatch".into());
        }
        f.sync_all().map_err(error)?;
        drop(f);
        let dest = self.path(id, false)?;
        if dest.exists() {
            return Err("Original already exists".into());
        }
        fs::rename(part, dest).map_err(error)?;
        Ok(())
    }
    pub fn cancel(&self, id: &str) -> Result<()> {
        let p = self.path(id, true)?;
        if p.exists() {
            fs::remove_file(p).map_err(error)?;
        }
        Ok(())
    }
    pub fn media_path(&self, id: &str) -> Result<Option<String>> {
        let p = self.path(id, false)?;
        Ok(p.exists().then(|| p.to_string_lossy().into_owned()))
    }
    pub fn discard_export(&self, id: &str) -> Result<()> {
        if !id.starts_with("export-") || id.len() <= 7 || !valid_id(id) {
            return Err("Only temporary exports can be discarded".into());
        }
        for partial in [true, false] {
            match fs::remove_file(self.path(id, partial)?) {
                Ok(()) => {}
                Err(error) if error.kind() == std::io::ErrorKind::NotFound => {}
                Err(failure) => return Err(error(failure)),
            }
        }
        Ok(())
    }
}
