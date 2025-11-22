// import { getStyleEntries, createCssRulesestBlock } from "@stylex/shared/styleTag";
import {
  type StyleX,
  type StyleSet,
  HierarchySelectorType,
  type StyleXTuple,
  type Value,
  type Selector,
  parseSelector,
  SelectorType,
  splitSelectorTypeAttribute,
  type CssValue,
  type Settings,
} from "@stylex/shared/styleX";
import camelCase from "lodash/camelCase";
//@ts-ignore
import { animate } from "popmotion";

interface PopmotionRunner {
  stop: () => void;
}

interface ExtendedElement {
  stylex?: {
    transitions?: Record<string, () => void>;
  };
}

interface Property {
  name: string;
  value: CssValue | null;
}

export function setStyleProperty(
  init: boolean = false,
  element: HTMLElement & ExtendedElement,
  name: string,
  value: CssValue | null,
  settings?: Settings
) {
  element.stylex = element.stylex || {};

  let property: Property = {
    name,
    value,
  };
  let customProperty: Property | null = null;

  if (name.startsWith("transform-")) {
    [property, customProperty] = transformProperty(element, property);
  }

  const customTransition = !!customProperty;
  let customTransitionRunnerFactory: () => PopmotionRunner;
  let customTransitionRunner: PopmotionRunner;

  if (!init && settings?.transition) {
    element.stylex.transitions = element.stylex.transitions || {};

    const propertyToTransition = customTransition ? customProperty : property;

    const previousListener =
      element.stylex.transitions[propertyToTransition.name];
    if (typeof previousListener === "function") {
      previousListener();
    }

    if (customTransition) {
      const startEnd = customTransitionStartEnd(element, propertyToTransition);
      if (startEnd) {
        customTransitionRunnerFactory = () => {
          return animate({
            from: startEnd.start,
            to: startEnd.end,
            duration: settings.transition,
            onUpdate: (v) => {
              element.style.setProperty(
                propertyToTransition.name,
                `${v.toFixed(2)}${startEnd.unit ? startEnd.unit : ""}`
              );
            },
            onComplete: () => {
              customTransitionRunner = null;
              const listener =
                element.stylex.transitions[propertyToTransition.name];
              if (typeof listener === "function") {
                listener();
              }
            },
          });
        };
      } else {
        setStyle(element, propertyToTransition);
        setStyle(element, property);
      }
    } else {
      const currentTransitionMap = transitionMap(element);
      currentTransitionMap[propertyToTransition.name] = [
        settings.transition + "ms",
        ...((settings.function ? [settings.function] : []) as [string]),
      ];
      element.style.transition = transitionCssValue(currentTransitionMap);
    }

    element.stylex.transitions[propertyToTransition.name] = () => {
      if (customTransition) {
        if (customTransitionRunner) {
          customTransitionRunner.stop();
          customTransitionRunner = null;
        }
        setStyle(element, propertyToTransition);
        if (!value) {
          setStyle(element, property);
        }
      } else {
        const currentTransitionMap = transitionMap(element);
        delete currentTransitionMap[propertyToTransition.name];
        element.style.transition = transitionCssValue(currentTransitionMap);
      }
      if (settings.onEnd) {
        settings.onEnd(element);
      }
    };

    if (settings.onStart) {
      settings.onStart(element);
    }

    if (!customTransition) {
      element.addEventListener(
        "transitionend",
        (e: TransitionEvent) => {
          if (e.propertyName === propertyToTransition.name) {
            const listener =
              element.stylex.transitions[propertyToTransition.name];
            if (typeof listener === "function") {
              listener();
            }
          }
        },
        { once: true }
      );
    }
  }


  if (customProperty) {
    if (customTransitionRunnerFactory) {
      if (value) {
        setStyle(element, property);
      }
      customTransitionRunner = customTransitionRunnerFactory();
    } else {
      setStyle(element, property);
      setStyle(element, customProperty);
    }
  } else {
    setStyle(element, property);
  }
}

function customTransitionStartEnd(element: HTMLElement, transitionProperty: Property): {
  start: number;
  end: number;
  unit: string | null;
} | null {

  const currentValue = element.style.getPropertyValue(transitionProperty.name);
  const startParsed = parseLengthOrPercentage(currentValue);
  const endParsed = parseLengthOrPercentage(transitionProperty.value)

  if (startParsed && endParsed && startParsed[1] === endParsed[1]) {
    return {
      start: startParsed[0],
      end: endParsed[0],
      unit: startParsed[1]
    }
  } else if (!startParsed ) {
    return {
      start: transitionProperty.name.includes("transform-scale") ? 1 : 0,
      end: endParsed[0],
      unit: endParsed[1]
    }

  } else if (!endParsed) {
    return {
      start: startParsed[0],
      end: transitionProperty.name.includes("transform-scale") ? 1 : 0,
      unit: startParsed[1]
    }
  }

  return null
}

