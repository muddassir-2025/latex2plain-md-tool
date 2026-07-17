import fs from "fs";
import { createInterface } from "readline";
/**
 * Read a file from disk and return its content as a string.
 */
export async function readFile(filepath) {
    return fs.readFileSync(filepath, "utf8");
}
/**
 * Read all content from stdin.
 */
export async function readStdin() {
    return new Promise((resolve) => {
        const rl = createInterface({ input: process.stdin });
        const lines = [];
        rl.on("line", (line) => lines.push(line));
        rl.on("close", () => resolve(lines.join("\n")));
    });
}
/**
 * Determine whether stdin has data piped to it.
 */
export function isStdinPiped() {
    return !process.stdin.isTTY;
}
