// import { getStyleEntries, createCssRulesestBlock } from "@stylex/shared/styleTag";
import {
  type StyleX,
  type StyleSet,
  type StyleXEntry,
  type ValueDynamicTuple,
  type ValueDynamic,
  type ValueDynamicTupleSelector,
  getDynamicTupleSelectorType,
  ValueDynamicTupleSelectorType,
  splitValueDynamicTupleSelectorAttribute,
  splitValueDynamic,
  HierarchySelectorType,
} from "@stylex/shared/styleX";
import camelCase from "lodash/camelCase";

export function setStyleProperty(
  element: HTMLElement,
  name: string,
  value: string | null
) {
  if (name.startsWith("transform-")) {
    let functionName = camelCase(name.replace("transform", ""));
    if (functionName.includes("3D")) {
      functionName = functionName.replace("3D", "3d");
    }

    const existingTransform = element.style.transform;
    const existingTransformParts = parseTransformTuples(existingTransform);

    const foundTuple = existingTransformParts.find(
      (t) => t[0] === functionName
    );
    if (foundTuple) {
      if (value) {
        foundTuple[1] = `(${value})`;
      } else {
        const index = existingTransformParts.indexOf(foundTuple);
        existingTransformParts.splice(index, 1);
      }
    } else {
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

function parseTransformTuples(str: string) {
  const regex = /([a-zA-Z0-9]+)(\([^)]*\))/g;
  const result = [];
  let match;

  while ((match = regex.exec(str)) !== null) {
    result.push([match[1], match[2]]);
  }

  return result;
}

export function convertStyleXToStyleSet(
  el: HTMLElement,
  styleX: StyleX
): StyleSet {
  const styleSet: StyleSet = {};
  (Object.entries(styleX) as StyleXEntry[]).forEach(([key, val]) => {
    if (typeof val === "string") {
      styleSet[key] = val;
    } else {
      styleSet[key] = getCssPropertyValueFromValueDynamic(val, el);
    }
  });

  return styleSet;
}

export function getCssPropertyValueFromValueDynamic(
  value: ValueDynamic,
  el: HTMLElement
): string | undefined {
  const [tuples, fallback] = splitValueDynamic(value);
  for (const [selector, propertyValue] of tuples) {
    if (isSelectorMatches(selector, el)) {
      return propertyValue;
    }
  }
  return fallback;
}

export function isSelectorMatches(
  selector: ValueDynamicTupleSelector,
  element: HTMLElement
) {
  const [selectorType, selectorValue, selectorHierarchy] =
    getDynamicTupleSelectorType(selector);

  if (selectorHierarchy) {
    let hierarchyElement: HTMLElement | undefined;
    switch (selectorHierarchy[0]) {
      case HierarchySelectorType.Parent:
        hierarchyElement = element.closest(
          `[data-stylex-id="${selectorHierarchy[1]}"]`
        ) as HTMLElement | undefined;
        break;
      case HierarchySelectorType.Child:
        hierarchyElement = element.querySelector(
          `[data-stylex-id="${selectorHierarchy[1]}"]`
        ) as HTMLElement | undefined;
        break;
      case HierarchySelectorType.Sibling:
        hierarchyElement = element.parentElement?.querySelector(
          `[data-stylex-id="${selectorHierarchy[1]}"]`
        ) as HTMLElement | undefined;
        break;
    }
    if (hierarchyElement) {
      element = hierarchyElement;
    } else {
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
      const [attrName, attrValue] =
        splitValueDynamicTupleSelectorAttribute(selectorValue);
      const fullAttrName = `data-stylex-${attrName}`;
      if (
        !attrValue
          ? element?.hasAttribute(fullAttrName)
          : element?.getAttribute(fullAttrName) === attrValue
      ) {
        return true;
      }
      break;
  }
  return false;
}

export function createEventListenerWithCleanupFactory() {
  const listeners: [EventTarget, string, (e: Event) => void][] = [];

  return [
    (target: EventTarget, event: string, handler: (e: Event) => void) => {
      target.addEventListener(event, handler);
      listeners.push([target, event, handler]);
    },
    () => {
      listeners.forEach(([target, event, handler]) => {
        target.removeEventListener(event, handler);
      });
    },
  ] as const;
}

export function createObserveWithCleanupFactory() {
  const observers: MutationObserver[] = [];
  return [
    (
      target: Element,
      options: MutationObserverInit,
      callback: MutationCallback
    ) => {
      const observer = new MutationObserver(callback);
      observer.observe(target, options);
      observers.push(observer);
    },
    () => {
      observers.forEach((observer) => {
        observer.disconnect();
      });
    },
  ] as const;
}

export interface MediaObserversAPI {
  set(media: string, cb: () => void): MediaObserversAPI;
  remove(media: string, cb: () => void): boolean;
}

const _mediaObserversMap = new Map<
  string,
  [MediaQueryList, () => void, (() => void)[]]
>();
const _mediaObservers = new Proxy(_mediaObserversMap, {
  get(target, prop, receiver) {
    if (prop === "set") {
      return (mediaString: string, callback: () => void) => {
        const mediaSelecotr = mediaString.replace("@media", "").trim();
        if (target.has(mediaSelecotr)) {
          const [_one, _two, callbacks] = target.get(mediaSelecotr);
          callbacks.push(callback);
        } else {
          const callbacks: (() => void)[] = [callback];
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
      return (mediaString: string, callback: () => void) => {
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
}) as unknown as MediaObserversAPI;

export function createMediaListenerWithCleanupFactory() {
  const listeners: [string, () => void][] = [];
  return [
    (mediaString: string, callback: () => void) => {
      _mediaObservers.set(mediaString, callback);
      listeners.push([mediaString, callback]);
    },
    () => {
      listeners.forEach(([mediaString, callback]) => {
        _mediaObservers.remove(mediaString, callback);
      });
    },
  ] as const;
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
