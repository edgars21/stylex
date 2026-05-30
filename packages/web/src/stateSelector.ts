export type StateSelector =
  | CombinedStateSelector
  | CoreStateWtithHierarchySelector
  | CoreState;

export function stateSelectorParsed(value: StateSelector): StateSelectorParsed {
  if (isCombinedStateSelector(value)) {
    return combinedStateSelectorParsed(value);
  } else if (isCoreStateWtithHierarchySelector(value)) {
    return coreStateWtithHierarchyParsed(value);
  } else {
    return coreStateParsed(value);
  }
}

export function isStateSelector(value: string): value is StateSelector {
  if (isCombinedStateSelector(value)) {
    return true;
  } else if (isCoreStateWtithHierarchySelector(value)) {
    return true;
  } else if (isCoreState(value)) {
    return true;
  }
  return false;
}

export type StateSelectorParsed =
  | CombinedStateSelectorParsed
  | CoreStateWtithHierarchyParsed
  | CoreStateParsed;

export type CoreState = MediaState | AttributeState | PseudoState;

type MediaState = string & {
  brand: CoreStateType.Media;
};

type AttributeState = string & {
  brand: CoreStateType.Attribute;
};

type PseudoState = string & {
  brand: CoreStateType.Pseudo;
};

export function coreState(selector: CoreStateParsed): CoreState {
  switch (selector.kind) {
    case CoreStateType.Media:
      return selector.mediaMatch as CoreState;
    case CoreStateType.Pseudo:
      return selector.pseudoMatch as CoreState;
    case CoreStateType.Attribute:
      return `@${selector.name}${selector.value ? `=${selector.value}` : ""}` as CoreState;
  }
}

export type CoreStateParsed =
  | MediaStateParsed
  | AttributeStateParsed
  | PseudoStateParsed;

type MediaStateParsed = {
  kind: CoreStateType.Media;
  mediaMatch: string;
};

type AttributeStateParsed = {
  kind: CoreStateType.Attribute;
  name: string;
  value?: string;
};

type PseudoStateParsed = {
  kind: CoreStateType.Pseudo;
  pseudoMatch: string;
};

export function fastSelectorCheck(value: string): boolean {
  return !!value.match(/^(@|:|default|<|>|~|&)/);
}

export enum CoreStateType {
  Media = "Media",
  Pseudo = "Pseudo",
  Attribute = "Attribute",
}

export function coreStateParsed(selector: CoreState): CoreStateParsed {
  if (selector.startsWith("@media ")) {
    return {
      kind: CoreStateType.Media,
      mediaMatch: selector.replace("@media ", ""),
    };
  } else if (selector.startsWith(":")) {
    return {
      kind: CoreStateType.Pseudo,
      pseudoMatch: selector,
    };
  } else {
    const [attrName, attrValue] = splitSelectorTypeAttribute(selector);
    return {
      kind: CoreStateType.Attribute,
      name: attrName,
      ...(attrValue && { value: attrValue }),
    };
  }
}

// TODO: needs to be more robust check
export function isCoreState(value: string): value is CoreState {
  if (value.startsWith("@media")) {
    return true;
  } else if (value.startsWith(":")) {
    return true;
  } else if (value.startsWith("@")) {
    return true;
  }
  return false;
}

function splitSelectorTypeAttribute(value: string): [string, string?] {
  const [attrName, attrValue] = value.slice(1).split("=");
  return [attrName, attrValue as string | undefined];
}

type CoreStateWtithHierarchySelector =
  | CoreStateWithParentHierarchySelector
  | CoreStateWithChildHierarchySelector
  | CoreStateWithSiblingHierarchySelector;

type CoreStateWithParentHierarchySelector = string & {
  brand: "CoreStateWithParentHierarchySelector";
};

type CoreStateWithChildHierarchySelector = string & {
  brand: "CoreStateWithChildHierarchySelector";
};

type CoreStateWithSiblingHierarchySelector = string & {
  brand: "CoreStateWithSiblingHierarchySelector";
};

export type CoreStateWtithHierarchyParsed =
  | CoreStateWithParentHierarchyParsed
  | CoreStateWithChildHierarchyParsed
  | CoreStateWithSiblingHierarchyParsed;

type CoreStateWithParentHierarchyParsed = {
  kind: HierarchySelectorType.Parent;
  id: string;
  state: CoreStateParsed;
};

type CoreStateWithChildHierarchyParsed = {
  kind: HierarchySelectorType.Child;
  id: string;
  state: CoreStateParsed;
};

type CoreStateWithSiblingHierarchyParsed = {
  kind: HierarchySelectorType.Sibling;
  id: string;
  state: CoreStateParsed;
};

export enum HierarchySelectorType {
  Parent = "Parent",
  Child = "Child",
  Sibling = "Sibling",
}

