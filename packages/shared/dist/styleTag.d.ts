import { type StyleX } from "./styleX";
type StyleEntry = [(string | [string, string]), [string, string]];
export declare function getStyleEntries(stylex: StyleX, id: string): StyleEntry[];
export declare function createCssRulesestBlock(stylex: StyleX, id: string): string;
export declare function createStyleTagElement(settings?: {
    id: string;
    append?: boolean | HTMLElement;
    content?: string;
}): HTMLStyleElement;
export {};
//# sourceMappingURL=styleTag.d.ts.map