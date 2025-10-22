import { convertStyleXValidSolidTypeToStyleX, getDynamicTupleSelectorType, ValueDynamicTupleSelectorType, splitValueDynamicTupleSelectorAttribute, HierarchySelectorType, } from "@stylex/shared/styleX";
import { createEffect, createSignal, onCleanup } from "solid-js";
import { setStyleProperty, convertStyleXToStyleSet, createEventListenerWithCleanupFactory, createObserveWithCleanupFactory, createMediaListenerWithCleanupFactory, } from "@stylex/web";
import "solid-js";
function convertStyleXValidSolidTypeToStyleXValidJsType(value) {
    const result = {};
    Object.entries(value).forEach(([key, val]) => {
        if (typeof val === "string") {
            result[key] = val;
        }
        else {
            let array = [];
            for (const item of val) {
                if (typeof item === "string") {
                    array.push(item);
                }
                else {
                    const [selector, propertyValue] = item;
                    if (typeof selector === "boolean") {
                        if (selector) {
                            array = array.filter((v) => typeof v !== "string");
                            array.push(propertyValue);
                            result[key] = array;
                            return;
                        }
                    }
                    else {
                        array.push([selector, propertyValue]);
                    }
                }
            }
            if (array.length > 0) {
                result[key] = array;
            }
        }
    });
    return result;
}
function readAttributeSelectors(value) {
    const selectors = [];
    Object.entries(value).forEach(([key, val]) => {
        if (typeof val !== "string") {
            for (const item of val) {
                if (typeof item !== "string") {
                    const [selector] = item;
                    if (typeof selector === "string") {
                        selectors.push(selector);
                    }
                }
            }
        }
    });
    return selectors;
}
export function stylexx(element, value) {
    const stylexPossibleValue = convertStyleXValidSolidTypeToStyleXValidJsType(value);
    const stylex = convertStyleXValidSolidTypeToStyleX(stylexPossibleValue);
    const styleSet = convertStyleXToStyleSet(element, stylex);
    Object.entries(styleSet)
        .sort(([a], [b]) => (a === "transform" ? -1 : b === "transform" ? 1 : 0))
        .forEach(([key, val]) => {
        setStyleProperty(element, key, val);
    });
}
export function stylex(element, callback) {
    const [listenWithCleanup, listenerCleanup] = createEventListenerWithCleanupFactory();
    const [observeWithCleanup, observerCleanup] = createObserveWithCleanupFactory();
    const [listeneMediaWithCleanup, mediaListenerCleanup] = createMediaListenerWithCleanupFactory();
    const [rerender, setRerender] = createSignal(0);
    let init = false;
    onCleanup(() => {
        listenerCleanup();
        observerCleanup();
        mediaListenerCleanup();
    });
    createEffect(() => {
        rerender();
        const value = callback();
        if (!init) {
            init = true;
            const selectors = readAttributeSelectors(value);
            selectors.forEach((selector) => {
                const [selectorType, selectorValue, selectorHierarchy] = getDynamicTupleSelectorType(selector);
                let elementToCheck = element;
                if (selectorHierarchy) {
                    let hierarchyElement;
                    switch (selectorHierarchy[0]) {
                        case HierarchySelectorType.Parent:
                            hierarchyElement = element.closest(`[data-stylex-id="${selectorHierarchy[1]}"]`);
                            break;
                        case HierarchySelectorType.Child:
                            hierarchyElement = element.querySelector(`[data-stylex-id="${selectorHierarchy[1]}"]`);
                            break;
                    }
                    if (hierarchyElement) {
                        elementToCheck = hierarchyElement;
                    }
                    else {
                        return false;
                    }
                }
                switch (selectorType) {
                    case ValueDynamicTupleSelectorType.Media:
                        listeneMediaWithCleanup(selectorValue.replace("@media", ""), () => {
                            setRerender((v) => v + 1);
                        });
                        break;
                    case ValueDynamicTupleSelectorType.PseudoHover:
                        listenWithCleanup(elementToCheck, "mouseenter", () => {
                            setRerender((v) => v + 1);
                        });
                        listenWithCleanup(elementToCheck, "mouseleave", () => {
                            setRerender((v) => v + 1);
                        });
                        break;
                    case ValueDynamicTupleSelectorType.PseudoActive:
                        let isDown = false;
                        listenWithCleanup(elementToCheck, "pointerdown", () => {
                            isDown = true;
                            setRerender((v) => v + 1);
                        });
                        listenWithCleanup(window, "pointerup", () => {
                            if (isDown) {
                                isDown = false;
                                setRerender((v) => v + 1);
                            }
                        });
                        break;
                    case ValueDynamicTupleSelectorType.Attribute:
                        const [attrName, attrValuey] = splitValueDynamicTupleSelectorAttribute(selectorValue);
                        const fullAttrName = `data-stylex-${attrName}`;
                        observeWithCleanup(elementToCheck, { attributes: true }, (mutations) => {
                            for (const m of mutations) {
                                if (m.type === "attributes") {
                                    if (m.attributeName === fullAttrName) {
                                        setRerender((v) => v + 1);
                                    }
                                }
                            }
                        });
                        break;
                }
            });
        }
        stylexx(element, value);
    });
}
//# sourceMappingURL=index.js.map