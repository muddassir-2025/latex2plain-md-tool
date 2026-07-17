import { mappings } from "../mappings/index.js";
import { protectCodeBlocks, restoreCodeBlocks } from "./codeblocks.js";
import { stripDollars } from "./dollars.js";
import { convertText, convertTag } from "./text.js";
import {
    convertBinom,
    convertPmod,
    convertRefs,
    convertNotag,
    convertOver,
    convertChoose,
    convertAtop,
} from "./structural.js";
import { convertSubscripts } from "./subscript.js";
import { convertSuperscripts } from "./superscript.js";
import { convertFractions } from "./fractions.js";
import { convertRoots } from "./roots.js";
import { cleanup } from "./cleanup.js";
import {
    stripDisplayMath,
    stripStyleCommands,
    stripInvisibleDelimiters,
    stripFontCommands,
    stripColorCommands,
    stripCancelCommands,
    stripSout,
    stripUnderlineOverline,
    stripOverUnderBraces,
    stripBoxed,
    stripPhantomCommands,
    stripAccents,
} from "./stripping.js";
import { stripEnvironments, stripHlines } from "./environments.js";
import { ConvertOptions } from "../types/mapping.js";

/**
 * Full conversion pipeline.
 *
 * Step order is critical:
 *  1. Protect code blocks
 *  2. Strip $...$, $$...$$ delimiters
 *  3. Strip \[...\] display math delimiters
 *  4. Strip \displaystyle, \textstyle, \scriptstyle, \scriptscriptstyle
 *  5. Convert \pmod{} (before symbol mappings — prevents \pm from breaking \pmod)
 *  6. Apply symbol mappings (greek, operators, arrows)
 *  7. Convert \text{} → plain
 *  8. Convert \tag{} → (content)
 *  9. Strip font commands (\mathrm{}, \mathbf{}, etc.)
 * 10. Strip color commands (\color{}{}, \textcolor{}{})
 * 11. Strip cancel, sout, underline, overline, under/overbrace
 * 12. Strip phantom commands
 * 13. Strip accent commands (\vec{}, \hat{}, \bar{}, etc.)
 * 14. Strip invisible delimiters (\left., \right.)
 * 15. Strip environment wrappers (\begin{...}/\end{...}), \hline
 * 16. Convert \binom, \over, \choose, \atop, \label, \ref, \eqref, \notag
 * 17. Convert subscripts
 * 18. Convert superscripts
 * 19. Convert fractions
 * 20. Convert roots
 * 21. Cleanup whitespace
 * 22. Restore code blocks
 */
export function runPipeline(text: string, opts: ConvertOptions = {}): string {
    // Step 1 — protect code blocks
    const { text: protected_, blocks } = protectCodeBlocks(text);
    let result = protected_;

    // Step 2 — strip $...$ and $$...$$
    result = stripDollars(result);

    // Step 3 — strip \[...\] display math
    result = stripDisplayMath(result);

    // Step 4 — strip \displaystyle, \textstyle, etc.
    result = stripStyleCommands(result);

    // Step 5 — \pmod{} (must run before symbol mappings)
    result = convertPmod(result);

    // Step 6 — symbol mappings
    if (!opts.noMappings) {
        for (const mapping of mappings) {
            result = result.replace(mapping.pattern, mapping.replacement);
        }
    }

    // Step 7 — \text{}
    result = convertText(result);

    // Step 8 — \tag{}
    result = convertTag(result);

    // Steps 9-15 — stripping (font, color, cancel, accents, environments, etc.)
    if (!opts.noStripping) {
        // Step 9 — strip font commands (\mathrm, \mathbf, etc.)
        result = stripFontCommands(result);

        // Step 10 — strip color commands
        result = stripColorCommands(result);

        // Step 11 — strip cancel, sout, underline, overline, braces
        result = stripCancelCommands(result);
        result = stripSout(result);
        result = stripUnderlineOverline(result);
        result = stripOverUnderBraces(result);
        result = stripBoxed(result);

        // Step 12 — strip phantom commands
        result = stripPhantomCommands(result);

        // Step 13 — strip accent commands (\vec, \hat, \bar, etc.)
        result = stripAccents(result);

        // Step 14 — strip invisible delimiters
        result = stripInvisibleDelimiters(result);
    }

    // Step 15 — strip environments and hlines
    if (!opts.noEnvironments) {
        result = stripEnvironments(result);
        result = stripHlines(result);
    }

    // Step 16 — \binom, \over, \choose, \atop, \label, \ref, \eqref, \notag
    result = convertBinom(result);
    result = convertOver(result);
    result = convertChoose(result);
    result = convertAtop(result);
    result = convertRefs(result);
    result = convertNotag(result);

    // Step 17 — subscripts
    if (!opts.noSubscripts) {
        result = convertSubscripts(result);
    }

    // Step 18 — superscripts
    if (!opts.noSuperscripts) {
        result = convertSuperscripts(result);
    }

    // Step 19 — fractions
    if (!opts.noFractions) {
        result = convertFractions(result);
    }

    // Step 20 — roots
    if (!opts.noRoots) {
        result = convertRoots(result);
    }

    // Step 21 — cleanup
    result = cleanup(result);

    // Step 22 — restore code blocks
    result = restoreCodeBlocks(result, blocks);

    return result;
}
