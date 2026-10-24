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
fn matte_references_are_validated_and_persisted() {
    let mut p = fixture();
    let mut mask = p["clips"][0].clone();
    mask["id"] = json!("matte-source");
    p["clips"].as_array_mut().unwrap().push(mask);
    p["clips"][0]["extensions"] =
        json!({"bazcut.matte.v1":{"id":"matte-source","mode":"luma-inverted","hideSource":true}});
    let dir = root();
    let mut db = ProjectStore::open(&dir).unwrap();
    db.save(&p, None, None).unwrap();
    assert_eq!(db.list().unwrap()[0], p);
    p["clips"][1]["extensions"] =
        json!({"bazcut.matte.v1":{"id":p["clips"][0]["id"],"mode":"alpha","hideSource":true}});
    assert!(validate_project(&p).unwrap_err().contains("acyclic"));
    p["clips"][1]["extensions"] = json!({});
    p["clips"][0]["extensions"]["bazcut.matte.v1"]["id"] = json!("missing");
    assert!(validate_project(&p).unwrap_err().contains("matte source"));
    p["clips"][0]["extensions"]["bazcut.matte.v1"]["id"] = json!("matte-source");
    p["clips"][0]["extensions"]["bazcut.matte.v1"]["mode"] = json!("unsupported");
    assert!(validate_project(&p).is_err());
    drop(db);
    fs::remove_dir_all(dir).unwrap();
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
fn export_cleanup_is_isolated_from_original_media() {
    let dir = root();
    let db = ProjectStore::open(&dir).unwrap();
    let hash = format!("{:x}", Sha256::digest(b"original"));
    for id in ["source", "export-complete"] {
        db.begin(id).unwrap();
        db.append(id, 0, b"original").unwrap();
        db.finish(id, &hash, 8).unwrap();
    }
    let export_path = PathBuf::from(db.media_path("export-complete").unwrap().unwrap());
    assert_eq!(export_path.parent().unwrap(), dir.join("exports"));
    db.begin("export-partial").unwrap();
    db.append("export-partial", 0, b"partial").unwrap();
    assert!(db.discard_export("source").is_err());
    assert!(db.discard_export("export-../source").is_err());
    db.discard_export("export-complete").unwrap();
    db.discard_export("export-partial").unwrap();
    db.discard_export("export-complete").unwrap();
    assert!(db.media_path("export-complete").unwrap().is_none());
    assert!(fs::read_dir(dir.join("exports")).unwrap().next().is_none());
    assert_eq!(
        fs::read(db.media_path("source").unwrap().unwrap()).unwrap(),
        b"original"
    );
    let mut project = fixture();
    project["assets"] = json!([{"id":"export-complete"}]);
    assert!(validate_project(&project)
        .unwrap_err()
        .contains("Temporary exports"));
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
        db.save_with_history(&p, None, Some("Recovered cut"), Some(&history))
            .unwrap();
        let mut invalid = history.clone();
        invalid["past"][0]["id"] = json!("another-project");
        assert!(db
            .save_with_history(&p, Some(1), None, Some(&invalid))
            .is_err());
        assert!(db
            .save_with_history(&p, Some(0), None, Some(&history))
            .is_err());
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

#[test]
fn effect_and_parent_metadata_is_validated_before_save() {
    let mut p = fixture();
    p["clips"][0]["extensions"] = json!({"bazcut.effects.v1":[{"id":"effect","type":"brightness","enabled":true,"amount":0.5,"keyframes":[]}]});
    validate_project(&p).unwrap();
    p["clips"][0]["extensions"]["bazcut.effects.v1"][0]["amount"] = json!(99);
    assert!(validate_project(&p).is_err());
    p["clips"][0]["extensions"] =
        json!({"bazcut.parent.v1":{"id":p["clips"][0]["id"],"inheritOpacity":true}});
    assert!(validate_project(&p).is_err());
}

#[test]
fn time_maps_enforce_source_bounds_speed_and_coverage() {
    let mut p = fixture();
    let duration = p["clips"][0]["duration"].as_u64().unwrap();
    p["assets"] = json!([{"id":"source","kind":"video","duration":duration}]);
    p["clips"][0]["assetId"] = json!("source");
    p["clips"][0]["kind"] = json!("video");
    p["clips"][0]["extensions"] = json!({"bazcut.time.v1":{"points":[{"at":0,"source":duration-1,"easing":"linear"},{"at":duration,"source":0,"easing":"linear"}]}});
    validate_project(&p).unwrap();
    p["clips"][0]["extensions"]["bazcut.time.v1"]["points"][0]["source"] = json!(duration);
    assert!(validate_project(&p).is_err());
    p["clips"][0]["extensions"]["bazcut.time.v1"]["points"][0]["source"] = json!(duration - 1);
    p["clips"][0]["extensions"]["bazcut.time.v1"]["points"][1]["at"] = json!(duration / 100);
    assert!(validate_project(&p).is_err());
}
