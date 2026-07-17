import fs from "fs";
export async function readFile(filepath) {
    return fs.readFileSync(filepath, "utf8");
}
export async function writeFile(filepath, content) {
    fs.writeFileSync(filepath, content, "utf-8");
}
