import { VuexModule, ProxyWatchers } from "./interfaces";
export declare function clearProxyCache<T extends typeof VuexModule>(cls: T): void;
export declare function createProxy<T extends typeof VuexModule>($store: any, cls: T): ProxyWatchers & InstanceType<T>;
export declare function createLocalProxy<T extends typeof VuexModule>(cls: T, $store: any): InstanceType<T>;
export declare function _createProxy<T extends typeof VuexModule>(cls: T, $store: any, namespacedPath?: string): InstanceType<T>;
