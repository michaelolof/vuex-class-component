import { ActionRegister } from "./actions";
import { _state, _mutations, _getters, _proxy, _map, _store, _namespacedPath, _actions_register, _actions, MutationFunction, GetterFunction, ActionFunction, VuexMap, _submodule, _module } from "./symbols";
import { Store } from "vuex";
export declare type VuexClassConstructor<T> = new () => T;
export declare type VuexModuleTarget = "core" | "nuxt";
export declare class VuexModule {
    static CreateSubModule<V extends typeof VuexModule>(SubModule: V): InstanceType<V>;
    static CreateProxy<V extends typeof VuexModule>($store: Store<any>, cls: V): InstanceType<V>;
    static ExtractVuexModule(cls: typeof VuexModule, target?: VuexModuleTarget): {
        namespaced: boolean;
        state: any;
        mutations: Record<string, MutationFunction>;
        actions: {
            [x: string]: any;
        };
        getters: Record<string, GetterFunction>;
        modules: Record<string, any>;
    };
}
export declare function createProxy<V extends typeof VuexModule>($store: Store<any>, cls: V, cachePath: string): InstanceType<V>;
export interface VuexModule {
    [_state]: Record<string, any>;
    [_mutations]: Record<string, MutationFunction>;
    [_getters]: Record<string, GetterFunction>;
    [_actions_register]: ActionRegister[];
    [_actions]: Record<string, ActionFunction>;
    [_map]: VuexMap[];
    [_proxy]: Record<string, any>;
    [_store]: Record<string, any>;
    [_namespacedPath]: string;
    [_submodule]: Record<string, typeof VuexModule>;
    [_module]: Record<string, any>;
}
export declare function Module(options?: {
    namespacedPath: string;
}): (target: typeof VuexModule) => void;
