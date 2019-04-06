import getDescriptors from "object.getownpropertydescriptors";
import { getMutatedActions as getProxiedActions, ActionRegister } from "./actions";
import { _state, _mutations, _getters, _proxy, _map, _store, _namespacedPath, _actions_register, _actions, MutationFunction, GetterFunction, ActionFunction, VuexMap, _submodule, SubModuleObject, _module, _target } from "./symbols";
//@ts-ignore
import { Store } from "vuex";

export type VuexClassConstructor<T> = new () => T

export class VuexModule {

  static CreateSubModule<V extends typeof VuexModule>(SubModule: V) :SubModuleObject {
    return {
      type: _submodule,
      store: SubModule,
    }
  }

  static CreateProxy<V extends typeof VuexModule>($store: Store<any>, cls: V) {
    return createProxy( $store, cls, _proxy )
  }

  static ExtractVuexModule(cls :typeof VuexModule ) {   
    return  {
      namespaced: extractNameSpaced( cls ),
      state: extractState( cls ),
      mutations: cls.prototype[_mutations],
      actions: extractActions( cls ),
      getters: cls.prototype[_getters],
      modules: cls.prototype[_module],
    };
  }
}

function extractNameSpaced( cls :typeof VuexModule ) :boolean {
  const namespacedPath = cls.prototype[ _namespacedPath ] || "";
  return namespacedPath.length > 0 ? true : false
}

function extractState( cls :typeof VuexModule ):any {
  switch( cls.prototype[ _target ] ) {
    case "core": return cls.prototype[ _state ];
    case "nuxt": return () => cls.prototype[ _state ];
    default: return cls.prototype [ _state ]; 
  }
}

function extractActions( cls :typeof VuexModule ) {
  const proxiedActions = getProxiedActions(cls);
  const rawActions = cls.prototype[_actions] as Record<any, any>;
  const actions = { ...proxiedActions, ...rawActions }
  //Update prototype with mutated actions.
  cls.prototype[ _actions ] = actions;
  return actions;
}

function getValueByPath (object: any, path: string) : any {
  const pathArray = path.split('/')
  let value : any = object
  for (const part of pathArray) {
    value = value[part]
  }
  return value
}

export function createProxy<V extends typeof VuexModule>($store :Store<any>, cls :V, cachePath :string) {
  let rtn: Record<any, any> = {}
  const path = cls.prototype[_namespacedPath];
  const prototype = cls.prototype as any

  if ( prototype[ cachePath ] === undefined ) { // Proxy has not been cached.

    Object.getOwnPropertyNames( prototype[ _getters ] || {} ).map( name => {
      Object.defineProperty(rtn, name, {
        get: () => $store.getters[path + name]
      })
    });

    Object.getOwnPropertyNames( prototype[ _state ] || {} ).map( name => {
      // If state has already been defined as a getter, do not redefine.
      if( rtn.hasOwnProperty( name ) ) return;
      
      if ( prototype[ _submodule ] && prototype[ _submodule ].hasOwnProperty( name ) ) {
        Object.defineProperty( rtn, name, {
          value: prototype[ _state ][ name ],
          writable: true,
        })
      } 
      else {
        Object.defineProperty( rtn, name, {
          get: () => getValueByPath( $store.state, path + name )
        })
      }

    });

    Object.getOwnPropertyNames( prototype[ _mutations ] || {} ).map( name => {
      rtn[ name ] = function( payload?: any ) {
        $store.commit( path + name, payload );
      }
    });

    Object.getOwnPropertyNames( prototype[ _actions ] || {} ).map( name => {
      rtn[ name ] = function ( payload?: any ) {
        return $store.dispatch(path + name, payload );
      }
    });

    Object.getOwnPropertyNames( prototype[ _submodule ] || {} ).map( name => {
      const vxmodule = cls.prototype[ _submodule ][ name ];
      vxmodule.prototype[ _namespacedPath ] = path + name + "/";
      rtn[ name ] = vxmodule.CreateProxy( $store, vxmodule );
    })

    // Cache proxy.
    prototype[ _proxy ] = rtn;
  }
  else {
    // Use cached proxy.
    rtn = prototype[ cachePath ];
  }
  
  return rtn as InstanceType<V>;
}

export interface VuexModule {
  [ _state ] :Record<string, any>;
  [ _mutations ] :Record<string, MutationFunction>;
  [ _getters ] :Record<string, GetterFunction>;
  [ _actions_register ] :ActionRegister[];
  [ _actions ] :Record<string, ActionFunction>;
  [ _map ] :VuexMap[];
  [ _target ] :VuexModuleTarget;
  [ _proxy ] :Record<string, any>;
  [ _store ] :Record<string, any>;
  [ _namespacedPath ] :string;
  [ _submodule ] :Record<string, typeof VuexModule>;
  [ _module ] :Record<string, any>;
}

export type VuexModuleTarget = "core" | "nuxt";

interface ModuleOptions {
  namespacedPath?: string,
  target?: VuexModuleTarget
}

const defaultModuleOptions :ModuleOptions = {
  namespacedPath: "",
  target: "core",
}

export function Module({ namespacedPath = "", target = "core" as VuexModuleTarget } = defaultModuleOptions ) {

  return function( _module :typeof VuexModule ) :void {
    const targetInstance = new _module();

    const states = Object.getOwnPropertyNames( targetInstance );
    const stateObj: Record<string, any> = {}
    if( _module.prototype[ _map ] === undefined ) _module.prototype[ _map ] = [];

    for( let stateField of states ) {
      const stateValue = targetInstance[ stateField ];
      if ( stateValue === undefined ) continue;

      if ( subModuleObjectIsFound( stateValue )) {
        handleSubModule( _module, stateField, stateValue )
        continue;
      }
      stateObj[ stateField ] = stateValue;
      _module.prototype[ _map ].push({ value: stateField, type: "state" });
    }

    _module.prototype[ _state ] = stateObj;

    const fields = getDescriptors( _module.prototype );
    if ( _module.prototype[ _getters ] === undefined ) _module.prototype[ _getters ] = {}
    for (let field in fields) {
      const getterField = fields[ field ].get;
      if ( getterField ) {
        const func = function (state: any) {
          return getterField.call(state);
        }
        _module.prototype[_getters][field] = func;
      }
    }

    _module.prototype[ _namespacedPath ] = namespacedPath;
    _module.prototype[ _target ] = target;
  }
}

function subModuleObjectIsFound(stateValue: any): stateValue is SubModuleObject {
  if( stateValue === null ) return false;
  return (typeof stateValue === "object") && (stateValue.type === _submodule);
}

function handleSubModule(target: typeof VuexModule, stateField: string, stateValue: SubModuleObject) {
  if (target.prototype[_module] === undefined) {
    target.prototype[_module] = {
      [stateField]: stateValue.store.ExtractVuexModule(stateValue.store),
    }
    target.prototype[_submodule] = {
      [stateField]: stateValue.store
    }
  } else {
    target.prototype[_module][stateField] = stateValue.store.ExtractVuexModule(stateValue.store);
    target.prototype[_submodule][stateField] = stateValue.store;
  }
}
