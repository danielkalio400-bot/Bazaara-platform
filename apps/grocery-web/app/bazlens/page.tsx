"use client";

import {
  ChangeEvent,
  useEffect,
  useRef,
  useState
} from "react";

const API =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://localhost:4000";

type LensMode =
  | "image"
  | "barcode";

type JsonRecord =
  Record<string, unknown>;

function isRecord(
  value: unknown
): value is JsonRecord {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

export default function BazLensPage() {
  const videoRef =
    useRef<HTMLVideoElement | null>(
      null
    );

  const canvasRef =
    useRef<HTMLCanvasElement | null>(
      null
    );

  const streamRef =
    useRef<MediaStream | null>(
      null
    );

  const scanTimer =
    useRef<number | null>(
      null
    );

  const [
    mode,
    setMode
  ] =
    useState<LensMode>(
      "image"
    );

  const [
    error,
    setError
  ] =
    useState("");

  const [
    busy,
    setBusy
  ] =
    useState(false);

  const [
    barcodeValue,
    setBarcodeValue
  ] =
    useState("");

  const [
    detectedBarcode,
    setDetectedBarcode
  ] =
    useState("");

  useEffect(
    () => {
      let cancelled = false;

      async function startCamera() {
        try {
          const stream =
            await navigator.mediaDevices.getUserMedia(
              {
                video: {
                  facingMode: {
                    ideal:
                      "environment"
                  }
                },
                audio: false
              }
            );

          if (cancelled) {
            stream
              .getTracks()
              .forEach(
                (track) =>
                  track.stop()
              );

            return;
          }

          streamRef.current =
            stream;

          if (videoRef.current) {
            videoRef.current.srcObject =
              stream;

            await videoRef.current.play();
          }
        }
        catch {
          setError(
            "Camera access is unavailable. Upload a product photo or enter a barcode instead."
          );
        }
      }

      void startCamera();

      return () => {
        cancelled = true;

        if (
          scanTimer.current !== null
        ) {
          window.clearTimeout(
            scanTimer.current
          );
        }

        streamRef.current
          ?.getTracks()
          .forEach(
            (track) =>
              track.stop()
          );
      };
    },
    []
  );

  useEffect(
    () => {
      if (
        mode !== "barcode"
      ) {
        return;
      }

      let stopped = false;

      const Detector =
        (
          window as unknown as {
            BarcodeDetector?: new (
              options: {
                formats: string[];
              }
            ) => {
              detect:
                (
                  source:
                    HTMLVideoElement
                ) =>
                  Promise<
                    Array<{
                      rawValue?: string;
                    }>
                  >;
            };
          }
        ).BarcodeDetector;

      if (!Detector) {
        setError(
          "Automatic barcode scanning is not supported by this browser. Enter the barcode manually below."
        );

        return;
      }

      const detector =
        new Detector(
          {
            formats: [
              "ean_13",
              "ean_8",
              "upc_a",
              "upc_e",
              "code_128",
              "code_39",
              "qr_code"
            ]
          }
        );

      async function tick() {
        if (
          stopped ||
          !videoRef.current
        ) {
          return;
        }

        try {
          const codes =
            await detector.detect(
              videoRef.current
            );

          const raw =
            codes[0]?.rawValue?.trim();

          if (raw) {
            setBarcodeValue(raw);
            setDetectedBarcode(raw);
            stopped = true;
            openCatalogue(raw);
            return;
          }
        }
        catch {
        }

        scanTimer.current =
          window.setTimeout(
            () =>
              void tick(),
            650
          );
      }

      void tick();

      return () => {
        stopped = true;

        if (
          scanTimer.current !== null
        ) {
          window.clearTimeout(
            scanTimer.current
          );
        }
      };
    },
    [mode]
  );

  function openCatalogue(
    query: string
  ) {
    const clean =
      query.trim();

    if (!clean) {
      return;
    }

    window.location.href =
      `/?q=${encodeURIComponent(clean)}#catalogue`;
  }

  async function analyseBlob(
    blob: Blob,
    filename: string
  ) {
    setBusy(true);
    setError("");

    try {
      const form =
        new FormData();

      form.append(
        "image",
        blob,
        filename
      );

      const response =
        await fetch(
          `${API}/v1/search/visual`,
          {
            method: "POST",
            credentials: "include",
            body: form
          }
        );

      const body =
        await response
          .json()
          .catch(
            () => null
          );

      if (!response.ok) {
        throw new Error(
          isRecord(body) &&
          isRecord(body.error) &&
          typeof body.error.message === "string"
            ? body.error.message
            : "Visual product search is not connected yet."
        );
      }

      const searchText =
        isRecord(body) &&
        typeof body.query === "string"
          ? body.query.trim()
          : "";

      if (!searchText) {
        throw new Error(
          "BazLens could not identify a product query from this image."
        );
      }

      openCatalogue(searchText);
    }
    catch (
      cause
    ) {
      setError(
        cause instanceof Error
          ? cause.message
          : "BazLens could not analyse this image."
      );
    }
    finally {
      setBusy(false);
    }
  }

  function capture() {
    const video =
      videoRef.current;

    const canvas =
      canvasRef.current;

    if (
      !video ||
      !canvas
    ) {
      return;
    }

    const width =
      video.videoWidth ||
      1280;

    const height =
      video.videoHeight ||
      720;

    canvas.width =
      width;

    canvas.height =
      height;

    const context =
      canvas.getContext(
        "2d"
      );

    if (!context) {
      return;
    }

    context.drawImage(
      video,
      0,
      0,
      width,
      height
    );

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          return;
        }

        void analyseBlob(
          blob,
          "bazlens-capture.jpg"
        );
      },
      "image/jpeg",
      0.9
    );
  }

  function uploadImage(
    event:
      ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    void analyseBlob(
      file,
      file.name
    );
  }

  return (
    <main
      className="bazlens-page"
    >
      <section
        className="bazlens-camera-shell"
      >
        <video
          ref={videoRef}
          className="bazlens-video"
          playsInline
          muted
        />

        <div
          className="bazlens-shade"
        />

        <button
          type="button"
          className="bazlens-close"
          onClick={
            () =>
              history.back()
          }
          aria-label="Close BazLens"
        >
          ×
        </button>

        <a
          className="bazlens-ai-link"
          href="/bazai"
        >
          Ask BazAI
        </a>

        <div
          className="bazlens-frame"
          aria-hidden="true"
        >
          <span />
          <span />
          <span />
          <span />
          <i />
        </div>

        <canvas
          ref={canvasRef}
          hidden
        />

        {
          error
            ? (
              <div
                className="bazlens-error"
                role="alert"
              >
                {error}
              </div>
            )
            : null
        }

        {
          mode === "barcode"
            ? (
              <div
                className="bazlens-barcode-panel"
              >
                <input
                  value={barcodeValue}
                  onChange={
                    (event) =>
                      setBarcodeValue(
                        event.target.value
                      )
                  }
                  placeholder="Barcode number"
                  inputMode="numeric"
                />

                <button
                  type="button"
                  onClick={
                    () =>
                      openCatalogue(
                        barcodeValue
                      )
                  }
                >
                  Find product
                </button>

                {
                  detectedBarcode
                    ? (
                      <small>
                        Detected {detectedBarcode}
                      </small>
                    )
                    : null
                }
              </div>
            )
            : null
        }

        <div
          className="bazlens-controls"
        >
          <label
            className="bazlens-upload"
            title="Upload a product image"
          >
            <input
              type="file"
              accept="image/*"
              onChange={uploadImage}
            />

            ▧
          </label>

          <button
            type="button"
            className="bazlens-shutter"
            disabled={
              busy ||
              mode === "barcode"
            }
            onClick={capture}
            aria-label="Capture product image"
          >
            <span />
          </button>

          <a
            className="bazlens-help"
            href="/bazai?ask=How do I use BazLens?"
          >
            ?
          </a>
        </div>

        <div
          className="bazlens-mode-tabs"
        >
          <button
            type="button"
            className={
              mode === "image"
                ? "is-active"
                : ""
            }
            onClick={
              () => {
                setMode("image");
                setError("");
              }
            }
          >
            Image
          </button>

          <button
            type="button"
            className={
              mode === "barcode"
                ? "is-active"
                : ""
            }
            onClick={
              () => {
                setMode("barcode");
                setError("");
              }
            }
          >
            Barcode
          </button>
        </div>
      </section>

      <aside
        className="bazlens-info"
      >
        <p>
          BAZAARA GROCERY
        </p>

        <h1>
          BazLens
        </h1>

        <span>
          Find products only — point the camera at an item, upload a photo or scan a barcode.
        </span>

        <div>
          <strong>
            Image search
          </strong>

          <small>
            BazLens identifies a likely product query and opens matching Bazaara catalogue results.
          </small>
        </div>

        <div>
          <strong>
            Barcode search
          </strong>

          <small>
            Scan or enter a barcode to search for that product in Grocery.
          </small>
        </div>

        <a
          href="/bazai"
        >
          Need advice, budgets or comparisons? Ask BazAI →
        </a>
      </aside>
    </main>
  );
}
