import fs from "fs";
/**
 * Write content to a file on disk.
 */
export async function writeFile(filepath, content) {
    fs.writeFileSync(filepath, content, "utf-8");
}
/**
 * Write content to stdout.
 */
export function writeStdout(content) {
    process.stdout.write(content);
}
/**
 * Determine whether stdout is piped (i.e. not a TTY terminal).
 */
export function isStdoutPiped() {
    return !process.stdout.isTTY;
}
