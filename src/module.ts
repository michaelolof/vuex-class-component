import { getActions, ActionRegister } from "./actions";
import { _state, _mutations, _getters, _proxy, _map, _store, _namespacedPath, _actions_register } from ".";
import { Store } from "vuex";

interface Storable {
  $store: Store<any>
}

export type VuexClassConstructor<T> = new () => T

const fetchStateFromClassInstance = (obj:VuexModule) => Object.getOwnPropertyNames( obj ).filter( v => v === "__store__" ? false : true );

export abstract class VuexModule {

  static CreatedProxy<V extends VuexModule>( $store:Store<any>, cls:VuexClassConstructor<V> ) {
    let rtn:Record<any, any> = {}
    const path = cls.prototype[ _namespacedPath ]; 
    const prototype = this.prototype as any
    
    if( prototype[ _proxy ] === undefined ) { // Proxy has not been cached.
      Object.getOwnPropertyNames( prototype[ _getters ] || {} ).map( name => {
        Object.defineProperty( rtn, name, {
          get: () => $store.getters[ path + name ]
        })        
      });

      Object.getOwnPropertyNames( prototype[ _mutations] || {} ).map( name => {
        rtn[ name ] = function( payload?:any) {
          $store.commit( path + name, payload );
        } 
      });

      (prototype[ _actions_register ] as ActionRegister[]).map( reg => {
        rtn[ reg.name ] = function( payload?:any ) {
          return $store.dispatch( path + reg.name, payload );
        }
      });
      
      // Cache proxy.
      prototype[ _proxy ] = rtn;
    } 
    else {
      // Use cached proxy.
      rtn = prototype[ _proxy ];
    }
    return rtn as V;
  }
  
  static ExtractVuexModule<T extends VuexModule>( cls:VuexClassConstructor<T> ) {
    const actions = getActions( cls );
    
    const mod = {
      namespaced:  cls.prototype[ _namespacedPath ].length > 0 ? true : false,
      state: cls.prototype[ _state ],
      mutations: cls.prototype[ _mutations ],
      actions,
      getters: cls.prototype[ _getters ],
    };

    return mod;   
  }
}
const defaultOptions = {
  namespacedPath: "" as string
}
export function Module(options = defaultOptions ) {
  
  return function<T extends VuexModule>( target:VuexClassConstructor<T> ):void {
    const targetInstance = new target();
     
    const states = fetchStateFromClassInstance( targetInstance );
    const stateObj:object = {}
    if( target.prototype[ _map ] === undefined ) target.prototype[ _map ] = [];  
    
    for(let state of states) { 
      // @ts-ignore
      stateObj[ state ] = targetInstance[ state ]
      target.prototype[ _map ].push({ value:state, type:"state"});  
    }

    target.prototype[ _state ] = stateObj;

    const fields = Object.getOwnPropertyDescriptors( target.prototype );
    if( target.prototype[ _getters ] === undefined ) target.prototype[ _getters ] = {}
    for( let field in fields ) {
      const getterField = fields[ field ].get; 
      if( getterField ) {
        const func = function(state:any) {
          return getterField.call( state );
        }
        target.prototype[ _getters ][ field ] = func; 
      }
    }
    
    
    if( options ) {
      target.prototype[ _namespacedPath ] = options.namespacedPath;
    }
  
  }
}

function createProxyProperty(cls:VuexClassConstructor<VuexModule>, $this:Storable) {
  Object.getOwnPropertyNames( cls.prototype[ _getters ] ).map( gettername => {
       $this.$store.getters[ gettername ]
  })
}