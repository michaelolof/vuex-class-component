import { VuexClassConstructor, VuexModule } from "./module";
import { _actions_register, _mutations, _state, _getters, _actions } from ".";
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
 
  const mutationsList = Object.getOwnPropertyNames( cls.prototype[ _mutations ] || {} );
  const actionsList = actionsRegister.map( action => action.name );
  const statesList = Object.getOwnPropertyNames( cls.prototype[ _state ] || {} );
  const gettersList = Object.getOwnPropertyNames( cls.prototype[ _getters ] || {} );

  for(let action of actionsRegister) {
    let funcString = action.descriptor.value!.toString();
    funcString = funcString.replace( /_?this(([\s]+)?)\.(([\s]+)?)\$?[_a-zA-Z]+(([\s]+)?)\(/g, functionCall => {
      const name = getFunctionName( functionCall );
      const type = checkTypeOfFunction( name );
      switch( type ) {
        case "mutation":
          return `context.commit('${name}',`;
        case "action":
          return `context.dispatch('${name}',`;
        default :
          return functionCall;
      }
    })

    funcString = funcString.replace( /_?this(([\s]+)?)\.(([\s]+)?)[_$a-zA-Z]+[^($_a-zA-Z]/g, propertyCall => {
      const name = getPropertyName( propertyCall );
      const lastChar = propertyCall[ propertyCall.length-1 ];
      if( statesList.indexOf( name ) > -1 ) return `context.state.${name + lastChar}`;
      else if( gettersList.indexOf( name ) > -1 ) return `context.getters.${name + lastChar}`;
      else return propertyCall
    });

    const param = getFunctionParam( funcString );
    const body = getFunctionBody( funcString );

    const func = new Function( "context", param, body );
    actions[ action.name ] = func;
  }

  return actions;
  //---------------------------------------------------------------------------------
  function getFunctionName( match:string) {
    const start = match.indexOf(".");
    return match.substring( start + 1, match.length-1 ).trim();
  }

  function getPropertyName( match:string ) {
    const start = match.indexOf(".");
    return match.substring( start + 1, match.length-1 ).trim();
  }

  function getFunctionParam( functionString:string ) {
    const paramStart = functionString.indexOf("(");
    const paramEnd = functionString.indexOf(")");
    return functionString.substring( paramStart + 1, paramEnd );
  }

  function getFunctionBody( functionString:string ) {
    const bodyStart = functionString.indexOf("{") + 1;
    const bodyEnd = functionString.length - 1;
    return functionString.substring( bodyStart, bodyEnd );
  } 

  function checkTypeOfFunction( name:string ):"mutation"|"action"|undefined {
    if( mutationsList.indexOf( name ) > -1 ) return "mutation"
    else if( actionsList.indexOf( name ) > -1 ) return "action"
    else return undefined;
  }
}