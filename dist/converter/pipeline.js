import { mappings } from "../mappings/index.js";
import { protectCodeBlocks, restoreCodeBlocks } from "./codeblocks.js";
import { stripDollars } from "./dollars.js";
import { convertText } from "./text.js";
import { convertSubscripts } from "./subscript.js";
import { convertSuperscripts } from "./superscript.js";
import { convertFractions } from "./fractions.js";
import { convertRoots } from "./roots.js";
import { cleanup } from "./cleanup.js";
/**
 * Full conversion pipeline.
 *
 * Step order is critical:
 *  1. Protect code blocks (nothing inside them is ever touched)
 *  2. Strip dollar delimiters
 *  3. Apply symbol mappings (greek, operators, arrows)
 *  4. Convert \text{} → plain
 *  5. Convert subscripts
 *  6. Convert superscripts
 *  7. Convert fractions
 *  8. Convert roots
 *  9. Cleanup whitespace
 * 10. Restore code blocks
 */
export function runPipeline(text, opts = {}) {
    // Step 1 — protect code blocks
    const { text: protected_, blocks } = protectCodeBlocks(text);
    let result = protected_;
    // Step 2 — strip $...$ and $$...$$
    result = stripDollars(result);
    // Step 3 — symbol mappings
    if (!opts.noMappings) {
        for (const mapping of mappings) {
            result = result.replace(mapping.pattern, mapping.replacement);
        }
    }
    // Step 4 — \text{}
    result = convertText(result);
    // Step 5 — subscripts
    if (!opts.noSubscripts) {
        result = convertSubscripts(result);
    }
    // Step 6 — superscripts
    if (!opts.noSuperscripts) {
        result = convertSuperscripts(result);
    }
    // Step 7 — fractions
    if (!opts.noFractions) {
        result = convertFractions(result);
    }
    // Step 8 — roots
    if (!opts.noRoots) {
        result = convertRoots(result);
    }
    // Step 9 — cleanup
    result = cleanup(result);
    // Step 10 — restore code blocks
    result = restoreCodeBlocks(result, blocks);
    return result;
}
