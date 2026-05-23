// @ts-nocheck
import { kebabCase } from "lodash-es";
import {
  StateSelector,
  isStateSelector,
  isCoreStateOrCoreStateWtithHierarchyOrCombinedStateMatches,
  stateSelectorParsed,
  type CoreStateParsed,
  CoreStateType,
  HierarchySelectorType,
  type CoreStateWtithHierarchyParsed,
  coreState,
  type CoreState,
  coreStateParsed,
} from "./stateSelector";
import {
  createEventListenerWithCleanupFactory,
  createMutationObserverWithCleanupFactory,
} from "./dom";

export type StylexConstructor = StylexDefinitionStateful | StylexDefinition;

export type StylexDefinitionStateful = (
  | StylexDefinition
  | [string, StylexDefinition]
)[];

export type StylexDefinition = Record<
  StylexPropertyName,
  StylexDefinitionValue
>;

type StylexDefinitionValue = StylexValueSimple | StylexDefinitionValueStateful;

type ValidCssPropertyNameCamelCase = string & {
  brand: "ValidCssPropertyNameCamelCase";
};

type ValidCssPropertyNameKebabCase = string & {
  brand: "ValidCssPropertyNameKebabCase";
};

type StylexPropertyName =
  | ValidCssPropertyNameCamelCase
  | AdditionalPropertyName;
type StylexDefinitionValueStateful = (
  | StylexValueSimple
  | [string, StylexValueSimple]
)[];

type StylexValueSimple = ValidCssPropertyValue | AdditionalPropertyValue;

type ValidCssPropertyValue = string & {
  brand: "ValidCssPropertyValue";
};

type AdditionalPropertyName = keyof AdditionalPropertiesTransform;

type AdditionalPropertyValue = string & {
  brand: "AdditionalPropertyValue";
};

type AdditionalPropertiesTransform = {
  transformRotate: string;
  transformRotateX: string;
  transformRotateY: string;
  transformRotateZ: string;
  transformRotate3d: string;
  transformTranslate: string;
  transformTranslateX: string;
  transformTranslateY: string;
  transformTranslateZ: string;
  transformTranslate3d: string;
  transformScale: string;
  transformScaleX: string;
  transformScaleY: string;
  transformScaleZ: string;
  transformScale3d: string;
};

type Setter = Record<string, ValueofSetter>;
type ValueofSetter =
  | string
  | number
  | (string | number | [string, string | number])[];

type Stylex = Record<StylexPropertyName, StylexValueSimple>;
export class StyleX {
  #propertyMap = new Map<string, StylexValue>();
  #element: HTMLElement;
  #dirty: boolean = false;
  #addListenerWithCleanup = createEventListenerWithCleanupFactory();
  #addMutationObserverWithCleanup = createMutationObserverWithCleanupFactory();
  #hoverObservers: Set<StyleX> = new Set();
  #hoverListeners: [() => void, () => void] | null = null;
  #activeObservers: Set<StyleX> = new Set();
  #activeListeners: [() => void, () => void] | null = null;
  #attributeObservers: Set<StyleX> = new Set();
  #attributeListener: (() => void) | null = null;

