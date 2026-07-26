export interface Mapping {
    pattern: RegExp;
    replacement: string;
}

export interface CodeBlock {
    id: string;
    content: string;
}

export interface ConvertOptions {
    dryRun?: boolean;
    diff?: boolean;
    verbose?: boolean;
    noSubscripts?: boolean;
    noSuperscripts?: boolean;
    noFractions?: boolean;
    noRoots?: boolean;
    noMappings?: boolean;
    noStripping?: boolean;
    noEnvironments?: boolean;
    yes?: boolean;
    smartFormat?: boolean;
}
