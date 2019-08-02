import { VuexModuleConstructor, VuexModule, Map } from "./interfaces";
import { createModule, extractVuexModule } from "./module";
import { createProxy } from './proxy';
import { createSubModule } from './submodule';

export function Module({ namespacedPath = "", target = "core" as VuexModuleTarget } = defaultModuleOptions ) {

  return function( module :VuexModule ) :void {
    
    const VuexClass = module as VuexModuleConstructor;

    const mod = createModule({
      target: VuexClass.prototype.__options__ && VuexClass.prototype.__options__.target,
      namespaced: VuexClass.prototype.__options__ && VuexClass.prototype.__options__.namespaced || false,
    });

    // Add all fields in mod prototype without replacing
    for( let field in mod.prototype ) {
      //@ts-ignore
      if( VuexClass.prototype[ field ] ) continue;
      //@ts-ignore
      VuexClass.prototype[ field ] = mod.prototype[ field ]
    }    

  
  }

}

export class LegacyVuexModule {

  static ExtractVuexModule( cls :typeof VuexModule ) {
    const vxmodule = extractVuexModule( cls );
    //@ts-ignore
    return vxmodule[ cls.prototype.__namespacedPath__ ]
  }

  static CreateProxy( cls :typeof VuexModule, $store :Map ) {
    return createProxy( cls, $store )
  }

  static CreateSubModule( cls :typeof VuexModule ) {
    return createSubModule( cls );
  }
}

export type VuexModuleTarget = "core" | "nuxt";

interface ModuleOptions {
  namespacedPath?: string,
  target?: VuexModuleTarget
}

const defaultModuleOptions :ModuleOptions = {
  namespacedPath: "",
  target: "core",
}