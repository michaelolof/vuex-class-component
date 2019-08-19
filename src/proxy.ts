import { extractVuexModule } from "./module";
import { VuexModuleConstructor, Map, VuexModule, ProxyWatchers } from "./interfaces";


export function clearProxyCache<T extends typeof VuexModule>( cls :T ) {

}

export function createProxy<T extends typeof VuexModule>( $store :any, cls :T ) :ProxyWatchers & InstanceType<T> {
  //@ts-ignore
  const VuexClass = cls as VuexModuleConstructor;
  
  // Check cache and return from cache if defined.
  // if( VuexClass.prototype.__vuex_proxy_cache__ ) {
  //   return VuexClass.prototype.__vuex_proxy_cache__ as InstanceType<T> & ProxyWatchers;
  // }
  
  const namespacedPath = VuexClass.prototype.__namespacedPath__ ? VuexClass.prototype.__namespacedPath__ + "/" : "";

  // Create Proxy and cache
  const proxy = _createProxy( cls, $store, namespacedPath );
  VuexClass.prototype.__vuex_proxy_cache__ = proxy;

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
        () => $store.getters[ namespacedPath +  field ],
        callback,
        options,
      )
    }

    return $store.watch( 
      () => $store.getters[ namespacedPath + "__internal_getter__"]( field ),
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

export function _createProxy<T>(cls: T, $store: any, namespacedPath = "") {

  //@ts-ignore
  const VuexClass = cls as VuexModuleConstructor;
  const proxy = {};
  const { state, mutations, actions, getters, modules } = extractVuexModule( VuexClass )[ VuexClass.prototype.__namespacedPath__ ];

  createGettersAndMutationProxyFromState({ cls: VuexClass, proxy, state, $store, namespacedPath, maxDepth: 7 });
  createExplicitMutationsProxy({ cls: VuexClass, proxy, $store, namespacedPath });
  createGettersAndGetterMutationsProxy({ cls: VuexClass, mutations, getters, proxy, $store, namespacedPath });
  createActionProxy({ actions, proxy, $store, namespacedPath });
  createSubModuleProxy( $store, VuexClass, proxy, modules );

  //@ts-ignore
  return proxy as InstanceType<T>;
}

function createLocalSubscriberAction( cls :VuexModuleConstructor, $store :Map, namespacedPath :string ) {

  const subscriberIsEnabled = cls.prototype.__options__ && cls.prototype.__options__.enableLocalActionSubscriptions;

  if( !subscriberIsEnabled ) return;

  const field = subscriberIsEnabled === true ? "$subscribeAction" : subscriberIsEnabled;

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
  
  const subscriberIsEnabled = cls.prototype.__options__ && cls.prototype.__options__.enableLocalSubscriptions;

  if( !subscriberIsEnabled ) return;

  const field = subscriberIsEnabled === true ? "$subscribe" : subscriberIsEnabled;

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

  const field = watcherIsEnabled === true ? "$watch" : watcherIsEnabled;

  // Access Class Static Field
  //@ts-ignore
  const watchMap = cls[ field ];

  if( watchMap === undefined ) return;

  const getterNames = cls.prototype.__explicit_getter_names__;

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
        () => $store.getters[ namespacedPath + field ],
        proxiedWatchFunc,
      )
    }
    else { // This is so we can also watch implicit getters.
      $store.watch( 
        () => $store.getters[ namespacedPath + "__internal_getter__" ]( field ),
        proxiedWatchFunc,
      )
    }
    
  }

}

function createSubModuleProxy( $store :Map, cls:VuexModuleConstructor, proxy :Map, modules :Map ) {

  for( let field in modules ) {
    const subModuleClass = cls.prototype.__submodules_cache__[ field ];
    proxy[ field ] = createProxy( $store, subModuleClass );
  }

}

function createGettersAndMutationProxyFromState({ cls, proxy, state, $store, namespacedPath = "", currentField = "", maxDepth = 7 }: { cls: VuexModuleConstructor, proxy: Map; state: Map; $store: any; namespacedPath?: string; currentField?: string; maxDepth: number}) {
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
  for (let field in state) {

    let value = state[ field ];

    if (currentField.length && !currentField.endsWith(".")) currentField += ".";
    const path = currentField + field;

    if ( maxDepth === 0 || typeof value !== "object") {
      Object.defineProperty(proxy, field, {
        get: () => { 
          // When creating local proxies getters doesn't exist on that context, so we have to account
          // for that.
          if( $store.getters ) return $store.getters[ namespacedPath + "__internal_getter__" ]( path )
          else return $store[ "__internal_getter__" ]( path ) 
        },
        set: payload => { 
          if( $store.commit ) $store.commit( namespacedPath + "__internal_mutator__", { field: path, payload });
          else {
            // We must be creating local proxies hence, $store.commit doesn't exist
            const store = cls.prototype.__context_store__!;
            store.commit( "__internal_mutator__", { field: path, payload })
          }
        },
      })

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

function createExplicitMutationsProxy({ cls, proxy, $store, namespacedPath } :MutationProxyCreator) {
  const mutations = cls.prototype.__mutations_cache__.__explicit_mutations__;
  for( let field in mutations ) {
    proxy[ field ] = ( payload :any ) => $store.commit( namespacedPath + field, payload )
  }
}

function createGettersAndGetterMutationsProxy({ cls, getters, mutations, proxy, $store, namespacedPath } :GetterProxyCreator) {
  
  const getterMutations = Object.keys( cls.prototype.__mutations_cache__.__setter_mutations__ );
  // If there are defined setter mutations that do not have a corresponding getter, 
  // throw an error. 
  if( $store && $store.__internal_getter__ ) {
    $store.__internal_mutator__ = mutations.__internal_mutator__;
  }

  for( let field in getters ) {

    if( $store === undefined ) continue;

    const fieldHasGetterAndMutation = getterMutations.indexOf( field ) > -1;
    if( fieldHasGetterAndMutation ) {
      
      Object.defineProperty( proxy, field, {
        get: () => {
          if( $store.getters ) return $store.getters[ namespacedPath + field ]
          else return $store[ namespacedPath + field ];
        },
        set: ( payload :any ) => $store.commit( namespacedPath + field, payload ),
      })
      
      continue;
    }
    
    // The field has only a getter.
    Object.defineProperty( proxy, field, {
      get: () => { 
        if( $store.getters ) return $store.getters[ namespacedPath + field ];
        else return $store[ namespacedPath + field ];
      }
    })

  }
}

function createActionProxy({ actions, proxy, $store, namespacedPath } :ActionProxyCreator) {
  for( let field in actions ) {
    if( $store === undefined ) continue;
    proxy[ field ] = function( payload :any )  { 
      return $store.dispatch( namespacedPath + field, payload );
    }
  }
}

function runSetterCheck( cls :VuexModuleConstructor, getters :Map ) {
  // if there are setters defined that are not in getters.
  // throw an error.
  const setterMutations = cls.prototype.__mutations_cache__.__setter_mutations__;
  console.log( "Setter Mutations", cls.name, setterMutations );
  for( let field in setterMutations ) {
    const setterIsNotInGetters = Object.keys( getters ).indexOf( field ) < 0;
    if( setterIsNotInGetters ) {

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

interface ActionProxyCreator extends ProxyCreator {
  actions :Map;
}
