
/*
 * The getter decorator exists just for backward compatibility.
 * Not doing anything.
 */
export const getter = (target:any, propertyKey:string) => {
  if( target.__decorator_getter_names__  === undefined ) {
    target.__decorator_getter_names__ = [ propertyKey ];
  }
  else target.__decorator_getter_names__.push( propertyKey );
}