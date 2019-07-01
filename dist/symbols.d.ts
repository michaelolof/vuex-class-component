import { VuexModule } from "./module";
export declare const _state = "__state__";
export declare const _mutations = "__mutations__";
export declare const _getters = "__getters__";
export declare const _actions_register = "__actions_register__";
export declare const _actions = "__actions__";
export declare const _map = "__map__";
export declare const _proxy = "__proxy_prototype__";
export declare const _contextProxy = "__context_proxy__";
export declare const _store = "__store__";
export declare const _namespacedPath = "__namespacedPath__";
export declare const _target = "__module_target__";
export declare const _submodule = "__submodule__";
export declare const _module = "__module__";
export declare type MutationFunction = (state: any, payload: any) => void;
export declare type ActionFunction = (context: any, payload: any) => Promise<any>;
export declare type GetterFunction = (state: any, getters: any) => any;
export interface VuexMap {
    type: "state";
    value: string;
}
export interface SubModuleObject {
    type: typeof _submodule;
    store: typeof VuexModule;
}
