import { VuexModuleAddons, Map } from "./interfaces";
declare class VuexModule {
}
export declare function Module({ namespacedPath, target }?: ModuleOptions): (module: unknown) => void;
export interface LegacyVuexModule extends VuexModuleAddons {
}
export declare class LegacyVuexModule {
    static ExtractVuexModule(cls: typeof VuexModule): import("./interfaces").VuexObject;
    static CreateProxy<T extends typeof VuexModule>($store: Map, cls: T): any;
    static CreateSubModule<T extends typeof VuexModule>(cls: T): any;
    static ClearProxyCache(cls: typeof VuexModule): void;
}
export declare type VuexModuleTarget = "core" | "nuxt";
interface ModuleOptions {
    namespacedPath?: string;
    target?: VuexModuleTarget;
}
export {};