  #notifyHoverObservers() {
    for (const observer of this.#hoverObservers) {
      observer.dirty = true;
    }
  }

  #notifyActiveObservers() {
    for (const observer of this.#activeObservers) {
      observer.dirty = true;
    }
  }

  #notifyAttributeObservers() {
    for (const observer of this.#attributeObservers) {
      observer.dirty = true;
    }
  }

  constructor(element: HTMLElement, initialData?: StylexConstructor) {
    this.#element = element;

    if (initialData) {
      Object.entries(initialData).forEach(([key, value]) => {
        const stylexValue = new StylexValue(
          this,
          key as StylexPropertyName,
          value,
        );
        if (stylexValue.length) {
          this.#propertyMap.set(key, stylexValue);
          // @ts-ignore
          this[key] = stylexValue;
        }
      });
    }

    const proxy = new Proxy(this, {
      set(target, prop, value) {
        if (typeof value === "undefined") {
          throw new Error(`Cannot set ${String(prop)} to undefined`);
        }
        // @ts-ignore
        target[prop] = value;
        return true;
      },
      get(target, prop, receiver) {
        if (prop === Symbol.iterator) {
          return target[Symbol.iterator].bind(target);
        }
        const value = Reflect.get(target, prop, target);

        if (typeof value === "function") {
          return value.bind(target);
        }

        return value;
      },
    });

    // @ts-ignore
    const previousStyleX = element.stylex as StyleX | undefined;
    if (previousStyleX) {
      const previousKeys = Array.from(previousStyleX).map(([key]) => key);
      const currentKeys = Array.from(this).map(([key]) => key);
      const missingKeys = previousKeys.filter(
        (key) => !currentKeys.includes(key),
      );
      for (const key of missingKeys) {
        removeStyle(element, key);
      }
    }
    // @ts-ignore
    element.stylex = proxy;

    evaluateAandApplyStylex(this, element);
    evaluateForObservationStylex(this);

    return proxy;
  }

  get element() {
    return this.#element;
  }

  get length() {
    return this.#propertyMap.size;
  }

  get dirty() {
    return this.#dirty;
  }

  set dirty(value: boolean) {
    this.#dirty = value;
    evaluateAandApplyStylex(this, this.#element);
  }

  addHoverObserver(observer: StyleX) {
    this.#hoverObservers.add(observer);
    this.#addRemoveHoverListeners();
  }

  removeHoverObserver(observer: StyleX) {
    this.#hoverObservers.delete(observer);
    this.#addRemoveHoverListeners();
  }

  #addRemoveHoverListeners() {
    if (this.#hoverObservers.size) {
      this.#hoverListeners = [
        this.#addListenerWithCleanup[0](
          this.element,
          "mouseenter",
          () => this.#notifyHoverObservers(),
          { passive: true },
        ),
        this.#addListenerWithCleanup[0](
          this.element,
          "mouseleave",
          () => this.#notifyHoverObservers(),
          { passive: true },
        ),
      ];
    } else {
      if (this.#hoverListeners) {
        this.#hoverListeners[0]();
        this.#hoverListeners[1]();
        this.#hoverListeners = null;
      }
    }
  }

  addActiveObserver(observer: StyleX) {
    this.#activeObservers.add(observer);
    this.#addRemoveActiveListeners();
  }

  removeActiveObserver(observer: StyleX) {
    this.#activeObservers.delete(observer);
    this.#addRemoveActiveListeners();
  }

  #addRemoveActiveListeners() {
    if (this.#activeObservers.size) {
      this.#activeListeners = [
        this.#addListenerWithCleanup[0](
          this.element,
          "pointerdown",
          () => this.#notifyActiveObservers(),
          { passive: true },
        ),
        this.#addListenerWithCleanup[0](
          this.element,
          "pointerup",
          () => this.#notifyActiveObservers(),
          { passive: true },
        ),
      ];
    } else {
      if (this.#activeListeners) {
        this.#activeListeners[0]();
        this.#activeListeners[1]();
        this.#activeListeners = null;
      }
    }
  }

  addAttributeObserver(observer: StyleX) {
    this.#attributeObservers.add(observer);
    this.#addRemoveAttributeListeners();
  }

  removeAttributeObserver(observer: StyleX) {
    this.#attributeObservers.delete(observer);
    this.#addRemoveAttributeListeners();
  }

  #addRemoveAttributeListeners() {
    if (this.#attributeObservers.size) {
      this.#attributeListener = this.#addMutationObserverWithCleanup[0](
        this.element,
        { attributes: true },
        () => this.#notifyAttributeObservers(),
      );
    } else {
      if (this.#attributeListener) {
        this.#attributeListener();
        this.#attributeListener = null;
      }
    }
  }

  apply(value: Record<string, string>) {
    Object.entries(value).forEach(([key, val]) => {
      applyValidCssPropertyValue(this.element, { name: key, value: val });
    });
  }

  getTransition(value: string) {
    //@ts-ignore
    return transitionMap(value);
  }

  [Symbol.iterator](): IterableIterator<[StylexPropertyName, StylexValue]> {
    // @ts-ignore
    return this.#propertyMap[Symbol.iterator]();
  }

  onDestroy() {
    this.#addListenerWithCleanup[1]();
    this.#addMutationObserverWithCleanup[1]();
  }
}

