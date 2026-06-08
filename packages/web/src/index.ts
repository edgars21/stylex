import type * as CSS from "csstype";
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
  fastSelectorCheck,
} from "./stateSelector";
import {
  createEventListenerWithCleanupFactory,
  createMutationObserverWithCleanupFactory,
  ElementDestructionObserver,
} from "./dom";
import { animate as popmotionAnimate } from "popmotion";

// TDDO: implement later
// export type StylexDefinitionStateful = (
//   | StylexValueDefinition
//   | [string, StylexValueDefinition]
// )[];

export type StylexDefinition = OrWithAnimation<{
  [K in StylexPropertyName]?: StylexValueDefinition;
}>;

type StylexValueDefinition =
  | OrWithAnimation<StylexValueSimple>
  | StylexValueDefinitionStateful;

type StylexValueDefinitionStateful = OrWithAnimation<
  (
    | OrWithAnimation<StylexValueSimple>
    | OrWithAnimation<[string, OrWithAnimation<StylexValueSimple>]>
  )[]
>;

type ValidCssPropertyNameKebabCase = string & {
  brand: "ValidCssPropertyNameKebabCase";
};

type StylexPropertyName =
  | StylexPropertyNameAsCssPropertyNameCamelCase
  | StylexPropertyNameCustom;

type StylexPropertyNameAsCssPropertyNameCamelCase =
  keyof CssPropertyCamelCaseToValueMap;
type StylexPropertyNameCustom = keyof AdditionalPropertiesTransform;

export type CssPropertyCamelCaseToValueMap = {
  [CssKey in keyof CSS.Properties]: CSS.Properties[CssKey];
};

type CssStyleName = keyof CssStyleKebabCaseToValueMap;
type CssPropertyName = keyof CssPropertyKebabCaseToValueMap;
type CssVariableName = keyof CssVariableKebabCaseToValueMap;

export type CssStyleKebabCaseToValueMap = CssPropertyKebabCaseToValueMap &
  CssVariableKebabCaseToValueMap;
export type CssPropertyKebabCaseToValueMap = {
  [CssKey in keyof CSS.PropertiesHyphen]: CSS.PropertiesHyphen[CssKey][];
};
export type CssVariableKebabCaseToValueMap = {
  [K in ValueOf<typeof additionalPropertiesTransformMap>]: string;
};

type StylexApplicableValue = StylexValueSimple | Animation<StylexValueSimple>;
type StylexValueSimple = string | number | null; //ValidCssPropertyValue | AdditionalPropertyValue;

type AdditionalPropertyName = keyof AdditionalPropertiesTransform;

type AdditionalPropertiesTransform = typeof additionalPropertiesTransformMap;

const additionalPropertiesTransformMap = {
  transformRotate: "--transform-rotate",
  transformRotateX: "--transform-rotate-x",
  transformRotateY: "--transform-rotate-y",
  transformRotateZ: "--transform-rotate-z",
  transformRotate3d: "--transform-rotate-3d",
  transformTranslate: "--transform-translate",
  transformTranslateX: "--transform-translate-x",
  transformTranslateY: "--transform-translate-y",
  transformTranslateZ: "--transform-translate-z",
  transformTranslate3d: "--transform-translate-3d",
  transformScale: "--transform-scale",
  transformScaleX: "--transform-scale-x",
  transformScaleY: "--transform-scale-y",
  transformScaleZ: "--transform-scale-z",
  transformScale3d: "--transform-scale-3d",
} as const;

function isCustomPropertyName(
  value: StylexPropertyName,
): value is StylexPropertyNameCustom {
  return value in additionalPropertiesTransformMap;
}

function cssStyleName(value: StylexPropertyName): CssStyleName {
  if (isCustomPropertyName(value)) {
    return cssVariableName(value);
  } else {
    return cssPropertyName(value);
  }
}

function cssPropertyName(
  value: StylexPropertyNameAsCssPropertyNameCamelCase,
): CssPropertyName {
  return kebabCase(value) as CssPropertyName;
}

function cssVariableName(value: StylexPropertyNameCustom): CssVariableName {
  return additionalPropertiesTransformMap[value] as CssVariableName;
}

type ValueOf<T> = T[keyof T];

type Setter = Record<string, ValueofSetter>;
type ValueofSetter =
  | string
  | number
  | (string | number | [string, string | number])[];

function unwrapAnimations(
  value: OrWithAnimation<[string, OrWithAnimation<StylexValueSimple>]>,
  applyAnimation?: Omit<Animation, "value">,
): [string, OrWithAnimation<StylexValueSimple>];
function unwrapAnimations(
  value: StylexValueDefinitionStateful,
  applyAnimation?: Omit<Animation, "value">,
): (
  | OrWithAnimation<StylexValueSimple>
  | [string, OrWithAnimation<StylexValueSimple>]
)[];
function unwrapAnimations(
  value: StylexDefinition,
  applyAnimation?: Omit<Animation, "value">,
): {
  [K in StylexPropertyName]?:
    | OrWithAnimation<StylexValueSimple>
    | (StylexValueSimple | [string, OrWithAnimation<StylexValueSimple>])[];
};

