import { mappings } from "../mappings/index.js";
export function applyMappings(text) {
    for (const mapping of mappings) {
        text = text.replace(mapping.pattern, mapping.replacement);
    }
    return text;
}
