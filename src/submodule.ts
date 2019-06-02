import { VuexModule, DictionaryField, SubModuleType } from "./interfaces";
import { extractModule } from "./module";

export function isFieldASubModule( instance :VuexModule, field :DictionaryField ) {
  return( 
    typeof instance[ field ] === "object" && 
    instance[ field ][ "__submodule_type__" ] === "submodule" 
  )
}

export function extractVuexSubModule( instance :VuexModule, field :DictionaryField ) {
  const subModuleClass = instance[ field ][ "__submodule_class__" ];
  return extractModule( subModuleClass  )
}

export function createSubModule<T>( Cls :T ) {
  const sub :SubModuleType<T> = {
    __submodule_type__: "submodule",
    __submodule_class__: Cls, 
  }
  //@ts-ignore
  return sub as InstanceType<T>
}