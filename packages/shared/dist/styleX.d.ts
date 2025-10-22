import type * as CSS from "csstype";
export type StyleSet = {
    [K in CssPropertyName]?: string;
};
export type CssPropertyNameCamelCase = keyof CSS.Properties<string | number, string | number>;
type CssPropertyName = keyof CSS.PropertiesHyphen<string | number, string | number>;
type CssPropertyValue = string;
export type StyleXPropertyCamelCase = CssPropertyNameCamelCase | keyof TransformValues;
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
export type StyleX = {
    [K in StyleXProperty]?: StyleXValue;
};
export declare function isStyleX(value: Object): value is StyleX;
export declare function assertStyleX(value: Object): asserts value is StyleX;
export type StyleXEntry = [StyleXProperty, StyleXValue];
export declare function assertStyleXEntry(value: [any, any]): void;
export type StyleXProperty = CssPropertyName;
export declare function isStyleXProperty(value: any): value is StyleXProperty;
export declare function assertStyleXProperty(value: any): void;
export type StyleXValue = CssPropertyValue | ValueDynamic;
export declare function isStyleXValue(value: any): value is StyleXValue;
export declare function assertStyleXValue(value: any): void;
export declare function isValueString(value: any): value is string;
export declare function assertisValueString(value: any): void;
declare const BrandValueDynamic: unique symbol;
export type ValueDynamic = (string | ValueDynamicTuple)[] & {
    readonly [BrandValueDynamic]: true;
};
export declare function assertValueDynamic(value: any): void;
export declare function splitValueDynamic(value: ValueDynamic): [ValueDynamicTuple[], string | undefined];
export type ValueDynamicTuple = [ValueDynamicTupleSelector, CssPropertyValue];
export declare function assertValueDynamicTuple(value: any): asserts value is ValueDynamicTuple;
export type ValueDynamicTupleSelector = ValueDynamicTupleSelectorMedia | ValueDynamicTupleSelectorPseudoHover | ValueDynamicTupleSelectorAttribute;
export declare function isValueDynamicTupleSelector(value: string): value is ValueDynamicTupleSelector;
export declare function assertValueDynamicTupleSelector(value: any): asserts value is ValueDynamicTupleSelector;
export declare enum ValueDynamicTupleSelectorType {
    Media = 0,
    PseudoHover = 1,
    PseudoActive = 2,
    Attribute = 3
}
export declare function getDynamicTupleSelectorType(value: ValueDynamicTupleSelector): [ValueDynamicTupleSelectorType.Media, ValueDynamicTupleSelectorMedia] | [
    ValueDynamicTupleSelectorType.PseudoHover,
    ValueDynamicTupleSelectorPseudoHover,
    HierarchySelector?
] | [
    ValueDynamicTupleSelectorType.PseudoActive,
    ValueDynamicTupleSelectorPseudoActive,
    HierarchySelector?
] | [
    ValueDynamicTupleSelectorType.Attribute,
    ValueDynamicTupleSelectorAttribute,
    HierarchySelector?
];
export declare enum HierarchySelectorType {
    Parent = 0,
    Child = 1
}
type HierarchySelector = [HierarchySelectorType, string];
type ValueDynamicTupleSelectorMedia = string & {
    readonly __brand: "ValueDynamicTupleSelectorMedia";
};
export declare function assertValueDynamicTupleSelectorMedia(value: string): asserts value is ValueDynamicTupleSelectorMedia;
type ValueDynamicTupleSelectorPseudoHover = string & {
    readonly __brand: "ValueDynamicTupleSelectorPseudoHover";
};
export declare function isValueDynamicTupleSelectorPseudoHover(value: string): value is ValueDynamicTupleSelectorPseudoHover;
export declare function assertValueDynamicTupleSelectorPseudoHover(value: string): asserts value is ValueDynamicTupleSelectorPseudoHover;
type ValueDynamicTupleSelectorPseudoActive = string & {
    readonly __brand: "ValueDynamicTupleSelectorPseudoActive";
};
export declare function isValueDynamicTupleSelectorPseudoActive(value: string): value is ValueDynamicTupleSelectorPseudoActive;
export declare function assertValueDynamicTupleSelectorPseudoActive(value: string): asserts value is ValueDynamicTupleSelectorPseudoActive;
export type ValueDynamicTupleSelectorAttribute = string & {
    readonly __brand: "ValueDynamicTupleSelectorAttribute";
};
export declare function assertValueDynamicTupleSelectorAttribute(value: string): asserts value is ValueDynamicTupleSelectorAttribute;
export declare function splitValueDynamicTupleSelectorAttribute(value: ValueDynamicTupleSelectorAttribute): [string, string?, HierarchySelector?];
export type StyleXValidJsType = {
    [K in StyleXPropertyCamelCase]?: string | ([string, string] | string)[];
};
export declare function convertStyleXValidSolidTypeToStyleX(value: StyleXValidJsType): StyleX;
export {};
//# sourceMappingURL=styleX.d.ts.map