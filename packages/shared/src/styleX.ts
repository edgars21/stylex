import type * as CSS from "csstype";
import { kebabCase } from "lodash-es";

export type StyleSet = {
  [K in keyof CSS.PropertiesHyphen]: [CSS.PropertiesHyphen<K>, Settings?] | null;
};

type ValueOf<T> = T[keyof T];

export type CssValue = string | number; //ValueOf<CSS.PropertiesHyphen>;

export type StyleXTuple = [keyof StyleX, ValueOf<StyleX>];
export type StyleX = {
  [CssKey in keyof CSS.PropertiesHyphen]: Value<CSS.PropertiesHyphen[CssKey]>[];
};

export enum HierarchySelectorType {
  Parent,
  Child,
  Sibling,
}
type HierarchySelector = [HierarchySelectorType, string];

export type StyleXJsTuple = [keyof StyleXJs, ValueOf<StyleXJs>];
export type StyleXJs = {
  [CssKey in keyof CSS.Properties]: WithSettingsValueStyleXJs<
    CSS.Properties[CssKey]
  >;
};

type WithSettingsValueStyleXJs<CV extends CssValue = CssValue> =
  | ValueStyleXJs<CV>
  | SettingValueStyleXJs<CV>;

type SettingValueStyleXJs<CV extends CssValue = CssValue> = [
  ValueStyleXJs<CV>,
  Settings?
];

type ValueStyleXJs<CV extends CssValue = CssValue> = ((
  | ValueJs<CV>
  | string
  | number
)[]) | CV;

export type Value<CV extends CssValue = CssValue> = [Selector, CV, Settings?];
export type ValueJs<CV extends CssValue = CssValue> = [string | boolean, CV, Settings?];

export function styleXFromStyleXJs(styleXJs: StyleXJs): StyleX {
  const out = (Object.entries(styleXJs) as unknown as StyleXJsTuple[]).reduce<StyleX>(
    (acc, [key, value]) => {
      let globlSettings: Settings | undefined = undefined;
      // @ts-ignore
      if (!Array.isArray(value)) {
        value = [value];
      } else if (isSettingsValueStylexJs(value)) {
        globlSettings = value[1];
        value = value[0];
      }

      value = value
        // @ts-ignore
        .map((v) => {
          if (!Array.isArray(v)) {
            v = [true, v];
          }
          return v;
        })
        .map((v) => {
          if (globlSettings && !v[2]) {
            v[2] = globlSettings;
          }
          return v;
        });

      acc[kebabCase(key)] = value;

      return acc;
    },
    {}
  );

  return out;
}

export function isSettingsValueStylexJs(
  value: WithSettingsValueStyleXJs
): value is SettingValueStyleXJs {
  return Array.isArray(value) && value.length === 2 && !Array.isArray(value[1]) && typeof value[1] === "object";
}

export type Settings = {
  transition: number;
  function?: string;
  onStart?: (element: HTMLElement) => void;
  onEnd?: (element: HTMLElement) => void;
};

export type Selector = (string | boolean) & {
  readonly __brand: unique symbol;
};

export enum SelectorType {
  Boolean,
  Media,
  Pseudo,
  Attribute,
}

export function parseSelector(
  selectorValue: Selector
): [Selector, SelectorType, HierarchySelector?] {
  const [selector, hierarchy] = ensureHierarchySafeSelector(selectorValue);
  return [selector, getSelectorType(selector), hierarchy];
}

function getSelectorType(value: Selector): SelectorType {
  if (isSelectorTypeBoolean(value)) {
    return SelectorType.Boolean;
  } else if (isSelectorTypeMedia(value)) {
    return SelectorType.Media;
  } else if (isSelectorTypePseudo(value)) {
    return SelectorType.Pseudo;
  } else if (isSelectorTypeAttribute(value)) {
    return SelectorType.Attribute;
  }
}

function isSelectorTypeBoolean(selector: Selector) {
  [selector] = ensureHierarchySafeSelector(selector);
  return typeof selector === "boolean";
}

function isSelectorTypeMedia(selector: Selector) {
  [selector] = ensureHierarchySafeSelector(selector);
  if (typeof selector === "string" && selector.startsWith("@media")) {
    return true;
  }
  return false;
}

function isSelectorTypePseudo(selector: Selector) {
  [selector] = ensureHierarchySafeSelector(selector);
  if (typeof selector === "string" && selector.startsWith(":")) {
    return true;
  }
  return false;
}

function isSelectorTypeAttribute(selector: Selector) {
  [selector] = ensureHierarchySafeSelector(selector);
  if (
    typeof selector === "string" &&
    selector.startsWith("@") &&
    !isSelectorTypeMedia(selector)
  ) {
    return true;
  }
  return false;
}

function ensureHierarchySafeSelector(
  selector: Selector
): [Selector, HierarchySelector?] {
  if (typeof selector === "boolean") return [selector];

  let onlyString = selector as string;
  const regexValidatorHasParentSelector = /^([a-z]+>).*$/;
  const regexValidatorHasChildSelector = /^(>[a-z]+).*$/;
  const regexValidatorHasSiblingSelector = /^(~[a-z]+).*$/;

  const matchParentSelector = onlyString.match(regexValidatorHasParentSelector);
  if (matchParentSelector && matchParentSelector[1]) {
    onlyString = onlyString.replace(matchParentSelector[1], "");
    return [
      onlyString as Selector,
      [HierarchySelectorType.Parent, matchParentSelector[1].slice(0, -1)],
    ];
  }

  const matchChildSelector = onlyString.match(regexValidatorHasChildSelector);
  if (matchChildSelector && matchChildSelector[1]) {
    onlyString = onlyString.replace(matchChildSelector[1], "");
    return [
      onlyString as Selector,
      [HierarchySelectorType.Child, matchChildSelector[1].slice(1)],
    ];
  }

  const matchSiblingSelector = onlyString.match(
    regexValidatorHasSiblingSelector
  );
  if (matchSiblingSelector && matchSiblingSelector[1]) {
    onlyString = onlyString.replace(matchSiblingSelector[1], "");
    return [
      onlyString as Selector,
      [HierarchySelectorType.Sibling, matchSiblingSelector[1].slice(1)],
    ];
  }

  return [selector];
}

export function splitSelectorTypeAttribute(value: string): [string, string?] {
  const [attrName, attrValue] = value.slice(1).split("=");
  return [attrName, attrValue as string | undefined];
}

// type TransformValues = {
//   transformRotate: string;
//   transformRotateX: string;
//   transformRotateY: string;
//   transformRotateZ: string;
//   transformRotate3d: string;
//   transformTranslate: string;
//   transformTranslateX: string;
//   transformTranslateY: string;
//   transformTranslateZ: string;
//   transformTranslate3d: string;
//   transformScale: string;
//   transformScaleX: string;
//   transformScaleY: string;
//   transformScaleZ: string;
//   transformScale3d: string;
// };

// type TransformValuesKebab = {
//   "transform-rotate": string;
//   "transform-rotateX": string;
//   "transform-rotateY": string;
//   "transform-rotateZ": string;
//   "transform-rotate3d": string;
//   "transform-translate": string;
//   "transform-translateX": string;
//   "transform-translateY": string;
//   "transform-translateZ": string;
//   "transform-translate3d": string;
//   "transform-scale": string;
//   "transform-scaleX": string;
//   "transform-scaleY": string;
//   "transform-scaleZ": string;
//   "transform-scale3d": string;
// };