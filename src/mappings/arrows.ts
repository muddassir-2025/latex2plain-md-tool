import { Mapping } from "../types/mapping.js";

export const arrows: Mapping[] = [
    // Basic single arrows
    { pattern: /\\\\rightarrow/g, replacement: "→" },
    { pattern: /\\\\to\\b/g, replacement: "→" },
    { pattern: /\\\\leftarrow/g, replacement: "←" },
    { pattern: /\\\\gets\\b/g, replacement: "←" },
    { pattern: /\\\\leftrightarrow/g, replacement: "↔" },
    { pattern: /\\\\uparrow/g, replacement: "↑" },
    { pattern: /\\\\downarrow/g, replacement: "↓" },
    { pattern: /\\\\updownarrow/g, replacement: "↕" },

    // Double arrows
    { pattern: /\\\\Rightarrow/g, replacement: "⇒" },
    { pattern: /\\\\Leftarrow/g, replacement: "⇐" },
    { pattern: /\\\\Leftrightarrow/g, replacement: "⟺" },
    { pattern: /\\\\Uparrow/g, replacement: "⇑" },
    { pattern: /\\\\Downarrow/g, replacement: "⇓" },
    { pattern: /\\\\Updownarrow/g, replacement: "⇕" },

    // Long arrows
    { pattern: /\\\\longrightarrow/g, replacement: "⟶" },
    { pattern: /\\\\longleftarrow/g, replacement: "⟵" },
    { pattern: /\\\\longleftrightarrow/g, replacement: "⟷" },
    { pattern: /\\\\Longrightarrow/g, replacement: "⟹" },
    { pattern: /\\\\Longleftarrow/g, replacement: "⟸" },
    { pattern: /\\\\Longleftrightarrow/g, replacement: "⟺" },

    // Hook / tail arrows
    { pattern: /\\\\hookrightarrow/g, replacement: "↪" },
    { pattern: /\\\\hookleftarrow/g, replacement: "↩" },
    { pattern: /\\\\twoheadrightarrow/g, replacement: "↠" },
    { pattern: /\\\\twoheadleftarrow/g, replacement: "↞" },

    // Harpoons
    { pattern: /\\\\rightharpoonup/g, replacement: "⇀" },
    { pattern: /\\\\rightharpoondown/g, replacement: "⇁" },
    { pattern: /\\\\leftharpoonup/g, replacement: "↼" },
    { pattern: /\\\\leftharpoondown/g, replacement: "↽" },
    { pattern: /\\\\rightleftharpoons/g, replacement: "⇌" },
    { pattern: /\\\\leftrightharpoons/g, replacement: "⇋" },

    // Diagonal arrows
    { pattern: /\\\\nearrow/g, replacement: "↗" },
    { pattern: /\\\\searrow/g, replacement: "↘" },
    { pattern: /\\\\swarrow/g, replacement: "↙" },
    { pattern: /\\\\nwarrow/g, replacement: "↖" },

    // Semantic / logic arrows
    { pattern: /\\\\iff/g, replacement: "⟺" },
    { pattern: /\\\\implies/g, replacement: "⟹" },
    { pattern: /\\\\impliedby/g, replacement: "⟸" },
    { pattern: /\\\\mapsto/g, replacement: "↦" },
    { pattern: /\\\\longmapsto/g, replacement: "⟼" },
];
