export interface VuexModuleOptions {
  namespaced ?:boolean;
  target ?:"nuxt"
}

export class VuexModule {
}

export type VuexModuleConstructor = typeof VuexModule & VuexModuleInternals;

export interface VuexModuleInternals {
  prototype :{
    __options__ :VuexModuleOptions | undefined;
    __vuex_module_cache__ :undefined | VuexObject;
    __vuex_proxy_cache__ :{} | undefined;
    __vuex_local_proxy_cache__ :{} | undefined;
    __submodules_cache__: Map;
    __mutations_cache__: {
      __explicit_mutations__: {},
      __setter_mutations__: {},
    };
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