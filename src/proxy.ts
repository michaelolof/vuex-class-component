import { extractVuexModule, getNamespacedPath } from "./module";
import { VuexModuleConstructor, Map, VuexModule, ProxyWatchers } from "./interfaces";
import { getClassPath, toCamelCase, refineNamespacedPath } from "./utils";

export function clearProxyCache<T extends typeof VuexModule>( cls :T ) {}

export function createProxy<T extends typeof VuexModule>( $store :any, cls :T ) :ProxyWatchers & InstanceType<T> {
  //@ts-ignore
  const VuexClass = cls as VuexModuleConstructor;
  
  // Check cache and return from cache if defined.
  if( VuexClass.prototype.__vuex_proxy_cache__ ) {
    return VuexClass.prototype.__vuex_proxy_cache__ as InstanceType<T> & ProxyWatchers;
  }
  
  const namespacedPath = VuexClass.prototype.__namespacedPath__ ? VuexClass.prototype.__namespacedPath__ + "/" : "";

  // Create Proxy and cache
  const proxy = _createProxy( cls, $store, namespacedPath );

  // Setup Local Watchers
  createLocalWatchers( VuexClass, $store, namespacedPath || "" );

  // Setup local mutation subscribers
  createLocalSubscriber( VuexClass, $store, namespacedPath || "" );

  // Setup local subscrube action.
  createLocalSubscriberAction( VuexClass, $store, namespacedPath || "" );
  
  // Setup proxy watcher
  //@ts-ignore
  proxy.$watch = function( field :string, callback, options ) {
    
    const getterNames = VuexClass.prototype.__explicit_getter_names__;
    
    // If field is a getter use the normal getter path if not use internal getters.
    if( typeof field === "string" && getterNames.indexOf( field ) > -1 ) {
      return $store.watch( 
        () => (namespacedPath ? $store.rootGetters : $store.getters)[ namespacedPath +  field ],
        callback,
        options,
      )
    }

    const className = cls.name.toLowerCase();

    return $store.watch( 
      () => (namespacedPath ? $store.rootGetters : $store.getters)[ namespacedPath + `__${className}_internal_getter__`]( field ),
      callback,
      options,
    )

  };

  // Setup proxy subscription
  //@ts-ignore
  proxy.$subscribe = function( field :string, callback :( payload :any ) => void ) {
    return $store.subscribe(( mutation :any ) => {
      if( mutation.type === namespacedPath + field ) {
        callback( mutation.payload );
      }
    })
  }

  //@ts-ignore
  proxy.$subscribeAction = function( field :string, callback :((payload) => void) | object ) {

    if( typeof callback === "function" ) {
      return $store.subscribeAction(( action :any ) => {
        //@ts-ignore
        if( action.type === namespacedPath + field ) callback( action.payload )
      })
    }

    if( typeof callback === "object" ) {
      return $store.subscribeAction({
        before( action :any ) {
          //@ts-ignore
          if( action.type === namespacedPath + field ) callback.before( action.payload )
        },
        after( action :any ) {
          //@ts-ignore
          if( action.type === namespacedPath + field ) callback.after( action.payload )
        }
      })
    }
  }

  if( VuexClass.prototype.__store_cache__ === undefined ) VuexClass.prototype.__store_cache__ = $store;

  VuexClass.prototype.__vuex_proxy_cache__ = proxy;
  
  return proxy as InstanceType<T> & ProxyWatchers;
}

export function createLocalProxy<T extends typeof VuexModule>( cls :T, $store :any ) :InstanceType<T> {
  // Check cache and return from cache
  //@ts-ignore
  const VuexClass = cls as VuexModuleConstructor;

  if( VuexClass.prototype.__vuex_local_proxy_cache__ ) {
    return VuexClass.prototype.__vuex_local_proxy_cache__ as InstanceType<T>;
  }

  // Create proxy and cache
  const proxy = _createProxy( cls, $store, "" );
  VuexClass.prototype.__vuex_local_proxy_cache__ = proxy;

  return proxy as InstanceType<T>;
}

export function _createProxy<T extends typeof VuexModule>(cls: T, $store: any, namespacedPath = "") {

  //@ts-ignore
  const VuexClass = cls as VuexModuleConstructor;
  const proxy :Map = {};
  
  const classPath = getClassPath( VuexClass.prototype.__namespacedPath__ ) || toCamelCase( VuexClass.name );
  let { state, mutations, actions, getters, modules } = extractVuexModule( VuexClass )[ classPath ];
  
  // For nuxt support state returns as a function
  // We need to handle this. 
  if( typeof state === "function" ) state = state();

  createGettersAndMutationProxyFromState({ cls: VuexClass, proxy, state, $store, namespacedPath });
  createGettersAndGetterMutationsProxy({ cls: VuexClass, mutations, getters, proxy, $store, namespacedPath });
  createExplicitMutationsProxy( VuexClass, proxy, $store, namespacedPath );
  createActionProxy({ cls: VuexClass, actions, proxy, $store, namespacedPath });
  createSubModuleProxy( $store, VuexClass, proxy, modules );

  //@ts-ignore
  return proxy as InstanceType<T>;
}