function setStyle(element: HTMLElement, property: Property) {
  property.value
    ? element.style.setProperty(property.name, String(property.value))
    : element.style.removeProperty(property.name);
}

function parseLengthOrPercentage(value) {
  if (!value) return null;

  const lengthOrPercentRegex =
    /^\s*([+-]?(?:\d*\.\d+|\d+))(px|r?em|ex|ch|vh|vw|vmin|vmax|cm|mm|Q|in|pt|pc|%|deg|grad|rad|turn)\s*$/i;

  const numberOnlyRegex = /^\s*([+-]?(?:\d*\.\d+|\d+))\s*$/;

  const withUnit = value.match(lengthOrPercentRegex);
  if (withUnit) {
    const [, num, unit] = withUnit;
    return [Number(num), unit];
  }

  const numberOnly = value.match(numberOnlyRegex);
  if (numberOnly) {
    const [, num] = numberOnly;
    return [Number(num), null];
  }

  return null;
}

function transformProperty(
  element: HTMLElement,
  property: Property
): [Property, Property] {
  let functionName = camelCase(property.name.replace("transform", ""));
  if (functionName.includes("3D")) {
    functionName = functionName.replace("3D", "3d");
  }

  const existingTransform = element.style.transform;
  const existingTransformParts = parseTransformTuples(existingTransform);

  const foundTuple = existingTransformParts.find((t) => t[0] === functionName);

  const customProperty = {
    name: `--${property.name}`,
    value: property.value,
  } as Property;

  if (foundTuple) {
    if (property.value) {
      foundTuple[1] = `(var(${customProperty.name}))`;
    } else {
      const index = existingTransformParts.indexOf(foundTuple);
      existingTransformParts.splice(index, 1);
    }
  } else {
    if (property.value) {
      existingTransformParts.push([
        functionName,
        `(var(${customProperty.name}))`,
      ]);
    }
  }

  const modifiedProperty = {
    value: existingTransformParts.map((t) => t.join("")).join(" "),
    name: "transform",
  };

  return [modifiedProperty, customProperty];
}

type TransitionMap = Record<string, [string, string?]>;

function transitionMap(element: HTMLElement): TransitionMap {
  const currentTransition = element.style.transition;
  const parts = currentTransition
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => p.split(" ").map((s) => s.trim()));

  const transitionMap = (parts as [string, string, string?][]).reduce(
    (acc, [tName, tTime, tFunction]) => {
      acc[tName] = [tTime, tFunction];
      return acc;
    },
    {} as TransitionMap
  );
  return transitionMap;
}

function transitionCssValue(map: TransitionMap) {
  return Object.entries(map)
    .map(
      ([tName, [tTime, tFunction]]) =>
        `${tName} ${tTime}${tFunction ? ` ${tFunction}` : ""}`
    )
    .join(", ");
}

function parseTransformTuples(str: string) {
  const regex = /([a-zA-Z0-9]+)\(((?:[^()]|\([^()]*\))*)\)/g;
  const result: [string, string][] = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(str)) !== null) {
    // match[1] = function name
    // match[2] = content inside outer parentheses
    result.push([match[1], `(${match[2]})`]);
  }

  return result;
}

export function convertStyleXToStyleSet(
  el: HTMLElement,
  styleX: StyleX
): StyleSet {
  const styleSet: StyleSet = {};
  (Object.entries(styleX) as StyleXTuple[]).forEach(([key, val]) => {
    // @ts-ignore
    const value = getCssPropertyValueFromValueDynamic(val, el);
    // @ts-ignore
    styleSet[key] = value;
  });

  return styleSet;
}

export function getCssPropertyValueFromValueDynamic(
  values: Value[],
  el: HTMLElement
): [Value[1], Value[2]?] | null {
  for (const [selector, propertyValue, settings] of values) {
    if (typeof selector === "boolean") {
      if (selector) {
        return [
          propertyValue,
          ...((settings ? [settings] : []) as unknown as [
            Value[2] | undefined
          ]),
        ];
      } else {
        continue;
      }
    } else {
      if (isSelectorMatches(selector, el)) {
        return [
          propertyValue,
          ...((settings ? [settings] : []) as unknown as [
            Value[2] | undefined
          ]),
        ];
      }
    }
  }
  return null;
}

export function isSelectorMatches(selector: Selector, element: HTMLElement) {
  const [selectorValue, selectorType, selectorHierarchy] =
    parseSelector(selector);

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

  if (selectorType === SelectorType.Boolean) {
    if (selectorValue) {
      return true;
    }
  }

  const selectorValueStr = selectorValue as string;

  switch (selectorType) {
    case SelectorType.Media:
      if (window.matchMedia(selectorValueStr.replace("@media", "")).matches) {
        return true;
      }
      break;
    case SelectorType.Pseudo:
      if (element.matches(selectorValueStr)) {
        return true;
      }
      break;
    case SelectorType.Attribute:
      const [attrName, attrValue] =
        splitSelectorTypeAttribute(selectorValueStr);
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
