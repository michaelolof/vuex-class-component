import { VuexModule, createProxy } from "./module";
import { _actions_register, _mutations, _state, _getters, _actions, _namespacedPath, _contextProxy } from "./symbols";
import { ActionContext, Store } from 'vuex'

export type ActionDescriptor = TypedPropertyDescriptor<(payload?:any) => Promise<any>>

export interface ActionRegister {
  name:string;
  descriptor:ActionDescriptor;
}

export interface ActionOption {
  mode?:"mutate"|"raw";
}

export function action(options?:ActionOption):any
export function action(target:any, key:string, descriptor:ActionDescriptor):any
export function action(...params:any[]) {
  const firstParam = params[0] as VuexModule | ActionOption | undefined;

  if( firstParam === undefined ) return mutateAction;
  if( firstParam instanceof VuexModule ) return mutateAction( firstParam, params[ 1 ], params[ 2 ] );
  switch( firstParam.mode ) {
    case "raw": return rawAction;
    case "mutate": return mutateAction;
    default: return mutateAction;
  }
}


export function getRawActionContext<T extends VuexModule, R>( thisArg:ThisType<T> ) {
  return thisArg as ActionContext<T, R>
}

function rawAction(target:any, key:string, descriptor:ActionDescriptor) {
  const func = descriptor.value || new Function()
  const vuexFunc = function(context:any, payload:any) {
    return func.call( context, payload );
  }
  const actions = target[ _actions ];
  if( actions === undefined ) {
    target[ _actions ] = {
      [ key ]: vuexFunc
    }
  }
  else {
    target[ _actions ][ key ] = vuexFunc;
  }
}

function mutateAction(target:VuexModule, key:string, descriptor:ActionDescriptor) {
  if( target[ _actions_register ] === undefined ) {
    target[ _actions_register ] = [ { name:key, descriptor }]
  }
  else {
    target[ _actions_register ].push({ name:key, descriptor });
  }
}

export function getMutatedActions(cls:typeof VuexModule ) {
  const actions:Record<any, any> = {};
  const actionsRegister = cls.prototype[ _actions_register ] as ActionRegister[] | undefined;
  if( actionsRegister === undefined || actionsRegister.length === 0 ) return actions;

  for(let action of actionsRegister) {
    let func = action.descriptor.value!;
    actions[ action.name ] = function( context:any, { payload, $store }: { payload: any, $store: Store<any>}) {
      const proxy = createProxy( context, cls, "", _contextProxy );
      Object.defineProperty(proxy, '$store', {
        value: $store
      })
      return func.call( proxy, payload );
    }
  }

  return actions;

}
