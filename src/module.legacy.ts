import { VuexModuleConstructor, VuexModule, VuexModuleAddons, Map } from "./interfaces";
import { createModule, extractVuexModule } from "./module";
import { createProxy, clearProxyCache } from './proxy';
import { createSubModule } from './submodule';
import { getClassPath, toCamelCase } from "./utils";

const defaultModuleOptions :ModuleOptions = {
  namespacedPath: "",
  target: "core",
}

export function Module({ namespacedPath = "", target = "core" as VuexModuleTarget } = defaultModuleOptions ) {

  return function( module :unknown ) :void {
    
    const VuexClass = module as VuexModuleConstructor;
    
    VuexClass.prototype.__options__ = {
      namespaced: namespacedPath,
      target: target === "nuxt" ? target : undefined,
    }
    
    const mod = createModule({
      target: VuexClass.prototype.__options__ && VuexClass.prototype.__options__.target,
      namespaced: VuexClass.prototype.__options__ && VuexClass.prototype.__options__.namespaced,
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

export interface LegacyVuexModule extends VuexModuleAddons {}
export class LegacyVuexModule {

  static ExtractVuexModule( cls :typeof VuexModule ) {
    
    const VuexClass = cls as VuexModule & VuexModuleConstructor;
    
    const vxmodule = extractVuexModule( VuexClass );
    const path = getClassPath( VuexClass.prototype.__namespacedPath__ ) || toCamelCase( VuexClass.name );
    return vxmodule[ path ];
  }

  static CreateProxy<T extends typeof VuexModule>( $store :Map, cls :T ) {
    return createProxy( $store, cls );
  }

  static CreateSubModule<T extends typeof VuexModule>( cls :T ) {
    return createSubModule( cls );
  }

  static ClearProxyCache( cls :typeof VuexModule ) {
    return clearProxyCache( cls );
  }
}

export type VuexModuleTarget = "core" | "nuxt";

interface ModuleOptions {
  namespacedPath?: string,
  target?: VuexModuleTarget
}