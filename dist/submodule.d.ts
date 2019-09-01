import { VuexModule, Map, VuexObject } from "./interfaces";
export declare function isFieldASubModule(instance: VuexModule & Map, field: string): boolean;
export declare function extractVuexSubModule(instance: VuexModule & Map, field: string): VuexObject;
export declare function createSubModule<T>(Cls: T): InstanceType<T>;
