/**
 * latex2plain — Web API server
 *
 * Provides:
 *   GET  /health         – Health check (used by frontend and Render)
 *   POST /api/convert    – Convert pasted markdown/LaTeX to PDF
 *   POST /api/convert-file – Convert an uploaded .md or .txt file to PDF
 *
 * In production, also serves the React frontend as static files.
 */

import express from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { convertToPdfBuffer } from "./pdf.js";

// ─── Constants ──────────────────────────────────────────────────────────────

const PORT = parseInt(process.env.PORT || "3001", 10);
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

// Detect production vs development
const isProduction = process.env.NODE_ENV === "production";

// Resolve __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Express setup ──────────────────────────────────────────────────────────

const app = express();

// CORS — allow the Vite dev server origin in development
app.use(
    cors({
        origin: isProduction
            ? false
            : ["http://localhost:5173", "http://localhost:4173", "http://127.0.0.1:5173"],
    }),
);

// JSON body parser with size limit
app.use(express.json({ limit: "5mb" }));

// ─── Multer (file upload) ───────────────────────────────────────────────────

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

// ─── Routes ─────────────────────────────────────────────────────────────────

/** GET /health — lightweight health check */
app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
});

/** POST /api/convert — convert pasted markdown to PDF */
app.post("/api/convert", async (req, res, next) => {
    try {
        const { markdown } = req.body;

        if (!markdown || typeof markdown !== "string" || markdown.trim().length === 0) {
            res.status(400).json({ error: "No markdown content provided." });
            return;
        }

        if (markdown.length > 500_000) {
            res.status(400).json({ error: "Input too large. Maximum 500,000 characters." });
            return;
        }

        const pdfBuffer = await convertToPdfBuffer(markdown);

        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": "attachment; filename=\"converted.pdf\"",
            "Content-Length": pdfBuffer.length.toString(),
        });
        res.send(pdfBuffer);
    } catch (err: unknown) {
        next(err);
    }
});

/** POST /api/convert-file — convert an uploaded .md or .txt file to PDF */
app.post("/api/convert-file", async (req, res, next) => {
    try {
        // Wrap multer in a promise to catch errors cleanly
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

        // Convert buffer to UTF-8 string
        const markdown = file.buffer.toString("utf-8").trim();
        if (markdown.length === 0) {
            res.status(400).json({ error: "Uploaded file is empty." });
            return;
        }

        const pdfBuffer = await convertToPdfBuffer(markdown);
        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": "attachment; filename=\"converted.pdf\"",
            "Content-Length": pdfBuffer.length.toString(),
        });
        res.send(pdfBuffer);
    } catch (err: unknown) {
        next(err);
    }
});

// ─── Serve React frontend (production) ──────────────────────────────────────

if (isProduction) {
    // Try multiple possible locations for the built client
    const possibleDirs = [
        path.resolve(__dirname, "..", "client", "dist"),   // dist/client/dist
        path.resolve(__dirname, "..", "..", "client", "dist"), // project-root/client/dist
        path.resolve(process.cwd(), "client", "dist"),       // cwd/client/dist
    ];

    let clientDist = "";
    for (const dir of possibleDirs) {
        if (fs.existsSync(dir)) {
            clientDist = dir;
            break;
        }
    }

    if (clientDist) {
        app.use(express.static(clientDist));

        // SPA fallback — serve index.html for all non-API routes
        // Note: Express 5 dropped bare wildcard '*' support, so we use middleware instead
        const indexPath = path.join(clientDist, "index.html");
        app.use((_req, res) => {
            if (fs.existsSync(indexPath)) {
                res.sendFile(indexPath);
            } else {
                res.status(404).json({ error: "Not found" });
            }
        });
    } else {
        console.warn(
            "Warning: client/dist not found. Build the frontend with: cd client && npm run build",
        );
    }
}

// ─── Error handler ──────────────────────────────────────────────────────────

app.use(
    (err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
        // Multer errors
        if (err instanceof multer.MulterError) {
            if (err.code === "LIMIT_FILE_SIZE") {
                res.status(400).json({ error: "File too large. Maximum size is 5 MB." });
                return;
            }
            res.status(400).json({ error: err.message });
            return;
        }

        // File type validation errors (from multer fileFilter)
        if (err.message && err.message.includes("Unsupported file type")) {
            res.status(400).json({ error: err.message });
            return;
        }

        // PDF generation errors
        if (err.message && err.message.includes("PDF generation")) {
            console.error("PDF generation error:", err.message);
            res.status(500).json({ error: "Failed to generate PDF. Please try again." });
            return;
        }

        // Generic server error
        console.error("Unhandled error:", err.message);
        res.status(500).json({ error: "Internal server error." });
    },
);

// ─── Start (only when run directly, not when imported) ───────────────────

const isMainModule = process.argv[1] &&
    (process.argv[1].endsWith("server.js") || process.argv[1].endsWith("server.ts"));

if (isMainModule) {
    app.listen(PORT, () => {
        console.log(`latex2plain server running on http://localhost:${PORT}`);
        if (!isProduction) {
            console.log("Development mode — Vite dev server expected on :5173");
        }
    });
}

export default app;