function unwrapAnimations(
  value:
    | StylexDefinition
    | StylexValueDefinitionStateful
    | OrWithAnimation<[string, OrWithAnimation<StylexValueSimple>]>,
  applyAnimation?: Omit<Animation, "value">,
):
  | {
      [K in StylexPropertyName]?:
        | OrWithAnimation<StylexValueSimple>
        | (StylexValueSimple | [string, OrWithAnimation<StylexValueSimple>])[];
    }
  | (
      | OrWithAnimation<StylexValueSimple>
      | [string, OrWithAnimation<StylexValueSimple>]
    )[]
  | [string, OrWithAnimation<StylexValueSimple>] {
  if (isAnimation(value)) {
    const currentValue = value.value;
    // @ts-ignore
    return unwrapAnimations(currentValue, { ...value, value: undefined });
  } else {
    if (!Array.isArray(value)) {
      return (
        Object.entries(value) as unknown as [
          StylexPropertyName,
          StylexValueDefinition,
        ][]
      ).reduce(
        (acc, [key, val]) => {
          // @ts-ignore
          if (isAnimation(val)) {
            if (
              typeof val.value !== "string" &&
              typeof val.value !== "number"
            ) {
              // @ts-ignore
              acc[key] = unwrapAnimations(val.value, {
                ...val,
                value: undefined,
              });
            } else {
              // @ts-ignore
              acc[key] = val;
            }
          } else {
            if (typeof val !== "string" && typeof val !== "number") {
              // @ts-ignore
              acc[key] = unwrapAnimations(val, applyAnimation);
            } else {
              acc[key] = applyAnimation
                ? { ...applyAnimation, value: val }
                : val;
            }
          }
          return acc;
        },
        {} as {
          [K in StylexPropertyName]?:
            | OrWithAnimation<StylexValueSimple>
            | (
                | StylexValueSimple
                | [string, OrWithAnimation<StylexValueSimple>]
              )[];
        },
      );
    } else {
      if (
        value.length === 2 &&
        typeof value[0] === "string" &&
        fastSelectorCheck(value[0])
      ) {
        if (applyAnimation && !isAnimation(value[1])) {
          // @ts-ignore
          value[1] = { ...applyAnimation, value: value[1] };
        }
        return value as [string, OrWithAnimation<StylexValueSimple>];
      } else {
        return (
          value as (
            | OrWithAnimation<StylexValueSimple>
            | OrWithAnimation<[string, OrWithAnimation<StylexValueSimple>]>
          )[]
        ).map((v) => {
          if (isAnimation(v)) {
            // @ts-ignore
            if (typeof v.value !== "string" && typeof v.value !== "number") {
              // @ts-ignore
              return unwrapAnimations(v.value, {
                ...v,
                value: undefined,
              }) as unknown as OrWithAnimation<StylexValueSimple>;
            } else {
              return v;
            }
          } else {
            if (Array.isArray(v)) {
              return (
                applyAnimation
                  ? // @ts-ignore
                    (unwrapAnimations(v, {
                      ...applyAnimation,
                      value: undefined,
                    }) as unknown as OrWithAnimation<StylexValueSimple>)
                  : v
              ) as OrWithAnimation<StylexValueSimple>;
            } else {
              return applyAnimation && !isAnimation(v)
                ? // @ts-ignore
                  animate(v, { ...applyAnimation, value: undefined })
                : v;
            }
          }
        }) as unknown as (
          | OrWithAnimation<StylexValueSimple>
          | [string, OrWithAnimation<StylexValueSimple>]
        )[];
      }
    }
  }
}

export function stylex(
  element: HTMLElement,
  definition: StylexDefinition,
): Stylex {
  return new Stylex(element, definition);
}

export function solidUseStylex(
  element: HTMLElement,
  definition: () => StylexConstructor,
) {
  new Stylex(element, definition());
}

export type StylexConstructor = {
  [K in StylexPropertyName]?:
    | OrWithAnimation<StylexValueSimple>
    | (
        | OrWithAnimation<StylexValueSimple>
        | [string, OrWithAnimation<StylexValueSimple>]
      )[];
};

const observer = new ElementDestructionObserver((el) => {
  // @ts-ignore
  const stylex = el.stylex as Stylex | undefined;
  if (stylex) {
    stylex.onDestroy();
  }
});

