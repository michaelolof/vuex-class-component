import { _getters } from ".";

const getterBuilder = (field:any) => new Function("state", `return state.${field}`);

export function getter(target:any, propertyKey:string) {
  const ctr = target.constructor();
  if( ctr[ _getters ] === undefined ) {
    ctr[ _getters ] = { 
      [ propertyKey ]: getterBuilder( propertyKey )
    }
  } else {
    ctr[ _getters ][ propertyKey ] = getterBuilder( propertyKey );
  }
}