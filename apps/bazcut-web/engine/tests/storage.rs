use bazcut_core::{frame_ticks, rescale, validate_project, ProjectStore, TIMEBASE};
use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use std::{
    fs,
    path::PathBuf,
    time::{SystemTime, UNIX_EPOCH},
};
fn fixture() -> Value {
    serde_json::from_str(include_str!("project.json")).unwrap()
}
fn root() -> PathBuf {
    std::env::temp_dir().join(format!(
        "bazcut-test-{}-{}",
        std::process::id(),
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_nanos()
    ))
}
#[test]
fn rational_time_is_exact() {
    assert_eq!(frame_ticks(30000, 1001).unwrap(), 1_177_176);
    assert_eq!(TIMEBASE % 44100, 0);
    assert_eq!(TIMEBASE % 48000, 0);
    assert_eq!(rescale(48000, 1, 48000, 1, 44100).unwrap(), 44100);
    assert!(frame_ticks(0, 1).is_err());
    assert!(frame_ticks(239, 1).is_err());
}
#[test]
fn malformed_and_future_documents_are_rejected() {
    let mut p = fixture();
    validate_project(&p).unwrap();
    p["schemaVersion"] = json!(3);
    assert!(validate_project(&p).is_err());
    p = fixture();
    p["width"] = json!(999999);
    assert!(validate_project(&p).is_err());
    p = fixture();
    p["clips"][0]["trackId"] = json!("missing");
    assert!(validate_project(&p).is_err());
}
#[test]
fn transaction_conflicts_and_named_revisions_survive_reopen() {
    let dir = root();
    let mut p = fixture();
    {
        let mut db = ProjectStore::open(&dir).unwrap();
        db.save(&p, None, Some("First cut")).unwrap();
        p["revision"] = json!(1);
        p["name"] = json!("Second cut");
        db.save(&p, Some(0), None).unwrap();
        assert!(db
            .save(&p, Some(0), None)
            .unwrap_err()
            .starts_with("SAVE_CONFLICT"));
    }
    let db = ProjectStore::open(&dir).unwrap();
    assert_eq!(db.list().unwrap()[0]["name"], "Second cut");
    assert_eq!(
        db.versions("fixture").unwrap()[0]["project"]["name"],
        "Native fixture"
    );
    drop(db);
    fs::remove_dir_all(dir).unwrap();
}
#[test]
fn corrupt_media_never_becomes_available() {
    let dir = root();
    let db = ProjectStore::open(&dir).unwrap();
    db.begin("source").unwrap();
    db.append("source", 0, b"original").unwrap();
    assert!(db.finish("source", "wrong", 8).is_err());
    assert!(db.media_path("source").unwrap().is_none());
    assert!(db.append("source", 0, b"x").is_err());
    db.cancel("source").unwrap();
    assert!(db.media_path("source").unwrap().is_none());
    drop(db);
    fs::remove_dir_all(dir).unwrap();
}
#[test]
fn media_integrity_and_path_isolation() {
    let dir = root();
    let db = ProjectStore::open(&dir).unwrap();
    assert!(db.begin("../escape").is_err());
    assert!(db.media_path("/etc/passwd").is_err());
    db.begin("source").unwrap();
    db.append("source", 0, b"original").unwrap();
    let hash = format!("{:x}", Sha256::digest(b"original"));
    db.finish("source", &hash, 8).unwrap();
    let path = db.media_path("source").unwrap().unwrap();
    assert_eq!(fs::read(path).unwrap(), b"original");
    assert!(db.begin("source").is_err());
    db.cancel("source").unwrap();
    assert!(db.media_path("source").unwrap().is_some());
    drop(db);
    fs::remove_dir_all(dir).unwrap();
}
#[test]
fn unknown_effect_metadata_roundtrips_without_loss() {
    let dir = root();
    let mut p = fixture();
    p["clips"][0]["extensions"] = json!({"unsupported":{"depth":27,"native":"preserved"}});
    let mut db = ProjectStore::open(&dir).unwrap();
    db.save(&p, None, None).unwrap();
    assert_eq!(db.list().unwrap()[0], p);
    drop(db);
    fs::remove_dir_all(dir).unwrap();
}

#[test]
fn graph_and_recovery_history_commit_atomically() {
    let dir = root();
    let initial = fixture();
    let mut p = initial.clone();
    p["revision"] = json!(1);
    let history = json!({"format":1,"projectId":p["id"],"revision":1,"past":[initial],"future":[]});
    {
        let mut db = ProjectStore::open(&dir).unwrap();
        db.save_with_history(&p, None, Some("Recovered cut"), Some(&history)).unwrap();
        let mut invalid = history.clone();
        invalid["past"][0]["id"] = json!("another-project");
        assert!(db.save_with_history(&p, Some(1), None, Some(&invalid)).is_err());
        assert!(db.save_with_history(&p, Some(0), None, Some(&history)).is_err());
    }
    let mut db = ProjectStore::open(&dir).unwrap();
    assert_eq!(db.list().unwrap()[0], p);
    assert_eq!(db.history("fixture").unwrap().unwrap(), history);
    assert_eq!(db.versions("fixture").unwrap().len(), 1);
    p["revision"] = json!(2);
    db.save(&p, Some(1), None).unwrap();
    assert!(db.history("fixture").unwrap().is_none());
    assert_eq!(db.versions("fixture").unwrap()[0]["project"]["revision"], 1);
    drop(db);
    fs::remove_dir_all(dir).unwrap();
}
