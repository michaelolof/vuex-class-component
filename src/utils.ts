export function toCamelCase(str :string){
  return str[ 0 ].toLocaleLowerCase() + str.substring( 1 );
}

export function getClassPath( path :string ) {
  const arr = path.split( "/" );
  return arr[ arr.length - 1 ];
}
