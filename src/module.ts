//@ts-ignore
import getDescriptors from "object.getownpropertydescriptors";
import { VuexModuleOptions, VuexModuleConstructor, DictionaryField, VuexModule, VuexObject, Map } from "./interfaces";
import { isFieldASubModule, extractVuexSubModule } from "./submodule";
import { createLocalProxy } from './proxy';
import { toCamelCase } from "./utils";
import { internalAction } from "./actions";
import { internalMutator } from "./mutations";
import { internalGetter } from "./getters";


export function createModule( options ?:VuexModuleOptions ) {

  /**
   * We do it like this because we don't want intelissense to pick up the
   * options variable as it is an internal variable.
   */
  //@ts-ignore
  const vuexModule = function(){} as VuexModuleConstructor;
  vuexModule.prototype.__options__ = options;
  vuexModule.With = defineWithExtension;

  return vuexModule as typeof VuexModule;

}

function defineWithExtension( this:typeof VuexModule & VuexModuleConstructor, options?: VuexModuleOptions ) {

  // Get the old vuex options
  const oldOptions = this.prototype.__options__ = {};
  
  // create a new module constructor
  //@ts-ignore
  const newVuexModule = function(){} as VuexModuleConstructor;
  newVuexModule.prototype.__options__ = {};
  
  // assign all the old options to the new module constructor
  Object.assign( newVuexModule.prototype.__options__, oldOptions );

  // If there are no new vuex options return as is.
  if( options === undefined ) return newVuexModule as typeof VuexModule;

  // Assign or new available vuex options to the new vuex module
  const prototypeOptions = newVuexModule.prototype.__options__ || {};
  if( options.namespaced )  prototypeOptions.namespaced = options.namespaced;
  if( options.strict )  prototypeOptions.strict = options.strict;
  if( options.target )  prototypeOptions.target = options.target;
  if( options.enableLocalWatchers )  prototypeOptions.enableLocalWatchers = options.enableLocalWatchers;

  return newVuexModule as typeof VuexModule;

}

function initializeModuleInternals( cls: VuexModuleConstructor ) {
  cls.prototype.__namespacedPath__ = "";
  cls.prototype.__vuex_module_cache__ = undefined;
  cls.prototype.__vuex_proxy_cache__ = undefined;
  cls.prototype.__vuex_local_proxy_cache__ = undefined;
  cls.prototype.__submodules_cache__ = {};
  cls.prototype.__context_store__ = {};
  cls.prototype.__watch__ = {};
  cls.prototype.__explicit_getter_names__ = [];
}

export function extractVuexModule( cls :typeof VuexModule ) {

  const VuexClass = cls as VuexModuleConstructor;

  // Check if module has been cached, 
  // and just return the cached version.
  if( VuexClass.prototype.__vuex_module_cache__ ) {
    return VuexClass.prototype.__vuex_module_cache__;
  }

  initializeModuleInternals( VuexClass );

  // If not extract vuex module from class.
  const fromInstance = extractModulesFromInstance( VuexClass );
  const fromPrototype = extractModulesFromPrototype( VuexClass );

  // Cache explicit mutations and getter mutations.
  VuexClass.prototype.__mutations_cache__ = { 
    __explicit_mutations__: fromPrototype.mutations.explicitMutations,
    __setter_mutations__: fromPrototype.mutations.setterMutations,
  }
  const className = VuexClass.name.toLowerCase();

  const vuexModule :VuexObject = {
    namespaced: VuexClass.prototype.__options__ && VuexClass.prototype.__options__.namespaced ? true : false,
    state: fromInstance.state,
    mutations: { ...fromPrototype.mutations.explicitMutations, ...fromPrototype.mutations.setterMutations, [`__${className}_internal_mutator__`]: internalMutator },
    getters: { ...fromPrototype.getters, ...fromInstance.getters , [ `__${className}_internal_getter__`]: internalGetter },
    actions: { ...fromPrototype.actions, [`__${className}_internal_action__`]: internalAction },
    modules: fromInstance.submodules,
  };

  // Cache the vuex module on the class.
  const path = getNamespacedPath( VuexClass ) || toCamelCase( VuexClass.name );

  const rtn = { [ path ]: vuexModule }
  VuexClass.prototype.__vuex_module_cache__ = rtn;

  return rtn;

}

export function getNamespacedPath( cls :VuexModuleConstructor ) {
  
  const namespaced = cls.prototype.__options__ && cls.prototype.__options__.namespaced;

  if( namespaced ) {
    const namePaths = namespaced.split("/");
    cls.prototype.__namespacedPath__ = namePaths[namePaths.length - 1] || namePaths[namePaths.length - 2];
  }

  return cls.prototype.__namespacedPath__;
  
}

