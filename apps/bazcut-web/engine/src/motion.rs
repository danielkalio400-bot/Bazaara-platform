use crate::{array, number, text, valid_id, Result};
use serde_json::Value;
use std::collections::HashSet;
const EFFECTS: &str = "bazcut.effects.v1";
const PARENT: &str = "bazcut.parent.v1";
pub const TIME_MAP: &str = "bazcut.time.v1";
fn finite(v: &Value) -> Result<f64> {
    v.as_f64()
        .filter(|v| v.is_finite())
        .ok_or_else(|| "Invalid motion value".into())
}
fn easing(v: &Value) -> bool {
    matches!(v.as_str(), Some("linear" | "hold" | "easeInOut"))
}
pub fn validate_motion(p: &Value) -> Result<()> {
    let clips = array(p, "clips")?;
    for c in clips {
        let Some(ext) = c.get("extensions") else {
            continue;
        };
        let ext = ext.as_object().ok_or("Invalid clip extensions")?;
        if let Some(effects) = ext.get(EFFECTS) {
            let effects = effects.as_array().ok_or("Invalid effect stack")?;
            if effects.len() > 64 {
                return Err("Too many effects".into());
            }
            let mut ids = HashSet::new();
            for e in effects {
                let id = text(e, "id")?;
                let (low, high) = match text(e, "type")? {
                    "brightness" | "contrast" | "saturation" => (0.0, 4.0),
                    "hue" => (-180.0, 180.0),
                    "blur" => (0.0, 100.0),
                    "grayscale" | "sepia" | "invert" => (0.0, 1.0),
                    _ => return Err("Unsupported effect type".into()),
                };
                let amount = finite(&e["amount"])?;
                if !valid_id(id)
                    || !ids.insert(id)
                    || e["enabled"].as_bool().is_none()
                    || amount < low
                    || amount > high
                {
                    return Err("Invalid effect parameters".into());
                }
                let keys = array(e, "keyframes")?;
                if keys.len() > 1000 {
                    return Err("Too many effect keys".into());
                }
                let mut times = HashSet::new();
                for k in keys {
                    let at = number(k, "at")?;
                    let value = finite(&k["value"])?;
                    if !times.insert(at) || value < low || value > high || !easing(&k["easing"]) {
                        return Err("Invalid effect keyframe".into());
                    }
                }
            }
        }
        if let Some(parent) = ext.get(PARENT) {
            let id = text(parent, "id")?;
            let target = clips
                .iter()
                .find(|x| x["id"] == id)
                .ok_or("Missing visual parent")?;
            if parent["inheritOpacity"].as_bool().is_none()
                || target["kind"] == "audio"
                || c["kind"] == "audio"
            {
                return Err("Invalid visual parent".into());
            }
            let mut visited = HashSet::from([text(c, "id")?]);
            let mut next = Some(target);
            while let Some(node) = next {
                if visited.len() > 32 || !visited.insert(text(node, "id")?) {
                    return Err("Parenting must be acyclic and no deeper than 32 layers".into());
                }
                next = match node["extensions"][PARENT]["id"].as_str() {
                    Some(id) => Some(
                        clips
                            .iter()
                            .find(|x| x["id"] == id)
                            .ok_or("Missing visual parent")?,
                    ),
                    None => None,
                };
            }
        }
        if let Some(map) = ext.get(TIME_MAP) {
            let asset = array(p, "assets")?
                .iter()
                .find(|a| a["id"] == c["assetId"])
                .ok_or("Missing time-remap source")?;
            if !matches!(asset["kind"].as_str(), Some("video" | "audio")) {
                return Err("Time remapping requires video or audio".into());
            }
            let points = array(map, "points")?;
            if !(2..=1000).contains(&points.len()) {
                return Err("Time remapping requires 2-1000 points".into());
            }
            let mut previous: Option<&Value> = None;
            for point in points {
                let at = number(point, "at")?;
                let source = number(point, "source")?;
                if source >= number(asset, "duration")? || !easing(&point["easing"]) {
                    return Err("Invalid time-remapping source range".into());
                }
                if let Some(prior) = previous {
                    let before = number(prior, "at")?;
                    if at <= before {
                        return Err("Time points must increase".into());
                    }
                    let peak = if prior["easing"] == "easeInOut" {
                        1.5
                    } else {
                        1.0
                    };
                    let speed = (source as f64 - number(prior, "source")? as f64).abs()
                        / (at - before) as f64
                        * peak;
                    if prior["easing"] != "hold" && speed > 16.000001 {
                        return Err("Time-remapping speed exceeds 16x".into());
                    }
                }
                previous = Some(point);
            }
            let offset = if c.get("animationOffset").is_some() {
                c["animationOffset"]
                    .as_i64()
                    .ok_or("Invalid animation offset")?
            } else {
                0
            };
            let end = i128::from(offset) + i128::from(number(c, "duration")?);
            if i128::from(number(&points[0], "at")?) > i128::from(offset)
                || i128::from(number(points.last().unwrap(), "at")?) < end
            {
                return Err("Time-remapping curve must cover clip duration".into());
            }
        }
    }
    Ok(())
}
