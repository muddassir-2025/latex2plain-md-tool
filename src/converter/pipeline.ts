import { mappings } from "../mappings/index.js";
import { protectCodeBlocks, restoreCodeBlocks } from "./codeblocks.js";
import { protectUrls, restoreUrls } from "./protect-urls.js";
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
 *  1. Protect URLs (standalone, links, images) from false LaTeX conversion
 *  2. Protect code blocks
 *  3. Strip $...$, $$...$$ delimiters
 *  4. Strip \[...\] display math delimiters
 *  5. Strip \displaystyle, \textstyle, \scriptstyle, \scriptscriptstyle
 *  6. Convert \pmod{} (before symbol mappings — prevents \pm from breaking \pmod)
 *  7. Convert \lim to lim (...) format (before mappings consume \lim)
 *  8. Apply symbol mappings (greek, operators, arrows)
 *  9. Convert \text{} → plain
 * 10. Convert \tag{} → (content)
 * 11. Strip font commands (\mathrm{}, \mathbf{}, etc.)
 * 12. Strip color commands (\color{}{}, \textcolor{}{})
 * 13. Strip cancel, sout, underline, overline, under/overbrace
 * 14. Strip phantom commands
 * 15. Strip accent commands (\vec{}, \hat{}, \bar{}, etc.)
 * 16. Strip invisible delimiters (\left., \right.)
 * 17. Strip environment wrappers (\begin{...}/\end{...}), \hline
 * 18. Convert \binom, \over, \choose, \atop, \label, \ref, \eqref, \notag
 * 19. Convert subscripts
 * 20. Convert superscripts
 * 21. Convert fractions
 * 22. Convert roots
 * 23. Add function parenthesization (sin x → sin(x))
 * 24. Cleanup whitespace
 * 25. Restore code blocks
 * 26. Restore URLs
 */
export function runPipeline(text: string, opts: ConvertOptions = {}): string {
    // Inject self-reference for recursive inner conversion
    setConverter((t: string) => runPipeline(t, opts));

    // Step 1 — protect URLs (before any conversion that could corrupt them)
    const { text: urlProtected, blocks: urlBlocks } = protectUrls(text);
    let result = urlProtected;

    // Step 2 — protect code blocks
    const { text: cbProtected, blocks: cbBlocks } = protectCodeBlocks(result);
    result = cbProtected;

    // Step 3 — strip $...$ and $$...$$
    result = stripDollars(result);

    // Step 4 — strip \[...\] display math
    result = stripDisplayMath(result);

    // Step 5 — strip \displaystyle, \textstyle, etc.
    result = stripStyleCommands(result);

    // Step 6 — \pmod{} (must run before symbol mappings)
    result = convertPmod(result);

    // Step 7 — \lim handling (before symbol mappings consume \lim)
    result = convertLim(result);

    // Step 8 — symbol mappings
    if (!opts.noMappings) {
        for (const mapping of mappings) {
            result = result.replace(mapping.pattern, mapping.replacement);
        }
    }

    // Step 9 — \text{}
    result = convertText(result);

    // Step 10 — \tag{}
    result = convertTag(result);

    // Steps 11-17 — stripping (font, color, cancel, accents, environments, etc.)
    if (!opts.noStripping) {
        // Step 11 — strip font commands (\mathrm, \mathbf, etc.)
        result = stripFontCommands(result);

        // Step 12 — strip color commands
        result = stripColorCommands(result);

        // Step 13 — strip cancel, sout, underline, overline, braces
        result = stripCancelCommands(result);
        result = stripSout(result);
        result = stripUnderlineOverline(result);
        result = stripOverUnderBraces(result);
        result = stripBoxes(result);
        result = stripExtensibleArrows(result);

        // Step 14 — strip phantom commands
        result = stripPhantomCommands(result);

        // Step 15 — strip accent commands (\vec, \hat, \bar, etc.)
        result = stripAccents(result);

        // Step 16 — strip invisible delimiters
        result = stripInvisibleDelimiters(result);
    }

    // Step 17 — strip environments and hlines
    if (!opts.noEnvironments) {
        result = stripEnvironments(result);
        result = stripHlines(result);
    }

    // Step 18 — \binom, \over, \choose, \atop, \label, \ref, \eqref, \notag
    result = convertBinom(result);
    result = convertOver(result);
    result = convertChoose(result);
    result = convertAtop(result);
    result = convertRefs(result);
    result = convertNotag(result);

    // Step 19 — subscripts
    if (!opts.noSubscripts) {
        result = convertSubscripts(result);
    }

    // Step 20 — superscripts
    if (!opts.noSuperscripts) {
        result = convertSuperscripts(result);
    }

    // Step 21 — fractions
    if (!opts.noFractions) {
        result = convertFractions(result);
    }

    // Step 22 — roots
    if (!opts.noRoots) {
        result = convertRoots(result);
    }

    // Step 23 — function parenthesization (sin x → sin(x))
    if (!opts.noMappings) {
        result = convertFunctions(result);
    }

    // Step 24 — cleanup
    result = cleanup(result);

    // Step 25 — restore code blocks
    result = restoreCodeBlocks(result, cbBlocks);

    // Step 26 — restore URLs
    result = restoreUrls(result, urlBlocks);

    return result;
}
