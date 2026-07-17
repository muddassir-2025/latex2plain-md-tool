import fs from "fs";

export async function readFile(filepath: string): Promise<string>{
    return fs.readFileSync(filepath,"utf8");
}

export async function writeFile(filepath: string, content: string): Promise<void>{
    fs.writeFileSync(filepath,content,"utf-8");
}

