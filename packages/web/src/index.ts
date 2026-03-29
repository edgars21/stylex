import { kebabCase } from "lodash-es";

type Setter = Record<string, ValueofSetter>;
type ValueofSetter =
  | string
  | number
  | (string | number | [string, string | number])[];

export class StyleX {
  #propertyMap = new Map<string, StyleXValue>();
  #element: HTMLElement;
  constructor(element: HTMLElement, initialData?: Setter) {
    Object.entries(initialData || {}).forEach(([key, value]) => {
      const stylexValue = creatStylexValue(value);
      if (stylexValue.length) {
        this.#propertyMap.set(key, stylexValue);
        this[key] = stylexValue;
      }
    });

    const proxy = new Proxy(this, {
      set(target, prop, value) {
        // guard logic
        if (typeof value === "undefined") {
          throw new Error(`Cannot set ${String(prop)} to undefined`);
        }
        target[prop] = value;
        return true;
      },
      get(target, prop, receiver) {
        if (prop === Symbol.iterator) {
          return target[Symbol.iterator].bind(target);
        }
        return Reflect.get(target, prop, receiver);
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
    this.#element = element;

    evaluateAandApplyStylex(this, element);

    return proxy;
  }

  [Symbol.iterator](): Iterator<[string, StyleXValue]> {
    return this.#propertyMap[Symbol.iterator]();
  }
}

function evaluateAandApplyStylex(stylex: StyleX, element: HTMLElement) {
  Array.from(stylex).forEach(([propertyName, stylexValue]) => {
    evaluateAndApplyStylexValue(propertyName, stylexValue, element);
  });
}

function evaluateAndApplyStylexValue(
  propertyName: string,
  value: StyleXValue,
  element: HTMLElement,
) {
  const evaluatedValue = evalulateStylexValue(value, element);
  if (evaluatedValue) {
    applyStylexValue(element, {
      name: propertyName,
      value: String(evaluatedValue),
    });
  }
}

function evalulateStylexValue(
  value: StyleXValue,
  element: HTMLElement,
): string | number | null {
  const match = (
    Array.from(value) as [StringSelector | "default", string | number][]
  ).find(([stringSelector, val]) => {
    if (stringSelector === "default") {
      return true;
    } else if (isSingleSelectorMatches(selector(stringSelector), element)) {
      return true;
    }
  });

  return match ? match[1] : null;
}

export function isSingleSelectorMatches(
  selector: Selector,
  element: HTMLElement,
) {
  if (selector.hierarchySelector) {
    let hierarchyElement: HTMLElement | undefined;
    switch (selector.hierarchySelector[0]) {
      case HierarchySelectorType.Parent:
        hierarchyElement = element.closest(
          `[data-stylex-id="${selector.hierarchySelector[1]}"]`,
        ) as HTMLElement | undefined;
        break;
      case HierarchySelectorType.Child:
        hierarchyElement = element.querySelector(
          `[data-stylex-id="${selector.hierarchySelector[1]}"]`,
        ) as HTMLElement | undefined;
        break;
      case HierarchySelectorType.Sibling:
        hierarchyElement = element.parentElement?.querySelector(
          `[data-stylex-id="${selector.hierarchySelector[1]}"]`,
        ) as HTMLElement | undefined;
        break;
    }
    if (hierarchyElement) {
      element = hierarchyElement;
    } else {
      return false;
    }
  }

  switch (selector.kind) {
    case SelectorType.Media:
      if (window.matchMedia(selector.mediaMatch).matches) {
        return true;
      }
      break;
    case SelectorType.Pseudo:
      if (element.matches(selector.pseudoMatch)) {
        return true;
      }
      break;
    case SelectorType.Attribute:
      const fullAttrName = `data-stylex-${selector.name}`;
      if (
        !selector.value
          ? element?.hasAttribute(fullAttrName)
          : element?.getAttribute(fullAttrName) === selector.value
      ) {
        return true;
      }
      break;
  }
  return false;
}

type StyleXValue = {} & {
  brand: "StyleXValue";
  length: number;
};
function creatStylexValue(setter: ValueofSetter): StyleXValue {
  const proxybOject = {};
  const mapValue = new Map<StringSelector, string | number>();
  let defaultValue: string | number;
  let values: [StringSelector, string | number][];
  if (typeof setter === "string" || typeof setter === "number") {
    defaultValue = setter;
  } else {
    const firstDefaultValue = setter.find(
      (s) => typeof s === "string" || typeof s === "number",
    );
    if (firstDefaultValue) {
      defaultValue = firstDefaultValue;
    }
    const onlyWithValidSelector = setter.filter(
      (s) => Array.isArray(s) && isStringSelector(s[0]),
    ) as [StringSelector, string | number][];
    if (onlyWithValidSelector.length > 0) {
      values = onlyWithValidSelector;
    }
  }

  if (values) {
    values.forEach(([selector, value]) => {
      mapValue.set(selector, value);
    });
  }
  if (defaultValue) {
    mapValue.set("default" as StringSelector, defaultValue);
  }

  const arrayValue = Array.from(mapValue);

  arrayValue.forEach(([selector, value], idx) => {
    proxybOject[selector] = value;
    proxybOject[idx] = [selector, value];
  });

  Object.defineProperty(proxybOject, "length", {
    get() {
      return mapValue.size;
    },
    enumerable: false,
  });

  const handler = {
    set(obj, prop, value) {
      throw new Error("Direct mutation is not allowed");
    },
  };

  const proxy = new Proxy(proxybOject, handler) as unknown as StyleXValue;
  return proxy;
}

type Selector = MediaSelector | AttributeSelector | PseudosSelector;

type MediaSelector = {
  kind: SelectorType.Media;
  mediaMatch: string;
  hierarchySelector?: HierarchySelector;
};

type AttributeSelector = {
  kind: SelectorType.Attribute;
  name: string;
  value?: string;
  hierarchySelector?: HierarchySelector;
};

type PseudosSelector = {
  kind: SelectorType.Pseudo;
  pseudoMatch: string;
  hierarchySelector?: HierarchySelector;
};

export enum SelectorType {
  Media,
  Pseudo,
  Attribute,
}

type StringSelector = string & {
  brand: "StringSelector";
};

function stringSelector(selector: Selector): StringSelector {
  let selectorValue: string;
  if (selector.kind === SelectorType.Media) {
    selectorValue = `@media ${selector.mediaMatch}`;
  } else if (selector.kind === SelectorType.Pseudo) {
    selectorValue = selector.pseudoMatch;
  } else {
    if (selector.value) {
      selectorValue = `@${selector.name}=${selector.value}`;
    }
    selectorValue = `@${selector.name}`;
  }

  if (selector.hierarchySelector) {
    if (selector.hierarchySelector[0] === HierarchySelectorType.Parent) {
      selectorValue = `<${selector.hierarchySelector[1]}${selectorValue}`;
    } else if (selector.hierarchySelector[0] === HierarchySelectorType.Child) {
      selectorValue = `>${selector.hierarchySelector[1]}${selectorValue}`;
    } else if (
      selector.hierarchySelector[0] === HierarchySelectorType.Sibling
    ) {
      selectorValue = `~${selector.hierarchySelector[1]}${selectorValue}`;
    }
  }

  return selectorValue as StringSelector;
}

function selector(value: StringSelector): Selector;
function selector(value: string): Selector | null;
function selector(value: StringSelector): Selector {
  const [valueWithoutHierarchy, hierarchySelector] =
    splitHierarchySelector(value);
  if (isStringSelector(valueWithoutHierarchy)) {
    if (isStringMediaSelector(valueWithoutHierarchy)) {
      return {
        kind: SelectorType.Media,
        mediaMatch: value.replace("@media ", "").replace("@media", ""),
        ...(hierarchySelector && { hierarchySelector }),
      };
    } else if (isStringPseudoSelector(valueWithoutHierarchy)) {
      return {
        kind: SelectorType.Pseudo,
        pseudoMatch: value,
        ...(hierarchySelector && { hierarchySelector }),
      };
    } else if (isStringAttributeSelector(valueWithoutHierarchy)) {
      const [attrName, attrValue] = splitSelectorTypeAttribute(
        valueWithoutHierarchy,
      );
      return {
        kind: SelectorType.Attribute,
        name: attrName,
        ...(attrValue && { value: attrValue }),
        ...(hierarchySelector && { hierarchySelector }),
      };
    }
  } else {
    return null;
  }
}

function isStringSelector(value: string): value is StringSelector {
  const [valueWithoutHierarchy] = splitHierarchySelector(value);

  return (
    isStringMediaSelector(valueWithoutHierarchy) ||
    isStringPseudoSelector(valueWithoutHierarchy) ||
    isStringAttributeSelector(valueWithoutHierarchy)
  );
}
function isStringMediaSelector(value: StringValueWeithoutHierarchy): boolean {
  return value.startsWith("@media");
}

function isStringPseudoSelector(value: StringValueWeithoutHierarchy): boolean {
  return value.startsWith(":");
}

function isStringAttributeSelector(
  value: StringValueWeithoutHierarchy,
): boolean {
  return value.startsWith("@");
}

function splitSelectorTypeAttribute(value: string): [string, string?] {
  const [attrName, attrValue] = value.slice(1).split("=");
  return [attrName, attrValue as string | undefined];
}

export enum HierarchySelectorType {
  Parent,
  Child,
  Sibling,
}
type StringValueWeithoutHierarchy = string & {
  brand: "StringValueWeithoutHierarchy";
};
type HierarchySelector = [HierarchySelectorType, string];
function splitHierarchySelector(
  value: string,
): [StringValueWeithoutHierarchy, HierarchySelector?] {
  const regexValidatorHasParentSelector = /^(<[a-z]+(?:-[a-z]+)*).*$/;
  const regexValidatorHasChildSelector = /^(>[a-z]+(?:-[a-z]+)*).*$/;
  const regexValidatorHasSiblingSelector = /^(~[a-z]+(?:-[a-z]+)*).*$/;

  const matchParentSelector = value.match(regexValidatorHasParentSelector);
  if (matchParentSelector && matchParentSelector[1]) {
    value = value.replace(matchParentSelector[1], "");
    return [
      value as StringValueWeithoutHierarchy,
      [HierarchySelectorType.Parent, matchParentSelector[1].slice(1)],
    ];
  }

  const matchChildSelector = value.match(regexValidatorHasChildSelector);
  if (matchChildSelector && matchChildSelector[1]) {
    value = value.replace(matchChildSelector[1], "");
    return [
      value as StringValueWeithoutHierarchy,
      [HierarchySelectorType.Child, matchChildSelector[1].slice(1)],
    ];
  }

  const matchSiblingSelector = value.match(regexValidatorHasSiblingSelector);
  if (matchSiblingSelector && matchSiblingSelector[1]) {
    value = value.replace(matchSiblingSelector[1], "");
    return [
      value as StringValueWeithoutHierarchy,
      [HierarchySelectorType.Sibling, matchSiblingSelector[1].slice(1)],
    ];
  }

  return [value as StringValueWeithoutHierarchy];
}

interface Property {
  name: string;
  value: string;
}

function applyStylexValue(element: HTMLElement, property: Property) {
  element.style.setProperty(kebabCase(property.name), String(property.value));
}

function removeStyle(element: HTMLElement, propertyName: string) {
  element.style.removeProperty(kebabCase(propertyName));
}
