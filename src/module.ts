import { getMutatedActions as getProxiedActions, ActionRegister } from "./actions";
import { _state, _mutations, _getters, _proxy, _map, _store, _namespacedPath, _actions_register, _actions, MutationFunction, GetterFunction, ActionFunction, VuexMap, _submodule, SubModuleObject, _module } from ".";
import { Store } from "vuex";

export type VuexClassConstructor<T> = new () => T


export class VuexModule {

  static CreateSubModule<V extends typeof VuexModule>(SubModule: V) {
    return {
      type: _submodule,
      store: SubModule,
    } as InstanceType<V>
  }

  static CreateProxy<V extends typeof VuexModule>($store: Store<any>, cls: V) {
    return createProxy( $store, cls, _proxy )
  }

  static ExtractVuexModule(cls: typeof VuexModule) {
    const proxiedActions = getProxiedActions(cls);
    const rawActions = cls.prototype[_actions] as Record<any, any>;
    const actions = { ...proxiedActions, ...rawActions }
    //Update prototype with mutated actions.
    cls.prototype[_actions] = actions;

    const mod = {
      namespaced: cls.prototype[_namespacedPath].length > 0 ? true : false,
      state: cls.prototype[_state],
      mutations: cls.prototype[_mutations],
      actions,
      getters: cls.prototype[_getters],
      modules: cls.prototype[_module],
    };

    return mod;
  }
}

export function createProxy<V extends typeof VuexModule>($store: Store<any>, cls: V, cachePath: symbol) {
  let rtn: Record<any, any> = {}
  const path = cls.prototype[_namespacedPath];
  const prototype = cls.prototype as any

  if (prototype[ cachePath ] === undefined) { // Proxy has not been cached.
    Object.getOwnPropertyNames(prototype[_getters] || {}).map(name => {
      Object.defineProperty(rtn, name, {
        get: () => $store.getters[path + name],
        value: prototype[ _state ][ name ]
      })
    });

    Object.getOwnPropertyNames(prototype[_mutations] || {}).map(name => {
      rtn[name] = function (payload?: any) {
        $store.commit(path + name, payload);
      }
    });

    Object.getOwnPropertyNames(prototype[_actions] || {}).map(name => {
      rtn[name] = function (payload?: any) {
        return $store.dispatch(path + name, payload);
      }
    });

    Object.getOwnPropertyNames(cls.prototype[_submodule] || {}).map(name => {
      const vxmodule = cls.prototype[_submodule][name];
      vxmodule.prototype[_namespacedPath] = path + name + "/";
      rtn[name] = vxmodule.CreateProxy($store, vxmodule);
    })

    // Cache proxy.
    prototype[_proxy] = rtn;
  }
  else {
    // Use cached proxy.
    rtn = prototype[ cachePath ];
  }
  return rtn as InstanceType<V>;

}

export interface VuexModule {
  [_state]: Record<string, any>;
  [_mutations]: Record<string, MutationFunction>;
  [_getters]: Record<string, GetterFunction>;
  [_actions_register]: ActionRegister[];
  [_actions]: Record<string, ActionFunction>;
  [_map]: VuexMap[];
  [_proxy]: Record<string, any>;
  [_store]: Record<string, any>;
  [_namespacedPath]: string;
  [_submodule]: Record<string, typeof VuexModule>;
  [_module]: Record<string, any>;
}


const defaultOptions = {
  namespacedPath: "" as string
}
export function Module(options = defaultOptions) {

  return function (target: typeof VuexModule): void {
    const targetInstance = new target();

    const states = Object.getOwnPropertyNames(targetInstance);
    const stateObj: Record<string, any> = {}
    if (target.prototype[_map] === undefined) target.prototype[_map] = [];

    for (let stateField of states) {
      // @ts-ignore
      const stateValue = targetInstance[stateField];
      if (stateValue === undefined) continue;

      if (subModuleObjectIsFound(stateValue)) {
        handleSubModule(target, stateField, stateValue)
        continue;
      }
      stateObj[stateField] = stateValue;
      target.prototype[_map].push({ value: stateField, type: "state" });
    }

    target.prototype[_state] = stateObj;

    const fields = Object.getOwnPropertyDescriptors(target.prototype);
    if (target.prototype[_getters] === undefined) target.prototype[_getters] = {}
    for (let field in fields) {
      const getterField = fields[field].get;
      if (getterField) {
        const func = function (state: any) {
          return getterField.call(state);
        }
        target.prototype[_getters][field] = func;
      }
    }

    if (options) target.prototype[_namespacedPath] = options.namespacedPath;

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
