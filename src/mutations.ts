import { _mutations } from "./symbols";

export type MutationDescriptor = TypedPropertyDescriptor<(payload?:any) => void>

export function mutation( target:any, key:string, descriptor:MutationDescriptor ) {
  const func:Function = descriptor.value || new Function()
  const newFunc = function(state:any, payload:object) {
    func.call( state, payload );
  }

  const mutations = target[ _mutations ];
  if( mutations === undefined ) {
    target[ _mutations ] = {
      [ key ]: newFunc,
    }
  }
  else {
    target[ _mutations ][ key ] = newFunc
  }
}

