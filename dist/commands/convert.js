import { readFile } from "../file.js";
import { writeFile } from "../file.js";
import { convert } from "../convertor/index.js";
export async function commandConvert(...args) {
    const inputPath = args[0];
    if (!inputPath) {
        console.log("filepath is required");
        process.exit(1);
    }
    // Read the markdown file
    const markdown = await readFile(inputPath);
    // Convert it
    const converted = convert(markdown);
    // Output file
    const outputPath = inputPath.replace(/\.md$/, ".plain.md");
    // Write converted markdown
    await writeFile(outputPath, converted);
    console.log(`✔ Converted ${inputPath} → ${outputPath}`);
}
