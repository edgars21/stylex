import { type StyleX, type StyleSet, type ValueDynamic, type ValueDynamicTupleSelector } from "@stylex/shared/styleX";
export declare function setStyleProperty(element: HTMLElement, name: string, value: string | null): void;
export declare function convertStyleXToStyleSet(el: HTMLElement, styleX: StyleX): StyleSet;
export declare function getCssPropertyValueFromValueDynamic(value: ValueDynamic, el: HTMLElement): string | undefined;
export declare function isSelectorMatches(selector: ValueDynamicTupleSelector, element: HTMLElement): boolean;
export declare function createEventListenerWithCleanupFactory(): readonly [(target: EventTarget, event: string, handler: (e: Event) => void) => void, () => void];
export declare function createObserveWithCleanupFactory(): readonly [(target: Element, options: MutationObserverInit, callback: MutationCallback) => void, () => void];
export interface MediaObserversAPI {
    set(media: string, cb: () => void): MediaObserversAPI;
    remove(media: string, cb: () => void): boolean;
}
export declare function createMediaListenerWithCleanupFactory(): readonly [(mediaString: string, callback: () => void) => void, () => void];
//# sourceMappingURL=index.d.ts.map