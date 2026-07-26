import { useState, useRef, useCallback, useMemo, type FormEvent, type DragEvent } from "react";
import "./App.css";

// ─── Config ──────────────────────────────────────────────────────────────

const API_BASE = import.meta.env.DEV
    ? (import.meta.env.VITE_API_URL || "http://localhost:3001")
    : (import.meta.env.VITE_API_URL || "");

const REQUEST_TIMEOUT_MS = 90_000;

// ─── Types ───────────────────────────────────────────────────────────────

type Mode = "paste" | "upload";
type Status = "idle" | "converting" | "success" | "error";

interface StepDef {
    id: string;
    icon: string;
    title: string;
    desc: string;
    /** Seconds at which this step becomes "active". 0 = starts active. */
    activateAt: number;
}

// ─── Step definitions per mode ───────────────────────────────────────────

const AI_STEPS: StepDef[] = [
    { id: "sending", icon: "🤖", title: "Sending to Groq", desc: "Transmitting your notes to Llama 3", activateAt: 0 },
    { id: "waiting", icon: "⏳", title: "Waiting for Groq", desc: "AI is processing your content", activateAt: 2 },
    { id: "formatting", icon: "✨", title: "AI Formatting", desc: "Structuring into clean Markdown", activateAt: 6 },
    { id: "pdf", icon: "📄", title: "Generating PDF", desc: "Rendering your formatted document", activateAt: 15 },
];

const SMART_STEPS: StepDef[] = [
    { id: "analyze", icon: "📝", title: "Applying Smart Format", desc: "Auto-detecting structure and patterns", activateAt: 0 },
    { id: "pdf", icon: "📄", title: "Generating PDF", desc: "Rendering your formatted document", activateAt: 3 },
];

const RAW_STEPS: StepDef[] = [
    { id: "pdf", icon: "📄", title: "Generating PDF", desc: "Rendering your document", activateAt: 0 },
];

// ─── Helpers ─────────────────────────────────────────────────────────────

function getSteps(aiEnabled: boolean, smartEnabled: boolean): StepDef[] {
    if (aiEnabled) return AI_STEPS;
    if (smartEnabled) return SMART_STEPS;
    return RAW_STEPS;
}

