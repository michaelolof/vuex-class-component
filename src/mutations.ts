import { _mutations } from ".";

type MutationDescriptor = TypedPropertyDescriptor<(payload?:any) => void>

export function mutation<T, U>( target:T, key:string, descriptor:MutationDescriptor ) {
  const func:Function = descriptor.value || new Function()
  const newFunc = function(state:any, payload:object) {
    func.call( state, payload );
  }

  const mutations = (target as any)[ _mutations ];
  if( mutations === undefined ) {
    (target as any)[ _mutations ] = {
      [ key ]: newFunc,
    }
  }
  else {
    (target as any)[ _mutations ][ key ] = newFunc
  }
}