function createLocalSubscriberAction( cls :VuexModuleConstructor, $store :Map, namespacedPath :string ) {

  const subscriberIsEnabled = cls.prototype.__options__ && cls.prototype.__options__.enableLocalWatchers;

  if( !subscriberIsEnabled ) return;

  const field = "$subscribeAction";

  // Access Static Class Field.
  //@ts-ignore
  const subscriptionMap = cls[ field ];

  if( subscriptionMap === undefined ) return;

  for( let field in subscriptionMap ) {

    const watcher = subscriptionMap[ field ];

    if( typeof watcher === "function" ) {

      $store.subscribeAction((action :any) => {
        if( action.type === namespacedPath + field ) { 
          const proxiedFunction = ( payload :any ) => watcher.call( cls.prototype.__vuex_proxy_cache__, payload );
          proxiedFunction( action.payload );
        }
      })

      continue;

    }

    if( typeof watcher === "object" ) {

      $store.subscribeAction({
        before: (action :any ) => {
          if( action.type === namespacedPath + field && watcher.before ) {
            const proxiedFunc = ( payload :any ) => watcher.before.call( cls.prototype.__vuex_proxy_cache__, payload );
            proxiedFunc( action.payload )
          }
        },

        after: (action :any) => {
          if( action.type === namespacedPath + field && watcher.after ) {
            const proxiedFunc = ( payload :any ) => watcher.after.call( cls.prototype.__vuex_proxy_cache__, payload );
            proxiedFunc( action.payload );
          }
        }
      })

    }

  }

}

function createLocalSubscriber( cls :VuexModuleConstructor, $store :Map, namespacedPath :string ) {
  
  const subscriberIsEnabled = cls.prototype.__options__ && cls.prototype.__options__.enableLocalWatchers;

  if( !subscriberIsEnabled ) return;

  const field = "$subscribe";

  // Access Static Class Field
  //@ts-ignore
  const subscriptionMap = cls[ field ];

  if( subscriptionMap === undefined ) return;
  
  $store.subscribe(( mutation :any, state :any ) => {
    
    for( let field in subscriptionMap ) {

      const subscribeFunc = subscriptionMap[ field ];
      
      const proxiedFunc = ( payload :any ) => subscribeFunc.call( cls.prototype.__vuex_proxy_cache__, payload );
      
      if( mutation.type === namespacedPath + field ) { 
        proxiedFunc( mutation.payload );
      }
  
    }

  })
  
}

function createLocalWatchers( cls :VuexModuleConstructor, $store :Map, namespacedPath :string ) {
  
  const watcherIsEnabled = cls.prototype.__options__ && cls.prototype.__options__.enableLocalWatchers;

  if( !watcherIsEnabled ) return;

  const field = "$watch";

  // Access Class Static Field
  //@ts-ignore
  const watchMap = cls[ field ];

  if( watchMap === undefined ) return;

  const getterNames = cls.prototype.__explicit_getter_names__;

  const className = cls.name.toLowerCase();

  for( let field in watchMap ) {
    
    const fieldIsAnExplicitGetter = getterNames.indexOf( field ) > -1;
    const watchFunc = watchMap[ field ];
    const proxiedWatchFunc = function( newVal :any, oldVal :any ) {
      return watchFunc.call( 
        cls.prototype.__vuex_proxy_cache__, 
        newVal, 
        oldVal
      )
    };

    if( fieldIsAnExplicitGetter ) {
      $store.watch( 
        () => (namespacedPath ? $store.rootGetters : $store.getters)[ namespacedPath + field ],
        proxiedWatchFunc,
      )
    }
    else { // This is so we can also watch implicit getters.
      $store.watch( 
        () => (namespacedPath ? $store.rootGetters : $store.getters)[ namespacedPath + `__${className}_internal_getter__` ]( field ),
        proxiedWatchFunc,
      )
    }
    
  }

}

