import { VuexModule, DictionaryField, SubModuleType, Map, VuexObject } from "./interfaces";
import { extractVuexModule, toCamelCase } from "./module";

export function isFieldASubModule( instance :VuexModule & Map, field :string ) {
  return( 
    typeof instance[ field ] === "object" && 
    instance[ field ][ "__submodule_type__" ] === "submodule" 
  )
}

export function extractVuexSubModule( instance :VuexModule & Map, field :string ) {
  const subModuleClass = instance[ field ][ "__submodule_class__" ];  
  return extractVuexModule( subModuleClass  )[ toCamelCase( subModuleClass.name ) ] as VuexObject
}

export function createSubModule<T>( Cls :T ) {
  const sub :SubModuleType<T> = {
    __submodule_type__: "submodule",
    __submodule_class__: Cls, 
  }
  //@ts-ignore
  return sub as InstanceType<T>
}