import { VuexModule, SubModuleType, Map, VuexObject, VuexModuleConstructor } from "./interfaces";
import { extractVuexModule } from "./module";
import { toCamelCase, getClassPath } from "./utils"

export function isFieldASubModule( instance :VuexModule & Map, field :string ) {
  return( 
    typeof instance[ field ] === "object" && 
    instance[ field ][ "__submodule_type__" ] === "submodule" 
  )
}

export function extractVuexSubModule( instance :VuexModule & Map, field :string ) {
  const subModuleClass = instance[ field ][ "__submodule_class__" ] as VuexModule & VuexModuleConstructor;
  const extract = extractVuexModule( subModuleClass  );
  const path = getClassPath( subModuleClass.prototype.__namespacedPath__ ) || toCamelCase( subModuleClass.name );
  return extract[ path ];
}

export function createSubModule<T>( Cls :T ) {
  const sub :SubModuleType<T> = {
    __submodule_type__: "submodule",
    __submodule_class__: Cls, 
  }
  //@ts-ignore
  return sub as InstanceType<T>
}