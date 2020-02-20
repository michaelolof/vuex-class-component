export function toCamelCase(str :string){
  return str[ 0 ].toLocaleLowerCase() + str.substring( 1 );
}

export function getClassPath( path :string ) {
  if (!path) { return ''; }
  const arr = path.split( "/" );
  return arr[ arr.length - 1 ];
}

export function refineNamespacedPath( path :string ) {
  const rtn = path.split( "/" ).filter( str => str.trim().length > 0 ).join( "/" ).trim();
  if( rtn.length > 0 ) return rtn + "/"
  else return rtn;
}