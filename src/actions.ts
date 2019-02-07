import { VuexModule, createProxy } from "./module";
import { _actions_register, _mutations, _state, _getters, _actions, _namespacedPath, _contextProxy } from ".";
import { ActionContext } from 'vuex';

export type ActionDescriptor = TypedPropertyDescriptor<(payload?:any) => Promise<any>>

export interface ActionRegister {
  name:string;
  descriptor:ActionDescriptor;
}

export interface ActionOption {
  mode:"mutate"|"raw";
}

export function action(options:ActionOption = { mode:"mutate"}) {
  switch( options.mode ) {
    case "mutate": return mutateAction;
    case "raw": return rawAction;
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
    actions[ action.name ] = function( context:any, payload:any ) {
      //@ts-ignore
      cls.prototype[ _namespacedPath ] = "";
      const proxy = createProxy( context, cls, _contextProxy );
      return func.call( proxy, payload );
    }
  }

  return actions;

}