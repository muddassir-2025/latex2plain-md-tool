/**
 * latex2plain — Web API server
 *
 * Uses raw Node.js HTTP server to bypass Express 5 middleware issues.
 *
 * Provides:
 *   GET  /health         – Health check
 *   POST /api/convert    – Convert pasted markdown/LaTeX to PDF
 *   POST /api/convert-file – Convert an uploaded .md or .txt file to PDF
 *
 * In production, also serves the React frontend as static files.
 */

import express from "express";
import cors from "cors";
import multer from "multer";
import http from "http";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { convertToPdfBuffer } from "./pdf.js";
import { smartFormat } from "./formatter/notes.js";

// ─── Constants ──────────────────────────────────────────────────────────────

const PORT = parseInt(process.env.PORT || "3001", 10);
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const isProduction = process.env.NODE_ENV === "production";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Express app (API only) ─────────────────────────────────────────────────

const app = express();

app.use(cors({
    origin: isProduction ? false : ["http://localhost:5173", "http://localhost:4173", "http://127.0.0.1:5173"],
}));

app.use(express.json({ limit: "5mb" }));

// ─── Multer ─────────────────────────────────────────────────────────────────

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter: (_req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (ext === ".md" || ext === ".txt") {
            cb(null, true);
        } else {
            cb(new Error("Unsupported file type. Only .md and .txt files are allowed."));
        }
    },
});

// ─── API Routes ─────────────────────────────────────────────────────────────

app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
});

app.post("/api/convert", async (req, res, next) => {
    try {
        const { markdown, smartFormat: useSmartFormat } = req.body;

        if (!markdown || typeof markdown !== "string" || markdown.trim().length === 0) {
            res.status(400).json({ error: "No markdown content provided." });
            return;
        }

        if (markdown.length > 500_000) {
            res.status(400).json({ error: "Input too large. Maximum 500,000 characters." });
            return;
        }

        let content = markdown;
        if (useSmartFormat) {
            content = smartFormat(content);
        }

        const pdfBuffer = await convertToPdfBuffer(content);
        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": 'attachment; filename="converted.pdf"',
            "Content-Length": pdfBuffer.length.toString(),
        });
        res.send(pdfBuffer);
    } catch (err: unknown) {
        next(err);
    }
});

app.post("/api/convert-file", async (req, res, next) => {
    try {
        await new Promise<void>((resolve, reject) => {
            upload.single("file")(req, res, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        const file = req.file;
        if (!file) {
            res.status(400).json({ error: "No file uploaded." });
            return;
        }

        let content = file.buffer.toString("utf-8").trim();
        if (content.length === 0) {
            res.status(400).json({ error: "Uploaded file is empty." });
            return;
        }

        const useSmartFormat = req.body.smartFormat === "true" || req.body.smartFormat === true;
        if (useSmartFormat) {
            content = smartFormat(content);
        }

        const pdfBuffer = await convertToPdfBuffer(content);
        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": 'attachment; filename="converted.pdf"',
            "Content-Length": pdfBuffer.length.toString(),
        });
        res.send(pdfBuffer);
    } catch (err: unknown) {
        next(err);
    }
});

// ─── Error handler ──────────────────────────────────────────────────────────

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
            res.status(400).json({ error: "File too large. Maximum size is 5 MB." });
            return;
        }
        res.status(400).json({ error: err.message });
        return;
    }

    if (err.message && err.message.includes("Unsupported file type")) {
        res.status(400).json({ error: err.message });
        return;
    }

    if (err.message && err.message.includes("PDF generation")) {
        console.error("PDF generation error:", err.message);
        res.status(500).json({ error: "Failed to generate PDF. Please try again." });
        return;
    }

    console.error("Unhandled error:", err.message);
    res.status(500).json({ error: "Internal server error." });
});

// ─── Find client/dist for production ────────────────────────────────────────

let clientDist = "";
if (isProduction) {
    const clientDirs = [
        path.resolve(__dirname, "..", "client", "dist"),
        path.resolve(process.cwd(), "client", "dist"),
    ];
    for (const dir of clientDirs) {
        try {
            if (fs.existsSync(dir)) {
                clientDist = dir;
                break;
            }
        } catch { /* ignore */ }
    }
}

// ─── Static file MIME types ─────────────────────────────────────────────────

const MIME_TYPES: Record<string, string> = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".ico": "image/x-icon",
    ".json": "application/json; charset=utf-8",
    ".woff2": "font/woff2",
    ".ttf": "font/ttf",
    ".map": "application/json",
};

// ─── HTTP server ────────────────────────────────────────────────────────────

const server = http.createServer((req, res) => {
    const url = req.url || "/";

    // ── API routes → Express ────────────────────────────────────────────
    if (url.startsWith("/api") || url === "/health") {
        app(req, res);
        return;
    }

    // ── Production: serve static files ───────────────────────────────────
    if (clientDist) {
        const filePath = url === "/" ? "index.html" : url.slice(1);
        const fullPath = path.join(clientDist, filePath);

        // Path traversal prevention
        if (!fullPath.startsWith(clientDist)) {
            res.writeHead(403);
            res.end("Forbidden");
            return;
        }

        if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
            const ext = path.extname(filePath).toLowerCase();
            const contentType = MIME_TYPES[ext] || "text/plain; charset=utf-8";
            const content = fs.readFileSync(fullPath);
            res.writeHead(200, { "Content-Type": contentType, "Content-Length": content.length });
            res.end(content);
            return;
        }

        // SPA fallback: serve index.html for all unmatched routes
        const indexPath = path.join(clientDist, "index.html");
        if (fs.existsSync(indexPath)) {
            const content = fs.readFileSync(indexPath);
            res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Content-Length": content.length });
            res.end(content);
            return;
        }
    }

    // ── Fallback: pass to Express ────────────────────────────────────────
    app(req, res);
});

// ─── Start ──────────────────────────────────────────────────────────────────

server.listen(PORT, () => {
    console.log(`latex2plain server running on http://localhost:${PORT}`);
    if (clientDist) {
        console.log(`Serving frontend from: ${clientDist}`);
    } else if (isProduction) {
        console.warn("Warning: client/dist not found. Build with: cd client && npm run build");
    }
});

export default app;
