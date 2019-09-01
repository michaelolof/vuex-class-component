import { VuexModuleOptions, VuexModuleConstructor, VuexModule, VuexObject } from "./interfaces";
export declare function createModule(options?: VuexModuleOptions): typeof VuexModule;
export declare function extractVuexModule(cls: typeof VuexModule): {
    [path: string]: VuexObject;
};
export declare function getNamespacedPath(cls: VuexModuleConstructor): string;