function evaluateAandApplyStylex(stylex: StyleX, element: HTMLElement) {
  Array.from(stylex).forEach(([propertyName, stylexValue]) => {
    evaluateAndApplyStylexValue(propertyName, stylexValue, element);
  });
}

function evaluateAndApplyStylexValue(
  propertyName: string,
  value: StylexValue,
  element: HTMLElement,
) {
  const evaluatedValue = evalulateStylexValue(value, element);
  if (evaluatedValue) {
    applyValidCssPropertyValue(element, {
      name: propertyName,
      value: String(evaluatedValue),
    });
  }
}

function evalulateStylexValue(
  value: StylexValue,
  element: HTMLElement,
): string | number | null {
  for (const [stateSelector, val] of value) {
    if (stateSelector === "default") {
      return val;
    } else if (
      isCoreStateOrCoreStateWtithHierarchyOrCombinedStateMatches(
        stateSelectorParsed(stateSelector),
        element,
      )
    ) {
      return val;
    }
  }
  return null;
}

function evaluateForObservationStylex(stylex: StyleX) {
  Array.from(stylex).forEach(([propertyName, stylexValue]) => {
    evaluateForObservationStylexValue(stylexValue, stylex);
  });
}

function evaluateForObservationStylexValue(value: StylexValue, stylex: Stylex) {
  const coreStates = new Map<Stylex, Set<CoreState>>();
  // const coreStates = new Set<CoreState>();
  for (const [stateSelector] of value) {
    if (stateSelector !== "default") {
      const parsedSelector = stateSelectorParsed(stateSelector);
      const inner = [] as (CoreStateParsed | CoreStateWtithHierarchyParsed)[];
      if (Array.isArray(parsedSelector)) {
        parsedSelector.forEach((s) => {
          inner.push(s);
        });
      } else {
        inner.push(parsedSelector);
      }
      inner.forEach((s) => {
        if ("state" in s) {
          let hierarchyElement: HTMLElement | undefined;
          switch (s.kind) {
            case HierarchySelectorType.Parent:
              hierarchyElement = stylex.element.closest(
                `[data-stylex-id="${s.id}"]`,
              ) as HTMLElement | undefined;
              break;
            case HierarchySelectorType.Child:
              hierarchyElement = stylex.element.querySelector(
                `[data-stylex-id="${s.id}"]`,
              ) as HTMLElement | undefined;
              break;
            case HierarchySelectorType.Sibling:
              hierarchyElement = stylex.element.parentElement?.querySelector(
                `[data-stylex-id="${s.id}"]`,
              ) as HTMLElement | undefined;
              break;
          }

          if (hierarchyElement.stylex) {
            const stylex = hierarchyElement.stylex;
            let set = coreStates.get(stylex);
            if (!set) {
              set = new Set<CoreState>();
              coreStates.set(stylex, set);
            }
            set.add(coreState(s.state));
          }
        } else {
          let set = coreStates.get(stylex);
          if (!set) {
            set = new Set<CoreState>();
            coreStates.set(stylex, set);
          }
          set.add(coreState(s));
        }
      });
    }
  }

  console.log("-----> hierrchy, ", coreStates);
  coreStates.forEach((states, hierarchyStylex) => {
    states.forEach((state) => {
      const parsedState = coreStateParsed(state);
      if (parsedState.kind === CoreStateType.Pseudo) {
        if (parsedState.pseudoMatch === ":hover") {
          hierarchyStylex.addHoverObserver(stylex);
        } else if (parsedState.pseudoMatch === ":active") {
          hierarchyStylex.addActiveObserver(stylex);
        }
      } else if (parsedState.kind === CoreStateType.Attribute) {
        hierarchyStylex.addAttributeObserver(stylex);
      }
    });
  });
}