function createSubModuleProxy( $store :Map, cls:VuexModuleConstructor, proxy :Map, modules :Map ) {
  const store = cls.prototype.__store_cache__ || $store;
  for( let field in modules ) {
    const subModuleClass = cls.prototype.__submodules_cache__[ field ] as VuexModuleConstructor;
    const namespacedPath = getNamespacedPath(subModuleClass);
    subModuleClass.prototype.__namespacedPath__ = cls.prototype.__namespacedPath__ + "/" + namespacedPath;
    proxy[ field ] = createProxy( store, subModuleClass );
  }

}

function createGettersAndMutationProxyFromState({ cls, proxy, state, $store, namespacedPath = "", currentField = "", maxDepth = 1 }: { cls: VuexModuleConstructor, proxy: Map; state: Map; $store: any; namespacedPath?: string; currentField?: string; maxDepth ?:number}) {
  /**
   * 1. Go through all fields in the object and check the values of those fields. 
   *  
   *  1.1.  If the value of the field is not an object. 
   *    1.1.1   Define a getter that returns that value 
   *            and a setter that calls a mutation commit on that value and move to the next field.
   *  
   *  1.2.  If the value of the field is an object,
   *    1.2.1   Define a getter that returns that value
   *            and a setter that calls a mutation commit on that value.
   *    1.2.2.  Go back to STEP 1.
   */
  const className = cls.name.toLowerCase();
  namespacedPath = refineNamespacedPath( namespacedPath );
  const strict = cls.prototype.__options__ && cls.prototype.__options__.strict;
  const submoduleNames = Object.keys( cls.prototype.__submodules_cache__ );
          
  for (let field in state) {
    
    const fieldIsSubmodule = submoduleNames.indexOf( field ) > -1;
    let value = state[ field ];

    if (currentField.length && !currentField.endsWith(".")) currentField += ".";
    const path = currentField + field;

    if ( maxDepth === 0 || typeof value !== "object" || (typeof value === 'object' && !fieldIsSubmodule) ) {

      if( !strict || fieldIsSubmodule ) {
        
        Object.defineProperty(proxy, field, {
          get: () => { 
            // When creating local proxies getters doesn't exist on that context, so we have to account
            // for that.
            const getters = cls.prototype.__namespacedPath__ ? $store.rootGetters : $store.getters;
            if( getters ) {
              const getterPath = refineNamespacedPath(cls.prototype.__namespacedPath__) + `__${className}_internal_getter__`;
              return getters[ getterPath ]( path )
            }else return $store[ `__${className}_internal_getter__` ]( path ) 
          },
          set: payload => { 
            const commit = $store.commit || cls.prototype.__store_cache__.commit;
            if( commit ) commit( refineNamespacedPath( cls.prototype.__namespacedPath__ ) + `__${className}_internal_mutator__`, { field: path, payload }, { root: true });
            else {
              // We must be creating local proxies hence, $store.commit doesn't exist
              const store = cls.prototype.__context_store__!;
              store.commit( `__${className}_internal_mutator__`, { field: path, payload }, { root: true })
            }
          },
        })

      }

      else {

        Object.defineProperty(proxy, field, {
          get: () => { 
            // When creating local proxies getters doesn't exist on that context, so we have to account
            // for that.
            if( $store.getters ) { 
              return $store.getters[ namespacedPath + `__${className}_internal_getter__` ]( path )
            }else return $store[ `__${className}_internal_getter__` ]( path ) 
          },
        })

      }


      continue;
    }

    proxy[ field ] = {};

    createGettersAndMutationProxyFromState({ 
      cls, proxy: 
      proxy[field], 
      state: value, 
      $store, namespacedPath, 
      currentField: currentField + field,
      maxDepth: maxDepth - 1, 
    });

    }
  

  return proxy;

}

/*
 * @deprecated
 */
