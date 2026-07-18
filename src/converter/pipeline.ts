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
import { convertLim, convertFunctions } from "./functions.js";
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
    stripBoxes,
    stripPhantomCommands,
    stripExtensibleArrows,
    stripAccents,
} from "./stripping.js";
import { stripEnvironments, stripHlines } from "./environments.js";
import { ConvertOptions } from "../types/mapping.js";
import { setConverter } from "./convert-inner.js";

/**
 * Full conversion pipeline.
 *
 * Step order is critical:
 *  1. Protect code blocks
 *  2. Strip $...$, $$...$$ delimiters
 *  3. Strip \[...\] display math delimiters
 *  4. Strip \displaystyle, \textstyle, \scriptstyle, \scriptscriptstyle
 *  5. Convert \pmod{} (before symbol mappings — prevents \pm from breaking \pmod)
 *  6. Convert \lim to lim (...) format (before mappings consume \lim)
 *  7. Apply symbol mappings (greek, operators, arrows)
 *  8. Convert \text{} → plain
 *  9. Convert \tag{} → (content)
 * 10. Strip font commands (\mathrm{}, \mathbf{}, etc.)
 * 11. Strip color commands (\color{}{}, \textcolor{}{})
 * 12. Strip cancel, sout, underline, overline, under/overbrace
 * 13. Strip phantom commands
 * 14. Strip accent commands (\vec{}, \hat{}, \bar{}, etc.)
 * 15. Strip invisible delimiters (\left., \right.)
 * 16. Strip environment wrappers (\begin{...}/\end{...}), \hline
 * 17. Convert \binom, \over, \choose, \atop, \label, \ref, \eqref, \notag
 * 18. Convert subscripts
 * 19. Convert superscripts
 * 20. Convert fractions
 * 21. Convert roots
 * 22. Add function parenthesization (sin x → sin(x))
 * 23. Cleanup whitespace
 * 24. Restore code blocks
 */
export function runPipeline(text: string, opts: ConvertOptions = {}): string {
    // Inject self-reference for recursive inner conversion
    setConverter((t: string) => runPipeline(t, opts));

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

    // Step 6 — \lim handling (before symbol mappings consume \lim)
    result = convertLim(result);

    // Step 7 — symbol mappings
    if (!opts.noMappings) {
        for (const mapping of mappings) {
            result = result.replace(mapping.pattern, mapping.replacement);
        }
    }

    // Step 8 — \text{}
    result = convertText(result);

    // Step 9 — \tag{}
    result = convertTag(result);

    // Steps 10-16 — stripping (font, color, cancel, accents, environments, etc.)
    if (!opts.noStripping) {
        // Step 10 — strip font commands (\mathrm, \mathbf, etc.)
        result = stripFontCommands(result);

        // Step 11 — strip color commands
        result = stripColorCommands(result);

        // Step 12 — strip cancel, sout, underline, overline, braces
        result = stripCancelCommands(result);
        result = stripSout(result);
        result = stripUnderlineOverline(result);
        result = stripOverUnderBraces(result);
        result = stripBoxes(result);
        result = stripExtensibleArrows(result);

        // Step 13 — strip phantom commands
        result = stripPhantomCommands(result);

        // Step 14 — strip accent commands (\vec, \hat, \bar, etc.)
        result = stripAccents(result);

        // Step 15 — strip invisible delimiters
        result = stripInvisibleDelimiters(result);
    }

    // Step 16 — strip environments and hlines
    if (!opts.noEnvironments) {
        result = stripEnvironments(result);
        result = stripHlines(result);
    }

    // Step 17 — \binom, \over, \choose, \atop, \label, \ref, \eqref, \notag
    result = convertBinom(result);
    result = convertOver(result);
    result = convertChoose(result);
    result = convertAtop(result);
    result = convertRefs(result);
    result = convertNotag(result);

    // Step 18 — subscripts
    if (!opts.noSubscripts) {
        result = convertSubscripts(result);
    }

    // Step 19 — superscripts
    if (!opts.noSuperscripts) {
        result = convertSuperscripts(result);
    }

    // Step 20 — fractions
    if (!opts.noFractions) {
        result = convertFractions(result);
    }

    // Step 21 — roots
    if (!opts.noRoots) {
        result = convertRoots(result);
    }

    // Step 22 — function parenthesization (sin x → sin(x))
    if (!opts.noMappings) {
        result = convertFunctions(result);
    }

    // Step 23 — cleanup
    result = cleanup(result);

    // Step 24 — restore code blocks
    result = restoreCodeBlocks(result, blocks);

    return result;
}
