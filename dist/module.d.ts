import { Store } from "vuex";
export declare type VuexClassConstructor<T> = new () => T;
export declare abstract class VuexModule {
    static CreateProxy<V extends VuexModule>($store: Store<any>, cls: VuexClassConstructor<V>): V;
    static ExtractVuexModule<T extends VuexModule>(cls: VuexClassConstructor<T>): {
        namespaced: boolean;
        state: any;
        mutations: any;
        actions: Record<any, any> | undefined;
        getters: any;
    };
}
export declare function Module(options?: {
    namespacedPath: string;
}): <T extends VuexModule>(target: VuexClassConstructor<T>) => void;