function __createGettersAndMutationProxyFromState({ cls, proxy, state, $store, namespacedPath = "" }: { cls: VuexModuleConstructor, proxy: Map; state: Map; $store: any; namespacedPath ?:string}) {

  const className = cls.name.toLowerCase();
  namespacedPath = refineNamespacedPath( namespacedPath );
  const strict = cls.prototype.__options__ && cls.prototype.__options__.strict;
  const submoduleNames = Object.keys( cls.prototype.__submodules_cache__ );

  for (let field in state) {

    /*
     * ATTENTION
     *-----------------------------------
     * The boolean condition below is necessary for handling an edge case. 
     * For some strange reason, submodules are included in the state.
     * I'm still trying to figure out why this is happening.
     * The consequence is making the proxy getter only will cause problems
     * So even if autoMutation is disabled we need to make the submodule field getter setter.
     */
    const fieldIsSubmodule = submoduleNames.indexOf( field ) > -1;

    if( !strict || fieldIsSubmodule ) {
      
      Object.defineProperty( proxy, field, {
        get: () => { 
          // When creating local proxies getters doesn't exist on that context, so we have to account
          // for that.
          if( $store.getters ) { 
            return $store.getters[ namespacedPath + `__${className}_internal_getter__` ]( field )
          }else return $store[ `__${className}_internal_getter__` ]( field ) 
        },
        set: payload => { 
          if( $store.commit ) $store.commit( namespacedPath + `__${className}_internal_mutator__`, { field, payload });
          else {
            // We must be creating local proxies hence, $store.commit doesn't exist
            const store = cls.prototype.__context_store__!;
            store.commit( `__${className}_internal_mutator__`, { field, payload }, { root: true })
          }
        },
      })
    
    }
    else {

      Object.defineProperty( proxy, field, {
        get: () => { 
          // When creating local proxies getters doesn't exist on that context, so we have to account
          // for that.
          if( $store.getters ) { 
            return $store.getters[ namespacedPath + `__${className}_internal_getter__` ]( field )
          }else return $store[ `__${className}_internal_getter__` ]( field ) 
        },
      })

    }
    
  
  }

  return proxy;

}

function createExplicitMutationsProxy( cls :VuexModuleConstructor, proxy :Map, $store :any, namespacedPath :string ) {
  
  const mutations = cls.prototype.__mutations_cache__ && cls.prototype.__mutations_cache__.__explicit_mutations__ || {};
  const commit = cls.prototype.__store_cache__ ? cls.prototype.__store_cache__.commit : $store.commit;
  namespacedPath = refineNamespacedPath( 
    cls.prototype.__namespacedPath__.length ? cls.prototype.__namespacedPath__ + "/" : namespacedPath
  );

  for( let field in mutations ) {
    proxy[ field ] = ( payload :any ) => commit( namespacedPath + field, payload, { root: true } )
  }

}

function createGettersAndGetterMutationsProxy({ cls, getters, mutations, proxy, $store, namespacedPath } :GetterProxyCreator) {
  
  const getterMutations = Object.keys( 
    cls.prototype.__mutations_cache__ && cls.prototype.__mutations_cache__.__setter_mutations__ || {}
  );
  const className = cls.name.toLowerCase();
  // If there are defined setter mutations that do not have a corresponding getter, 
  // throw an error. 
  if( $store && $store[`__${className}_internal_getter__`] ) {
    $store[`__${className}_internal_mutator__`] = mutations[`__${className}_internal_mutator__`];
  }

  namespacedPath = refineNamespacedPath( namespacedPath );

  for( let field in getters ) {

    if( $store === undefined || proxy[ field ] ) continue;

    const fieldHasGetterAndMutation = getterMutations.indexOf( field ) > -1;
    if( fieldHasGetterAndMutation ) {
      
      Object.defineProperty( proxy, field, {
        get: () => {
          const storeGetters = namespacedPath ? $store.rootGetters : $store.getters;
          if( storeGetters ) return storeGetters[ namespacedPath + field ]
          else return $store[ namespacedPath + field ];
        },
        set: ( payload :any ) => $store.commit( namespacedPath + field, payload, { root: !!namespacedPath } ),
      })
      
      continue;
    }
    
    // The field has only a getter.
    if( Object.prototype.hasOwnProperty.call(proxy, field) ) continue;
    
    Object.defineProperty( proxy, field, {
      get: () => { 
        const storeGetters = namespacedPath ? $store.rootGetters : $store.getters;
        if (storeGetters)
            return storeGetters[ namespacedPath + field ];
        else
            return $store[ namespacedPath + field ];
      }
    })

  }
}

function createActionProxy({ cls, actions, proxy, $store, namespacedPath } :ActionProxyCreator) {

  const dispatch = cls.prototype.__store_cache__ ? cls.prototype.__store_cache__.dispatch : $store.dispatch;
  namespacedPath = refineNamespacedPath( cls.prototype.__namespacedPath__.length ? cls.prototype.__namespacedPath__ + "/" : namespacedPath );

  for( let field in actions ) {
    proxy[ field ] = function( payload :any )  { 
      return dispatch( namespacedPath + field, payload );
    }
  }
}

interface ProxyCreator {
  proxy :Map;
  $store :any;
  namespacedPath :string
}

interface MutationProxyCreator extends ProxyCreator {
  cls :VuexModuleConstructor;
}

interface GetterProxyCreator extends MutationProxyCreator {
  getters :Map;
  mutations :Map;
}

interface ActionProxyCreator extends MutationProxyCreator {
  actions :Map;
}
