"use client";
import { MatteControls } from "./MatteControls";
import {
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import {
  ArrowLeft,
  ArrowRight,
  AudioLines,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clapperboard,
  Copy,
  Download,
  Eye,
  EyeOff,
  Film,
  FolderOpen,
  Frame,
  GripVertical,
  ImagePlus,
  Layers,
  Lock,
  Maximize2,
  MessageSquare,
  MoreHorizontal,
  MousePointer2,
  Music2,
  Pause,
  Play,
  Plus,
  Redo2,
  Scissors,
  Search,
  Settings2,
  SlidersHorizontal,
  Sparkles,
  Star,
  Subtitles,
  Trash2,
  Type,
  Undo2,
  Unlock,
  Upload,
  Volume2,
  VolumeX,
  X,
  Diamond,
  Flag,
  Save,
  Monitor,
  Smartphone,
  Link2,
  Square,
  Mic,
} from "lucide-react";
import {
  applyEdit,
  endOf,
  exportCaptions,
  fadeAt,
  frameTicks,
  fpsValue,
  newClip,
  newProject,
  parseCaptions,
  propertyAt,
  seconds,
  snapFrame,
  ticks,
  timecode,
  uid,
  unsupportedFeatures,
  validateProject,
  type Asset,
  type Clip,
  type Edit,
  type KeyProperty,
  type Project,
  type Rate,
} from "./model";
import {
  download,
  getMedia,
  listProjects,
  listVersions,
  platformName,
  persistStorage,
  putMedia,
} from "./storage";
import { inspectMedia, MediaPool } from "./media";
import {
  capabilities,
  drawFrame,
  renderProject,
  renderWav,
  type ExportSettings,
  type Progress,
} from "./render";
import { useProject } from "./controller";
import { isPortableProject, packageProject, unpackProject } from "./package";
import { useTransport, shuttleSpeed } from "./transport";
import { SourceMonitor } from "./SourceMonitor";
import { insertSourceRange } from "./source-edit";
import { EffectStack } from "./EffectStack";
import { TimeRemap } from "./TimeRemap";
import "./studio.css";

type Workspace =
  "Edit" | "Motion" | "Color" | "Audio" | "Captions" | "Review" | "Deliver";
const tabs: Workspace[] = [
  "Edit",
  "Motion",
  "Color",
  "Audio",
  "Captions",
  "Review",
  "Deliver",
];
const toolIcon = {
  Edit: Scissors,
  Motion: Diamond,
  Color: SlidersHorizontal,
  Audio: AudioLines,
  Captions: Subtitles,
  Review: MessageSquare,
  Deliver: Download,
};
const presets = [
  {
    name: "Story",
    aspect: "9:16",
    label: "A vertical canvas. A new point of view.",
    gradient: "linear-gradient(140deg,#18437c,#2147af 50%,#67b8f3)",
  },
  {
    name: "Film",
    aspect: "16:9",
    label: "Give your next big idea room to breathe.",
    gradient: "linear-gradient(140deg,#18443f,#267a78 50%,#a3c99a)",
  },
  {
    name: "Square",
    aspect: "1:1",
    label: "Make something impossible to scroll past.",
    gradient: "linear-gradient(140deg,#533961,#856485 50%,#e9c2ac)",
  },
];
function IconButton({
  label,
  children,
  onClick,
  disabled,
  active,
}: {
  label: string;
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      className={`bc-icon ${active ? "active" : ""}`}
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
function Field({ label, children }: { label: string; children: ReactNode }) {
  const id = useId();
  return (
    <div className="bc-field">
      <label htmlFor={id}>{label}</label>
      {isValidElement(children)
        ? cloneElement(children as ReactElement<{ id: string }>, { id })
        : children}
    </div>
  );
}
function NumberField({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (v: number) => void;
}) {
  return (
    <Field label={label}>
      <input
        type="number"
        value={Number(value.toFixed(4))}
        min={min}
        max={max}
        step={step}
        onChange={(e) => {
          const n = e.target.valueAsNumber;
          if (Number.isFinite(n)) onChange(n);
        }}
      />
    </Field>
  );
}
function Slider({
  label,
  value,
  min,
  max,
  step = 0.01,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="bc-slider">
      <span>
        {label}
        <output>{Number(value.toFixed(2))}</output>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}
function Modal({
  title,
  close,
  children,
}: {
  title: string;
  close: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null),
    prior = useRef<Element | null>(null);
  useEffect(() => {
    prior.current = document.activeElement;
    ref.current?.showModal();
    return () => {
      ref.current?.close();
      if (prior.current instanceof HTMLElement) prior.current.focus();
    };
  }, []);
  return (
    <dialog
      className="bc-modal"
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
    >
      <div className="bc-modal-head">
        <h2>{title}</h2>
        <IconButton label="Close dialog" onClick={close}>
          <X size={19} />
        </IconButton>
      </div>
      {children}
    </dialog>
  );
}
function Logo() {
  return (
    <span className="bc-brand">
      <span className="bc-logo">
        <Scissors size={22} />
      </span>
      <strong>
        BazCut<span>2.0</span>
      </strong>
    </span>
  );
}

export default function Studio() {
  const ctl = useProject(),
    p = ctl.project;
  const [home, setHome] = useState(true),
    [projects, setProjects] = useState<Project[]>([]),
    [tab, setTab] = useState<Workspace>("Edit"),
    [selected, setSelected] = useState(""),
    [frame, setFrame] = useState(0),
    [playing, setPlaying] = useState(false),
    [playbackSpeed, setPlaybackSpeed] = useState(1),
    [sourceId, setSourceId] = useState(""),
    [busy, setBusy] = useState(""),
    [notice, setNotice] = useState(""),
    [search, setSearch] = useState(""),
    [panel, setPanel] = useState<"media" | "titles" | "effects">("media"),
    [zoom, setZoom] = useState(60),
    [snapping, setSnapping] = useState(true),
    [ripple, setRipple] = useState(false),
    [safeArea, setSafeArea] = useState(false),
    [modal, setModal] = useState<
      "new" | "nova" | "settings" | "versions" | "shortcuts" | null
    >(null),
    [name, setName] = useState("Untitled project"),
    [aspect, setAspect] = useState("16:9"),
    [mobilePanel, setMobilePanel] = useState<"media" | "inspector" | null>(
      null,
    ),
    [versions, setVersions] = useState<{ project: Project; label?: string }[]>(
      [],
    ),
    [missing, setMissing] = useState<string[]>([]),
    [quality, setQuality] = useState("Balanced"),
    [recording, setRecording] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null),
    pool = useRef<MediaPool | null>(null),
    fileInput = useRef<HTMLInputElement>(null),
    projectInput = useRef<HTMLInputElement>(null),
    subtitleInput = useRef<HTMLInputElement>(null),
    relinkInput = useRef<HTMLInputElement>(null),
    relink = useRef<Asset | null>(null),
    drawQueue = useRef(Promise.resolve()),
    latestDraw = useRef(0),
    recorder = useRef<MediaRecorder | null>(null),
    recordStream = useRef<MediaStream | null>(null),
    timeline = useRef<HTMLDivElement>(null);
  const c = p?.clips.find((c) => c.id === selected),
    total = p ? Math.ceil(endOf(p) / frameTicks(p.fps)) : 0,
    at = p ? frame * frameTicks(p.fps) : 0;
  const report = (e: unknown) =>
    ctl.setError(e instanceof Error ? e.message : String(e));
  const run = async (task: () => Promise<void>, label?: string) => {
    try {
      if (label) setBusy(label);
      await task();
    } catch (e) {
      report(e);
    } finally {
      if (label) setBusy("");
    }
  };
  useEffect(() => {
    const onExportError = (e: Event) => report((e as CustomEvent).detail);
    window.addEventListener("bazcut-export-error", onExportError);
    void listProjects().then(setProjects).catch(report);
    return () => {
      window.removeEventListener("bazcut-export-error", onExportError);
      pool.current?.dispose();
      recorder.current?.stop();
      recordStream.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);
  useEffect(() => {
    if (!p) return;
    pool.current?.dispose();
    pool.current = new MediaPool();
    setFrame(0);
    setPlaying(false);
    setSelected("");
    void Promise.all(
      p.assets.map(async (a) => ((await getMedia(a.id)) ? null : a.id)),
    )
      .then((ids) => setMissing(ids.filter((id): id is string => id !== null)))
      .catch(report);
  }, [p?.id]);
  useEffect(() => {
    if (!p || !canvas.current || !pool.current || home) return;
    const id = ++latestDraw.current,
      cv = canvas.current,
      media = pool.current;
    drawQueue.current = drawQueue.current
      .catch(() => {})
      .then(async () => {
        if (id !== latestDraw.current) return;
        const scale = Math.min(
          1,
          (quality === "Eco" ? 540 : quality === "Performance" ? 1920 : 960) /
            p.width,
        );
        cv.width = Math.max(1, Math.round(p.width * scale));
        cv.height = Math.max(1, Math.round(p.height * scale));
        await drawFrame(cv, p, media, Math.min(at, Math.max(0, endOf(p) - 1)), {
          guides: safeArea,
        });
      })
      .catch((e) => {
        if (!playing) report(e);
      });
  }, [p, at, home, safeArea, quality]);
  useTransport({
    project: p,
    pool: pool.current,
    frame,
    playing,
    speed: playbackSpeed,
    onFrame: setFrame,
    onPlaying: setPlaying,
    onError: report,
  });
  const change = (fn: (p: Project) => Project) => {
    setPlaying(false);
    ctl.edit(fn);
  };
  const edit = (op: Edit) => change((p) => applyEdit(p, op));
  const patch = (patch: Partial<Clip>) => {
    if (c) edit({ type: "patch", id: c.id, patch });
  };
  const command = (type: Edit["type"]) => {
    if (!c || !p) return;
    if (type === "split") edit({ type, id: c.id, at });
    if (type === "duplicate") edit({ type, id: c.id });
    if (type === "delete") {
      edit({ type, ids: [c.id], ripple });
      setSelected("");
    }
  };
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("input,textarea,select,[contenteditable=true],dialog"))
        return;
      if (e.key === "?") {
        setModal("shortcuts");
        return;
      }
      if (home || !p) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void run(() => ctl.flush());
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        setPlaying(false);
        e.shiftKey ? ctl.redo() : ctl.undo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "d") {
        e.preventDefault();
        command("duplicate");
        return;
      }
      if (e.code === "Space") {
        e.preventDefault();
        setPlaybackSpeed(1);
        setPlaying((v) => !v);
      }
      if (e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPlaying(false);
      }
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault();
        setPlaying(false);
        setFrame((f) =>
          Math.max(
            0,
            Math.min(
              total - 1,
              f + (e.key === "ArrowRight" ? 1 : -1) * (e.shiftKey ? 10 : 1),
            ),
          ),
        );
      }
      if (["j", "l"].includes(e.key.toLowerCase()) && !e.repeat) {
        e.preventDefault();
        setPlaybackSpeed(
          shuttleSpeed(
            playbackSpeed,
            e.key.toLowerCase() === "j" ? -1 : 1,
            playing,
          ),
        );
        setPlaying(true);
      }
      if (e.key.toLowerCase() === "s") command("split");
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        command("delete");
      }
      if (e.key.toLowerCase() === "m") addMarker();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [p, c, at, home, total, ripple, playing, playbackSpeed]);
  async function create(title = name, ratio = aspect) {
    const next = newProject(title.trim() || "Untitled project", ratio);
    await ctl.open(next, false);
    setHome(false);
    setTab("Edit");
    setModal(null);
    await persistStorage();
  }
  async function open(project: Project) {
    await ctl.open(project);
    setHome(false);
    setTab("Edit");
  }
  async function importFiles(files: File[]) {
    if (!p) return;
    setPlaying(false);
    for (const file of files) {
      setBusy(`Reading ${file.name}…`);
      const asset = await inspectMedia(file),
        existing = ctl.current.current?.assets.find(
          (a) => a.hash === asset.hash,
        );
      if (existing) {
        setNotice(`${file.name} is already in your media bin.`);
        continue;
      }
      await putMedia(asset, file);
      let clipId = "";
      ctl.edit((project) => {
        project.assets.push(asset);
        const track = project.tracks.find(
          (t) =>
            t.kind === (asset.kind === "audio" ? "audio" : "visual") &&
            !t.locked,
        );
        if (!track) throw Error("Create or unlock a compatible track.");
        const end = project.clips
          .filter((c) => c.trackId === track.id)
          .reduce((n, c) => Math.max(n, c.start + c.duration), 0);
        const clip = newClip(track.id, snapFrame(end, project.fps), asset);
        clip.duration = Math.max(
          frameTicks(project.fps),
          Math.floor(clip.duration / frameTicks(project.fps)) *
            frameTicks(project.fps),
        );
        project.clips.push(clip);
        clipId = clip.id;
        return project;
      });
      setSelected(clipId);
    }
    setBusy("");
    setNotice("Media imported and stored on this device.");
    await ctl.flush();
  }
  function addTrack(kind: "visual" | "audio") {
    const id = uid();
    change((p) => ({
      ...p,
      tracks: [
        ...p.tracks,
        {
          id,
          name: `${kind === "visual" ? "Video" : "Audio"} ${p.tracks.filter((t) => t.kind === kind).length + 1}`,
          kind,
          locked: false,
          muted: false,
          hidden: false,
          volume: 1,
        },
      ],
    }));
    return id;
  }
  function addTitle(kind: "text" | "shape" = "text", style?: string) {
    if (!p) return;
    const trackId = uid(),
      clip = newClip(trackId, at, undefined, kind);
    if (style === "lower") {
      clip.text = "YOUR NAME\nYour next chapter";
      clip.fontSize = 54;
      clip.y = 0.32;
    }
    if (style === "statement") {
      clip.text = "MAKE IT\nYOUR OWN.";
      clip.fontSize = 130;
      clip.color = "#b8d1ff";
    }
    if (style === "fade") {
      clip.fadeIn = ticks(0.6);
      clip.fadeOut = ticks(0.6);
    }
    change((p) => ({
      ...p,
      tracks: [
        ...p.tracks,
        {
          id: trackId,
          name: kind === "text" ? "Titles" : "Shapes",
          kind: "visual",
          locked: false,
          muted: false,
          hidden: false,
          volume: 1,
        },
      ],
      clips: [...p.clips, clip],
    }));
    setSelected(clip.id);
    setMobilePanel("inspector");
  }
  function addMarker() {
    change((p) => ({
      ...p,
      markers: [
        ...p.markers,
        { id: uid(), at, label: `Marker ${p.markers.length + 1}` },
      ],
    }));
  }
  async function recordVoice() {
    if (recording) {
      recorder.current?.stop();
      setRecording(false);
      return;
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    recordStream.current = stream;
    try {
      const r = new MediaRecorder(stream),
        parts: Blob[] = [];
      recorder.current = r;
      r.ondataavailable = (e) => {
        if (e.data.size) parts.push(e.data);
      };
      r.onerror = () => {
        stream.getTracks().forEach((t) => t.stop());
        setRecording(false);
        report(Error("Recording failed."));
      };
      r.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        setRecording(false);
        const blob = new Blob(parts, { type: r.mimeType });
        void run(
          () =>
            importFiles([
              new File(
                [blob],
                `Voiceover ${new Date().toISOString().replace(/[:.]/g, "-")}.${r.mimeType.includes("mp4") ? "m4a" : "webm"}`,
                { type: blob.type },
              ),
            ]),
          "Saving voiceover…",
        );
      };
      r.start();
      setRecording(true);
    } catch (e) {
      stream.getTracks().forEach((t) => t.stop());
      throw e;
    }
  }
  const exportJson = () => {
    if (p) download(`${p.name}.bazcut.json`, JSON.stringify(p, null, 2));
  };
  const exportPortable = () =>
    void run(async () => {
      if (!p) return;
      await ctl.flush();
      const blob = await packageProject(p, (name) =>
        setBusy(`Verifying ${name}…`),
      );
      download(`${p.name}.bazcut`, blob);
      setNotice(
        "Portable project prepared with original media. Keep this file to move your project between devices.",
      );
    }, "Preparing portable project…");
  const goHome = () =>
    void run(async () => {
      setPlaying(false);
      await ctl.flush();
      setProjects(await listProjects());
      setHome(true);
    });
  const actionError = ctl.error;
  const chooser = (
    <>
      <input
        ref={fileInput}
        className="bc-hidden"
        type="file"
        multiple
        accept="video/*,audio/*,image/*"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = "";
          void run(() => importFiles(files), "Importing media…");
        }}
      />
      <input
        ref={projectInput}
        className="bc-hidden"
        type="file"
        accept=".json,.bazcut"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f)
            void run(async () => {
              const portable = await isPortableProject(f);
              if (!portable && f.size > 20 * 1024 * 1024)
                throw Error("Project metadata exceeds the 20 MB safety limit.");
              const data = portable
                ? await unpackProject(f, (name) =>
                    setBusy(`Verifying ${name}…`),
                  )
                : validateProject(JSON.parse(await f.text()));
              data.id = uid();
              data.revision = 0;
              data.parentRevision = null;
              await ctl.open(data, false);
              setHome(false);
              setNotice(
                portable
                  ? "Portable project imported with verified original media."
                  : "Project imported. Relink media if it is not stored on this device.",
              );
            }, "Opening project…");
        }}
      />
      <input
        ref={relinkInput}
        className="bc-hidden"
        type="file"
        accept="video/*,audio/*,image/*"
        onChange={(e) => {
          const f = e.target.files?.[0],
            asset = relink.current;
          e.target.value = "";
          if (f && asset)
            void run(async () => {
              const replacement = await inspectMedia(f);
              if (replacement.hash !== asset.hash)
                throw Error(
                  "This file does not match the original checksum. Relink the exact original to preserve timing and edits.",
                );
              await putMedia(asset, f);
              pool.current?.dispose();
              pool.current = new MediaPool();
              setMissing((ids) => ids.filter((id) => id !== asset.id));
              setNotice("Original media relinked.");
              setFrame(frame);
              change((p) => p);
            }, "Verifying original…");
        }}
      />
    </>
  );
  return (
    <div
      className={`bc ${home ? "bc-home" : "bc-studio"}`}
      data-workspace={tab}
    >
      {chooser}
      <header className="bc-header">
        <button
          className="bc-brand-button"
          onClick={goHome}
          aria-label="BazCut home"
        >
          <Logo />
        </button>
        {!home && p ? (
          <>
            <span className="bc-header-sep" />
            <div className="bc-project-title">
              <input
                aria-label="Project name"
                value={p.name}
                maxLength={200}
                onChange={(e) =>
                  change((p) => ({ ...p, name: e.target.value }))
                }
              />
              <span>
                <span className="bc-status-dot" />
                {ctl.saveState}
              </span>
            </div>
            <div className="bc-history">
              <IconButton
                label="Undo"
                onClick={() => {
                  setPlaying(false);
                  ctl.undo();
                }}
                disabled={!ctl.history.undo}
              >
                <Undo2 size={17} />
              </IconButton>
              <IconButton
                label="Redo"
                onClick={() => {
                  setPlaying(false);
                  ctl.redo();
                }}
                disabled={!ctl.history.redo}
              >
                <Redo2 size={17} />
              </IconButton>
            </div>
            <div className="bc-header-actions">
              <button className="bc-quiet" onClick={() => setModal("nova")}>
                <Sparkles size={16} />
                Ask Nova
              </button>
              <button
                className="bc-primary"
                onClick={() => {
                  setPlaying(false);
                  setTab("Deliver");
                  setMobilePanel("inspector");
                }}
              >
                <Download size={15} />
                Export
              </button>
            </div>
          </>
        ) : (
          <>
            <span className="bc-home-caption">YOUR CREATIVE SPACE</span>
            <div className="bc-header-actions">
              <button className="bc-quiet" onClick={() => setModal("settings")}>
                <Settings2 size={17} />
                <span>Preferences</span>
              </button>
              <span className="bc-avatar" aria-label="Local profile">
                B
              </span>
            </div>
          </>
        )}
      </header>
      {actionError && (
        <div className="bc-alert" role="alert">
          <span>{actionError}</span>
          <button onClick={() => ctl.setError("")} aria-label="Dismiss error">
            <X size={15} />
          </button>
        </div>
      )}
      {notice && (
        <div className="bc-notice" role="status">
          <Check size={14} />
          {notice}
          <button
            onClick={() => setNotice("")}
            aria-label="Dismiss notification"
          >
            <X size={14} />
          </button>
        </div>
      )}
      {busy && (
        <div className="bc-busy" role="status">
          <span className="bc-spinner" />
          {busy}
        </div>
      )}
      {home ? (
        <main className="bc-dashboard">
          <aside className="bc-home-nav">
            <span className="bc-section-label">STUDIO</span>
            <button className="active">
              <Layers size={18} />
              Your projects
            </button>
            <button onClick={() => setModal("new")}>
              <Plus size={18} />
              New project
            </button>
            <button onClick={() => projectInput.current?.click()}>
              <FolderOpen size={18} />
              Open project file
            </button>
            <button onClick={() => setModal("nova")}>
              <Sparkles size={18} />
              Nova AI
            </button>
            <div className="bc-nav-bottom">
              <span className="bc-local-badge">
                <span className="bc-status-dot" />
                Local first
              </span>
              <p>
                Your ideas stay on your device.
                <br />
                Your originals stay yours.
              </p>
              <button onClick={() => setModal("shortcuts")}>
                <MousePointer2 size={17} />
                Keyboard shortcuts
              </button>
            </div>
          </aside>
          <div className="bc-home-body">
            <div className="bc-home-eyebrow">
              BAZAARA CREATIVE TOOLS <span> / </span> BAZCUT STUDIO
            </div>
            <section className="bc-hero">
              <div>
                <h1>
                  Big ideas.
                  <br />
                  <span>Every little frame.</span>
                </h1>
                <p>Make the cut. Find your rhythm. Tell your story.</p>
                <button
                  className="bc-primary bc-large"
                  onClick={() => setModal("new")}
                >
                  <Plus size={19} />
                  Create a project
                  <ArrowRight size={17} />
                </button>
                <button
                  className="bc-text-button"
                  onClick={() => projectInput.current?.click()}
                >
                  Open a project <ArrowRight size={14} />
                </button>
              </div>
              <div className="bc-hero-art" aria-hidden="true">
                <div className="bc-art-frame">
                  <div className="bc-art-sun" />
                  <div className="bc-art-mountain one" />
                  <div className="bc-art-mountain two" />
                  <span>
                    YOUR NEXT
                    <br />
                    <b>GREAT STORY.</b>
                  </span>
                  <div className="bc-art-label">
                    01:00:00:00 <span>REC ●</span>
                  </div>
                </div>
                <div className="bc-art-timeline">
                  <div />
                  <div />
                  <div />
                  <div />
                </div>
                <div className="bc-art-playhead" />
              </div>
            </section>
            <section className="bc-starters">
              <div className="bc-section-head">
                <h2>Start with a canvas</h2>
                <span>Same tools. Different possibilities.</span>
              </div>
              <div className="bc-preset-grid">
                {presets.map((x) => (
                  <button
                    className="bc-preset"
                    key={x.name}
                    onClick={() =>
                      void run(() =>
                        create(`Untitled ${x.name.toLowerCase()}`, x.aspect),
                      )
                    }
                  >
                    <div
                      className="bc-preset-art"
                      style={{ background: x.gradient }}
                    >
                      <span
                        className={`bc-aspect-art a${x.aspect.replace(":", "")}`}
                      >
                        <Frame size={26} />
                      </span>
                      <span>{x.aspect}</span>
                    </div>
                    <div>
                      <strong>
                        {x.name}
                        <ArrowRight size={16} />
                      </strong>
                      <small>{x.label}</small>
                    </div>
                  </button>
                ))}
              </div>
            </section>
            <section className="bc-recents">
              <div className="bc-section-head">
                <h2>
                  Your projects{" "}
                  <span className="bc-count">{projects.length}</span>
                </h2>
                <label className="bc-search">
                  <Search size={15} />
                  <input
                    placeholder="Find a project"
                    aria-label="Find a project"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </label>
              </div>
              {projects.length ? (
                <div className="bc-project-grid">
                  {[...projects]
                    .sort((a, b) => b.updated.localeCompare(a.updated))
                    .filter((p) =>
                      p.name.toLowerCase().includes(search.toLowerCase()),
                    )
                    .map((project) => (
                      <button
                        className="bc-project-card"
                        key={project.id}
                        onClick={() => void run(() => open(project))}
                      >
                        <div style={{ background: project.background }}>
                          <Clapperboard size={34} />
                          <span>
                            {project.width} × {project.height}
                          </span>
                        </div>
                        <strong>{project.name}</strong>
                        <small>
                          {project.clips.length} clips ·{" "}
                          {new Date(project.updated).toLocaleDateString()}
                          <span>LOCAL</span>
                        </small>
                      </button>
                    ))}
                </div>
              ) : (
                <div className="bc-empty-projects">
                  <div>
                    <FolderOpen size={25} />
                  </div>
                  <strong>A clean slate for your next idea</strong>
                  <p>
                    Create a project or open a BazCut project file to get
                    started.
                  </p>
                  <button className="bc-quiet" onClick={() => setModal("new")}>
                    <Plus size={16} />
                    New project
                  </button>
                </div>
              )}
            </section>
            <footer className="bc-home-footer">
              <span>Made for your imagination.</span>
              <span>
                Android · iOS · Windows{" "}
                <span className="bc-tag">Development build</span>
              </span>
            </footer>
          </div>
        </main>
      ) : (
        p && (
          <>
            <nav className="bc-workspaces" aria-label="Workspaces">
              {tabs.map((t) => {
                const Icon = toolIcon[t];
                return (
                  <button
                    key={t}
                    className={tab === t ? "active" : ""}
                    onClick={() => {
                      setPlaying(false);
                      setTab(t);
                      if (["Captions", "Review", "Deliver"].includes(t))
                        setMobilePanel("inspector");
                    }}
                  >
                    <Icon size={15} />
                    {t}
                  </button>
                );
              })}
              <button
                className="bc-settings"
                onClick={() => setModal("settings")}
                aria-label="Preferences"
              >
                <Settings2 size={17} />
              </button>
            </nav>
            <main className="bc-editor-main">
              <aside
                className={`bc-bin ${mobilePanel === "media" ? "bc-mobile-open" : ""}`}
              >
                <div className="bc-pane-head">
                  <h2>Project library</h2>
                  <IconButton
                    label="Close media panel"
                    onClick={() => setMobilePanel(null)}
                  >
                    <X size={15} />
                  </IconButton>
                </div>
                <div className="bc-bin-tabs">
                  {(["media", "titles", "effects"] as const).map((t) => (
                    <button
                      className={panel === t ? "active" : ""}
                      key={t}
                      onClick={() => setPanel(t)}
                    >
                      {t[0]!.toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>
                {panel === "media" ? (
                  <>
                    <button
                      className="bc-import"
                      onClick={() => fileInput.current?.click()}
                      disabled={!!busy}
                    >
                      <Upload size={17} />
                      Import media
                    </button>
                    <label className="bc-search">
                      <Search size={14} />
                      <input
                        placeholder="Search media"
                        aria-label="Search media"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </label>
                    <div
                      className="bc-media-list"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        void run(
                          () => importFiles(Array.from(e.dataTransfer.files)),
                          "Importing media…",
                        );
                      }}
                    >
                      {p.assets
                        .filter((a) =>
                          a.name.toLowerCase().includes(search.toLowerCase()),
                        )
                        .map((a) => (
                          <article className="bc-media-item" key={a.id}>
                            <button
                              className={`bc-media-thumb ${a.kind}`}
                              aria-label={`Open source ${a.name}`}
                              onClick={() => {
                                setPlaying(false);
                                setSourceId(a.id);
                              }}
                            >
                              {a.kind === "audio" ? (
                                <Music2 size={22} />
                              ) : a.kind === "image" ? (
                                <ImagePlus size={22} />
                              ) : (
                                <Film size={22} />
                              )}
                            </button>
                            <div>
                              <strong title={a.name}>{a.name}</strong>
                              <small>
                                {a.kind === "image"
                                  ? `${a.width} × ${a.height}`
                                  : `${seconds(a.duration).toFixed(1)}s`}{" "}
                                · {(a.size / 1024 / 1024).toFixed(1)} MB
                              </small>
                              {missing.includes(a.id) ? (
                                <button
                                  className="bc-link bc-error-text"
                                  onClick={() => {
                                    relink.current = a;
                                    relinkInput.current?.click();
                                  }}
                                >
                                  Relink original
                                </button>
                              ) : (
                                <span className="bc-media-status">
                                  On this device
                                </span>
                              )}
                            </div>
                            <button
                              aria-label={`Favorite ${a.name}`}
                              aria-pressed={a.favorite}
                              className="bc-mini"
                              onClick={() =>
                                change((p) => ({
                                  ...p,
                                  assets: p.assets.map((x) =>
                                    x.id === a.id
                                      ? { ...x, favorite: !x.favorite }
                                      : x,
                                  ),
                                }))
                              }
                            >
                              <Star
                                size={13}
                                fill={a.favorite ? "currentColor" : "none"}
                              />
                            </button>
                            <button
                              className="bc-mini"
                              aria-label={`Add ${a.name} to timeline`}
                              onClick={() => {
                                const track = p.tracks.find(
                                  (t) =>
                                    t.kind ===
                                      (a.kind === "audio"
                                        ? "audio"
                                        : "visual") && !t.locked,
                                );
                                if (track) {
                                  const clip = newClip(track.id, at, a);
                                  change((p) => ({
                                    ...p,
                                    clips: [...p.clips, clip],
                                  }));
                                  setSelected(clip.id);
                                }
                              }}
                            >
                              <Plus size={14} />
                            </button>
                          </article>
                        ))}
                      {!p.assets.length && (
                        <div className="bc-bin-empty">
                          <FolderOpen size={32} />
                          <strong>Bring your story in</strong>
                          <p>
                            Drop video, audio or photos here.
                            <br />
                            Your original files stay untouched.
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="bc-bin-foot">
                      <span>{p.assets.length} media files</span>
                      <span>Local only</span>
                    </div>
                  </>
                ) : panel === "titles" ? (
                  <div className="bc-title-presets">
                    <p>Editable titles, made on your device.</p>
                    {["basic", "lower", "statement", "fade"].map((style) => (
                      <button
                        key={style}
                        onClick={() => addTitle("text", style)}
                      >
                        <span className={style}>
                          {style === "statement"
                            ? "MAKE IT\nYOUR OWN."
                            : style === "lower"
                              ? "Name & story"
                              : style === "fade"
                                ? "Fade into focus"
                                : "Your title here"}
                        </span>
                        <small>
                          {style === "lower"
                            ? "Lower third"
                            : style === "statement"
                              ? "Bold statement"
                              : style === "fade"
                                ? "Soft fade"
                                : "Clean title"}
                          <Plus size={13} />
                        </small>
                      </button>
                    ))}
                    <button
                      className="bc-quiet"
                      onClick={() => addTitle("shape")}
                    >
                      <Square size={16} />
                      Add a shape layer
                    </button>
                  </div>
                ) : (
                  <div className="bc-effects">
                    <p>Select a clip to apply an editable look.</p>
                    {[
                      { name: "Original", b: 1, s: 1, c: 1, h: 0 },
                      { name: "Cinematic", b: 0.93, s: 0.75, c: 1.2, h: 0 },
                      { name: "Bright story", b: 1.1, s: 1.2, c: 1.08, h: 0 },
                      { name: "Monochrome", b: 1, s: 0, c: 1.12, h: 0 },
                      { name: "Blue hour", b: 0.95, s: 0.8, c: 1.05, h: 16 },
                    ].map((look) => (
                      <button
                        key={look.name}
                        disabled={!c}
                        onClick={() =>
                          patch({
                            brightness: look.b,
                            saturation: look.s,
                            contrast: look.c,
                            hue: look.h,
                          })
                        }
                      >
                        <span
                          className="bc-effect-swatch"
                          style={{
                            filter: `saturate(${look.s}) brightness(${look.b}) hue-rotate(${look.h}deg)`,
                          }}
                        />
                        {look.name}
                        <Plus size={14} />
                      </button>
                    ))}
                    <button
                      disabled={!c}
                      onClick={() =>
                        patch({ fadeIn: ticks(0.5), fadeOut: ticks(0.5) })
                      }
                    >
                      <span className="bc-effect-swatch fade" />
                      Fade in & out
                      <Plus size={14} />
                    </button>
                  </div>
                )}
              </aside>
              <section className="bc-preview-section">
                <div className="bc-preview-header">
                  <span>
                    PROGRAM <span className="bc-preview-project">{p.name}</span>
                  </span>
                  <div>
                    <span className="bc-tag">
                      {p.width} × {p.height}
                    </span>
                    <IconButton
                      label="Toggle safe area"
                      active={safeArea}
                      onClick={() => setSafeArea((v) => !v)}
                    >
                      <Frame size={15} />
                    </IconButton>
                  </div>
                </div>
                <div
                  className="bc-preview-stage"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    void run(
                      () => importFiles(Array.from(e.dataTransfer.files)),
                      "Importing media…",
                    );
                  }}
                >
                  <canvas
                    ref={canvas}
                    aria-label="Project video preview"
                    style={{ aspectRatio: `${p.width}/${p.height}` }}
                  />
                  {!p.clips.length && (
                    <div className="bc-preview-empty">
                      <div>
                        <Clapperboard size={33} />
                      </div>
                      <h2>Every story starts somewhere.</h2>
                      <p>
                        Import your media or create a title to make your first
                        cut.
                      </p>
                      <button
                        className="bc-primary"
                        onClick={() => fileInput.current?.click()}
                      >
                        <Plus size={16} />
                        Add media
                      </button>
                      <button
                        className="bc-text-button"
                        onClick={() => addTitle()}
                      >
                        Start with a title
                      </button>
                    </div>
                  )}
                </div>
                <div className="bc-transport">
                  <span className="bc-timecode">
                    {timecode(at, p.fps)}{" "}
                    <span>/ {timecode(endOf(p), p.fps)}</span>
                  </span>
                  <div>
                    <IconButton
                      label="Previous frame"
                      onClick={() => {
                        setPlaying(false);
                        setFrame((f) => Math.max(0, f - 1));
                      }}
                    >
                      <ChevronLeft size={19} />
                    </IconButton>
                    <button
                      className="bc-play"
                      aria-label={playing ? "Pause" : "Play"}
                      disabled={!total}
                      onClick={() => {
                        setPlaybackSpeed(1);
                        if (frame >= total - 1) setFrame(0);
                        setPlaying((v) => !v);
                      }}
                    >
                      {playing ? (
                        <Pause size={18} fill="currentColor" />
                      ) : (
                        <Play size={18} fill="currentColor" />
                      )}
                    </button>
                    <IconButton
                      label="Next frame"
                      onClick={() => {
                        setPlaying(false);
                        setFrame((f) =>
                          Math.min(Math.max(0, total - 1), f + 1),
                        );
                      }}
                    >
                      <ChevronRight size={19} />
                    </IconButton>
                  </div>
                  <span className="bc-fps">
                    {playing
                      ? `${playbackSpeed < 0 ? "Reverse" : "Forward"} ${Math.abs(playbackSpeed)}×`
                      : `${Number(fpsValue(p.fps).toFixed(3))} FPS`}
                  </span>
                </div>
                <input
                  className="bc-scrub"
                  type="range"
                  aria-label="Timeline playhead"
                  min={0}
                  max={Math.max(0, total - 1)}
                  value={Math.min(frame, Math.max(0, total - 1))}
                  onChange={(e) => {
                    setPlaying(false);
                    setFrame(Number(e.target.value));
                  }}
                />
              </section>
              <aside
                className={`bc-inspector ${mobilePanel === "inspector" ? "bc-mobile-open" : ""}`}
              >
                <div className="bc-pane-head">
                  <h2>{tab === "Edit" ? "Inspector" : `${tab} studio`}</h2>
                  <IconButton
                    label="Close inspector"
                    onClick={() => setMobilePanel(null)}
                  >
                    <X size={15} />
                  </IconButton>
                </div>
                <div className="bc-inspector-body">
                  {tab === "Deliver" ? (
                    <Delivery
                      p={p}
                      onError={report}
                      onNotice={setNotice}
                      onProject={exportJson}
                      onPortable={exportPortable}
                      packaging={!!busy}
                    />
                  ) : tab === "Captions" ? (
                    <>
                      <p className="bc-help">
                        Add captions or import SRT / VTT. All text remains
                        editable.
                      </p>
                      <button
                        className="bc-primary bc-full"
                        disabled={!total}
                        onClick={() =>
                          change((p) => ({
                            ...p,
                            captions: [
                              ...p.captions,
                              {
                                id: uid(),
                                start: at,
                                end: Math.min(endOf(p), at + ticks(3)),
                                text: "New caption",
                                speaker: "",
                              },
                            ],
                          }))
                        }
                      >
                        <Plus size={15} />
                        Add at playhead
                      </button>
                      <input
                        className="bc-hidden"
                        ref={subtitleInput}
                        type="file"
                        accept=".srt,.vtt"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          e.target.value = "";
                          if (f)
                            void run(async () => {
                              if (f.size > 2 * 1024 * 1024)
                                throw Error("Subtitle file too large.");
                              const captions = parseCaptions(await f.text());
                              if (captions.some((c) => c.end > endOf(p)))
                                throw Error(
                                  "Captions extend beyond the project.",
                                );
                              change((p) => ({ ...p, captions }));
                            });
                        }}
                      />
                      <div className="bc-button-pair">
                        <button
                          className="bc-quiet"
                          onClick={() => subtitleInput.current?.click()}
                        >
                          <Upload size={14} />
                          Import
                        </button>
                        <button
                          className="bc-quiet"
                          onClick={() =>
                            download(
                              `${p.name}.srt`,
                              exportCaptions(p.captions, "srt"),
                              "text/plain",
                            )
                          }
                        >
                          SRT <Download size={14} />
                        </button>
                        <button
                          className="bc-quiet"
                          onClick={() =>
                            download(
                              `${p.name}.vtt`,
                              exportCaptions(p.captions, "vtt"),
                              "text/vtt",
                            )
                          }
                        >
                          VTT
                        </button>
                      </div>
                      <Slider
                        label="Caption size"
                        value={p.captionStyle.size}
                        min={12}
                        max={160}
                        step={1}
                        onChange={(size) =>
                          change((p) => ({
                            ...p,
                            captionStyle: { ...p.captionStyle, size },
                          }))
                        }
                      />
                      <Slider
                        label="Vertical position"
                        value={p.captionStyle.position}
                        min={0}
                        max={1}
                        onChange={(position) =>
                          change((p) => ({
                            ...p,
                            captionStyle: { ...p.captionStyle, position },
                          }))
                        }
                      />
                      {p.captions.map((cap) => (
                        <div className="bc-caption-card" key={cap.id}>
                          <div>
                            <button
                              onClick={() =>
                                setFrame(
                                  Math.round(cap.start / frameTicks(p.fps)),
                                )
                              }
                            >
                              {timecode(cap.start, p.fps)}
                            </button>
                            <IconButton
                              label="Remove caption"
                              onClick={() =>
                                change((p) => ({
                                  ...p,
                                  captions: p.captions.filter(
                                    (c) => c.id !== cap.id,
                                  ),
                                }))
                              }
                            >
                              <Trash2 size={13} />
                            </IconButton>
                          </div>
                          <textarea
                            aria-label="Caption text"
                            value={cap.text}
                            onChange={(e) =>
                              change((p) => ({
                                ...p,
                                captions: p.captions.map((c) =>
                                  c.id === cap.id
                                    ? { ...c, text: e.target.value }
                                    : c,
                                ),
                              }))
                            }
                          />
                          <div className="bc-two">
                            <NumberField
                              label="Start (s)"
                              value={seconds(cap.start)}
                              min={0}
                              step={1 / fpsValue(p.fps)}
                              onChange={(v) =>
                                change((p) => ({
                                  ...p,
                                  captions: p.captions.map((c) =>
                                    c.id === cap.id
                                      ? {
                                          ...c,
                                          start: snapFrame(ticks(v), p.fps),
                                        }
                                      : c,
                                  ),
                                }))
                              }
                            />
                            <NumberField
                              label="End (s)"
                              value={seconds(cap.end)}
                              min={0}
                              step={1 / fpsValue(p.fps)}
                              onChange={(v) =>
                                change((p) => ({
                                  ...p,
                                  captions: p.captions.map((c) =>
                                    c.id === cap.id
                                      ? {
                                          ...c,
                                          end: snapFrame(ticks(v), p.fps),
                                        }
                                      : c,
                                  ),
                                }))
                              }
                            />
                          </div>
                        </div>
                      ))}
                      <div className="bc-service-note">
                        Automatic transcription and translation require a
                        connected Nova service.
                      </div>
                    </>
                  ) : tab === "Review" ? (
                    <Review
                      p={p}
                      at={at}
                      change={change}
                      seek={(t) => setFrame(Math.round(t / frameTicks(p.fps)))}
                    />
                  ) : (
                    <>
                      {!c ? (
                        <div className="bc-select-hint">
                          <MousePointer2 size={27} />
                          <strong>Select a clip</strong>
                          <p>
                            Fine-tune your selection here. Every change is
                            reversible.
                          </p>
                          <button
                            className="bc-quiet"
                            onClick={() => addTitle()}
                          >
                            <Type size={15} />
                            Add a title
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="bc-selected-name">
                            <span className={`bc-kind ${c.kind}`}>
                              {c.kind === "text" ? (
                                <Type size={16} />
                              ) : c.kind === "audio" ? (
                                <Music2 size={16} />
                              ) : (
                                <Film size={16} />
                              )}
                            </span>
                            <strong>{c.name}</strong>
                          </div>
                          {(tab === "Edit" || tab === "Motion") && (
                            <>
                              <h3>
                                {tab === "Motion"
                                  ? "Animation & transform"
                                  : "Transform"}
                              </h3>
                              {c.kind === "text" && (
                                <>
                                  <Field label="Title text">
                                    <textarea
                                      value={c.text}
                                      onChange={(e) =>
                                        patch({
                                          text: e.target.value,
                                          name:
                                            e.target.value.slice(0, 40) ||
                                            "Title",
                                        })
                                      }
                                    />
                                  </Field>
                                  <NumberField
                                    label="Font size"
                                    value={c.fontSize}
                                    min={8}
                                    max={600}
                                    onChange={(fontSize) => patch({ fontSize })}
                                  />
                                  <Field label="Text color">
                                    <input
                                      type="color"
                                      value={c.color}
                                      onChange={(e) =>
                                        patch({ color: e.target.value })
                                      }
                                    />
                                  </Field>
                                </>
                              )}
                              {c.kind === "shape" && (
                                <>
                                  <Field label="Shape">
                                    <select
                                      value={c.shape}
                                      onChange={(e) =>
                                        patch({
                                          shape: e.target
                                            .value as Clip["shape"],
                                        })
                                      }
                                    >
                                      <option value="rectangle">
                                        Rectangle
                                      </option>
                                      <option value="ellipse">Ellipse</option>
                                    </select>
                                  </Field>
                                  <Field label="Fill">
                                    <input
                                      type="color"
                                      value={c.background}
                                      onChange={(e) =>
                                        patch({ background: e.target.value })
                                      }
                                    />
                                  </Field>
                                </>
                              )}
                              <div className="bc-two">
                                <NumberField
                                  label="Position X (%)"
                                  value={c.x * 100}
                                  step={1}
                                  onChange={(v) => patch({ x: v / 100 })}
                                />
                                <NumberField
                                  label="Position Y (%)"
                                  value={c.y * 100}
                                  step={1}
                                  onChange={(v) => patch({ y: v / 100 })}
                                />
                              </div>
                              <Slider
                                label="Scale"
                                value={c.scale}
                                min={0.05}
                                max={5}
                                onChange={(scale) => patch({ scale })}
                              />
                              <Slider
                                label="Rotation"
                                value={c.rotation}
                                min={-180}
                                max={180}
                                step={1}
                                onChange={(rotation) => patch({ rotation })}
                              />
                              <Slider
                                label="Opacity"
                                value={c.opacity}
                                min={0}
                                max={1}
                                onChange={(opacity) => patch({ opacity })}
                              />
                              {tab === "Motion" ? (
                                <>
                                  <Keyframes
                                    clip={c}
                                    local={Math.max(0, at - c.start)}
                                    fps={p.fps}
                                    patch={patch}
                                  />

                                  <EffectStack
                                    project={p}
                                    clip={c}
                                    local={at - c.start}
                                    patch={patch}
                                  />
                                  <TimeRemap
                                    project={p}
                                    clip={c}
                                    local={at - c.start}
                                    patch={patch}
                                  />
                                  <MatteControls
                                    project={p}
                                    clip={c}
                                    patch={patch}
                                  />
                                </>
                              ) : (
                                <>
                                  <div className="bc-button-pair">
                                    <button
                                      className={`bc-quiet ${c.mirror ? "active" : ""}`}
                                      onClick={() =>
                                        patch({ mirror: !c.mirror })
                                      }
                                    >
                                      Mirror
                                    </button>
                                    <button
                                      className="bc-quiet"
                                      onClick={() =>
                                        patch({
                                          x: 0,
                                          y: 0,
                                          scale: 1,
                                          rotation: 0,
                                          opacity: 1,
                                        })
                                      }
                                    >
                                      Reset transform
                                    </button>
                                  </div>
                                  <Field label="Fit">
                                    <select
                                      value={c.fit}
                                      onChange={(e) =>
                                        patch({
                                          fit: e.target.value as Clip["fit"],
                                        })
                                      }
                                    >
                                      <option value="contain">
                                        Fit inside canvas
                                      </option>
                                      <option value="cover">Fill canvas</option>
                                    </select>
                                  </Field>
                                  <Field label="Mask">
                                    <select
                                      value={c.mask}
                                      onChange={(e) =>
                                        patch({
                                          mask: e.target.value as Clip["mask"],
                                        })
                                      }
                                    >
                                      <option value="none">None</option>
                                      <option value="circle">Circle</option>
                                      <option value="rounded">
                                        Rounded rectangle
                                      </option>
                                    </select>
                                  </Field>
                                  <Field label="Blend">
                                    <select
                                      value={c.blend}
                                      onChange={(e) =>
                                        patch({
                                          blend: e.target
                                            .value as Clip["blend"],
                                        })
                                      }
                                    >
                                      {[
                                        "source-over",
                                        "screen",
                                        "multiply",
                                        "overlay",
                                      ].map((x) => (
                                        <option key={x}>{x}</option>
                                      ))}
                                    </select>
                                  </Field>
                                  <details>
                                    <summary>Crop</summary>
                                    {(
                                      [
                                        "Top",
                                        "Right",
                                        "Bottom",
                                        "Left",
                                      ] as const
                                    ).map((label, i) => (
                                      <Slider
                                        key={label}
                                        label={label}
                                        value={c.crop[i]!}
                                        min={0}
                                        max={0.9}
                                        onChange={(v) => {
                                          const crop = [
                                            ...c.crop,
                                          ] as Clip["crop"];
                                          crop[i] = v;
                                          patch({ crop });
                                        }}
                                      />
                                    ))}
                                  </details>
                                  <h3>Timing</h3>
                                  <div className="bc-two">
                                    <NumberField
                                      label="Start (s)"
                                      value={seconds(c.start)}
                                      min={0}
                                      step={1 / fpsValue(p.fps)}
                                      onChange={(v) =>
                                        edit({
                                          type: "move",
                                          id: c.id,
                                          start: ticks(v),
                                          linked: true,
                                        })
                                      }
                                    />
                                    <NumberField
                                      label="Duration (s)"
                                      value={seconds(c.duration)}
                                      min={1 / fpsValue(p.fps)}
                                      step={1 / fpsValue(p.fps)}
                                      onChange={(v) =>
                                        edit({
                                          type: "trim",
                                          id: c.id,
                                          start: c.start,
                                          end: c.start + ticks(v),
                                          ripple,
                                        })
                                      }
                                    />
                                  </div>
                                  <div className="bc-two">
                                    <NumberField
                                      label="Source in (s)"
                                      value={seconds(c.sourceIn)}
                                      min={0}
                                      step={1 / fpsValue(p.fps)}
                                      onChange={(v) =>
                                        edit({
                                          type: "slip",
                                          id: c.id,
                                          delta: ticks(v) - c.sourceIn,
                                        })
                                      }
                                    />
                                    <Field label="Speed">
                                      <select
                                        value={c.speed.num / c.speed.den}
                                        onChange={(e) =>
                                          edit({
                                            type: "speed",
                                            id: c.id,
                                            rate: {
                                              num: Math.round(
                                                Number(e.target.value) * 100,
                                              ),
                                              den: 100,
                                            },
                                          })
                                        }
                                      >
                                        {[
                                          0.25, 0.5, 0.75, 1, 1.5, 2, 4, 8, 16,
                                        ].map((v) => (
                                          <option key={v} value={v}>
                                            {v}×
                                          </option>
                                        ))}
                                      </select>
                                    </Field>
                                  </div>
                                  <div className="bc-button-pair">
                                    <button
                                      className={`bc-quiet ${c.reverse ? "active" : ""}`}
                                      onClick={() =>
                                        patch({ reverse: !c.reverse })
                                      }
                                    >
                                      Reverse
                                    </button>
                                    <button
                                      className={`bc-quiet ${c.freeze ? "active" : ""}`}
                                      onClick={() =>
                                        patch({ freeze: !c.freeze })
                                      }
                                    >
                                      Freeze
                                    </button>
                                  </div>
                                  <div className="bc-two">
                                    <NumberField
                                      label="Fade in (s)"
                                      value={seconds(c.fadeIn)}
                                      min={0}
                                      step={0.1}
                                      onChange={(v) =>
                                        patch({ fadeIn: ticks(v) })
                                      }
                                    />
                                    <NumberField
                                      label="Fade out (s)"
                                      value={seconds(c.fadeOut)}
                                      min={0}
                                      step={0.1}
                                      onChange={(v) =>
                                        patch({ fadeOut: ticks(v) })
                                      }
                                    />
                                  </div>
                                  <details>
                                    <summary>Precision edits</summary>
                                    <p className="bc-help">
                                      Roll / slide require adjacent clips and
                                      source handles.
                                    </p>
                                    {(["slip", "roll", "slide"] as const).map(
                                      (type) => (
                                        <div className="bc-edit-row" key={type}>
                                          <span>{type}</span>
                                          <button
                                            onClick={() =>
                                              edit({
                                                type,
                                                id: c.id,
                                                delta: -frameTicks(p.fps),
                                              })
                                            }
                                          >
                                            −1 frame
                                          </button>
                                          <button
                                            onClick={() =>
                                              edit({
                                                type,
                                                id: c.id,
                                                delta: frameTicks(p.fps),
                                              })
                                            }
                                          >
                                            +1 frame
                                          </button>
                                        </div>
                                      ),
                                    )}
                                    <Field label="Link group">
                                      <input
                                        value={c.linkId ?? ""}
                                        placeholder="Same label links clips"
                                        onChange={(e) =>
                                          patch({
                                            linkId: e.target.value || undefined,
                                          })
                                        }
                                      />
                                    </Field>
                                  </details>
                                </>
                              )}
                            </>
                          )}
                          {tab === "Color" && (
                            <>
                              <h3>Primary adjustments</h3>
                              <Slider
                                label="Brightness"
                                value={c.brightness}
                                min={0}
                                max={2}
                                onChange={(brightness) => patch({ brightness })}
                              />
                              <Slider
                                label="Contrast"
                                value={c.contrast}
                                min={0}
                                max={2}
                                onChange={(contrast) => patch({ contrast })}
                              />
                              <Slider
                                label="Saturation"
                                value={c.saturation}
                                min={0}
                                max={3}
                                onChange={(saturation) => patch({ saturation })}
                              />
                              <Slider
                                label="Hue"
                                value={c.hue}
                                min={-180}
                                max={180}
                                step={1}
                                onChange={(hue) => patch({ hue })}
                              />
                              <Slider
                                label="Blur"
                                value={c.blur}
                                min={0}
                                max={40}
                                step={0.1}
                                onChange={(blur) => patch({ blur })}
                              />
                              <button
                                className="bc-quiet bc-full"
                                onClick={() =>
                                  patch({
                                    brightness: 1,
                                    contrast: 1,
                                    saturation: 1,
                                    hue: 0,
                                    blur: 0,
                                  })
                                }
                              >
                                Reset color adjustments
                              </button>
                              <Scope
                                canvas={canvas}
                                revision={p.revision}
                                frame={frame}
                              />
                              <p className="bc-help">
                                Display-referred sRGB preview histogram. HDR and
                                professional color transforms are not active.
                              </p>
                            </>
                          )}
                          {tab === "Audio" && (
                            <>
                              <h3>Clip mix</h3>
                              <Slider
                                label="Volume"
                                value={c.volume}
                                min={0}
                                max={2}
                                onChange={(volume) => patch({ volume })}
                              />
                              <Slider
                                label="Pan"
                                value={c.pan}
                                min={-1}
                                max={1}
                                onChange={(pan) => patch({ pan })}
                              />
                              <div className="bc-two">
                                <NumberField
                                  label="Fade in (s)"
                                  value={seconds(c.fadeIn)}
                                  min={0}
                                  step={0.1}
                                  onChange={(v) => patch({ fadeIn: ticks(v) })}
                                />
                                <NumberField
                                  label="Fade out (s)"
                                  value={seconds(c.fadeOut)}
                                  min={0}
                                  step={0.1}
                                  onChange={(v) => patch({ fadeOut: ticks(v) })}
                                />
                              </div>
                              <button
                                className={`bc-quiet bc-full ${recording ? "bc-error-text" : ""}`}
                                onClick={() => void run(recordVoice)}
                              >
                                <Mic size={16} />
                                {recording
                                  ? "Stop recording"
                                  : "Record voiceover"}
                              </button>
                              <Keyframes
                                clip={c}
                                local={Math.max(0, at - c.start)}
                                fps={p.fps}
                                patch={patch}
                                audioOnly
                              />
                              <p className="bc-help">
                                Stereo mix with sample mapping, volume
                                automation and peak clipping protection. Speed
                                changes also change audio pitch.
                              </p>
                            </>
                          )}
                        </>
                      )}
                      <details className="bc-project-settings">
                        <summary>Project settings</summary>
                        <div className="bc-two">
                          <NumberField
                            label="Width"
                            value={p.width}
                            min={16}
                            max={8192}
                            step={2}
                            onChange={(width) =>
                              change((p) => ({ ...p, width }))
                            }
                          />
                          <NumberField
                            label="Height"
                            value={p.height}
                            min={16}
                            max={8192}
                            step={2}
                            onChange={(height) =>
                              change((p) => ({ ...p, height }))
                            }
                          />
                        </div>
                        <Field label="Frame rate">
                          <select
                            value={`${p.fps.num}/${p.fps.den}`}
                            onChange={(e) => {
                              const [num, den] = e.target.value
                                .split("/")
                                .map(Number);
                              change((p) => ({
                                ...p,
                                fps: { num: num!, den: den! },
                              }));
                            }}
                          >
                            {[
                              [24, 1],
                              [25, 1],
                              [30, 1],
                              [30000, 1001],
                              [50, 1],
                              [60, 1],
                              [60000, 1001],
                            ].map(([n, d]) => (
                              <option value={`${n}/${d}`} key={`${n}/${d}`}>
                                {Number((n! / d!).toFixed(3))} fps
                              </option>
                            ))}
                          </select>
                        </Field>
                        <Field label="Canvas color">
                          <input
                            type="color"
                            value={p.background}
                            onChange={(e) =>
                              change((p) => ({
                                ...p,
                                background: e.target.value,
                              }))
                            }
                          />
                        </Field>
                        <button
                          className="bc-quiet bc-full"
                          onClick={() =>
                            void run(async () => {
                              await ctl.flush(`Version ${p.revision}`);
                              setNotice("Named version saved.");
                            })
                          }
                        >
                          <Save size={15} />
                          Save named version
                        </button>
                        <button
                          className="bc-quiet bc-full"
                          onClick={() =>
                            void run(async () => {
                              setVersions(await listVersions(p.id));
                              setModal("versions");
                            })
                          }
                        >
                          Version history
                        </button>
                        <button
                          className="bc-quiet bc-full"
                          onClick={exportJson}
                        >
                          <Download size={15} />
                          Export project file
                        </button>
                        <button
                          className="bc-quiet bc-full"
                          onClick={exportPortable}
                          disabled={!!busy}
                        >
                          <FolderOpen size={15} />
                          Export with original media
                        </button>
                      </details>
                    </>
                  )}
                </div>
              </aside>
            </main>
            <section className="bc-timeline" aria-label="Multitrack timeline">
              <div className="bc-timeline-toolbar">
                <div>
                  <IconButton
                    label="Import media"
                    onClick={() => {
                      setMobilePanel("media");
                      fileInput.current?.click();
                    }}
                  >
                    <Plus size={18} />
                  </IconButton>
                  <span className="bc-divider" />
                  <IconButton
                    label="Split at playhead"
                    onClick={() => command("split")}
                    disabled={!c}
                  >
                    <Scissors size={17} />
                  </IconButton>
                  <IconButton
                    label="Duplicate clip"
                    onClick={() => command("duplicate")}
                    disabled={!c}
                  >
                    <Copy size={16} />
                  </IconButton>
                  <IconButton
                    label="Delete clip"
                    onClick={() => command("delete")}
                    disabled={!c}
                  >
                    <Trash2 size={16} />
                  </IconButton>
                  <span className="bc-divider" />
                  <IconButton
                    label="Snapping"
                    active={snapping}
                    onClick={() => setSnapping((v) => !v)}
                  >
                    <GripVertical size={17} />
                  </IconButton>
                  <button
                    className={`bc-toggle ${ripple ? "active" : ""}`}
                    onClick={() => setRipple((v) => !v)}
                    aria-pressed={ripple}
                  >
                    Ripple
                  </button>
                  <IconButton label="Add marker" onClick={addMarker}>
                    <Flag size={15} />
                  </IconButton>
                </div>
                <div>
                  <button
                    className="bc-text-button"
                    onClick={() => addTrack("visual")}
                  >
                    <Plus size={13} />
                    Video track
                  </button>
                  <button
                    className="bc-text-button"
                    onClick={() => addTrack("audio")}
                  >
                    <Plus size={13} />
                    Audio track
                  </button>
                  <input
                    aria-label="Timeline zoom"
                    type="range"
                    min={15}
                    max={200}
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                  />
                </div>
              </div>
              <div className="bc-timeline-scroll" ref={timeline}>
                <div
                  className="bc-timeline-inner"
                  style={{
                    minWidth: Math.max(760, seconds(endOf(p)) * zoom + 240),
                  }}
                >
                  <div
                    className="bc-ruler"
                    onPointerDown={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const t = (e.clientX - rect.left - 140) / zoom;
                      setPlaying(false);
                      setFrame(
                        Math.max(
                          0,
                          Math.min(
                            Math.max(0, total - 1),
                            Math.round(t * fpsValue(p.fps)),
                          ),
                        ),
                      );
                    }}
                  >
                    <div className="bc-ruler-label">TRACKS</div>
                    {Array.from(
                      {
                        length: Math.ceil(
                          Math.max(10, seconds(endOf(p)) + 2) /
                            Math.max(1, Math.ceil(60 / zoom)),
                        ),
                      },
                      (_, i) => {
                        const s = i * Math.max(1, Math.ceil(60 / zoom));
                        return (
                          <span key={i} style={{ left: 140 + s * zoom }}>
                            {String(Math.floor(s / 60)).padStart(2, "0")}:
                            {String(s % 60).padStart(2, "0")}
                          </span>
                        );
                      },
                    )}
                  </div>
                  {[...p.tracks].reverse().map((track) => (
                    <div className={`bc-track ${track.kind}`} key={track.id}>
                      <div className="bc-track-label">
                        <span>
                          {track.kind === "audio" ? (
                            <Music2 size={13} />
                          ) : (
                            <Film size={13} />
                          )}
                          <input
                            aria-label="Track name"
                            value={track.name}
                            onChange={(e) =>
                              change((p) => ({
                                ...p,
                                tracks: p.tracks.map((t) =>
                                  t.id === track.id
                                    ? { ...t, name: e.target.value }
                                    : t,
                                ),
                              }))
                            }
                          />
                        </span>
                        <div>
                          <IconButton
                            label={`${track.locked ? "Unlock" : "Lock"} ${track.name}`}
                            onClick={() =>
                              change((p) => ({
                                ...p,
                                tracks: p.tracks.map((t) =>
                                  t.id === track.id
                                    ? { ...t, locked: !t.locked }
                                    : t,
                                ),
                              }))
                            }
                          >
                            {track.locked ? (
                              <Lock size={12} />
                            ) : (
                              <Unlock size={12} />
                            )}
                          </IconButton>
                          <IconButton
                            label={`${track.muted ? "Unmute" : "Mute"} ${track.name}`}
                            onClick={() =>
                              change((p) => ({
                                ...p,
                                tracks: p.tracks.map((t) =>
                                  t.id === track.id
                                    ? { ...t, muted: !t.muted }
                                    : t,
                                ),
                              }))
                            }
                          >
                            {track.muted ? (
                              <VolumeX size={13} />
                            ) : (
                              <Volume2 size={13} />
                            )}
                          </IconButton>
                          {track.kind === "visual" && (
                            <IconButton
                              label={`${track.hidden ? "Show" : "Hide"} ${track.name}`}
                              onClick={() =>
                                change((p) => ({
                                  ...p,
                                  tracks: p.tracks.map((t) =>
                                    t.id === track.id
                                      ? { ...t, hidden: !t.hidden }
                                      : t,
                                  ),
                                }))
                              }
                            >
                              {track.hidden ? (
                                <EyeOff size={13} />
                              ) : (
                                <Eye size={13} />
                              )}
                            </IconButton>
                          )}
                        </div>
                      </div>
                      <div className="bc-track-content">
                        {p.clips
                          .filter((c) => c.trackId === track.id)
                          .map((clip) => (
                            <button
                              className={`bc-clip ${clip.kind} ${selected === clip.id ? "selected" : ""}`}
                              key={clip.id}
                              data-clip-id={clip.id}
                              aria-label={`Select ${clip.name}`}
                              style={{
                                left: seconds(clip.start) * zoom,
                                width: Math.max(
                                  24,
                                  seconds(clip.duration) * zoom,
                                ),
                              }}
                              onClick={() => {
                                setSelected(clip.id);
                                setMobilePanel("inspector");
                              }}
                              onPointerDown={(e) => {
                                if (track.locked || e.button !== 0) return;
                                const startX = e.clientX,
                                  original = clip.start,
                                  button = e.currentTarget;
                                button.setPointerCapture(e.pointerId);
                                let destination = original,
                                  moved = false;
                                const move = (ev: PointerEvent) => {
                                  const delta = ev.clientX - startX;
                                  if (Math.abs(delta) > 4) moved = true;
                                  destination = snapFrame(
                                    original + ticks(delta / zoom),
                                    p.fps,
                                  );
                                  if (snapping) {
                                    const edges = [
                                      at,
                                      0,
                                      ...p.clips
                                        .filter((x) => x.id !== clip.id)
                                        .flatMap((x) => [
                                          x.start,
                                          x.start + x.duration,
                                        ]),
                                    ];
                                    for (const edge of edges)
                                      if (
                                        Math.abs(
                                          seconds(destination - edge) * zoom,
                                        ) < 8
                                      ) {
                                        destination = edge;
                                        break;
                                      }
                                  }
                                  button.style.left = `${seconds(destination) * zoom}px`;
                                };
                                const finish = () => {
                                  button.removeEventListener(
                                    "pointermove",
                                    move,
                                  );
                                  button.removeEventListener(
                                    "pointerup",
                                    finish,
                                  );
                                  button.removeEventListener(
                                    "pointercancel",
                                    cancel,
                                  );
                                  button.style.left = `${seconds(original) * zoom}px`;
                                  if (moved)
                                    edit({
                                      type: "move",
                                      id: clip.id,
                                      start: destination,
                                      linked: true,
                                    });
                                };
                                const cancel = () => {
                                  button.removeEventListener(
                                    "pointermove",
                                    move,
                                  );
                                  button.removeEventListener(
                                    "pointerup",
                                    finish,
                                  );
                                  button.removeEventListener(
                                    "pointercancel",
                                    cancel,
                                  );
                                  button.style.left = `${seconds(original) * zoom}px`;
                                };
                                button.addEventListener("pointermove", move);
                                button.addEventListener("pointerup", finish, {
                                  once: true,
                                });
                                button.addEventListener(
                                  "pointercancel",
                                  cancel,
                                  { once: true },
                                );
                              }}
                            >
                              <span>
                                {clip.kind === "text" ? (
                                  <Type size={12} />
                                ) : clip.kind === "audio" ? (
                                  <Music2 size={12} />
                                ) : clip.kind === "shape" ? (
                                  <Square size={12} />
                                ) : (
                                  <Film size={12} />
                                )}
                                <strong>{clip.name}</strong>
                                {clip.linkId && <Link2 size={11} />}
                              </span>
                              <small>
                                {seconds(clip.duration).toFixed(2)}s
                              </small>
                              {clip.keyframes.map((k) => (
                                <i
                                  key={k.id}
                                  className="bc-key-dot"
                                  style={{
                                    left:
                                      seconds(
                                        k.at - (clip.animationOffset ?? 0),
                                      ) * zoom,
                                  }}
                                />
                              ))}
                            </button>
                          ))}
                      </div>
                    </div>
                  ))}
                  <div
                    className="bc-playhead"
                    style={{ left: 140 + seconds(at) * zoom }}
                  >
                    <span />
                  </div>
                  {p.markers.map((marker) => (
                    <button
                      className="bc-timeline-marker"
                      key={marker.id}
                      style={{ left: 140 + seconds(marker.at) * zoom }}
                      title={marker.label}
                      onClick={() =>
                        setFrame(Math.round(marker.at / frameTicks(p.fps)))
                      }
                    >
                      <Flag size={12} />
                    </button>
                  ))}
                </div>
              </div>
              <div className="bc-timeline-status">
                <span>
                  <span className="bc-status-dot" />
                  {p.clips.length} clips · {p.tracks.length} tracks · sRGB
                </span>
                <span>Original media · {platformName()}</span>
                <button onClick={() => setModal("shortcuts")}>
                  Shortcuts ?
                </button>
              </div>
            </section>
            <div className="bc-mobile-tools">
              <button onClick={() => setMobilePanel("media")}>
                <FolderOpen size={18} />
                Media
              </button>
              <button onClick={() => command("split")} disabled={!c}>
                <Scissors size={18} />
                Split
              </button>
              <button onClick={() => addTitle()}>
                <Type size={18} />
                Text
              </button>
              <button onClick={() => setMobilePanel("inspector")}>
                <SlidersHorizontal size={18} />
                Adjust
              </button>
              <button onClick={() => setModal("nova")}>
                <Sparkles size={18} />
                Nova
              </button>
            </div>
          </>
        )
      )}
      {modal === "new" && (
        <Modal title="Start something great" close={() => setModal(null)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void run(() => create());
            }}
          >
            <Field label="Project name">
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={200}
              />
            </Field>
            <Field label="Canvas">
              <select
                value={aspect}
                onChange={(e) => setAspect(e.target.value)}
              >
                <option>16:9</option>
                <option>9:16</option>
                <option>1:1</option>
                <option>4:5</option>
              </select>
            </Field>
            <p className="bc-help">
              Saved on this device. Importing media does not upload it.
            </p>
            <button className="bc-primary bc-full" type="submit">
              <Plus size={17} />
              Create project
            </button>
          </form>
        </Modal>
      )}
      {modal === "nova" && (
        <Modal title="Nova Smart Assist" close={() => setModal(null)}>
          <div className="bc-nova-orb">
            <Sparkles size={35} />
          </div>
          <h3>Your creative partner, with your permission.</h3>
          <p>
            Nova will propose reversible edits for you to review. Cloud
            processing, credit spending and training each require separate
            authorization.
          </p>
          <div className="bc-service-note">
            <strong>Nova is not connected in this build.</strong>
            <br />
            No media has been uploaded and no credits have been spent. A
            verified BazID session and Nova service contract are required to
            activate it.
          </div>
          <button className="bc-quiet bc-full" onClick={() => setModal(null)}>
            Continue editing locally
          </button>
        </Modal>
      )}
      {modal === "settings" && (
        <Modal title="Studio preferences" close={() => setModal(null)}>
          <Field label="Preview quality">
            <select
              value={quality}
              onChange={(e) => setQuality(e.target.value)}
            >
              <option>Eco</option>
              <option>Balanced</option>
              <option>Performance</option>
            </select>
          </Field>
          <p className="bc-help">
            Preview quality does not change your exported dimensions.
          </p>
          <button
            className="bc-quiet bc-full"
            onClick={() =>
              void run(async () => {
                const durable = await persistStorage();
                setNotice(
                  durable
                    ? "Persistent storage is enabled."
                    : "The browser did not grant persistent storage. Keep exported project files and originals.",
                );
              })
            }
          >
            Request persistent device storage
          </button>
          <h3>Connected services</h3>
          {[
            "BazID identity & subscriptions",
            "BCloud selective sync",
            "Nova AI",
            "Creator marketplace",
            "Cloud rendering",
          ].map((s) => (
            <div className="bc-service-row" key={s}>
              <span>{s}</span>
              <span className="bc-tag">Not connected</span>
            </div>
          ))}
          <p className="bc-help">
            This development build does not activate paid plans or public
            sharing. Premium pricing and quotas in the specification remain
            provisional.
          </p>
          <p className="bc-help">
            Native packages require target-platform builds and signing. Android
            and iOS hardware media bridges are not yet validated.
          </p>
        </Modal>
      )}
      {modal === "versions" && (
        <Modal title="Named versions" close={() => setModal(null)}>
          {versions.length ? (
            versions.map((v, i) => (
              <div className="bc-version" key={i}>
                <div>
                  <strong>{v.label}</strong>
                  <small>
                    Revision {v.project.revision} ·{" "}
                    {new Date(v.project.updated).toLocaleString()}
                  </small>
                </div>
                <button
                  className="bc-quiet"
                  onClick={() => {
                    change(() => structuredClone(v.project));
                    setModal(null);
                  }}
                >
                  Restore as new edit
                </button>
              </div>
            ))
          ) : (
            <p>
              No named versions yet. Use “Save named version” in Project
              settings.
            </p>
          )}
        </Modal>
      )}
      {sourceId && p && p.assets.find((a) => a.id === sourceId) && (
        <Modal title="Source monitor" close={() => setSourceId("")}>
          <SourceMonitor
            asset={p.assets.find((a) => a.id === sourceId)!}
            project={p}
            insert={(track, input, output, mode) => {
              try {
                const result = insertSourceRange(
                  p,
                  sourceId,
                  track,
                  input,
                  output,
                  at,
                  mode,
                );
                change(() => result.project);
                setSelected(result.clipId);
                setSourceId("");
                setNotice(
                  mode === "insert"
                    ? "Source range inserted."
                    : "Source range overwritten.",
                );
              } catch (error) {
                report(error);
              }
            }}
          />
        </Modal>
      )}
      {modal === "shortcuts" && (
        <Modal title="Make your next move" close={() => setModal(null)}>
          {[
            ["Space", "Play / pause"],
            ["J / K / L", "Reverse / stop / forward; repeat J or L for 2–16×"],
            ["L", "Play forward"],
            ["J", "Step back one second"],
            ["← / →", "One frame"],
            ["Shift + ← / →", "Ten frames"],
            ["S", "Split at playhead"],
            ["M", "Add marker"],
            ["Ctrl / ⌘ + Z", "Undo"],
            ["Ctrl / ⌘ + Shift + Z", "Redo"],
            ["Ctrl / ⌘ + D", "Duplicate clip"],
            ["Ctrl / ⌘ + S", "Save"],
            ["Delete", "Remove selected clip"],
          ].map(([key, text]) => (
            <div className="bc-shortcut" key={key}>
              <span>{text}</span>
              <kbd>{key}</kbd>
            </div>
          ))}
        </Modal>
      )}
    </div>
  );
}

