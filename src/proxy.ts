import { extractVuexModule, toCamelCase } from "./module";
import { VuexModuleConstructor, Map, VuexModule } from "./interfaces"


export function createProxy<T extends typeof VuexModule>( cls :T, $store :any ) :InstanceType<T> {
  //@ts-ignore
  const VuexClass = cls as VuexModuleConstructor;
  
  // Check cache and return from cache if defined.
  if( VuexClass.prototype.__vuex_proxy_cache__ ) {
    return VuexClass.prototype.__vuex_proxy_cache__ as InstanceType<T>;
  }
  
  let namespacedPath: string | undefined = undefined;
  if (VuexClass.prototype.__options__ && VuexClass.prototype.__options__.namespaced) {
    namespacedPath = toCamelCase(VuexClass.name) + "/";
  }
  
  // Create Proxy and cache
  const proxy = _createProxy( cls, $store, namespacedPath );
  VuexClass.prototype.__vuex_proxy_cache__ = proxy;
  
  return proxy as InstanceType<T>;
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
  const { state, mutations, actions, getters, modules } = extractVuexModule( VuexClass );

  createGettersAndMutationProxyFromState({ cls: VuexClass, proxy, state, $store, namespacedPath });
  createExplicitMutationsProxy({ cls: VuexClass, proxy, $store, namespacedPath });
  createGettersAndGetterMutationsProxy({ cls: VuexClass, mutations, getters, proxy, $store, namespacedPath });
  createActionProxy({ actions, proxy, $store, namespacedPath });
  
  createSubModuleProxy( $store, VuexClass, proxy, modules );


  //@ts-ignore
  return proxy as InstanceType<T>;
}


function createSubModuleProxy( $store :Map, cls:VuexModuleConstructor, proxy :Map, modules :Map ) {

  for( let field in modules ) {
    const subModuleClass = cls.prototype.__submodules_cache__[ field ];
    proxy[ field ] = createProxy( subModuleClass, $store );
  }

}

function createGettersAndMutationProxyFromState({ cls, proxy, state, $store, namespacedPath = "", currentField = "" }: { cls: VuexModuleConstructor, proxy: Map; state: Map; $store: any; namespacedPath?: string; currentField?: string; }) {
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

    let value = state[field];

    if (currentField.length && !currentField.endsWith(".")) currentField += ".";
    const path = currentField + field;

    if (typeof value !== "object") {
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

    proxy[field] = {};
    createGettersAndMutationProxyFromState({ cls, proxy: proxy[field], state: value, $store, namespacedPath, currentField: currentField + field });
  
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
  if( $store.__internal_getter__ ) {
    $store.__internal_mutator__ = mutations.__internal_mutator__;
  }

  for( let field in getters ) {


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
    proxy[ field ] = ( payload :any ) => $store.dispatch( namespacedPath + field, payload );
  }
}

function runSetterCheck( cls :VuexModuleConstructor, getters :Map ) {
  // if there are setters defined that are not in getters.
  // throw an error.
  const setterMutations = cls.prototype.__mutations_cache__.__setter_mutations__;
  console.log( "Setter Mutations", cls.name, setterMutations );
  // for( let field in setterMutations ) {
  //   const setterIsNotInGetters = Object.keys( getters ).indexOf( field ) < 0;
  //   if( setterIsNotInGetters ) {

      // throw new Error(
      //   `\nImproper Use of Setter Mutations:\n` + 
      //   `at >>\n` +
      //   `set ${ field }( payload ) {\n` +
      //   `\t...\n` +
      //   `}\n` +
      //   `\n` +
      //   `Setter mutations should only be used if there is a corresponding getter defined.\n` +
      //   `\n` +
      //   `Either define a corresponding getter for this setter mutation or,\n` +
      //   `Define them as an explicit mutation using function assignment.\n` +
      //   `Example:\n` +
      //   `--------------------\n` +
      //   `${ field } = ( payload ) => {\n` +
      //   ` ...\n` +
      //   `}`
      // )

    // }
  // }
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
