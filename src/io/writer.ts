import { promises as fs } from "fs";

/**
 * Write content to a file on disk.
 */
export async function writeFile(filepath: string, content: string): Promise<void> {
    await fs.writeFile(filepath, content, "utf-8");
}

/**
 * Write content to stdout.
 */
export function writeStdout(content: string): void {
    process.stdout.write(content);
}

/**
 * Determine whether stdout is piped (i.e. not a TTY terminal).
 */
export function isStdoutPiped(): boolean {
    return !process.stdout.isTTY;
}