function getActiveStepIndex(steps: StepDef[], elapsed: number): number {
    for (let i = steps.length - 1; i >= 0; i--) {
        if (elapsed >= steps[i].activateAt) return i;
    }
    return 0;
}

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
    const [aiFormatEnabled, setAiFormatEnabled] = useState(false);
    const [aiRateLimited, setAiRateLimited] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const startTimeRef = useRef<number>(0);

    // ── Progress stepper ─────────────────────────────────────────────

    const steps = useMemo(() => getSteps(aiFormatEnabled, smartFormat), [aiFormatEnabled, smartFormat]);
    const activeStepIndex = useMemo(
        () => getActiveStepIndex(steps, conversionTime),
        [steps, conversionTime],
    );

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

        let body: string | FormData;
        let isFormData = false;

        if (mode === "paste") {
            const text = pasteText.trim();
            if (!text) {
                setErrorMessage("Please enter some text to convert.");
                setStatus("error");
                return;
            }
            body = JSON.stringify({ markdown: text, smartFormat, aiFormat: aiFormatEnabled });
        } else {
            if (!file) {
                setErrorMessage("Please select a file to upload.");
                setStatus("error");
                return;
            }
            const formData = new FormData();
            formData.append("file", file);
            formData.append("smartFormat", String(smartFormat));
            formData.append("aiFormat", String(aiFormatEnabled));
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

            const aiFormatStatus = response.headers.get("X-Ai-Format-Status");
            if (aiFormatStatus === "rate-limited") {
                setAiRateLimited(true);
                setAiFormatEnabled(false);
                setSmartFormat(true);
            }

            const pdfBlob = await response.blob();

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

    const isAiToggleDisabled = status === "converting" || aiRateLimited;

    const clearText = () => {
        setPasteText("");
        if (status !== "idle") reset();
    };

    // ── Character count ────────────────────────────────────────────────

    const charCount = pasteText.length;
    const isPasteValid = mode === "paste" && pasteText.trim().length > 0;
    const isUploadValid = mode === "upload" && file !== null;
    const canConvert = (isPasteValid || isUploadValid) && status !== "converting";

    // ── Format descriptions ───────────────────────────────────────────

    const smartFormatTooltip =
        "Auto-detect headings, code blocks, math formulas, definitions, and more " +
        "from raw unstructured text before conversion.";

    const aiFormatTooltip =
        "Use Groq AI (Llama 3) to intelligently format messy, unstructured notes " +
        "into beautiful Markdown. Falls back to Smart Format if AI is unavailable.";

    const handleAiToggle = (checked: boolean) => {
        if (aiRateLimited && checked) return;
        setAiFormatEnabled(checked);
        if (checked) setSmartFormat(false);
        if (status !== "idle") reset();
    };

    const resetAiLimit = () => {
        setAiRateLimited(false);
        setSmartFormat(false);
    };

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
                                        <span className="file-icon">{file.name.endsWith(".md") ? "📝" : "📄"}</span>
                                        <div className="file-details">
                                            <span className="file-name">{file.name}</span>
                                            <span className="file-size">{(file.size / 1024).toFixed(1)} KB</span>
                                        </div>
                                        <button
                                            type="button"
                                            className="file-remove"
                                            onClick={(e) => { e.stopPropagation(); removeFile(); }}
                                            aria-label="Remove file"
                                            disabled={status === "converting"}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ) : (
                                    <div className="dropzone-content">
                                        <span className="dropzone-icon">📤</span>
                                        <p className="dropzone-text">Drag & drop a <strong>.md</strong> or <strong>.txt</strong> file here</p>
                                        <p className="dropzone-subtext">or click to browse</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── Format toggles ────────────────────────── */}
                        <div className="format-options">
                            <div className={`smart-format-row ai-format-row ${aiRateLimited ? "ai-rate-limited" : ""}`}>
                                <label className="toggle-label" title={aiRateLimited ? "AI rate limit reached — toggle is disabled" : aiFormatTooltip}>
                                    <span className="toggle-switch">
                                        <input
                                            type="checkbox"
                                            id="ai-format-toggle"
                                            name="aiFormat"
                                            checked={aiFormatEnabled}
                                            onChange={(e) => handleAiToggle(e.target.checked)}
                                            disabled={isAiToggleDisabled}
                                            aria-label="Enable AI formatting"
                                        />
                                        <span className={`toggle-slider ai-slider ${aiRateLimited ? "disabled-slider" : ""}`} />
                                    </span>
                                    <span className="toggle-text">
                                        <span className="toggle-title">
                                            <span className="ai-sparkle">✨</span> AI Format
                                        </span>
                                        <span className="toggle-desc">
                                            {aiRateLimited
                                                ? "Rate limit reached — using Smart Format fallback"
                                                : "Groq AI turns messy notes into beautiful Markdown"}
                                        </span>
                                    </span>
                                </label>
                            </div>

                            {aiRateLimited && (
                                <div className="ai-rate-limit-note">
                                    <span className="ai-info-icon">⚠️</span>
                                    <span className="ai-info-text">
                                        <strong>AI rate limit reached.</strong> The Groq API is temporarily unavailable.
                                        Your PDF was generated using our built-in Smart Format engine instead.
                                        The AI Format toggle is now disabled.{" "}
                                        <button type="button" className="reset-limit-btn" onClick={resetAiLimit}>Reset</button>
                                    </span>
                                </div>
                            )}

                            {aiFormatEnabled && !aiRateLimited && (
                                <div className="ai-info-note">
                                    <span className="ai-info-icon">💡</span>
                                    <span className="ai-info-text">
                                        <strong>AI Format: Best for notes under ~10,000 characters.</strong>{" "}
                                        Uses Groq's Llama 3 (Free tier: 6K tokens/min).{" "}
                                        If rate-limited or the notes are too long, we automatically fall back to{" "}
                                        our built-in Smart Format engine.{" "}
                                        <span className="ai-powered-by">Powered by Groq &amp; Llama 3</span>
                                    </span>
                                </div>
                            )}

                            {!aiFormatEnabled && !aiRateLimited && (
                                <div className="smart-format-row">
                                    <label className="toggle-label" title={smartFormatTooltip}>
                                        <span className="toggle-switch">
                                            <input
                                                type="checkbox"
                                                id="smart-format-toggle"
                                                name="smartFormat"
                                                checked={smartFormat}
                                                onChange={(e) => {
                                                    setSmartFormat(e.target.checked);
                                                    if (status !== "idle") reset();
                                                }}
                                                disabled={status === "converting"}
                                                aria-label="Enable smart formatting"
                                            />
                                            <span className="toggle-slider" />
                                        </span>
                                        <span className="toggle-text">
                                            <span className="toggle-title">Smart Format</span>
                                            <span className="toggle-desc">Auto-detect headings, code, math</span>
                                        </span>
                                    </label>
                                </div>
                            )}
                        </div>

                        {/* ── Convert button ────────────────────────── */}
                        <button
                            type="submit"
                            className={`convert-btn ${status === "converting" ? "loading" : ""}`}
                            disabled={!canConvert}
                        >
                            {status === "converting" ? (
                                <><span className="spinner" aria-hidden="true" /><span>Converting...</span></>
                            ) : (
                                <>Convert to PDF</>
                            )}
                        </button>
                    </form>

                    {/* ── Status area ──────────────────────────────────── */}
                    <div className="status-area" aria-live="polite" aria-atomic="true">

                        {/* Converting — progress stepper */}
                        {status === "converting" && (
                            <div className="status converting">
                                <div className="stepper">
                                    {steps.map((step, idx) => {
                                        const isActive = idx === activeStepIndex;
                                        const isCompleted = idx < activeStepIndex;
                                        const isPending = idx > activeStepIndex;
                                        const isLast = idx === steps.length - 1;

                                        return (
                                            <div key={step.id} className="step-row">
                                                <div className="step-track">
                                                    <div
                                                        className={`step-dot ${isCompleted ? "completed" : ""} ${isActive ? "active" : ""} ${isPending ? "pending" : ""}`}
                                                    >
                                                        {isCompleted ? "✓" : <span className="step-number">{idx + 1}</span>}
                                                    </div>
                                                    {!isLast && (
                                                        <div
                                                            className={`step-line ${isCompleted ? "completed" : ""} ${isActive ? "active" : ""} ${isPending ? "pending" : ""}`}
                                                        />
                                                    )}
                                                </div>
                                                <div className={`step-content ${isActive ? "active" : ""} ${isPending ? "pending" : ""}`}>
                                                    <div className="step-header">
                                                        <span className="step-icon">{step.icon}</span>
                                                        <span className={`step-title ${isActive ? "active" : ""}`}>
                                                            {step.title}
                                                            {isActive && <span className="step-spinner" />}
                                                        </span>
                                                        {isCompleted && <span className="step-check">✓</span>}
                                                    </div>
                                                    <div className={`step-desc ${isActive ? "active" : ""}`}>
                                                        {isActive
                                                            ? step.desc
                                                            : isCompleted
                                                                ? "Complete"
                                                                : "Waiting..."}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="conversion-timer">
                                    <span className="timer-icon">⏱</span>
                                    <span>{conversionTime}s</span>
                                    {conversionTime > 20 && activeStepIndex === steps.length - 1 && (
                                        <span className="timer-warning">This is taking longer than expected...</span>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Success */}
                        {status === "success" && (
                            <div className="status success">
                                <span className="status-icon">✅</span>
                                <p>PDF ready! Check your downloads folder for <strong>converted.pdf</strong>.</p>
                                <button type="button" className="reset-btn" onClick={reset}>Convert another</button>
                            </div>
                        )}

                        {/* Error */}
                        {status === "error" && (
                            <div className="status error">
                                <span className="status-icon">❌</span>
                                <p>{errorMessage}</p>
                                <button type="button" className="retry-btn" onClick={reset}>Try Again</button>
                            </div>
                        )}
                    </div>
                </div>

                <footer className="footer">
                    <p>
                        Powered by{" "}
                        <a href="https://github.com/muddassir-2025/latex2plain-md-tool" target="_blank" rel="noopener noreferrer">latex2plain</a>
                        {" — "}LaTeX to Unicode conversion engine
                    </p>
                </footer>
            </main>
        </div>
    );
}