type StateSelectorwithDefault = StateSelector | "default";
export class StylexValue {
  #stateMap = new Map<StateSelectorwithDefault, StylexValueSimple>();
  #stylex: StyleX;
  #proeptyName: StylexPropertyName;
  default?: StylexValueSimple;
  [key: `@${string}`]: StylexValueSimple | undefined;
  [key: `:${string}`]: StylexValueSimple | undefined;
  constructor(
    stylex: StyleX,
    propertyName: StylexPropertyName,
    initialValue?: StylexDefinitionValue,
  ) {
    this.#stylex = stylex;
    this.#proeptyName = propertyName;
    this.#stateMap = new Map<StateSelectorwithDefault, StylexValueSimple>();

    if (initialValue) {
      if (
        typeof initialValue === "string" ||
        typeof initialValue === "number"
      ) {
        this.#stateMap.set("default" as StateSelectorwithDefault, initialValue);
      } else {
        let defaultValueSet: true | undefined;
        initialValue.forEach((value) => {
          if (typeof value === "string" || typeof value === "number") {
            if (!defaultValueSet) {
              this.#stateMap.set("default" as StateSelectorwithDefault, value);
              defaultValueSet = true;
            }
          } else {
            const [stringSelector, val] = value;

            if (!defaultValueSet && stringSelector === "default") {
              this.#stateMap.set("default" as StateSelectorwithDefault, val);
              defaultValueSet = true;
            } else {
              if (isStateSelector(stringSelector)) {
                this.#stateMap.set(stringSelector, val);
              }
            }
          }
        });
      }

      if (this.#stateMap.size) {
        this.#stateMap.entries().forEach(([key, value], idx) => {
          // @ts-ignore
          this[key] = value;
          // @ts-ignore
          this[idx] = [key, value];
        });
      }
    }
  }

  get current() {
    // @ts-ignore
    return this.#stylex.element.style[this.#proeptyName];
  }

  get length() {
    return this.#stateMap.size;
  }

  [Symbol.iterator](): IterableIterator<
    [StateSelectorwithDefault, StylexValueSimple]
  > {
    return this.#stateMap[Symbol.iterator]();
  }
}

// function creatStylexValue(
//   property: StylexPropertyName,
//   value: StylexDefinitionValue,
//   stylex: StyleX,
// ): StyleXValue {
//   const proxybOject = {};
//   const mapValue = new Map<StringSelector, string | number>();
//   let defaultValue: string | number;
//   let values: [StringSelector, string | number][];
//   if (typeof setter === "string" || typeof setter === "number") {
//     defaultValue = setter;
//   } else {
//     const firstDefaultValue = setter.find(
//       (s) => typeof s === "string" || typeof s === "number",
//     );
//     if (firstDefaultValue) {
//       defaultValue = firstDefaultValue;
//     }
//     const onlyWithValidSelector = setter.filter(
//       (s) => Array.isArray(s) && isStringSelector(s[0]),
//     ) as [StringSelector, string | number][];
//     if (onlyWithValidSelector.length > 0) {
//       values = onlyWithValidSelector;
//     }
//   }

//   if (values) {
//     values.forEach(([selector, value]) => {
//       mapValue.set(selector, value);
//     });
//   }
//   if (defaultValue) {
//     mapValue.set("default" as StringSelector, defaultValue);
//   }

//   const arrayValue = Array.from(mapValue);

//   arrayValue.forEach(([selector, value], idx) => {
//     proxybOject[selector] = value;
//     proxybOject[idx] = [selector, value];
//   });

//   Object.defineProperty(proxybOject, "length", {
//     get() {
//       return mapValue.size;
//     },
//     enumerable: false,
//   });

//   Object.defineProperty(proxybOject, "current", {
//     get() {
//       console.log("key is", key);

//       return stylex.element.style[key];
//     },
//     enumerable: false,
//     set() {
//       console.log("key is", key);
//     },
//   });

//   const handler = {
//     set(obj, prop, value) {
//       throw new Error("Direct mutation is not allowed");
//     },
//   };

//   const proxy = new Proxy(proxybOject, handler) as unknown as StyleXValue;
//   return proxy;
// }

interface Animation {
  value: string | number;
  duration: number;
  timingFunction?: string;
  onEnd?: () => void;
}

interface Property {
  name: string;
  value: string | Animation;
}

