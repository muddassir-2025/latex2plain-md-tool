import { mappings } from "../mappings/index.js";
import { protectCodeBlocks, restoreCodeBlocks } from "./codeblocks.js";
import { stripDollars } from "./dollars.js";
import { convertText, convertTag } from "./text.js";
import { convertBinom, convertPmod, convertRefs, convertNotag } from "./structural.js";
import { convertSubscripts } from "./subscript.js";
import { convertSuperscripts } from "./superscript.js";
import { convertFractions } from "./fractions.js";
import { convertRoots } from "./roots.js";
import { cleanup } from "./cleanup.js";
import { ConvertOptions } from "../types/mapping.js";

/**
 * Full conversion pipeline.
 *
 * Step order is critical:
 *  1. Protect code blocks (nothing inside them is ever touched)
 *  2. Strip dollar delimiters
 *  3. Convert \pmod{} (before symbol mappings — prevents \pm from breaking \pmod)
 *  4. Apply symbol mappings (greek, operators, arrows)
 *  5. Convert \text{} → plain
 *  6. Convert \tag{} → (content)
 *  7. Convert structural commands (\binom, \label, \ref, \eqref, \notag)
 *  7. Convert subscripts
 *  8. Convert superscripts
 *  9. Convert fractions
 * 10. Convert roots
 * 11. Cleanup whitespace
 * 12. Restore code blocks
 */
export function runPipeline(text: string, opts: ConvertOptions = {}): string {
    // Step 1 — protect code blocks
    const { text: protected_, blocks } = protectCodeBlocks(text);
    let result = protected_;

    // Step 2 — strip $...$ and $$...$$
    result = stripDollars(result);

    // Step 3 — \pmod{} (must run before symbol mappings — \pm would break \pmod)
    result = convertPmod(result);

    // Step 4 — symbol mappings
    if (!opts.noMappings) {
        for (const mapping of mappings) {
            result = result.replace(mapping.pattern, mapping.replacement);
        }
    }

    // Step 5 — \text{}
    result = convertText(result);

    // Step 6 — \tag{}
    result = convertTag(result);

    // Step 7 — \binom, \label, \ref, \eqref, \notag
    result = convertBinom(result);
    result = convertRefs(result);
    result = convertNotag(result);

    // Step 8 — subscripts
    if (!opts.noSubscripts) {
        result = convertSubscripts(result);
    }

    // Step 9 — superscripts
    if (!opts.noSuperscripts) {
        result = convertSuperscripts(result);
    }

    // Step 10 — fractions
    if (!opts.noFractions) {
        result = convertFractions(result);
    }

    // Step 11 — roots
    if (!opts.noRoots) {
        result = convertRoots(result);
    }

    // Step 12 — cleanup
    result = cleanup(result);

    // Step 13 — restore code blocks
    result = restoreCodeBlocks(result, blocks);

    return result;
}