export function coreStateWtithHierarchyParsed(
  value: CoreStateWtithHierarchySelector,
): CoreStateWtithHierarchyParsed {
  const regexValidatorHasParentSelector = /^(<[a-z]+(?:-[a-z]+)*)(.*$)/;
  const regexValidatorHasChildSelector = /^(>[a-z]+(?:-[a-z]+)*)(.*$)/;
  const regexValidatorHasSiblingSelector = /^(~[a-z]+(?:-[a-z]+)*)(.*$)/;

  const matchParentSelector = value.match(regexValidatorHasParentSelector) as
    | [string, string, CoreState]
    | null;
  if (matchParentSelector) {
    return {
      kind: HierarchySelectorType.Parent,
      id: matchParentSelector[1].slice(1),
      state: coreStateParsed(matchParentSelector[2]),
    };
  }

  const matchChildSelector = value.match(regexValidatorHasChildSelector) as
    | [string, string, CoreState]
    | null;
  if (matchChildSelector) {
    return {
      kind: HierarchySelectorType.Child,
      id: matchChildSelector[1].slice(1),
      state: coreStateParsed(matchChildSelector[2]),
    };
  }

  const matchSiblingSelector = value.match(
    regexValidatorHasSiblingSelector,
  ) as [string, string, CoreState];
  return {
    kind: HierarchySelectorType.Sibling,
    id: matchSiblingSelector[1].slice(1),
    state: coreStateParsed(matchSiblingSelector[2]),
  };
}

// TODO: needs to be more robust check
export function isCoreStateWtithHierarchySelector(
  value: string,
): value is CoreStateWtithHierarchySelector {
  const regexValidatorHasParentSelector = /^(<[a-z]+(?:-[a-z]+)*).*$/;
  const regexValidatorHasChildSelector = /^(>[a-z]+(?:-[a-z]+)*).*$/;
  const regexValidatorHasSiblingSelector = /^(~[a-z]+(?:-[a-z]+)*).*$/;

  const matchParentSelector = value.match(regexValidatorHasParentSelector);
  if (matchParentSelector && matchParentSelector[1]) {
    return true;
  }

  const matchChildSelector = value.match(regexValidatorHasChildSelector);
  if (matchChildSelector && matchChildSelector[1]) {
    return true;
  }

  const matchSiblingSelector = value.match(regexValidatorHasSiblingSelector);
  if (matchSiblingSelector && matchSiblingSelector[1]) {
    return true;
  }
  return false;
}

type CombinedStateSelector = string & {
  brand: "CombinedStateSelector";
};

type CombinedStateSelectorParsed = (
  | CoreStateWtithHierarchyParsed
  | CoreStateParsed
)[];
export function combinedStateSelectorParsed(
  value: CombinedStateSelector,
): CombinedStateSelectorParsed {
  const states = value.split("&") as (
    | CoreStateWtithHierarchySelector
    | CoreState
  )[];

  return states.map((state) => {
    if (isCoreStateWtithHierarchySelector(state)) {
      return coreStateWtithHierarchyParsed(state);
    } else {
      return coreStateParsed(state);
    }
  });
}

// TODO: needs to be more robust check
export function isCombinedStateSelector(
  value: string,
): value is CombinedStateSelector {
  return value.includes("&");
}

export function isCoreStateOrCoreStateWtithHierarchyMatches(
  selector: CoreStateParsed | CoreStateWtithHierarchyParsed,
  element: HTMLElement,
) {
  let coreStateSelector: CoreStateParsed;
  if (
    selector.kind === HierarchySelectorType.Child ||
    selector.kind === HierarchySelectorType.Parent ||
    selector.kind === HierarchySelectorType.Sibling
  ) {
    let hierarchyElement: HTMLElement | undefined;
    coreStateSelector = selector.state;
    switch (selector.kind) {
      case HierarchySelectorType.Parent:
        hierarchyElement = element.closest(
          `[data-stylex-id="${selector.id}"]`,
        ) as HTMLElement | undefined;
        break;
      case HierarchySelectorType.Child:
        hierarchyElement = element.querySelector(
          `[data-stylex-id="${selector.id}"]`,
        ) as HTMLElement | undefined;
        break;
      case HierarchySelectorType.Sibling:
        hierarchyElement = element.parentElement?.querySelector(
          `[data-stylex-id="${selector.id}"]`,
        ) as HTMLElement | undefined;
        break;
    }
    if (hierarchyElement) {
      element = hierarchyElement;
    } else {
      return false;
    }
  } else {
    coreStateSelector = selector;
  }

  switch (coreStateSelector.kind) {
    case CoreStateType.Media:
      if (window.matchMedia(coreStateSelector.mediaMatch).matches) {
        return true;
      }
      break;
    case CoreStateType.Pseudo:
      if (element.matches(coreStateSelector.pseudoMatch)) {
        return true;
      }
      break;
    case CoreStateType.Attribute:
      const fullAttrName = `${coreStateSelector.name}`;
      if (
        !coreStateSelector.value
          ? element?.hasAttribute(fullAttrName)
          : element?.getAttribute(fullAttrName) === coreStateSelector.value
      ) {
        return true;
      }
      break;
  }
  return false;
}

export function isCoreStateOrCoreStateWtithHierarchyOrCombinedStateMatches(
  selector:
    | CoreStateParsed
    | CoreStateWtithHierarchyParsed
    | CombinedStateSelectorParsed,
  element: HTMLElement,
) {
  if (Array.isArray(selector)) {
    return selector.every((state) =>
      isCoreStateOrCoreStateWtithHierarchyMatches(state, element),
    );
  } else {
    return isCoreStateOrCoreStateWtithHierarchyMatches(selector, element);
  }
}