function applyValidCssPropertyValue(element: HTMLElement, property: Property) {
  if (isPropertyValueAnimation(property.value)) {
    const currentTransition = transitionMap(
      // @ts-ignore
      window.getComputedStyle(element).transition,
    );
    element.addEventListener(
      "transitionend",
      (e: TransitionEvent) => {
        console.log("Transition ended for property", e.propertyName);
        // if (e.propertyName === propertyToTransition.name) {
        //   const listener =
        //     element.stylex.transitions[propertyToTransition.name];
        //   if (typeof listener === "function") {
        //     listener();
        //   }
        // }
      },
      { once: true },
    );
    // @ts-ignore
    currentTransition[property.name] = [
      property.value.duration,
      property.value.timingFunction,
    ];
    element.style.transition =
      validCssTransitionPropertyValue(currentTransition);
    console.log(
      "valid tarnsition: ",
      validCssTransitionPropertyValue(currentTransition),
    );
    // @ts-ignore
    property.value = property.value.value;
  }

  element.style.setProperty(kebabCase(property.name), String(property.value));
}

function isPropertyValueAnimation(
  value: Property["value"],
): value is Animation {
  return typeof value === "object" && "duration" in value && "value" in value;
}

function removeStyle(element: HTMLElement, propertyName: string) {
  element.style.removeProperty(kebabCase(propertyName));
}

type ValidCssTransitionPropertyName = string & {
  brand: "ValidCssTransitionPropertyName";
};

type ValidCssTimingFunctionName = string & {
  brand: "ValidCssTimingFunctionName";
};

type TransitionMap = Record<
  ValidCssTransitionPropertyName,
  [number, ValidCssTimingFunctionName?]
>;

type ValidCssTransitionPropertyValue = string & {
  brand: "ValidCssTransitionPropertyValue";
};

function validCssTransitionPropertyValue(
  map: TransitionMap,
): ValidCssTransitionPropertyValue {
  return Object.entries(map)
    .map(
      ([tName, [tTime, tFunction]]) =>
        `${tName} ${tTime}ms${tFunction ? ` ${tFunction}` : ""}`,
    )
    .join(", ") as ValidCssTransitionPropertyValue;
}

function transitionMap(value: ValidCssTransitionPropertyValue): TransitionMap {
  const result: TransitionMap = {};

  for (const part of splitByComma(value)) {
    const tokens = splitByWhitespace(part);

    let property: string | undefined;
    let duration: number | undefined;
    let timing: string | undefined;

    for (const token of tokens) {
      const time = parseCssTime(token);

      if (time !== null) {
        // First time value is duration, second would be delay.
        if (duration === undefined) {
          duration = time;
        }
        continue;
      }

      if (isTimingFunction(token)) {
        timing = token;
        continue;
      }

      if (token === "normal" || token === "allow-discrete") {
        continue;
      }

      if (!property) {
        property = token;
      }
    }

    if (!property) {
      property = "all";
    }

    if (duration === undefined) {
      duration = 0;
    }

    if (property === "all") {
      for (const key of Object.keys(result)) {
        delete result[key as ValidCssTransitionPropertyName];
      }
    }

    result[property as ValidCssTransitionPropertyName] = timing
      ? [duration, timing as ValidCssTimingFunctionName]
      : [duration];
  }

  return result;
}

function parseCssTime(value: string): number | null {
  const match = value.trim().match(/^(-?\d*\.?\d+)(ms|s)$/);

  if (!match) return null;

  const amount = Number(match[1]);
  const unit = match[2];

  return unit === "s" ? amount * 1000 : amount;
}

function isTimingFunction(value: string): boolean {
  return (
    value === "linear" ||
    value === "ease" ||
    value === "ease-in" ||
    value === "ease-out" ||
    value === "ease-in-out" ||
    value.startsWith("cubic-bezier(") ||
    value.startsWith("steps(") ||
    value.startsWith("linear(")
  );
}

function splitByComma(value: string): string[] {
  return splitTopLevel(value, ",")
    .map((v) => v.trim())
    .filter(Boolean);
}

function splitByWhitespace(value: string): string[] {
  const result: string[] = [];
  let current = "";
  let depth = 0;

  for (const char of value.trim()) {
    if (char === "(") depth++;
    if (char === ")") depth--;

    if (/\s/.test(char) && depth === 0) {
      if (current) {
        result.push(current);
        current = "";
      }
    } else {
      current += char;
    }
  }

  if (current) result.push(current);

  return result;
}

function splitTopLevel(value: string, separator: string): string[] {
  const result: string[] = [];
  let current = "";
  let depth = 0;

  for (const char of value) {
    if (char === "(") depth++;
    if (char === ")") depth--;

    if (char === separator && depth === 0) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current);

  return result;
}
