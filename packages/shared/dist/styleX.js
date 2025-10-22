import { uniq, kebabCase } from "lodash-es";
const test = "transform";
export function isStyleX(value) {
    if (Object.entries(value).every(([sxProperty, sxValue]) => isStyleXEntry([sxProperty, sxValue]))) {
        return true;
    }
    return false;
}
export function assertStyleX(value) {
    if (!isStyleX(value)) {
        throw new Error("Invalid StyleX object");
    }
}
function isStyleXEntry(value) {
    if (isStyleXProperty(value[0]) || isStyleXValue(value[1])) {
        return true;
    }
    return false;
}
export function assertStyleXEntry(value) {
    if (!isStyleXEntry(value)) {
        throw new Error(`Invalid StyleXEntry tuple: ${JSON.stringify(value)}`);
    }
}
export function isStyleXProperty(value) {
    if (typeof value === "string") {
        return true;
    }
    return false;
}
export function assertStyleXProperty(value) {
    if (!isStyleXProperty(value)) {
        throw new Error(`Invalid StyleXProperty value: ${JSON.stringify(value)}`);
    }
}
export function isStyleXValue(value) {
    if (isValueString(value) || isValueDynamic(value)) {
        return true;
    }
    throw new Error("isStyleXValue: nothing matched");
    return false;
}
export function assertStyleXValue(value) {
    if (!isStyleXValue(value)) {
        throw new Error(`Invalid StyleXValue value: ${JSON.stringify(value)}`);
    }
}
export function isValueString(value) {
    return typeof value === "string";
}
export function assertisValueString(value) {
    if (!isValueString(value)) {
        throw new Error(`Invalid ValueString value: ${JSON.stringify(value)}`);
    }
}
function isValueDynamic(value) {
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
        }
        else if (isValueDynamicTuple(last)) {
            return true;
        }
    }
    return false;
}
export function assertValueDynamic(value) {
    if (!isValueDynamic(value)) {
        throw new Error(`Invalid ValueDynamic value: ${JSON.stringify(value)}`);
    }
}
export function splitValueDynamic(value) {
    let defaultValue = undefined;
    let last = value.slice(-1)[0];
    const rest = value.slice(0, -1);
    if (isValueString(last)) {
        defaultValue = last;
    }
    else {
        rest.push(last);
    }
    return [rest, defaultValue];
}
function isValueDynamicTuple(value) {
    if (Array.isArray(value) && value.length === 2) {
        if (isValueDynamicTupleSelector(value[0]) && isValueString(value[1])) {
            return true;
        }
    }
    return false;
}
export function assertValueDynamicTuple(value) {
    if (!isValueDynamicTuple(value)) {
        throw new Error(`Invalid ValueDynamicTuple value: ${JSON.stringify(value)}`);
    }
}
export function isValueDynamicTupleSelector(value) {
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
export function assertValueDynamicTupleSelector(value) {
    if (!isValueDynamicTupleSelector(value)) {
        throw new Error(`Invalid ValueDynamicTupleSelector value: ${JSON.stringify(value)}`);
    }
}
export var ValueDynamicTupleSelectorType;
(function (ValueDynamicTupleSelectorType) {
    ValueDynamicTupleSelectorType[ValueDynamicTupleSelectorType["Media"] = 0] = "Media";
    ValueDynamicTupleSelectorType[ValueDynamicTupleSelectorType["PseudoHover"] = 1] = "PseudoHover";
    ValueDynamicTupleSelectorType[ValueDynamicTupleSelectorType["PseudoActive"] = 2] = "PseudoActive";
    ValueDynamicTupleSelectorType[ValueDynamicTupleSelectorType["Attribute"] = 3] = "Attribute";
})(ValueDynamicTupleSelectorType || (ValueDynamicTupleSelectorType = {}));
export function getDynamicTupleSelectorType(value) {
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
export var HierarchySelectorType;
(function (HierarchySelectorType) {
    HierarchySelectorType[HierarchySelectorType["Parent"] = 0] = "Parent";
    HierarchySelectorType[HierarchySelectorType["Child"] = 1] = "Child";
})(HierarchySelectorType || (HierarchySelectorType = {}));
function ensureHierarchySafeSelector(value) {
    const regexValidatorHasParentSelector = /^([a-z]+>).*$/;
    const regexValidatorHasChildSelector = /^(>[a-z]+).*$/;
    const matchParentSelector = value.match(regexValidatorHasParentSelector);
    if (matchParentSelector && matchParentSelector[1]) {
        value = value.replace(matchParentSelector[1], "");
        return [
            value,
            [HierarchySelectorType.Parent, matchParentSelector[1].slice(0, -1)],
        ];
    }
    const matchChildSelector = value.match(regexValidatorHasChildSelector);
    if (matchChildSelector && matchChildSelector[1]) {
        value = value.replace(matchChildSelector[1], "");
        return [
            value,
            [HierarchySelectorType.Child, matchChildSelector[1].slice(1)],
        ];
    }
    return [value, undefined];
}
function isValueDynamicTupleSelectorMedia(value) {
    if (value.startsWith("@media")) {
        return true;
    }
    return false;
}
export function assertValueDynamicTupleSelectorMedia(value) {
    if (!isValueDynamicTupleSelectorMedia(value)) {
        throw new Error(`Invalid ValueDynamicTupleSelectorMedia value: ${JSON.stringify(value)}`);
    }
}
export function isValueDynamicTupleSelectorPseudoHover(value) {
    [value] = ensureHierarchySafeSelector(value);
    return value === "@hover";
}
export function assertValueDynamicTupleSelectorPseudoHover(value) {
    if (!isValueDynamicTupleSelectorPseudoHover(value)) {
        throw new Error(`Invalid ValueDynamicTupleSelectorPseudoHover value: ${JSON.stringify(value)}`);
    }
}
export function isValueDynamicTupleSelectorPseudoActive(value) {
    [value] = ensureHierarchySafeSelector(value);
    return value === "@active";
}
export function assertValueDynamicTupleSelectorPseudoActive(value) {
    if (!isValueDynamicTupleSelectorPseudoActive(value)) {
        throw new Error(`Invalid ValueDynamicTupleSelectorPseudoActive value: ${JSON.stringify(value)}`);
    }
}
function isValueDynamicTupleSelectorAttribute(value) {
    [value] = ensureHierarchySafeSelector(value);
    if (value.startsWith("@") &&
        !isValueDynamicTupleSelectorMedia(value) &&
        !isValueDynamicTupleSelectorMedia(value)) {
        return true;
    }
    return false;
}
export function assertValueDynamicTupleSelectorAttribute(value) {
    if (!isValueDynamicTupleSelectorAttribute(value)) {
        throw new Error(`Invalid ValueDynamicTupleSelectorAttribute value: ${JSON.stringify(value)}`);
    }
}
export function splitValueDynamicTupleSelectorAttribute(value) {
    const result = ensureHierarchySafeSelector(value);
    const hierarchySelector = result[1];
    const [attrName, attrValue] = value.slice(1).split("=");
    return [attrName, attrValue, hierarchySelector];
}
export function convertStyleXValidSolidTypeToStyleX(value) {
    const result = {};
    Object.entries(value).forEach(([key, val]) => {
        if (!key.startsWith("--")) {
            key = kebabCase(key);
        }
        if (typeof val === "string") {
            result[key] = val;
        }
        else {
            val;
            if (val.length === 0) {
                return;
            }
            else if (val.length === 1 && typeof val[0] === "string") {
                result[key] = val[0];
            }
            else {
                let first = val[0];
                let last = val[val.length - 1];
                let rest = val.slice(1, -1);
                rest = rest.filter((v) => isValueDynamicTuple(v));
                if (last && isValueDynamicTuple(last)) {
                    rest.push(last);
                    last = undefined;
                }
                else if (last && typeof last !== "string") {
                    last = undefined;
                }
                if (isValueDynamicTuple(first)) {
                    rest.unshift(first);
                }
                else if (typeof first === "string") {
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
//# sourceMappingURL=styleX.js.map