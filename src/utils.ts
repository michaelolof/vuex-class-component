export function toCamelCase(str :string){
  return str[ 0 ].toLocaleLowerCase() + str.substring( 1 );
}