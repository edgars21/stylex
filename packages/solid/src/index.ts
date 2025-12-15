import {
  parseSelector,
  splitSelectorTypeAttribute,
  type StyleXJs,
  styleXFromStyleXJs,
  type Selector,
  isSettingsValueStylexJs,
  HierarchySelectorType,
  SelectorType,
} from "@stylex/shared/styleX";
import { type Accessor, createEffect, createSignal, onCleanup } from "solid-js";
import {
  setStyleProperty,
  convertStyleXToStyleSet,
  createEventListenerWithCleanupFactory,
  createObserveWithCleanupFactory,
  createMediaListenerWithCleanupFactory,
  isCombinedSelector,
} from "@stylex/web";
import "solid-js";
import { uniq, kebabCase } from "lodash-es";

export type { StyleXJs };

declare module "solid-js" {
  namespace JSX {
    interface Directives {
      stylex: StyleXJs;
    }
  }
}

function readAttributeSelectors(value: StyleXJs): Selector[] {
  const selectors: Set<Selector> = new Set();

  Object.entries(value).forEach(([key, val]) => {
    if (isSettingsValueStylexJs(val)) {
      val = val[0];
    }
    if (Array.isArray(val)) {
      // @ts-ignore
      val.forEach((v) => {
        if (Array.isArray(v)) {
          if (typeof v[0] === "string") {
            // @ts-ignore
            selectors.add(v[0]);
          }
        }
      });
    }
  });

  return Array.from(selectors);
}

export function stylexx(element: HTMLElement, value: StyleXJs, init?: boolean) {
  const stylex = styleXFromStyleXJs(value);
  const styleSet = convertStyleXToStyleSet(element, stylex);
  Object.entries(styleSet)
    .sort(([a], [b]) => (a === "transform" ? -1 : b === "transform" ? 1 : 0))
    .forEach(([key, val]) => {
      if (!val) {
        val = [null];
      }
      // @ts-ignore
      setStyleProperty(init, element, key, val[0], val[1]);
    });
}

export function stylex(element: HTMLElement, callback: () => StyleXJs) {
  const [listenWithCleanup, listenerCleanup] =
    createEventListenerWithCleanupFactory();
  const [observeWithCleanup, observerCleanup] =
    createObserveWithCleanupFactory();
  const [listeneMediaWithCleanup, mediaListenerCleanup] =
    createMediaListenerWithCleanupFactory();
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
      stylexx(element, value, true);
      init = true;
      // @ts-ignore
      if (value.log) {
        console.log(element, value);
      }
      const selectors = readAttributeSelectors(value);
      selectors.forEach((selector) => {
        let singleSelectors: Selector[] = [selector];

        if (isCombinedSelector(selector)) {
          if (typeof selector === "string") {
            singleSelectors = selector.split("&").map((s) => s.trim()) as Selector[];
          } else {
            singleSelectors = [];
          }
        }

        singleSelectors.forEach((selector) => {
          const [selectorValue, selectorType, selectorHierarchy] =
            parseSelector(selector);

          let elementToCheck = element;
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
              elementToCheck = hierarchyElement;
            } else {
              return false;
            }
          }

          if (selectorType === SelectorType.Boolean) return;
          const selectorValueStr = selectorValue as string;

          switch (selectorType) {
            case SelectorType.Media:
              listeneMediaWithCleanup(
                selectorValueStr.replace("@media", ""),
                () => {
                  setRerender((v) => v + 1);
                }
              );
              break;
            case SelectorType.Pseudo:
              if (selectorValueStr === ":hover") {
                listenWithCleanup(elementToCheck, "mouseenter", () => {
                  setRerender((v) => v + 1);
                });
                listenWithCleanup(elementToCheck, "mouseleave", () => {
                  setRerender((v) => v + 1);
                });
              } else if (selectorValueStr === ":active") {
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
              }
              break;
            case SelectorType.Attribute:
              const [attrName, attrValuey] =
                splitSelectorTypeAttribute(selectorValueStr);
              const fullAttrName = `data-stylex-${attrName}`;

              observeWithCleanup(
                elementToCheck,
                { attributes: true },
                (mutations) => {
                  for (const m of mutations) {
                    if (m.type === "attributes") {
                      if (m.attributeName === fullAttrName) {
                        setRerender((v) => v + 1);
                      }
                    }
                  }
                }
              );
              break;
          }
        });
      });
    } else {
      stylexx(element, value);
    }
  });
}
