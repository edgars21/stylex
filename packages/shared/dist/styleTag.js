import { isValueString, getDynamicTupleSelectorType, ValueDynamicTupleSelectorType, splitValueDynamicTupleSelectorAttribute, HierarchySelectorType, } from "./styleX";
export function getStyleEntries(stylex, id) {
    return Object.entries(stylex)
        .map((entry) => createStyleEntries(entry, id))
        .flat();
}
function createStyleEntries([propertyName, sxValue], id) {
    if (isValueString(sxValue)) {
        return [[`[data-stylex-id="${id}"]`, [propertyName, sxValue]]];
    }
    return sxValue.map((sxValueDynamic) => {
        if (isValueString(sxValueDynamic)) {
            return [`[data-stylex-id="${id}"]`, [propertyName, sxValueDynamic]];
        }
        const [selecotrValue, propertyValue] = sxValueDynamic;
        const [selectorType, _, hierarchySelector] = getDynamicTupleSelectorType(selecotrValue);
        switch (selectorType) {
            case ValueDynamicTupleSelectorType.PseudoHover:
                if (hierarchySelector?.[0] === HierarchySelectorType.Parent) {
                    return [
                        `[data-stylex-id="${hierarchySelector[1]}"]:hover [data-stylex-id="${id}"]`,
                        [propertyName, propertyValue],
                    ];
                }
                return [
                    `[data-stylex-id="${id}"]:hover`,
                    [propertyName, propertyValue],
                ];
            case ValueDynamicTupleSelectorType.Attribute:
                const [attributeName, attributeValue] = splitValueDynamicTupleSelectorAttribute(selecotrValue);
                if (hierarchySelector?.[0] === HierarchySelectorType.Parent) {
                    return [
                        `[data-stylex-id="${hierarchySelector}"][data-stylex-${attributeName}="${attributeValue}"] [data-stylex-id="${id}"]`,
                        [propertyName, propertyValue],
                    ];
                }
                return [
                    `[data-stylex-id="${id}"][data-stylex-${attributeName}="${attributeValue}"]`,
                    [propertyName, propertyValue],
                ];
            case ValueDynamicTupleSelectorType.Media:
                return [
                    [selecotrValue, `[data-stylex-id="${id}"]`],
                    [propertyName, propertyValue],
                ];
        }
    });
}
export function createCssRulesestBlock(stylex, id) {
    const styleEntries = getStyleEntries(stylex, id);
    return styleEntries
        .map(([selector, [name, value]]) => {
        if (Array.isArray(selector)) {
            return `${selector[0]} { ${selector[1]} { ${name}: ${value}; }}`;
        }
        return `${selector} { ${name}: ${value}; }`;
    })
        .join("\n");
}
export function createStyleTagElement(settings = {
    id: "root",
    append: true,
}) {
    const styleEl = document.createElement("style");
    styleEl.setAttribute("data-sx", settings.id);
    if (settings.content) {
        styleEl.textContent = settings.content;
    }
    if (settings.append) {
        appendStyleTagElementTo(styleEl, settings.append instanceof HTMLElement ? settings.append : undefined);
    }
    return styleEl;
}
function appendStyleTagElementTo(styleTag, target = document.head) {
    target.appendChild(styleTag);
}
//# sourceMappingURL=styleTag.js.map