function extractModulesFromInstance( cls :VuexModuleConstructor ) {

  const instance = new cls() as InstanceType<VuexModuleConstructor> & Map;
  const classFields = Object.getOwnPropertyNames( instance );
  const state :Map = {};
  const mutations :Map = {};
  const submodules :Map = {};
  const submodulesCache = cls.prototype.__submodules_cache__;
  const moduleOptions = cls.prototype.__options__ || {};

  for( let field of classFields ) {
    
    // Check if field is a submodule.
    const fieldIsSubModule = isFieldASubModule( instance, field  );
    if( fieldIsSubModule ) {
      // Cache submodule class
      submodulesCache[ field ] = instance[ field ][ "__submodule_class__" ]
      
      const submodule = extractVuexSubModule( instance, field );
            
      submodules[ field ] = submodule;
          
      continue;
    }
    
    // If field is not a submodule, then it must be a state.
    state[ field ] = instance[ field ];
        
  }
  
  return {
    submodules,
    mutations,
    getters: extractDecoratorGetterNames( cls.prototype.__decorator_getter_names__ ),
    // Check if the vuex module is targeting nuxt return state as function. if not define state as normal.    
    state: moduleOptions.target === "nuxt" ? () => state : state,
  }
}

function extractModulesFromPrototype( cls :VuexModuleConstructor ) {

  const setterMutations :Record<DictionaryField, any> = {};
  const explicitMutations :Record<DictionaryField, any> = {};
  const actions :Record<DictionaryField, any> = {};
  const getters :Record<DictionaryField, any> = {};
  const descriptors :PropertyDescriptorMap = getDescriptors( cls.prototype );
  const gettersList :string[] = Object.keys( descriptors ).filter( field => descriptors[ field ].get );
  const explicitMutationNames :string[] = cls.prototype.__explicit_mutations_names__ || [];
  const actionNames = cls.prototype.__actions__ || [];

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

    const actionType = (typeof descriptor.value === "function") && actionNames.find( action => action.__name__ === field );    
    // If prototype field is an mutate action
    if( actionType && actionType.__type__ === "mutate" ) {

      const func = descriptor.value as Function
      
      const action = function( context :any, payload :any ) {
        cls.prototype.__context_store__ = context;
        const proxy = createLocalProxy( cls, context );
        
        if( proxy[ "$store" ] === undefined ) { 
          Object.defineProperty( proxy, "$store", { value: context });
        }

        return func.call( proxy, payload )
      }

      actions[ field ] = action;

      continue;
    }

    // if prototype field is a raw action
    if( actionType && actionType.__type__ === "raw" ) {
      const func = descriptor.value as Function;

      const action = ( context :any, payload :any ) => func.call( context, payload );

      actions[ field ] = action;

      continue;
    }

    // If prototype field is an explicit mutation
    const fieldIsExplicitMutation = ( 
      typeof descriptor.value === "function" && 
      explicitMutationNames.indexOf( field ) > -1
    );
    if( fieldIsExplicitMutation ) {
      const mutation = ( state :any, payload :any ) => descriptor.value.call( state, payload );
            
      explicitMutations[ field ] = mutation;

      continue;
    }

    // If the prototype field has a getter.
    if( descriptor.get ) {
      const getter = ( state :any, context :Map ) => { 
        const proxy = createLocalProxy( cls, context )
        return descriptor.get!.call( proxy )
      }
      
      getters[ field ] = getter;
    }

    // if the prototype field has setter mutation.
    if( descriptor.set ) {
      const mutation = (state :any, payload :any) => descriptor.set!.call( state, payload );
      
      // Before we push a setter mutation We must verify 
      // if that mutation has a corresponding getter.
      // If not, we dissallow it.

      const mutationHasGetter = gettersList.indexOf( field ) > -1;
      if( mutationHasGetter === false ) {
        // Throw an Error.
        throw new Error(
          `\nImproper Use of Setter Mutations:\n` + 
          `at >>\n` +
          `set ${ field }( payload ) {\n` +
          `\t...\n` +
          `}\n` +
          `\n` +
          `Setter mutations should only be used if there is a corresponding getter defined.\n` +
          `\n` +
          `Either define a corresponding getter for this setter mutation or,\n` +
          `Define them as an explicit mutation using function assignment.\n` +
          `Example:\n` +
          `--------------------\n` +
          `${ field } = ( payload ) => {\n` +
          ` ...\n` +
          `}`
        )  
      }

      setterMutations[ field ] = mutation;
    }

    // Stash getters list. To be used later when creating $watch functionality.
    cls.prototype.__explicit_getter_names__ = gettersList;

  }

  return {
    actions,
    mutations: { 
      explicitMutations,
      setterMutations,
    },
    getters
  }

}

function extractDecoratorGetterNames( names :string[] = [] ) {
  const decorator :Map = {};
  for( let name of names ) {
    decorator[ name ] = new Function("state", `return state.${name}`);
  }
  return decorator;
}