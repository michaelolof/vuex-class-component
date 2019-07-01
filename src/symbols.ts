import { VuexModule } from "./module";

export const _state = "__state__";
export const _mutations = "__mutations__";
export const _getters = "__getters__";
export const _actions_register = "__actions_register__";
export const _actions = "__actions__";
export const _map = "__map__";
export const _proxy = "__proxy_prototype__";
export const _contextProxy = "__context_proxy__";
export const _store = "__store__";
export const _namespacedPath = "__namespacedPath__";
export const _target = "__module_target__";
export const _submodule = "__submodule__";
export const _module = "__module__";

export type MutationFunction = (state:any, payload:any) => void;
export type ActionFunction = (context:any, payload:any) => Promise<any>;
export type GetterFunction = (state:any, getters:any) => any;
export interface VuexMap {
  type:"state";
  value:string;
}

export interface SubModuleObject {
  type: typeof _submodule;
  store: typeof VuexModule;
}
