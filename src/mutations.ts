import { Map, FieldPayload, MutationDescriptor, VuexModuleInternalsPrototype } from "./interfaces";

/*
 * Define mutation decorator
 */
export function mutation( target:any, key:string, descriptor:MutationDescriptor ) {
  // Just store the name of the mutation.
  initializeExplicitMutationsCache( target );
  (target as VuexModuleInternalsPrototype).__explicit_mutations_names__.push( key );  
}



export const internalMutator = ( state :Map, { field, payload } :FieldPayload ) => {
  const fields = field.split( "." );
  switch( fields.length ) {
    case 1:
      state[ fields[0] ] = payload;
      break;
    case 2:
      state[ fields[0] ][ fields[1] ] = payload;
      break;
    case 3:
      state[ fields[0] ][ fields[1] ][ fields[2] ] = payload;
      break;
    case 4:
      state[ fields[0] ][ fields[1] ][ fields[2] ][ fields[3] ] = payload;
      break;
    case 5:
      state[ fields[0] ][ fields[1] ][ fields[2] ][ fields[3] ][ fields[4] ] = payload;
      break;
    case 6:
      state[ fields[0] ][ fields[1] ][ fields[2] ][ fields[3] ][ fields[4] ][ fields[ 5] ] = payload;
      break;
    case 7:
      state[ fields[0] ][ fields[1] ][ fields[2] ][ fields[3] ][ fields[4] ][ fields[ 5] ][ fields[6] ] = payload;
      break;
    case 8:
      state[ fields[0] ][ fields[1] ][ fields[2] ][ fields[3] ][ fields[4] ][ fields[ 5] ][ fields[6] ][ fields[7] ] = payload;
      break;
    case 9:
      state[ fields[0] ][ fields[1] ][ fields[2] ][ fields[3] ][ fields[4] ][ fields[ 5] ][ fields[6] ][ fields[7] ][ field[8] ] = payload;
      break;
    case 10:
      state[ fields[0] ][ fields[1] ][ fields[2] ][ fields[3] ][ fields[4] ][ fields[ 5] ][ fields[6] ][ fields[7] ][ field[8] ][ field[9] ] = payload;
      break;
    case 11:
      state[ fields[0] ][ fields[1] ][ fields[2] ][ fields[3] ][ fields[4] ][ fields[ 5] ][ fields[6] ][ fields[7] ][ field[8] ][ field[9] ][ field[10] ] = payload;
      break;
    case 12:
      state[ fields[0] ][ fields[1] ][ fields[2] ][ fields[3] ][ fields[4] ][ fields[ 5] ][ fields[6] ][ fields[7] ][ field[8] ][ field[9] ][ field[10] ][ field[11] ] = payload;
      break;

  }
}

function initializeExplicitMutationsCache(target :any) {  
  const cls = target as VuexModuleInternalsPrototype;
  if ( cls.__explicit_mutations_names__ === undefined ) {
    cls.__explicit_mutations_names__ = [];
  }

  if( cls.__mutations_cache__ === undefined ) {
    cls.__mutations_cache__ = {
      __explicit_mutations__: {},
      __setter_mutations__: {},
    }
  }
}
