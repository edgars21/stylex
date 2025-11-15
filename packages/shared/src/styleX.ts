import type * as CSS from "csstype";
import { uniq, kebabCase } from "lodash-es";

export type StyleSet = {
  [K in CssPropertyName]?: string;
};

export type CssPropertyNameCamelCase = keyof CSS.Properties<
  string | number,
  string | number
>;

type CssPropertyName = keyof CSS.PropertiesHyphen<
  string | number,
  string | number
>;
type CssPropertyNameWithCamelCase = keyof CSS.Properties<
  string | number,
  string | number
>;
type CssPropertyValue = string;

export type StyleXPropertyCamelCase =  CssPropertyNameCamelCase | keyof TransformValues;

type TransformValues = {
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

type TransformValuesKebab = {
  "transform-rotate": string;
  "transform-rotateX": string;
  "transform-rotateY": string;
  "transform-rotateZ": string;
  "transform-rotate3d": string;
  "transform-translate": string;
  "transform-translateX": string;
  "transform-translateY": string;
  "transform-translateZ": string;
  "transform-translate3d": string;
  "transform-scale": string;
  "transform-scaleX": string;
  "transform-scaleY": string;
  "transform-scaleZ": string;
  "transform-scale3d": string;
};

export type StyleX = {
  [K in StyleXProperty]?: StyleXValue;
};
export function isStyleX(value: Object): value is StyleX {
  if (
    Object.entries(value).every(([sxProperty, sxValue]) =>
      isStyleXEntry([sxProperty, sxValue])
    )
  ) {
    return true;
  }
  return false;
}

export function assertStyleX(value: Object): asserts value is StyleX {
  if (!isStyleX(value)) {
    throw new Error("Invalid StyleX object");
  }
}

export type StyleXEntry = [StyleXProperty, StyleXValue];
function isStyleXEntry(value: [any, any]): value is StyleXEntry {
  if (isStyleXProperty(value[0]) || isStyleXValue(value[1])) {
    return true;
  }
  return false;
}
export function assertStyleXEntry(value: [any, any]) {
  if (!isStyleXEntry(value)) {
    throw new Error(`Invalid StyleXEntry tuple: ${JSON.stringify(value)}`);
  }
}

export type StyleXProperty = CssPropertyName;
export function isStyleXProperty(value: any): value is StyleXProperty {
  if (typeof value === "string") {
    return true;
  }
  return false;
}
export function assertStyleXProperty(value: any) {
  if (!isStyleXProperty(value)) {
    throw new Error(`Invalid StyleXProperty value: ${JSON.stringify(value)}`);
  }
}

export type StyleXValue = CssPropertyValue | ValueDynamic;
export function isStyleXValue(value: any): value is StyleXValue {
  if (isValueString(value) || isValueDynamic(value)) {
    return true;
  }
  throw new Error("isStyleXValue: nothing matched");
  return false;
}
export function assertStyleXValue(value: any) {
  if (!isStyleXValue(value)) {
    throw new Error(`Invalid StyleXValue value: ${JSON.stringify(value)}`);
  }
}

export function isValueString(value: any): value is string {
  return typeof value === "string";
}
export function assertisValueString(value: any) {
  if (!isValueString(value)) {
    throw new Error(`Invalid ValueString value: ${JSON.stringify(value)}`);
  }
}

declare const BrandValueDynamic: unique symbol;
export type ValueDynamic = (string | ValueDynamicTuple)[] & {
  readonly [BrandValueDynamic]: true;
};

function isValueDynamic(value: any): value is ValueDynamic {
  value = uniq(value);
  if (Array.isArray(value) && value.length > 0) {
    const last = value.slice(-1)[0];
    const rest = value.slice(0, -1);

    if (rest.length) {
      const allValid = rest.every((v) => isValueDynamicTuple(v));
      if (!allValid) {
        return false;
      }
    }

    if (isValueString(last)) {
      return true;
    } else if (isValueDynamicTuple(last)) {
      return true;
    }
  }
  return false;
}
export function assertValueDynamic(value: any) {
  if (!isValueDynamic(value)) {
    throw new Error(`Invalid ValueDynamic value: ${JSON.stringify(value)}`);
  }
}
export function splitValueDynamic(
  value: ValueDynamic
): [ValueDynamicTuple[], string | undefined] {
  let defaultValue: string | undefined = undefined;
  let last = value.slice(-1)[0];
  const rest = value.slice(0, -1) as ValueDynamicTuple[];
  if (isValueString(last)) {
    defaultValue = last;
  } else {
    rest.push(last);
  }
  return [rest, defaultValue];
}

export type ValueDynamicTuple = [ValueDynamicTupleSelector, CssPropertyValue];
function isValueDynamicTuple(value: any): value is ValueDynamicTuple {
  if (Array.isArray(value) && value.length === 2) {
    if (isValueDynamicTupleSelector(value[0]) && isValueString(value[1])) {
      return true;
    }
  }

  return false;
}
export function assertValueDynamicTuple(
  value: any
): asserts value is ValueDynamicTuple {
  if (!isValueDynamicTuple(value)) {
    throw new Error(
      `Invalid ValueDynamicTuple value: ${JSON.stringify(value)}`
    );
  }
}

export type ValueDynamicTupleSelector =
  | ValueDynamicTupleSelectorMedia
  | ValueDynamicTupleSelectorPseudoHover
  | ValueDynamicTupleSelectorAttribute;
export function isValueDynamicTupleSelector(
  value: string
): value is ValueDynamicTupleSelector {
  [value] = ensureHierarchySafeSelector(value);

  if (isValueDynamicTupleSelectorMedia(value)) {
    return true;
  }

  if (isValueDynamicTupleSelectorPseudoHover(value)) {
    return true;
  }

  if (isValueDynamicTupleSelectorAttribute(value)) {
    return true;
  }

  return false;
}
export function assertValueDynamicTupleSelector(
  value: any
): asserts value is ValueDynamicTupleSelector {
  if (!isValueDynamicTupleSelector(value)) {
    throw new Error(
      `Invalid ValueDynamicTupleSelector value: ${JSON.stringify(value)}`
    );
  }
}

export enum ValueDynamicTupleSelectorType {
  Media,
  PseudoHover,
  PseudoActive,
  Attribute,
}
export function getDynamicTupleSelectorType(
  value: ValueDynamicTupleSelector
):
  | [ValueDynamicTupleSelectorType.Media, ValueDynamicTupleSelectorMedia]
  | [
      ValueDynamicTupleSelectorType.PseudoHover,
      ValueDynamicTupleSelectorPseudoHover,
      HierarchySelector?
    ]
  | [
      ValueDynamicTupleSelectorType.PseudoActive,
      ValueDynamicTupleSelectorPseudoActive,
      HierarchySelector?
    ]
  | [
      ValueDynamicTupleSelectorType.Attribute,
      ValueDynamicTupleSelectorAttribute,
      HierarchySelector?
    ] {

  const result = ensureHierarchySafeSelector(value);
  value = result[0];
  const hierarchySelector = result[1];
  if (isValueDynamicTupleSelectorPseudoHover(value)) {
    return [
      ValueDynamicTupleSelectorType.PseudoHover,
      value,
      hierarchySelector,
    ];
  }
  if (isValueDynamicTupleSelectorPseudoActive(value)) {
    return [
      ValueDynamicTupleSelectorType.PseudoActive,
      value,
      hierarchySelector,
    ];
  }
  if (isValueDynamicTupleSelectorMedia(value)) {
    return [ValueDynamicTupleSelectorType.Media, value];
  }
  if (isValueDynamicTupleSelectorAttribute(value)) {
    return [ValueDynamicTupleSelectorType.Attribute, value, hierarchySelector];
  }

  throw new Error("nothing");
}

export enum HierarchySelectorType {
  Parent,
  Child,
  Sibling,
}
type HierarchySelector = [HierarchySelectorType, string];
function ensureHierarchySafeSelector<
  T extends ValueDynamicTupleSelector | string
>(value: T): [T, undefined] | [T, HierarchySelector] {
  const regexValidatorHasParentSelector = /^([a-z]+>).*$/;
  const regexValidatorHasChildSelector = /^(>[a-z]+).*$/;
  const regexValidatorHasSiblingSelector = /^(~[a-z]+).*$/;


  const matchParentSelector = value.match(regexValidatorHasParentSelector);
  if (matchParentSelector && matchParentSelector[1]) {
    value = value.replace(matchParentSelector[1], "") as T;
    return [
      value,
      [HierarchySelectorType.Parent, matchParentSelector[1].slice(0, -1)],
    ];
  }

  const matchChildSelector = value.match(regexValidatorHasChildSelector);
  if (matchChildSelector && matchChildSelector[1]) {
    value = value.replace(matchChildSelector[1], "") as T;
    return [
      value,
      [HierarchySelectorType.Child, matchChildSelector[1].slice(1)],
    ];
  }

  const matchSiblingSelector = value.match(regexValidatorHasSiblingSelector);
  if (matchSiblingSelector && matchSiblingSelector[1]) {
    value = value.replace(matchSiblingSelector[1], "") as T;
    return [
      value,
      [HierarchySelectorType.Sibling, matchSiblingSelector[1].slice(1)],
    ];
  }

  return [value, undefined];
}

type ValueDynamicTupleSelectorMedia = string & {
  readonly __brand: "ValueDynamicTupleSelectorMedia";
};
function isValueDynamicTupleSelectorMedia(
  value: string
): value is ValueDynamicTupleSelectorMedia {
  if (value.startsWith("@media")) {
    return true;
  }
  return false;
}
export function assertValueDynamicTupleSelectorMedia(
  value: string
): asserts value is ValueDynamicTupleSelectorMedia {
  if (!isValueDynamicTupleSelectorMedia(value)) {
    throw new Error(
      `Invalid ValueDynamicTupleSelectorMedia value: ${JSON.stringify(value)}`
    );
  }
}

type ValueDynamicTupleSelectorPseudoHover = string & {
  readonly __brand: "ValueDynamicTupleSelectorPseudoHover";
};
export function isValueDynamicTupleSelectorPseudoHover(
  value: string
): value is ValueDynamicTupleSelectorPseudoHover {
  [value] = ensureHierarchySafeSelector(value);
  return value === "@hover";
}
export function assertValueDynamicTupleSelectorPseudoHover(
  value: string
): asserts value is ValueDynamicTupleSelectorPseudoHover {
  if (!isValueDynamicTupleSelectorPseudoHover(value)) {
    throw new Error(
      `Invalid ValueDynamicTupleSelectorPseudoHover value: ${JSON.stringify(
        value
      )}`
    );
  }
}

type ValueDynamicTupleSelectorPseudoActive = string & {
  readonly __brand: "ValueDynamicTupleSelectorPseudoActive";
};
export function isValueDynamicTupleSelectorPseudoActive(
  value: string
): value is ValueDynamicTupleSelectorPseudoActive {
  [value] = ensureHierarchySafeSelector(value);
  return value === "@active";
}
export function assertValueDynamicTupleSelectorPseudoActive(
  value: string
): asserts value is ValueDynamicTupleSelectorPseudoActive {
  if (!isValueDynamicTupleSelectorPseudoActive(value)) {
    throw new Error(
      `Invalid ValueDynamicTupleSelectorPseudoActive value: ${JSON.stringify(
        value
      )}`
    );
  }
}

export type ValueDynamicTupleSelectorAttribute = string & {
  readonly __brand: "ValueDynamicTupleSelectorAttribute";
};
function isValueDynamicTupleSelectorAttribute(
  value: string
): value is ValueDynamicTupleSelectorAttribute {
  [value] = ensureHierarchySafeSelector(value);
  if (
    value.startsWith("@") &&
    !isValueDynamicTupleSelectorMedia(value) &&
    !isValueDynamicTupleSelectorMedia(value)
  ) {
    return true;
  }
  return false;
}
export function assertValueDynamicTupleSelectorAttribute(
  value: string
): asserts value is ValueDynamicTupleSelectorAttribute {
  if (!isValueDynamicTupleSelectorAttribute(value)) {
    throw new Error(
      `Invalid ValueDynamicTupleSelectorAttribute value: ${JSON.stringify(
        value
      )}`
    );
  }
}
export function splitValueDynamicTupleSelectorAttribute(
  value: ValueDynamicTupleSelectorAttribute
): [string, string?, HierarchySelector?] {
  const result = ensureHierarchySafeSelector(value);
  const hierarchySelector = result[1];

  const [attrName, attrValue] = value.slice(1).split("=");

  return [attrName, attrValue, hierarchySelector];
}

export type StyleXValidJsType = {
  [K in StyleXPropertyCamelCase]?: string | ([string, string] | string)[];
};
export function convertStyleXValidSolidTypeToStyleX(
  value: StyleXValidJsType
): StyleX {
  const result: {
    string?: string | ([string, string] | string)[];
  } = {};

  Object.entries(value).forEach(([key, val]) => {
    if (!key.startsWith("--")) {
      key = kebabCase(key);
    }
    if (typeof val === "string") {
      result[key] = val;
    } else {
      val;
      if (val.length === 0) {
        return;
      } else if (val.length === 1 && typeof val[0] === "string") {
        result[key] = val[0];
      } else {
        let first = val[0];
        let last = val[val.length - 1];
        let rest = val.slice(1, -1);

        rest = rest.filter((v) => isValueDynamicTuple(v));

        if (last && isValueDynamicTuple(last)) {
          rest.push(last);
          last = undefined;
        } else if (last && typeof last !== "string") {
          last = undefined;
        }

        if (isValueDynamicTuple(first)) {
          rest.unshift(first);
        } else if (typeof first === "string") {
          last = first;
        }

        if (last) {
          rest.push(last);
        }

        result[key] = rest;
      }
    }
  });

  assertStyleX(result);
  return result;
}
