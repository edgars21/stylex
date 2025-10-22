// import { getStyleEntries, createCssRulesestBlock } from "@stylex/shared/styleTag";
import { getDynamicTupleSelectorType, ValueDynamicTupleSelectorType, splitValueDynamicTupleSelectorAttribute, splitValueDynamic, HierarchySelectorType, } from "@stylex/shared/styleX";
import camelCase from "lodash/camelCase";
export function setStyleProperty(element, name, value) {
    if (name.startsWith("transform-")) {
        let functionName = camelCase(name.replace("transform", ""));
        if (functionName.includes("3D")) {
            functionName = functionName.replace("3D", "3d");
        }
        const existingTransform = element.style.transform;
        const existingTransformParts = parseTransformTuples(existingTransform);
        const foundTuple = existingTransformParts.find((t) => t[0] === functionName);
        if (foundTuple) {
            if (value) {
                foundTuple[1] = `(${value})`;
            }
            else {
                const index = existingTransformParts.indexOf(foundTuple);
                existingTransformParts.splice(index, 1);
            }
        }
        else {
            if (value) {
                existingTransformParts.push([functionName, `(${value})`]);
            }
        }
        value = existingTransformParts.map((t) => t.join("")).join(" ");
        name = "transform";
    }
    value != null
        ? element.style.setProperty(name, value)
        : element.style.removeProperty(name);
}
function parseTransformTuples(str) {
    const regex = /([a-zA-Z0-9]+)(\([^)]*\))/g;
    const result = [];
    let match;
    while ((match = regex.exec(str)) !== null) {
        result.push([match[1], match[2]]);
    }
    return result;
}
export function convertStyleXToStyleSet(el, styleX) {
    const styleSet = {};
    Object.entries(styleX).forEach(([key, val]) => {
        if (typeof val === "string") {
            styleSet[key] = val;
        }
        else {
            styleSet[key] = getCssPropertyValueFromValueDynamic(val, el);
        }
    });
    return styleSet;
}
export function getCssPropertyValueFromValueDynamic(value, el) {
    const [tuples, fallback] = splitValueDynamic(value);
    for (const [selector, propertyValue] of tuples) {
        if (isSelectorMatches(selector, el)) {
            return propertyValue;
        }
    }
    return fallback;
}
export function isSelectorMatches(selector, element) {
    const [selectorType, selectorValue, selectorHierarchy] = getDynamicTupleSelectorType(selector);
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
            element = hierarchyElement;
        }
        else {
            return false;
        }
    }
    switch (selectorType) {
        case ValueDynamicTupleSelectorType.Media:
            if (window.matchMedia(selectorValue.replace("@media", "")).matches) {
                return true;
            }
            break;
        case ValueDynamicTupleSelectorType.PseudoHover:
            if (element.matches(":hover")) {
                return true;
            }
            break;
        case ValueDynamicTupleSelectorType.PseudoActive:
            if (element.matches(":active")) {
                return true;
            }
            break;
        case ValueDynamicTupleSelectorType.Attribute:
            const [attrName, attrValue] = splitValueDynamicTupleSelectorAttribute(selectorValue);
            const fullAttrName = `data-stylex-${attrName}`;
            if (!attrValue
                ? element?.hasAttribute(fullAttrName)
                : element?.getAttribute(fullAttrName) === attrValue) {
                return true;
            }
            break;
    }
    return false;
}
export function createEventListenerWithCleanupFactory() {
    const listeners = [];
    return [
        (target, event, handler) => {
            target.addEventListener(event, handler);
            listeners.push([target, event, handler]);
        },
        () => {
            listeners.forEach(([target, event, handler]) => {
                target.removeEventListener(event, handler);
            });
        },
    ];
}
export function createObserveWithCleanupFactory() {
    const observers = [];
    return [
        (target, options, callback) => {
            const observer = new MutationObserver(callback);
            observer.observe(target, options);
            observers.push(observer);
        },
        () => {
            observers.forEach((observer) => {
                observer.disconnect();
            });
        },
    ];
}
const _mediaObserversMap = new Map();
const _mediaObservers = new Proxy(_mediaObserversMap, {
    get(target, prop, receiver) {
        if (prop === "set") {
            return (mediaString, callback) => {
                const mediaSelecotr = mediaString.replace("@media", "").trim();
                if (target.has(mediaSelecotr)) {
                    const [_one, _two, callbacks] = target.get(mediaSelecotr);
                    callbacks.push(callback);
                }
                else {
                    const callbacks = [callback];
                    const mql = window.matchMedia(mediaSelecotr);
                    const changeCallback = () => {
                        callbacks.forEach((cb) => cb());
                    };
                    mql.addEventListener("change", changeCallback);
                    Map.prototype.set.call(target, mediaSelecotr, [
                        mql,
                        changeCallback,
                        callbacks,
                    ]);
                }
                return target;
            };
        }
        if (prop === "remove") {
            return (mediaString, callback) => {
                const mediaSelecotr = mediaString.replace("@media", "").trim();
                if (target.has(mediaSelecotr)) {
                    const [mql, changeCallback, callbacks] = target.get(mediaSelecotr);
                    const index = callbacks.indexOf(callback);
                    if (index !== -1) {
                        callbacks.splice(index, 1);
                        if (callbacks.length === 0) {
                            mql.removeEventListener("change", changeCallback);
                            Map.prototype.delete.call(target, mediaSelecotr);
                        }
                        return true;
                    }
                }
                return false;
            };
        }
        // pass through everything else
        return Reflect.get(target, prop, receiver);
    },
});
export function createMediaListenerWithCleanupFactory() {
    const listeners = [];
    return [
        (mediaString, callback) => {
            _mediaObservers.set(mediaString, callback);
            listeners.push([mediaString, callback]);
        },
        () => {
            listeners.forEach(([mediaString, callback]) => {
                _mediaObservers.remove(mediaString, callback);
            });
        },
    ];
}
// export function watchWithCleanupFactory() {
//   const callbacks: (() => void)[] = [];
//   return [
//     (
//       media: string,
//       callback: () => void
//     ) => {
//       const observer = new MutationObserver(callback);
//       observer.observe(target, options);
//       observers.push(observer);
//     },
//     () => {
//       observers.forEach((observer) => {
//         observer.disconnect();
//       });
//     },
//   ] as const;
// }
// export function initParse(start = document.body) {
//   parse(start);
//   const styleEl = document.createElement("style");
//   styleEl.setAttribute("data-stylex", "");
//   styleEl.textContent = styleEntries.join("\n");
//   document.head.appendChild(styleEl);
// }
// function parse(node: Node) {
//   if (node instanceof HTMLElement) {
//     const styleXAttr =
//       node.getAttribute("data-stylex") ||
//       node.getAttribute("data-sx") ||
//       node.getAttribute("stylex") ||
//       node.getAttribute("sx");
//     if (styleXAttr) {
//       node.removeAttribute("data-stylex");
//       node.removeAttribute("data-sx");
//       node.removeAttribute("stylex");
//       node.removeAttribute("sx");
//       try {
//         const styleXObj = JSON.parse(styleXAttr);
//         let id = node.getAttribute("data-stylex-id");
//         if  (!id) {
//           id = generateId();
//           node.setAttribute("data-stylex-id", id);
//         }
//         const css = createCssRulesestBlock(styleXObj as StyleX, id);
//         styleEntries.push(css);
//         console.log("css", css);
//       } catch (e: any) {
//         console.warn("Failed to parse stylex attribute:", e);
//       }
//     }
//   }
//   const children = [...node.childNodes];
//   if (children.length) {
//     children.forEach(parse);
//   }
// }
// let attempts = 0;
// function generateId() {
//   const id = `sx-${++attempts}`;
//   return id;
// }
// initParse();
//# sourceMappingURL=index.js.map