import { type StyleXPropertyCamelCase } from "@stylex/shared/styleX";
import "solid-js";
declare module "solid-js" {
    namespace JSX {
        interface Directives {
            stylex: StyleXValidSolidType;
        }
    }
}
export type StyleXValidSolidType = {
    [key in StyleXPropertyCamelCase]?: string | ([string, string] | [boolean, string] | string)[];
};
export declare function stylexx(element: HTMLElement, value: StyleXValidSolidType): void;
export declare function stylex(element: HTMLElement, callback: () => StyleXValidSolidType): void;
//# sourceMappingURL=index.d.ts.map