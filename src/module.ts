//@ts-ignore
import getDescriptors from "object.getownpropertydescriptors";
import { VuexModuleOptions, VuexModuleConstructor, DictionaryField, VuexModule, VuexObject, Map, FieldPayload } from "./interfaces";
import { isFieldASubModule, extractVuexSubModule } from "./submodule";
import { createLocalProxy } from './proxy';

export function initializeStore( options ?:VuexModuleOptions ) {

  /**
   * We do it like this because we don't want intelissense to pick up the
   * options variable as it is an internal variable.
   */
  (VuexModule as VuexModuleConstructor).prototype.__options__ = options;
  (VuexModule as VuexModuleConstructor).prototype.__vuex_module_cache__ = undefined;
  (VuexModule as VuexModuleConstructor).prototype.__vuex_proxy_cache__ = undefined;
  (VuexModule as VuexModuleConstructor).prototype.__vuex_local_proxy_cache__ = undefined;
  (VuexModule as VuexModuleConstructor).prototype.__context_store__ = undefined;
  (VuexModule as VuexModuleConstructor).prototype.__mutations_cache__ = {
    __explicit_mutations__: {},
    __setter_mutations__: {}
  };

  return VuexModule;

}

export function extractModule( cls :typeof VuexModule ) {

  const VuexClass = cls as VuexModuleConstructor;

  // Check if module has been cached, 
  // and just return the cached version.
  if( VuexClass.prototype.__vuex_module_cache__ ) {
    return VuexClass.prototype.__vuex_module_cache__;
  }

  // If not extract vuex module from class.
  const fromInstance = extractFromInstance( VuexClass );
  const fromPrototype = extractFromPrototype( VuexClass );

  // Cache explicit mutations and getter mutations.
  VuexClass.prototype.__mutations_cache__.__explicit_mutations__ = fromInstance.mutations;
  VuexClass.prototype.__mutations_cache__.__setter_mutations__ = fromPrototype.mutations;

  const vuexModule :VuexObject = {
    namespaced: VuexClass.prototype.__options__ ? VuexClass.prototype.__options__.namespaced : false,
    state: fromInstance.state,
    mutations: { ...fromInstance.mutations, ...fromPrototype.mutations, __internal_mutator__: internalMutator },
    getters: { ...fromPrototype.getters, __internal_getter__: internalGetter },
    actions: fromPrototype.actions,
    modules: fromInstance.submodules,
  };

  // Cache the vuex module on the class.
  VuexClass.prototype.__vuex_module_cache__ = vuexModule;
  const className = toCamelCase( VuexClass.name );
  return { 
    [ className ]: vuexModule
  } as any

} 

export function toCamelCase(str :string){
  return str[ 0 ].toLocaleLowerCase() + str.substring( 1 );
}

function extractFromInstance( cls :VuexModuleConstructor ) {

  const instance = new cls() as InstanceType<VuexModuleConstructor> & Map;
  const classFields = Object.getOwnPropertyNames( instance );
  const state :Map = {};
  const mutations :Map = {};
  const submodules :Map = {};
  const moduleOptions = cls.prototype.__options__ || {};

  for( let field of classFields ) {
    /**
     * Fields defined in a class can either be states or sub modules.
     * First we check if the field is a submodule, if not then it 
     * definitely must be a state.
     */  

    // Check if field is a submodule.
    const fieldIsSubModule = isFieldASubModule( instance, field  );
    if( fieldIsSubModule ) {
      submodules[ field ] = extractVuexSubModule( instance, field );
      continue;
    }

    // Check if field is an explicit mutation.
    if( typeof instance[ field ] === "function" ) {
      mutations[ field ] = ( state :any, payload :any ) => instance[ field ].call( state, payload );
      continue;
    }

    // If field is not a submodule, then it must be a state.
    // Check if the vuex module is targeting nuxt. if not define state as normal.
    if( moduleOptions.nuxt === true ) state[ field ] = () => instance[ field ];
    else state[ field ] = instance[ field ];

  }
  
  return {
    submodules,
    mutations,
    state,
  }
}

function extractFromPrototype( cls :VuexModuleConstructor ) {

  const actions :Record<DictionaryField, any> = {};
  const mutations :Record<DictionaryField, any>= {};
  const getters :Record<DictionaryField, any> = {};
  const descriptors :PropertyDescriptorMap = getDescriptors( cls.prototype );

  for( let field in descriptors ) {
    
    // Ignore the constructor and module interals.
    const fieldIsInternal = ( 
      field === "constructor"             || 
      field === "__options__"             ||
      field === "__vuex_module_cache__"   ||
      field === "__vuex_proxy_cache__"    ||
      field === "__mutations_cache__"     ||
      field === "__explicit_mutations__"  ||
      field === "__getter_mutations__"
    );

    if( fieldIsInternal ) continue;

    const descriptor = descriptors[ field ];

    // If proptotype field is a function, extract as an action.
    if( typeof descriptor.value === "function" ) {
      const func = descriptor.value as Function
      actions[ field ] = function( context :any, payload :any ) {
        cls.prototype.__context_store__ = context;
        const proxy = createLocalProxy( cls, context );
        return func.call( proxy, payload )
      }

      continue;
    }

    // If the prototype field has a getter.
    if( descriptor.get ) {
      getters[ field ] = ( state :any, context :Map ) => { 
        const proxy = createLocalProxy( cls, context )
        return descriptor.get!.call( proxy )
      }
    }

    // if the prototype field has an explicit mutation (i.e setter).
    if( descriptor.set ) {
      mutations[ field ] = (state :any, payload :any) => descriptor.set!.call( state, payload )
    }

  }

  return {
    actions,
    mutations,
    getters
  }

}

const internalMutator = ( state :Map, { field, payload } :FieldPayload ) => {
  const fields = field.split( "." );
  switch( fields.length ) {
    case 1:
      state[ fields[0] ] = payload;
      break;
    case 2:
      state[ fields[0] ][ fields[1] ] = payload;
      break;
    case 3:
      state[ fields[0] ][ fields[1] ][ fields[2] ] = payload;
      break;
    case 4:
      state[ fields[0] ][ fields[1] ][ fields[2] ][ fields[3] ] = payload;
      break;
    case 5:
      state[ fields[0] ][ fields[1] ][ fields[2] ][ fields[3] ][ fields[4] ] = payload;
      break;
    case 6:
      state[ fields[0] ][ fields[1] ][ fields[2] ][ fields[3] ][ fields[4] ][ fields[ 5] ] = payload;
      break;
    case 7:
      state[ fields[0] ][ fields[1] ][ fields[2] ][ fields[3] ][ fields[4] ][ fields[ 5] ][ fields[6] ] = payload;
      break;
  }
}

const internalGetter = ( state :any, context :any ) => ( field :string ) => {
  const fields = field.split( "." );
  switch( fields.length ) {
    case 1: 
      return state[ fields[0] ];
      
    case 2:
      return state[ fields[0] ][ fields[1] ];
      
    case 3:
      return state[ fields[0] ][ fields[1] ][ fields[2] ];
      
    case 4:
      return state[ fields[0] ][ fields[1] ][ fields[2] ][ fields[3] ];
      
    case 5:
      return state[ fields[0] ][ fields[1] ][ fields[2] ][ fields[3] ][ fields[4] ];
      
    case 6:
      return state[ fields[0] ][ fields[1] ][ fields[2] ][ fields[3] ][ fields[4] ][ fields[ 5] ];
      
    case 7:
      return state[ fields[0] ][ fields[1] ][ fields[2] ][ fields[3] ][ fields[4] ][ fields[ 5] ][ fields[6] ];
      
  }
}