// type Stylex = Record<StylexPropertyName, StylexValueSimple>;
export class Stylex {
  static #instances = new Set<Stylex>();
  static #onInstanceAddedSubscribers = new Set<() => void>();
  static #addInstance(instance: Stylex) {
    observer.observe(instance.#element);
    Stylex.#instances.add(instance);
    Stylex.#onInstanceAddedSubscribers.forEach((subscriber) => subscriber());
  }
  static #removeInstance(instance: Stylex) {
    Stylex.#instances.delete(instance);
  }
  static #onInstanceAdded(cb: () => void): () => void {
    Stylex.#onInstanceAddedSubscribers.add(cb);
    return () => {
      Stylex.#onInstanceAddedSubscribers.delete(cb);
    };
  }

  #propertyMap = new Map<string, StylexValue>();
  #element: HTMLElement;
  #addListenerWithCleanup = createEventListenerWithCleanupFactory();
  #addMutationObserverWithCleanup = createMutationObserverWithCleanupFactory();
  #hoverObservers: Set<StylexValue> = new Set();
  #hoverListeners: [() => void, () => void] | null = null;
  #activeObservers: Set<StylexValue> = new Set();
  #activeListeners: [() => void, () => void] | null = null;
  #attributeObservers: Set<StylexValue> = new Set();
  #attributeListener: (() => void) | null = null;
  #focusObservers: Set<StylexValue> = new Set();
  #focusListeners: [() => void, () => void] | null = null;
  #focusWithinObservers: Set<StylexValue> = new Set();
  #focusWithinListeners: [() => void, () => void] | null = null;
  #parentDependence: boolean = false;
  #siblingDependence: boolean = false;
  #childDependence: boolean = false;
  #onIstanceAddedUnsubscribe: (() => void) | null = null;
  #appliedTransforms = new Set<keyof AdditionalPropertiesTransform>();
  #runningAnimations: Map<StylexPropertyName, [CssTransition, () => void]> =
    new Map();
  #computedTransition: string = "";
  #lastAppliedValues: Map<StylexPropertyName, StylexValueSimple> = new Map();

  constructor(
    element: HTMLElement,
    definition?: OrWithAnimation<StylexDefinition>,
  ) {
    this.#element = element;

    // @ts-ignore
    const previousStylex = element.stylex as Stylex | undefined;
    let previousProperties: Set<StylexPropertyName>;
    if (definition) {
      if (previousStylex) {
        previousProperties = new Set(
          Array.from(previousStylex).map(([key]) => key),
        );
      }
      const [definitionValue, hasAnimation]: [
        StylexDefinition,
        Animation | false,
      ] = isAnimation(definition)
        ? [definition.value, { ...definition, value: undefined }]
        : [definition, false];
      Object.entries(definitionValue).forEach(([key, value]) => {
        value = isAnimation(value)
          ? value
          : hasAnimation
            ? animate(value, hasAnimation)
            : value;
        // @ts-ignore
        if (previousStylex) {
          // @ts-ignore
          previousStylex[key as StylexPropertyName] = value;
          previousProperties.delete(key as StylexPropertyName);
        } else {
          // @ts-ignore
          this.#addProperty(key as StylexPropertyName, value, true);
        }
      });
    }

    if (previousStylex) {
      // @ts-ignore
      if (previousProperties && previousProperties.size) {
        for (const key of previousProperties) {
          // @ts-ignore
          delete previousStylex[key as StylexPropertyName];
        }
      }
      return previousStylex;
    }

    const proxy = new Proxy(this, {
      deleteProperty(target, prop) {
        target.#removeProperty(prop as StylexPropertyName);
        return true;
      },
      set(target, prop, value) {
        if (typeof value === "undefined" || value === null) {
          target.#removeProperty(prop as StylexPropertyName);
        } else {
          target.#removeProperty(prop as StylexPropertyName);
          // @ts-ignore
          target.#addProperty(prop as StylexPropertyName, value);
        }
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

    setTimeout(() => {
      this.#evaluateForObservation();
    }, 0);

    // @ts-ignore
    element.stylex = proxy;

    Stylex.#addInstance(this);

    return proxy;
  }

  #setComputedTransition(value: string) {
    if (this.#computedTransition !== value) {
      this.#computedTransition = value;
      this.#recalculateTransitionCssPropertyValue();
    }
  }

  #addRunningAnimation(
    property: StylexPropertyName,
    transition: CssTransition,
    cleanupFunction: () => void,
  ) {
    if (!this.#runningAnimations.has(property)) {
      this.#runningAnimations.set(property, [transition, cleanupFunction]);
      this.#recalculateTransitionCssPropertyValue();
    }
  }

  #removeRunningAnimation(property: StylexPropertyName) {
    if (this.#runningAnimations.has(property)) {
      this.#runningAnimations.delete(property);
      this.#recalculateTransitionCssPropertyValue();
    }
  }

  #recalculateTransitionCssPropertyValue() {
    if (this.#computedTransition || this.#runningAnimations.size) {
      const transitionList = [];
      if (this.#computedTransition) {
        transitionList.push(this.#computedTransition);
      }
      if (this.#runningAnimations.size) {
        // @ts-ignore
        const transitionMap = (
          [...this.#runningAnimations.values()] as [CssTransition, () => void][]
        ).reduce((acc, [transition]) => {
          acc[transition[0]] = transition[1];
          return acc;
        }, {} as TransitionMap);
        const style = validCssTransitionPropertyValue(transitionMap);
        transitionList.push(style);
      }
      applyCssStyle(this.element, "transition", transitionList.join(", "));
    } else {
      removeCssStyle(this.element, "transition");
    }
  }

  #addAppliedTransform(transform: keyof AdditionalPropertiesTransform) {
    if (!this.#appliedTransforms.has(transform)) {
      this.#appliedTransforms.add(transform);
      this.#recalculateTransformCssPropertyValue();
    }
  }

  #removeAppliedTransform(transform: keyof AdditionalPropertiesTransform) {
    if (this.#appliedTransforms.has(transform)) {
      this.#appliedTransforms.delete(transform);
      this.#recalculateTransformCssPropertyValue();
    }
  }

  #recalculateTransformCssPropertyValue() {
    this.#element.style.transform = Array.from(this.#appliedTransforms)
      .map(
        (val) =>
          `${lowercaseFirst(val.replace("transform", ""))}(var(${additionalPropertiesTransformMap[val]}))`,
      )
      .join(" ");
  }

  #removeProperty(name: StylexPropertyName) {
    // @ts-ignore
    const stylexValue = this[name];
    if (stylexValue) {
      stylexValue.onDestroy();
    }
    this.#propertyMap.delete(name);
    // @ts-ignore
    delete this[name];
    removeCssStyle(this.element, cssStyleName(name));
  }

  #addProperty(
    name: StylexPropertyName,
    value: ValueOf<StylexDefinition>,
    initial?: boolean,
  ) {
    const stylexValue = new StylexValue(this, name, value);
    if (stylexValue.length) {
      this.#propertyMap.set(name, stylexValue);
      // @ts-ignore
      this[name] = stylexValue;
      this.#evaluateAndApplyProperty(name, stylexValue, this.element, initial);
      if (!initial) {
        this.#evaluateForObservationProperty(stylexValue, [
          false,
          false,
          false,
        ]);
      }
    }
  }

  apply(
    value: Record<StylexPropertyName, StylexApplicableValue>,
    settings?: { ignoreAnimation: boolean },
  ) {
    Object.entries(value).forEach(([key, val]) => {
      // @ts-ignore
      this.applyProperty(key, value, settings);
    });
  }

  applyProperty(
    property: StylexPropertyName,
    value: StylexApplicableValue,
    settings?: { ignoreAnimation: boolean },
  ) {
    if (settings?.ignoreAnimation && isAnimation(value)) {
      value = value.value;
    }

    // @ts-ignore
    const currentPropertyValue = this[property]?.current;
    const valueToCompare = isAnimation(value) ? value.value : value;
    if (currentPropertyValue === valueToCompare) {
      return;
    }

    const transitionProperties = [
      "transition",
      "transitionProperty",
      "transitionDuration",
      "transitionTimingFunction",
      "transitionDelay",
    ];

    const runningAnimation = this.#runningAnimations.get(property);
    if (runningAnimation) {
      runningAnimation[1]();
    }

    if (transitionProperties.includes(property)) {
      const valueMap = {
        transition: "",
        transitionProperty: "",
        transitionDuration: "",
        transitionTimingFunction: "",
        transitionDelay: "",
      };

      // @ts-ignore
      valueMap[property] = String(valueToCompare);

      // @ts-ignore
      const computed = transitionMap(valueMap.transition);
      const setThis = validCssTransitionPropertyValue(computed);
      this.#setComputedTransition(setThis);
      return;
    }

    this.#lastAppliedValues.set(property, valueToCompare);

    if (isAnimation(value)) {
      if (isCustomPropertyName(property) || value.poprunner) {
        this.#addAppliedTransform(property as AdditionalPropertyName);

        if (valueToCompare === null) {
          console.log("need to animate removal poprunner");
        } else {
          const startParsed = parseLengthOrPercentage(currentPropertyValue);
          // @ts-ignore
          const endParsed = parseLengthOrPercentage(valueToCompare);
          if (startParsed && endParsed && startParsed[1] === endParsed[1]) {
            applyCssStyleWithAnimation(this.element, property, {
              kind: "poprunner",
              duration: value.duration,
              cssStyleName: cssStyleName(property),
              start: startParsed[0],
              end: endParsed[0],
              ...(startParsed[1] && {
                unit: startParsed[1],
              }),
              ...(value.beforeStart && { beforeStart: value.beforeStart }),
              ...(value.afterEnd && { afterEnd: value.afterEnd }),
              ...(value.duration && { duration: value.duration }),
            });
          } else {
            console.warn(
              "Requested poprunner animation but start/end values are not valid to proceed: ",
              {
                startParsed,
                endParsed,
              },
            );
            applyCssStyle(
              this.element,
              cssStyleName(property),
              String(valueToCompare),
            );
          }
        }
      } else {
        applyCssStyleWithAnimation(
          this.element,
          property,
          {
            kind: "css",
            cssPropertyName: cssPropertyName(property),
            value: String(valueToCompare),
            ...(value.duration && { duration: value.duration }),
            ...(value.timingFunction && {
              timingFunction: value.timingFunction,
            }),
            ...(value.beforeStart && { beforeStart: value.beforeStart }),
            ...(value.afterEnd && { afterEnd: value.afterEnd }),
          },
          this.#addListenerWithCleanup[0],
          this.#addRunningAnimation.bind(this),
          this.#removeRunningAnimation.bind(this),
        );
      }
    } else {
      if (value === null) {
        removeCssStyle(this.element, cssStyleName(property));
      } else {
        applyCssStyle(this.element, cssStyleName(property), String(value));
      }
    }
  }

  get element() {
    return this.#element;
  }

  get length() {
    return this.#propertyMap.size;
  }

  addHoverObserver(observer: StylexValue) {
    this.#hoverObservers.add(observer);
    if (!this.#hoverListeners) {
      this.#addRemoveHoverListeners();
    }
  }

  removeHoverObserver(observer: StylexValue) {
    this.#hoverObservers.delete(observer);
    if (this.#hoverListeners) {
      this.#addRemoveHoverListeners();
    }
  }

  #addRemoveHoverListeners() {
    if (this.#hoverObservers.size) {
      this.#hoverListeners = [
        this.#addListenerWithCleanup[0](
          this.element,
          "mouseenter",
          () => {
            for (const observer of this.#hoverObservers) {
              observer.evaluteAndApply();
            }
          },
          { passive: true },
        ),
        this.#addListenerWithCleanup[0](
          this.element,
          "mouseleave",
          () => {
            for (const observer of this.#hoverObservers) {
              observer.evaluteAndApply();
            }
          },
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

  addFocusObserver(observer: StylexValue) {
    this.#focusObservers.add(observer);
    if (!this.#focusListeners) {
      this.#addRemoveFocusListeners();
    }
  }

  removeFocusObserver(observer: StylexValue) {
    this.#focusObservers.delete(observer);
    if (this.#focusListeners) {
      this.#addRemoveFocusListeners();
    }
  }

  #addRemoveFocusListeners() {
    if (this.#focusObservers.size) {
      this.#focusListeners = [
        this.#addListenerWithCleanup[0](
          this.element,
          "focus",
          () => {
            for (const observer of this.#focusObservers) {
              observer.evaluteAndApply();
            }
          },
          { passive: true },
        ),
        this.#addListenerWithCleanup[0](
          this.element,
          "blur",
          () => {
            for (const observer of this.#focusObservers) {
              observer.evaluteAndApply();
            }
          },
          { passive: true },
        ),
      ];
    } else {
      if (this.#focusListeners) {
        this.#focusListeners[0]();
        this.#focusListeners[1]();
        this.#focusListeners = null;
      }
    }
  }

  addFocusWithinObserver(observer: StylexValue) {
    this.#focusWithinObservers.add(observer);
    if (!this.#focusWithinListeners) {
      this.#addRemoveFocusWithinListeners();
    }
  }

  removeFocusWithinObserver(observer: StylexValue) {
    this.#focusWithinObservers.delete(observer);
    if (this.#focusWithinListeners) {
      this.#addRemoveFocusWithinListeners();
    }
  }

  #addRemoveFocusWithinListeners() {
    if (this.#focusWithinObservers.size) {
      this.#focusWithinListeners = [
        this.#addListenerWithCleanup[0](
          this.element,
          "focusin",
          () => {
            for (const observer of this.#focusWithinObservers) {
              observer.evaluteAndApply();
            }
          },
          { passive: true },
        ),
        this.#addListenerWithCleanup[0](
          this.element,
          "focusout",
          () => {
            for (const observer of this.#focusWithinObservers) {
              observer.evaluteAndApply();
            }
          },
          { passive: true },
        ),
      ];
    } else {
      if (this.#focusWithinListeners) {
        this.#focusWithinListeners[0]();
        this.#focusWithinListeners[1]();
        this.#focusWithinListeners = null;
      }
    }
  }

  addActiveObserver(observer: StylexValue) {
    this.#activeObservers.add(observer);
    if (!this.#activeListeners) {
      this.#addRemoveActiveListeners();
    }
  }

  removeActiveObserver(observer: StylexValue) {
    this.#activeObservers.delete(observer);
    if (this.#activeListeners) {
      this.#addRemoveActiveListeners();
    }
  }

  #addRemoveActiveListeners() {
    if (this.#activeObservers.size) {
      this.#activeListeners = [
        this.#addListenerWithCleanup[0](
          this.element,
          "pointerdown",
          () => {
            for (const observer of this.#activeObservers) {
              observer.evaluteAndApply();
            }
          },
          { passive: true },
        ),
        this.#addListenerWithCleanup[0](
          this.element,
          "pointerup",
          () => {
            for (const observer of this.#activeObservers) {
              observer.evaluteAndApply();
            }
          },
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

  addAttributeObserver(observer: StylexValue) {
    this.#attributeObservers.add(observer);
    if (!this.#attributeListener) {
      this.#addRemoveAttributeListener();
    }
  }

  removeAttributeObserver(observer: StylexValue) {
    this.#attributeObservers.delete(observer);
    if (this.#attributeListener) {
      this.#addRemoveAttributeListener();
    }
  }

  #addRemoveAttributeListener() {
    if (this.#attributeObservers.size) {
      this.#attributeListener = this.#addMutationObserverWithCleanup[0](
        this.element,
        { attributes: true },
        (mutations) => {
          for (const mutation of mutations) {
            if (mutation.attributeName === "style") {
              return;
            }
          }
          for (const observer of this.#attributeObservers) {
            observer.evaluteAndApply();
          }
        },
      );
    } else {
      if (this.#attributeListener) {
        this.#attributeListener();
        this.#attributeListener = null;
      }
    }
  }

  getTransition(value: string) {
    //@ts-ignore
    return transitionMap(value);
  }

  [Symbol.iterator](): IterableIterator<[StylexPropertyName, StylexValue]> {
    // @ts-ignore
    return this.#propertyMap[Symbol.iterator]();
  }

  evaluateAndApply(
    values: [StylexPropertyName, StylexValue][] = Array.from(this),
    initial?: boolean,
  ) {
    values.forEach(([propertyName, stylexValue]) => {
      this.#evaluateAndApplyProperty(
        propertyName,
        stylexValue,
        this.element,
        initial,
      );
    });
  }

  #evaluateAndApplyProperty(
    propertyName: StylexPropertyName,
    value: StylexValue,
    element: HTMLElement,
    initial?: boolean,
  ) {
    const evaluatedValue = evalulateStylexValue(value, element);
    console.log("evaluted value: ", evaluatedValue);
    if (evaluatedValue !== null) {
      // @ts-ignore
      this.applyProperty(
        propertyName,
        evaluatedValue,
        ...(initial ? [{ ignoreAnimation: true }] : []),
      );
    }
  }

  #evaluateForObservation() {
    let dependence: [boolean, boolean, boolean] = [false, false, false];
    Array.from(this).forEach(([_, stylexValue]) => {
      this.#evaluateForObservationProperty(stylexValue, dependence);
    });
    this.#parentDependence = dependence[0];
    this.#siblingDependence = dependence[1];
    this.#childDependence = dependence[2];

    if (
      this.#parentDependence ||
      this.#siblingDependence ||
      this.#childDependence
    ) {
      if (!this.#onIstanceAddedUnsubscribe) {
        this.#onIstanceAddedUnsubscribe = Stylex.#onInstanceAdded(() => {
          this.#evaluateForObservation();
        });
      }
    } else {
      if (this.#onIstanceAddedUnsubscribe) {
        this.#onIstanceAddedUnsubscribe();
        this.#onIstanceAddedUnsubscribe = null;
      }
    }
  }

  #evaluateForObservationProperty(
    value: StylexValue,
    dependence: [boolean, boolean, boolean],
  ) {
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
                dependence[0] = true;
                hierarchyElement = this.element.closest(
                  `[data-stylex-id="${s.id}"]`,
                ) as HTMLElement | undefined;
                break;
              case HierarchySelectorType.Sibling:
                dependence[1] = true;
                hierarchyElement = this.element.parentElement?.querySelector(
                  `[data-stylex-id="${s.id}"]`,
                ) as HTMLElement | undefined;
                break;
              case HierarchySelectorType.Child:
                dependence[2] = true;
                hierarchyElement = this.element.querySelector(
                  `[data-stylex-id="${s.id}"]`,
                ) as HTMLElement | undefined;
                break;
            }

            // @ts-ignore
            if (hierarchyElement?.stylex) {
              // @ts-ignore
              const stylex = hierarchyElement.stylex;
              let set = coreStates.get(stylex);
              if (!set) {
                set = new Set<CoreState>();
                coreStates.set(stylex, set);
              }
              set.add(coreState(s.state));
            }
          } else {
            let set = coreStates.get(this);
            if (!set) {
              set = new Set<CoreState>();
              coreStates.set(this, set);
            }
            set.add(coreState(s));
          }
        });
      }
    }

    coreStates.forEach((states, hierarchyStylex) => {
      states.forEach((state) => {
        const parsedState = coreStateParsed(state);
        if (parsedState.kind === CoreStateType.Pseudo) {
          if (parsedState.pseudoMatch === ":hover") {
            hierarchyStylex.addHoverObserver(value);
            // TODO: left add observer for focus and focus within
          } else if (parsedState.pseudoMatch === ":active") {
            hierarchyStylex.addActiveObserver(value);
          } else if (parsedState.pseudoMatch === ":focus") {
            hierarchyStylex.addFocusObserver(value);
          } else if (parsedState.pseudoMatch === ":focus-within") {
            hierarchyStylex.addFocusWithinObserver(value);
          }
        } else if (parsedState.kind === CoreStateType.Attribute) {
          hierarchyStylex.addAttributeObserver(value);
        }
      });
    });
  }

  onDestroy() {
    this.#addListenerWithCleanup[1]();
    this.#addMutationObserverWithCleanup[1]();
    for (const [_, stylexValue] of this) {
      stylexValue.onDestroy();
    }
    observer.unobserve(this.#element);
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

type StateSelectorwithDefault = StateSelector | "default";
export class StylexValue {
  #stateMap = new Map<
    StateSelectorwithDefault,
    OrWithAnimation<StylexValueSimple>
  >();
  #stylex: Stylex;
  #propertyName: StylexPropertyName;
  default?: StylexValueSimple;
  [key: `@${string}`]: StylexValueSimple | undefined;
  [key: `:${string}`]: StylexValueSimple | undefined;
  constructor(
    stylex: Stylex,
    propertyName: StylexPropertyName,
    definition?: StylexValueDefinition,
  ) {
    this.#stylex = stylex;
    this.#propertyName = propertyName;
    this.#stateMap = new Map<StateSelectorwithDefault, StylexValueSimple>();

    if (definition !== undefined) {
      if (
        typeof definition === "string" ||
        typeof definition === "number" ||
        (isAnimation(definition) && typeof definition.value === "string") ||
        // @ts-ignore
        typeof definition.value === "number"
      ) {
        const castDefinition = definition as OrWithAnimation<StylexValueSimple>;
        this.#stateMap.set(
          "default" as StateSelectorwithDefault,
          castDefinition,
        );
      } else {
        const castDefinition = definition as StylexValueDefinitionStateful;
        const unwrappedDefinition = unwrapAnimations(castDefinition);
        let defaultValueSet: true | undefined;
        unwrappedDefinition.forEach((value) => {
          const valueToCheck = isAnimation(value) ? value.value : value;
          if (
            typeof valueToCheck === "string" ||
            typeof valueToCheck === "number"
          ) {
            const castValue = value as OrWithAnimation<StylexValueSimple>;
            if (!defaultValueSet) {
              this.#stateMap.set(
                "default" as StateSelectorwithDefault,
                castValue,
              );
              defaultValueSet = true;
            }
          } else {
            const castValue = value as [
              string,
              OrWithAnimation<StylexValueSimple>,
            ];
            const [stringSelector, val] = castValue;

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
    const value = this.#stylex.element.style.getPropertyValue(
      stylexPropertyValueToKebabCase(this.#propertyName),
    );
    return value ? null : value;
  }

  get length() {
    return this.#stateMap.size;
  }

  evaluteAndApply() {
    this.#stylex.evaluateAndApply([[this.#propertyName, this]]);
  }

  onDestroy() {
    this.#stylex.removeHoverObserver(this);
    this.#stylex.removeActiveObserver(this);
    this.#stylex.removeAttributeObserver(this);
  }

  [Symbol.iterator](): IterableIterator<
    [StateSelectorwithDefault, StylexValueSimple]
  > {
    // @ts-ignore
    return this.#stateMap[Symbol.iterator]();
  }
}

type OrWithAnimation<T> = T | Animation<T>;

export function animate(
  value: [string, OrWithAnimation<StylexValueSimple>],
  animation: Omit<Animation, "value">,
  // @ts-ignore
): Animation<StylexStateTuple>;

export function animate(
  // @ts-ignore
  value: StylexStateItem[],
  animation: Omit<Animation, "value">,
  // @ts-ignore
): Animation<StylexStateItem[]>;

export function animate<T>(
  value: T,
  animation: Omit<Animation, "value">,
): Animation<T>;

export function animate(value: unknown, animation: Omit<Animation, "value">) {
  return { ...animation, value };
}

type Animation<T = any> = {
  poprunner?: boolean;
  value: T;
  duration: number;
  timingFunction?: string;
  beforeStart?: () => void;
  afterEnd?: () => void;
};

type AnimationSpec = AnimationSpecCss | AnimationSpecPoprunner;

type AnimationSpecPoprunner = {
  kind: "poprunner";
  cssStyleName: keyof CssStyleKebabCaseToValueMap;
  duration: number;
  start: number;
  end: number;
  unit?: string;
  timingFunction?: (t: number) => number;
  beforeStart?: () => void;
  afterEnd?: () => void;
};

type AnimationSpecCss = {
  kind: "css";
  cssPropertyName: keyof CssPropertyKebabCaseToValueMap;
  value: string;
  duration?: number;
  timingFunction?: string;
  beforeStart?: () => void;
  afterEnd?: () => void;
};

function applyCssStyleWithAnimation(
  element: HTMLElement,
  propertyName: StylexPropertyName,
  animation: AnimationSpecPoprunner,
): void;
function applyCssStyleWithAnimation(
  element: HTMLElement,
  propertyName: StylexPropertyName,
  animation: AnimationSpecCss,
  addEventListenerWithCleanup: ReturnType<
    typeof createEventListenerWithCleanupFactory
  >[0],
  addRunningAnimation: (
    property: StylexPropertyName,
    transition: CssTransition,
    callback: () => void,
  ) => void,
  removeRunningAnimation: (property: StylexPropertyName) => void,
): void;
function applyCssStyleWithAnimation(
  element: HTMLElement,
  propertyName: StylexPropertyName,
  animation: AnimationSpec,
  ...args: any[]
): void {
  if (animation.kind === "poprunner") {
    const animateInstance = popmotionAnimate({
      from: animation.start,
      to: animation.end,
      duration: animation.duration,
      onUpdate: (v) => {
        element.style.setProperty(
          animation.cssStyleName,
          `${v.toFixed(2)}${animation.unit ? animation.unit : ""}`,
        );
      },
      ...(animation.beforeStart && { onPlay: animation.beforeStart }),
      ...(animation.afterEnd && { onComplete: animation.afterEnd }),
      ...(animation.timingFunction && { ease: animation.timingFunction }),
    });
    // return () => {
    //   animateInstance.stop();
    // };
  } else {
    let cleanUpFunction: () => void;
    const addEventListenerWithCleanup = args[0] as ReturnType<
      typeof createEventListenerWithCleanupFactory
    >[0];
    const addRunningAnimation = args[1] as (
      property: StylexPropertyName,
      transition: CssTransition,
      cleanupCallback: () => void,
    ) => void;
    const removeRunningAnimation = args[2] as (
      property: StylexPropertyName,
    ) => void;
    const cleanUpTransitionEnd = addEventListenerWithCleanup(
      element,
      "transitionend",
      // @ts-ignore
      (e: TransitionEvent) => {
        if (e.propertyName === animation.cssPropertyName) {
          cleanUpFunction();
        }
      },
    );
    cleanUpFunction = () => {
      cleanUpTransitionEnd();
      removeRunningAnimation(propertyName);
    };

    addRunningAnimation(
      propertyName,
      [
        // @ts-ignore
        animation.cssPropertyName,
        // @ts-ignore
        [animation.duration, animation.timingFunction],
      ],
      cleanUpFunction,
    );
    applyCssStyle(element, animation.cssPropertyName, animation.value);
  }
}

function removeCssStyleWithAnimation(
  element: HTMLElement,
  propertyName: StylexPropertyName,
  animation: AnimationSpec,
) {
  if (animation.kind === "poprunner") {
    const originalAftterEnd = animation.afterEnd;
    const callback = () => {
      removeCssStyle(element, animation.cssStyleName);
      originalAftterEnd && originalAftterEnd();
    };
    animation.afterEnd = callback;
    applyCssStyleWithAnimation(element, propertyName, animation);
  } else {
    console.log(
      "------> need to implement css transition animation for remove",
    );
  }
}

function applyCssStyle(
  element: HTMLElement,
  name: keyof CssStyleKebabCaseToValueMap,
  value: string,
) {
  element.style.setProperty(name, value);
}

function removeCssStyle(
  element: HTMLElement,
  name: keyof CssStyleKebabCaseToValueMap,
) {
  element.style.removeProperty(name);
}

function isPropertyValueAnimation(
  value: StylexApplicableValue,
  // @ts-ignore
): value is Animation<string> {
  return typeof value === "object" && "duration" in value && "value" in value;
}

function isAnimation(value: any): value is Animation {
  return typeof value === "object" && "duration" in value && "value" in value;
}

type ValidCssTransitionPropertyName = string & {
  brand: "ValidCssTransitionPropertyName";
};

type ValidCssTimingFunctionName = string & {
  brand: "ValidCssTimingFunctionName";
};

type TransitionMap = Record<CssTransition[0], CssTransition[1]>;

type CssTransition = [
  ValidCssTransitionPropertyName,
  [number, ValidCssTimingFunctionName?],
];

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

function lowercaseFirst(str: string) {
  return str.charAt(0).toLowerCase() + str.slice(1);
}

function stylexPropertyValueToKebabCase(property: StylexPropertyName): string {
  if (property in additionalPropertiesTransformMap) {
    return additionalPropertiesTransformMap[property as AdditionalPropertyName];
  } else {
    return kebabCase(property);
  }
}

function parseLengthOrPercentage(
  value: string,
): null | [number, string | null] {
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

export function mergeStylexDefinitions(
  base: StylexDefinition,
  spread?: StylexDefinition,
): StylexDefinition {
  if (!spread) {
    return base;
  }
  const unwrapedBase = unwrapAnimations(base);
  const unwrapedSpread = unwrapAnimations(spread);
  return { ...unwrapedBase, ...unwrapedSpread };
}
