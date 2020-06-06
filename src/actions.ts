import { ActionDescriptor, ActionOption, VuexModule, VuexModuleInternalsPrototype } from "./interfaces";
import { ActionContext } from 'vuex';
import { LegacyVuexModule } from './module.legacy';

/*
 * We need a Vuex action to always be present so we can
 * guarantee access to the context object always exist when creating a
 * proxy.
 */
export const internalAction = ( state :any, context :any ) => undefined;


export function action(options? :ActionOption ): (target:any, key:string, descriptor:ActionDescriptor) => any
export function action(target:any, key:string, descriptor:ActionDescriptor):any
export function action(...params:any[]) {

  const firstParam = params[0] as VuexModule | ActionOption | undefined;
  
  if( firstParam === undefined ) return handleMutateActionMode;
  
  if( firstParam instanceof VuexModule || firstParam instanceof LegacyVuexModule ) { 
    return handleMutateActionMode( firstParam, params[ 1 ], params[ 2 ] )
  }
  switch( firstParam.mode ) {
    case "raw": return handleRawActionMode;
    case "mutate": return handleMutateActionMode;
    default: return handleMutateActionMode( firstParam, params[ 1 ], params[ 2 ] );
  }

}

export function getRawActionContext<T extends VuexModule, R>( thisArg:ThisType<T> ) {
  return thisArg as ActionContext<T, R>
}

function handleMutateActionMode(target:VuexModule | object, key:string, descriptor:ActionDescriptor) {

  initializeActionsCache( target );
  
  (target as VuexModule & VuexModuleInternalsPrototype).__actions__!.push({
    __name__: key,
    __type__: "mutate",
  })

}

function handleRawActionMode(target:VuexModule, key:string, descriptor:ActionDescriptor) {
  
  initializeActionsCache( target );
  
  (target as VuexModule & VuexModuleInternalsPrototype).__actions__!.push({
    __name__: key,
    __type__: "raw",
  });
}

function initializeActionsCache(target :any) {  
  if( ( target as VuexModuleInternalsPrototype).__actions__ === undefined ) {
    (target as VuexModuleInternalsPrototype).__actions__ = [];
  }
}