function Keyframes({
  clip,
  local,
  fps,
  patch,
  audioOnly = false,
}: {
  clip: Clip;
  local: number;
  fps: Rate;
  patch: (p: Partial<Clip>) => void;
  audioOnly?: boolean;
}) {
  const [property, setProperty] = useState<KeyProperty>(
      audioOnly ? "volume" : "scale",
    ),
    [easing, setEasing] = useState<"linear" | "hold" | "easeInOut" | "bezier">(
      "easeInOut",
    );
  const at = snapFrame(local, fps) + (clip.animationOffset ?? 0),
    points = clip.keyframes
      .filter((k) => k.property === property)
      .sort((a, b) => a.at - b.at);
  const min = Math.min(0, ...points.map((k) => k.value)),
    max = Math.max(1, ...points.map((k) => k.value));
  return (
    <div className="bc-keyframes">
      <h3>{audioOnly ? "Volume automation" : "Keyframes"}</h3>
      <div className="bc-two">
        <Field label="Property">
          <select
            value={property}
            onChange={(e) => setProperty(e.target.value as KeyProperty)}
          >
            {(audioOnly
              ? ["volume"]
              : ["x", "y", "scale", "rotation", "opacity"]
            ).map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </Field>
        <Field label="Interpolation">
          <select
            value={easing}
            onChange={(e) => setEasing(e.target.value as typeof easing)}
          >
            <option value="linear">Linear</option>
            <option value="easeInOut">Ease in/out</option>
            <option value="hold">Hold</option>
            <option value="bezier">Bezier</option>
          </select>
        </Field>
      </div>
      <button
        className="bc-quiet bc-full"
        disabled={at - (clip.animationOffset ?? 0) > clip.duration}
        onClick={() =>
          patch({
            keyframes: [
              ...clip.keyframes.filter(
                (k) => !(k.at === at && k.property === property),
              ),
              {
                id: uid(),
                at,
                property,
                value: clip[property],
                easing,
                curve: easing === "bezier" ? [0.42, 0, 0.58, 1] : undefined,
              },
            ],
          })
        }
      >
        <Diamond size={14} />
        Set keyframe at {timecode(at, fps)}
      </button>
      <svg
        className="bc-curve"
        viewBox="0 0 240 95"
        role="img"
        aria-label="Animated property curve"
      >
        <path d="M10 10V85H230" fill="none" stroke="#34405a" />
        <polyline
          fill="none"
          stroke="#689bff"
          strokeWidth="2"
          points={Array.from({ length: 80 }, (_, i) => {
            const value = propertyAt(clip, property, (i / 79) * clip.duration);
            return `${10 + (i / 79) * 220},${85 - ((value - min) / (max - min || 1)) * 70}`;
          }).join(" ")}
        />
        {points.map((k) => (
          <circle
            key={k.id}
            cx={
              10 + ((k.at - (clip.animationOffset ?? 0)) / clip.duration) * 220
            }
            cy={85 - ((k.value - min) / (max - min || 1)) * 70}
            r={3}
            fill="#a8c6ff"
          />
        ))}
      </svg>
      {points.map((k) => (
        <div className="bc-key-row" key={k.id}>
          <span>{timecode(k.at, fps)}</span>
          <input
            aria-label="Keyframe value"
            type="number"
            value={k.value}
            step={0.1}
            onChange={(e) =>
              patch({
                keyframes: clip.keyframes.map((x) =>
                  x.id === k.id ? { ...x, value: Number(e.target.value) } : x,
                ),
              })
            }
          />
          <button
            aria-label="Delete keyframe"
            onClick={() =>
              patch({ keyframes: clip.keyframes.filter((x) => x.id !== k.id) })
            }
          >
            <X size={13} />
          </button>
        </div>
      ))}
    </div>
  );
}
function Scope({
  canvas,
  revision,
  frame,
}: {
  canvas: React.RefObject<HTMLCanvasElement | null>;
  revision: number;
  frame: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!canvas.current || !ref.current) return;
      const source = canvas.current.getContext("2d"),
        ctx = ref.current.getContext("2d");
      if (!source || !ctx) return;
      try {
        const pixels = source.getImageData(
            0,
            0,
            canvas.current.width,
            canvas.current.height,
          ).data,
          bins = Array.from({ length: 3 }, () => new Uint32Array(64));
        for (let i = 0; i < pixels.length; i += 16)
          for (let ch = 0; ch < 3; ch++) bins[ch]![pixels[i + ch]! >> 2]!++;
        const max = Math.max(1, ...bins.flatMap((b) => Array.from(b)));
        ctx.clearRect(0, 0, 240, 100);
        ctx.globalCompositeOperation = "screen";
        for (let ch = 0; ch < 3; ch++) {
          ctx.fillStyle = ["#fc6a72", "#5dd999", "#668cff"][ch]!;
          for (let i = 0; i < 64; i++) {
            const h = (bins[ch]![i]! / max) * 90;
            ctx.fillRect(i * 3.75, 100 - h, 3, h);
          }
        }
      } catch {}
    }, 200);
    return () => clearTimeout(timer);
  }, [revision, frame]);
  return (
    <div className="bc-scope">
      <h3>RGB histogram</h3>
      <canvas
        width={240}
        height={100}
        ref={ref}
        aria-label="RGB preview histogram"
      />
    </div>
  );
}
function Review({
  p,
  at,
  change,
  seek,
}: {
  p: Project;
  at: number;
  change: (fn: (p: Project) => Project) => void;
  seek: (t: number) => void;
}) {
  const [text, setText] = useState("");
  return (
    <>
      <p className="bc-help">Frame-anchored notes stored with this project.</p>
      <textarea
        aria-label="Review note"
        placeholder="Leave a note at this frame…"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button
        className="bc-primary bc-full"
        disabled={!text.trim()}
        onClick={() => {
          change((p) => ({
            ...p,
            comments: [
              ...p.comments,
              {
                id: uid(),
                at,
                text: text.trim(),
                author: "Local editor",
                resolved: false,
                created: new Date().toISOString(),
              },
            ],
          }));
          setText("");
        }}
      >
        <MessageSquare size={15} />
        Add note
      </button>
      {p.comments.map((c) => (
        <article
          className={`bc-review-card ${c.resolved ? "resolved" : ""}`}
          key={c.id}
        >
          <button className="bc-link" onClick={() => seek(c.at)}>
            {timecode(c.at, p.fps)}
          </button>
          <p>{c.text}</p>
          <div>
            <span>{c.author}</span>
            <button
              className="bc-mini"
              aria-label={c.resolved ? "Reopen note" : "Resolve note"}
              onClick={() =>
                change((p) => ({
                  ...p,
                  comments: p.comments.map((x) =>
                    x.id === c.id ? { ...x, resolved: !x.resolved } : x,
                  ),
                }))
              }
            >
              {c.resolved ? <CheckCheck size={16} /> : <Check size={16} />}
            </button>
          </div>
        </article>
      ))}
      <div className="bc-service-note">
        Shared review links and team permissions require the collaboration
        service.
      </div>
    </>
  );
}
function Delivery({
  p,
  onError,
  onNotice,
  onProject,
  onPortable,
  packaging,
}: {
  p: Project;
  onError: (e: unknown) => void;
  onNotice: (s: string) => void;
  onProject: () => void;
  onPortable: () => void;
  packaging: boolean;
}) {
  const [codec, setCodec] = useState<ExportSettings["codec"]>("avc"),
    [container, setContainer] = useState<"mp4" | "webm">("mp4"),
    [bitrate, setBitrate] = useState(8),
    [burn, setBurn] = useState(true),
    [progress, setProgress] = useState<Progress | null>(null),
    [running, setRunning] = useState(false),
    [support, setSupport] = useState<Awaited<
      ReturnType<typeof capabilities>
    > | null>(null);
  const abort = useRef<AbortController | null>(null);
  const needsAudio = p.clips.some(
    (c) =>
      !c.freeze &&
      (c.volume > 0 ||
        c.keyframes.some((k) => k.property === "volume" && k.value > 0)) &&
      !p.tracks.find((t) => t.id === c.trackId)?.muted &&
      p.assets.find((a) => a.id === c.assetId)?.hasAudio,
  );
  const codecReady = support?.video.find((v) => v.codec === codec)?.supported;
  const audioReady =
    !needsAudio ||
    (container === "mp4" ? support?.audio.aac : support?.audio.opus);
  useEffect(() => {
    let alive = true;
    void capabilities(p)
      .then((r) => {
        if (alive) setSupport(r);
      })
      .catch(onError);
    return () => {
      alive = false;
      abort.current?.abort();
    };
  }, [p.width, p.height, p.fps.num, p.fps.den]);
  const start = async (wav = false) => {
    if (running) return;
    setRunning(true);
    abort.current = new AbortController();
    try {
      if (wav) {
        const blob = await renderWav(p, abort.current.signal, (percent) =>
          setProgress({
            stage: "rendering",
            percent,
            completed: Math.round(percent),
            total: 100,
          }),
        );
        download(`${p.name}.wav`, blob);
        onNotice("Stereo WAV exported.");
      } else {
        const result = await renderProject(
          p,
          {
            container,
            codec,
            bitrate: bitrate * 1_000_000,
            width: p.width,
            height: p.height,
            captions: burn,
          },
          abort.current.signal,
          setProgress,
        );
        download(`${p.name}.${container}`, result.blob);
        onNotice(
          `Export verified: ${result.frames} frames · ${result.duration.toFixed(2)} seconds${result.audio ? " · stereo audio" : ""}.`,
        );
      }
    } catch (e) {
      onError(e);
    } finally {
      setRunning(false);
      abort.current = null;
    }
  };
  return (
    <>
      <div className="bc-delivery-card">
        <Download size={25} />
        <strong>Ready for the world.</strong>
        <span>
          {p.width} × {p.height} · {Number(fpsValue(p.fps).toFixed(3))} fps ·
          sRGB
        </span>
      </div>
      <Field label="Container">
        <select
          disabled={running}
          value={container}
          onChange={(e) => {
            const v = e.target.value as typeof container;
            setContainer(v);
            setCodec(v === "webm" ? "vp9" : "avc");
          }}
        >
          <option value="mp4">MP4</option>
          <option value="webm">WebM</option>
        </select>
      </Field>
      <Field label="Video codec">
        <select
          disabled={running}
          value={codec}
          onChange={(e) => setCodec(e.target.value as typeof codec)}
        >
          {(container === "mp4" ? ["avc", "hevc", "av1"] : ["vp9", "av1"]).map(
            (c) => (
              <option
                value={c}
                key={c}
                disabled={
                  support !== null &&
                  !support.video.find((v) => v.codec === c)?.supported
                }
              >
                {
                  (
                    {
                      avc: "H.264",
                      hevc: "H.265 / HEVC",
                      av1: "AV1",
                      vp9: "VP9",
                    } as Record<string, string>
                  )[c]
                }
                {support && !support.video.find((v) => v.codec === c)?.supported
                  ? " — unavailable"
                  : ""}
              </option>
            ),
          )}
        </select>
      </Field>
      <Slider
        label="Video bitrate (Mbps)"
        value={bitrate}
        min={1}
        max={80}
        step={1}
        onChange={setBitrate}
      />
      <label className="bc-checkbox">
        <input
          disabled={running}
          type="checkbox"
          checked={burn}
          onChange={(e) => setBurn(e.target.checked)}
        />
        Burn in captions
      </label>
      <div className="bc-export-spec">
        <span>
          Audio
          <strong>
            {container === "mp4" ? "AAC" : "Opus"} · 192 kbps stereo
          </strong>
        </span>
        <span>
          Estimated size
          <strong>
            {((seconds(endOf(p)) * (bitrate + 0.192)) / 8).toFixed(1)} MB
          </strong>
        </span>
        <span>
          Processing<strong>Local · no cloud charge</strong>
        </span>
        <span>
          Watermark<strong>None</strong>
        </span>
      </div>
      <button
        className="bc-primary bc-full"
        disabled={running || !p.clips.length || !codecReady || !audioReady}
        onClick={() => void start()}
      >
        <Download size={16} />
        {running ? "Rendering…" : "Export video"}
      </button>
      {support && (!codecReady || !audioReady) && (
        <p className="bc-help" role="status">
          {!codecReady
            ? "The selected video encoder is unavailable on this device."
            : `This device cannot encode ${container === "mp4" ? "AAC" : "Opus"} audio.`}{" "}
          Choose another codec or container to export.
        </p>
      )}
      {running && (
        <button
          className="bc-quiet bc-full"
          onClick={() => abort.current?.abort()}
        >
          Cancel export
        </button>
      )}
      {progress && (
        <div className="bc-render-progress" role="status">
          <progress max={100} value={progress.percent} />
          <span>
            {progress.stage} · {progress.percent.toFixed(0)}%
          </span>
          <small>
            {progress.completed} / {progress.total}{" "}
            {progress.total === 100 ? "units" : "frames"}
          </small>
        </div>
      )}
      <p className="bc-help">
        Keep this window open during export. Available encoders depend on this
        device. Outputs above the 512 MB memory limit are blocked.
      </p>
      <h3>More deliverables</h3>
      <button
        className="bc-quiet bc-full"
        disabled={running || !p.clips.length}
        onClick={() => void start(true)}
      >
        <AudioLines size={16} />
        Export stereo WAV
      </button>
      <button className="bc-quiet bc-full" onClick={onProject}>
        <Layers size={16} />
        Export editable project
      </button>
      <button
        className="bc-quiet bc-full"
        onClick={onPortable}
        disabled={running || packaging}
      >
        <FolderOpen size={16} />
        Export with original media
      </button>
      <p className="bc-help">
        A .bazcut file includes your editable project and verified originals for
        transfer to another device. A JSON project file contains only the edit
        graph.
      </p>
      <div className="bc-service-note">
        Cloud rendering, background native exports, HDR and ProRes are not
        available in this build.
      </div>
    </>
  );
}
