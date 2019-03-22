import { VuexModule } from "./module";
export declare const _state: unique symbol;
export declare const _mutations: unique symbol;
export declare const _getters: unique symbol;
export declare const _actions_register: unique symbol;
export declare const _actions: unique symbol;
export declare const _map: unique symbol;
export declare const _proxy: unique symbol;
export declare const _contextProxy: unique symbol;
export declare const _store: unique symbol;
export declare const _namespacedPath: unique symbol;
export declare const _submodule: unique symbol;
export declare const _module: unique symbol;
export declare type MutationFunction = (state: any, payload: any) => void;
export declare type ActionFunction = (context: any, payload: any) => Promise<any>;
export declare type GetterFunction = (state: any) => any;
export interface VuexMap {
    type: "state";
    value: string;
}
export interface SubModuleObject {
    type: typeof _submodule;
    store: typeof VuexModule;
}
