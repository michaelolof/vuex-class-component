import { VuexModule } from "./module";

export const _state = Symbol("state");
export const _mutations = Symbol("mutations");
export const _getters = Symbol("getters");
export const _actions_register = Symbol("actions_register");
export const _actions = Symbol("actions");
export const _map = Symbol("map");
export const _proxy = Symbol("proxy_prototype");
export const _store = Symbol("store");
export const _namespacedPath = Symbol("namespacedPath");
export const _submodule = Symbol("submodule");
export const _module = Symbol("module");

export * from "./module";
export * from "./mutations";
export * from "./actions";
export * from "./getters";

export type MutationFunction = (state:any, payload:any) => void;
export type ActionFunction = (context:any, payload:any) => Promise<any>;
export type GetterFunction = (state:any) => any;
export interface VuexMap {
  type:"state";
  value:string;
}

export interface SubModuleObject {
  type: typeof _submodule;
  store: typeof VuexModule;
}