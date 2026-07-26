import { useState, useRef, useCallback, type FormEvent, type DragEvent } from "react";
import "./App.css";

// ─── Config ──────────────────────────────────────────────────────────────

/** API base URL — uses direct backend URL in dev (Vite proxy is unreliable on Windows).
 * In production, uses relative path since backend serves both frontend and API.
 * To override, set VITE_API_URL env var (e.g. VITE_API_URL=http://localhost:4000). */
const API_BASE = import.meta.env.DEV
    ? (import.meta.env.VITE_API_URL || "http://localhost:3001")
    : (import.meta.env.VITE_API_URL || "");

const REQUEST_TIMEOUT_MS = 90_000; // 90 seconds (Render cold start can be slow)

// ─── Types ───────────────────────────────────────────────────────────────

type Mode = "paste" | "upload";
type Status = "idle" | "converting" | "success" | "error";

// ─── Component ───────────────────────────────────────────────────────────

export default function App() {
    const [mode, setMode] = useState<Mode>("paste");
    const [pasteText, setPasteText] = useState("");
    const [status, setStatus] = useState<Status>("idle");
    const [errorMessage, setErrorMessage] = useState("");
    const [conversionTime, setConversionTime] = useState(0);
    const [file, setFile] = useState<File | null>(null);
    const [dragOver, setDragOver] = useState(false);
    const [smartFormat, setSmartFormat] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const startTimeRef = useRef<number>(0);

    // ── Loading messages ────────────────────────────────────────────────

    const getLoadingMessage = (elapsed: number): string => {
        if (elapsed < 3) return "Preparing your PDF...";
        if (elapsed < 8) {
            return (
                "Preparing your PDF...\n" +
                "If this is the first conversion in a while, the server may need a moment to start. Thanks for your patience."
            );
        }
        return "Still working... Your PDF is being generated.";
    };

    // ── Timer management ────────────────────────────────────────────────

    const startTimer = () => {
        startTimeRef.current = Date.now();
        setConversionTime(0);
        timerRef.current = setInterval(() => {
            setConversionTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
        }, 1000);
    };

    const stopTimer = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };

    // ── File handling ───────────────────────────────────────────────────

    const handleFileSelect = useCallback((selectedFile: File | null) => {
        if (!selectedFile) {
            setFile(null);
            return;
        }
        const ext = selectedFile.name.split(".").pop()?.toLowerCase();
        if (ext !== "md" && ext !== "txt") {
            setErrorMessage("Only .md and .txt files are supported.");
            setStatus("error");
            return;
        }
        if (selectedFile.size > 5 * 1024 * 1024) {
            setErrorMessage("File is too large. Maximum size is 5 MB.");
            setStatus("error");
            return;
        }
        setFile(selectedFile);
        setStatus("idle");
        setErrorMessage("");
    }, []);

    const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragOver(false);
        const droppedFile = e.dataTransfer.files[0];
        handleFileSelect(droppedFile);
    }, [handleFileSelect]);

    const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragOver(true);
    }, []);

    const handleDragLeave = useCallback(() => {
        setDragOver(false);
    }, []);

    const removeFile = useCallback(() => {
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    }, []);

    // ── Convert action ─────────────────────────────────────────────────

    const handleConvert = async (e: FormEvent) => {
        e.preventDefault();
        setStatus("converting");
        setErrorMessage("");

        // Determine the payload
        let body: string | FormData;
        let isFormData = false;

        if (mode === "paste") {
            const text = pasteText.trim();
            if (!text) {
                setErrorMessage("Please enter some text to convert.");
                setStatus("error");
                return;
            }
            body = JSON.stringify({ markdown: text, smartFormat });
        } else {
            // Upload mode
            if (!file) {
                setErrorMessage("Please select a file to upload.");
                setStatus("error");
                return;
            }
            const formData = new FormData();
            formData.append("file", file);
            formData.append("smartFormat", String(smartFormat));
            body = formData;
            isFormData = true;
        }

        startTimer();

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

            const url =
                mode === "paste"
                    ? `${API_BASE}/api/convert`
                    : `${API_BASE}/api/convert-file`;

            const headers: Record<string, string> = {};
            if (!isFormData) {
                headers["Content-Type"] = "application/json";
            }

            const response = await fetch(url, {
                method: "POST",
                headers,
                body: body as BodyInit,
                signal: controller.signal,
            });

            clearTimeout(timeoutId);
            stopTimer();

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.error || `Server error (${response.status})`);
            }

            // Get the PDF blob
            const pdfBlob = await response.blob();

            // Trigger download
            const blobUrl = URL.createObjectURL(pdfBlob);
            const anchor = document.createElement("a");
            anchor.href = blobUrl;
            anchor.download = "converted.pdf";
            document.body.appendChild(anchor);
            anchor.click();
            document.body.removeChild(anchor);
            URL.revokeObjectURL(blobUrl);

            setStatus("success");
        } catch (err: unknown) {
            stopTimer();
            if (err instanceof Error && err.name === "AbortError") {
                setErrorMessage(
                    "The conversion is taking longer than expected. The server may still be starting up. Please try again.",
                );
            } else {
                const msg = err instanceof Error ? err.message : "Something went wrong.";
                setErrorMessage(
                    msg.includes("Failed to fetch")
                        ? "Cannot reach the conversion server. Please check your connection and try again."
                        : msg,
                );
            }
            setStatus("error");
        }
    };

    // ── Reset / Clear ──────────────────────────────────────────────────

    const reset = () => {
        setStatus("idle");
        setErrorMessage("");
        setConversionTime(0);
        stopTimer();
    };

    const clearText = () => {
        setPasteText("");
        if (status !== "idle") reset();
    };

    // ── Character count ────────────────────────────────────────────────

    const charCount = pasteText.length;
    const isPasteValid = mode === "paste" && pasteText.trim().length > 0;
    const isUploadValid = mode === "upload" && file !== null;
    const canConvert = (isPasteValid || isUploadValid) && status !== "converting";

    // ── Smart Format description ──────────────────────────────────────
    const smartFormatTooltip =
        "Auto-detect headings, code blocks, math formulas, definitions, and more " +
        "from raw unstructured text before conversion.";

    // ─── Render ────────────────────────────────────────────────────────

    return (
        <div className="app">
            <header className="header">
                <div className="header-content">
                    <h1 className="title">
                        <span className="title-icon">📄</span>
                        latex2plain
                    </h1>
                    <p className="subtitle">
                        Convert Markdown and LaTeX math notation to PDF
                    </p>
                </div>
            </header>

            <main className="main">
                <div className="card">
                    {/* ── Mode tabs ─────────────────────────────────── */}
                    <div className="mode-tabs" role="tablist" aria-label="Input mode">
                        <button
                            className={`mode-tab ${mode === "paste" ? "active" : ""}`}
                            onClick={() => { setMode("paste"); reset(); }}
                            role="tab"
                            aria-selected={mode === "paste"}
                            disabled={status === "converting"}
                        >
                            <span className="tab-icon">✏️</span>
                            Paste Text
                        </button>
                        <button
                            className={`mode-tab ${mode === "upload" ? "active" : ""}`}
                            onClick={() => { setMode("upload"); reset(); }}
                            role="tab"
                            aria-selected={mode === "upload"}
                            disabled={status === "converting"}
                        >
                            <span className="tab-icon">📁</span>
                            Upload File
                        </button>
                    </div>

                    {/* ── Form ──────────────────────────────────────── */}
                    <form onSubmit={handleConvert} className="convert-form">
                        {/* Paste mode */}
                        {mode === "paste" && (
                            <div className="textarea-wrapper">
                            <textarea
                                id="markdown-input"
                                className="text-input"
                                value={pasteText}
                                onChange={(e) => {
                                    setPasteText(e.target.value);
                                    if (status !== "idle") reset();
                                }}
                                placeholder={`Paste your Markdown or LaTeX text here...\n\nExample:\n# Quadratic Formula\n\nThe quadratic formula is $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$`}
                                rows={12}
                                disabled={status === "converting"}
                                aria-label="Markdown or LaTeX text input"
                            />
                                <div className="textarea-actions">
                                    <span className="char-count">
                                        {charCount.toLocaleString()} characters
                                    </span>
                                    {pasteText.length > 0 && (
                                        <button
                                            type="button"
                                            className="clear-btn"
                                            onClick={clearText}
                                            disabled={status === "converting"}
                                            aria-label="Clear text"
                                        >
                                            ✕ Clear
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Upload mode */}
                        {mode === "upload" && (
                            <div
                                className={`dropzone ${dragOver ? "drag-over" : ""} ${file ? "has-file" : ""}`}
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onClick={() => !file && fileInputRef.current?.click()}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        fileInputRef.current?.click();
                                    }
                                }}
                                aria-label="File upload area"
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".md,.txt"
                                    onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
                                    className="file-input-hidden"
                                    disabled={status === "converting"}
                                    aria-hidden="true"
                                />
                                {file ? (
                                    <div className="file-info">
                                        <span className="file-icon">
                                            {file.name.endsWith(".md") ? "📝" : "📄"}
                                        </span>
                                        <div className="file-details">
                                            <span className="file-name">{file.name}</span>
                                            <span className="file-size">
                                                {(file.size / 1024).toFixed(1)} KB
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            className="file-remove"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeFile();
                                            }}
                                            aria-label="Remove file"
                                            disabled={status === "converting"}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ) : (
                                    <div className="dropzone-content">
                                        <span className="dropzone-icon">📤</span>
                                        <p className="dropzone-text">
                                            Drag & drop a <strong>.md</strong> or{" "}
                                            <strong>.txt</strong> file here
                                        </p>
                                        <p className="dropzone-subtext">or click to browse</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── Smart Format toggle ────────────────────── */}
                        <div className="smart-format-row">
                            <label className="toggle-label" title={smartFormatTooltip}>
                                <span className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        id="smart-format-toggle"
                                        name="smartFormat"
                                        checked={smartFormat}
                                        onChange={(e) => setSmartFormat(e.target.checked)}
                                        disabled={status === "converting"}
                                        aria-label="Enable smart formatting"
                                    />
                                    <span className="toggle-slider" />
                                </span>
                                <span className="toggle-text">
                                    <span className="toggle-title">Smart Format</span>
                                    <span className="toggle-desc">
                                        Auto-detect headings, code, math
                                    </span>
                                </span>
                            </label>
                        </div>

                        {/* ── Convert button ────────────────────────── */}
                        <button
                            type="submit"
                            className={`convert-btn ${status === "converting" ? "loading" : ""}`}
                            disabled={!canConvert}
                        >
                            {status === "converting" ? (
                                <>
                                    <span className="spinner" aria-hidden="true" />
                                    <span>Converting...</span>
                                </>
                            ) : (
                                <>Convert to PDF</>
                            )}
                        </button>
                    </form>

                    {/* ── Status area ──────────────────────────────────── */}
                    <div className="status-area" aria-live="polite" aria-atomic="true">
                        {/* Converting */}
                        {status === "converting" && (
                            <div className="status converting">
                                <div className="loading-dots" aria-hidden="true">
                                    <span>.</span><span>.</span><span>.</span>
                                </div>
                                <p className="loading-message">
                                    {getLoadingMessage(conversionTime)
                                        .split("\n")
                                        .map((line, i) => (
                                            <span key={i}>
                                                {line}
                                                {i === 0 && <br />}
                                            </span>
                                        ))}
                                </p>
                            </div>
                        )}

                        {/* Success */}
                        {status === "success" && (
                            <div className="status success">
                                <span className="status-icon">✅</span>
                                <p>PDF ready! Check your downloads folder for <strong>converted.pdf</strong>.</p>
                                <button
                                    type="button"
                                    className="reset-btn"
                                    onClick={reset}
                                >
                                    Convert another
                                </button>
                            </div>
                        )}

                        {/* Error */}
                        {status === "error" && (
                            <div className="status error">
                                <span className="status-icon">❌</span>
                                <p>{errorMessage}</p>
                                <button
                                    type="button"
                                    className="retry-btn"
                                    onClick={reset}
                                >
                                    Try Again
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Footer ──────────────────────────────────────────── */}
                <footer className="footer">
                    <p>
                        Powered by{" "}
                        <a href="https://github.com/muddassir-2025/latex2plain-md-tool" target="_blank" rel="noopener noreferrer">
                            latex2plain
                        </a>
                        {" — "}LaTeX to Unicode conversion engine
                    </p>
                </footer>
            </main>
        </div>
    );
}
