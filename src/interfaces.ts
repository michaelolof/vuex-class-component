export interface VuexModuleOptions {
  namespaced ?:boolean;
  target ?:"nuxt"
}

export class VuexModule {
}

type VuexStashTypes =  "state" | "explicit-mutation" | "getter" | "action" | "submodule";

export interface VuexStash<T extends VuexStashTypes> {
  [ field :string ]: { 
    type :T, 
    value: 
      T extends "state" ? boolean | number | string | object | any : 
      T extends  "explicit-mutation" ? ( state :any, payload :any ) => void :
      T extends "getter" ? { getter :( state :any, context :any ) => any, mutation? :( state :any, payload :any ) => void } :
      T extends "action" ? ( context :any, payload :any ) => Promise<any> :
      T extends "submodule" ? Map :
      never
  }
}

export type VuexModuleConstructor = typeof VuexModule & VuexModuleInternals;

export interface VuexModuleInternals {
  prototype :{
    __options__ :VuexModuleOptions | undefined;
    __vuex_module_cache__ :undefined | VuexObject;
    __vuex_module_tree_stash__: VuexStash<VuexStashTypes>;
    __vuex_proxy_cache__ :{} | undefined;
    __vuex_local_proxy_cache__ :{} | undefined;
    __submodules_cache__: Map;
    __mutations_cache__: {
      __explicit_mutations__: {},
      __setter_mutations__: {},
    };
    __context_store__: Map | undefined;
  }
}

export interface SubModuleType<T> {
  __submodule_type__ :"submodule";
  __submodule_class__ :T
}

export type DictionaryField = string | number | symbol

export interface VuexObject {
  namespaced :boolean | undefined;
  state :Record<DictionaryField, any>
  mutations :Record<DictionaryField, any>
  getters :Record<DictionaryField, any>
  actions :Record<DictionaryField, any>
  modules :Record<DictionaryField, VuexObject>  
}

export type Map = Record<DictionaryField, any>

export interface FieldPayload { 
  field :string;
  payload :any;
}