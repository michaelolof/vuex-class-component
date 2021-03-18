import { Map, FieldPayload, MutationDescriptor } from "./interfaces";
export declare function mutation(target: any, key: string, descriptor: MutationDescriptor): void;
export declare const internalMutator: (state: Map, { field, payload }: FieldPayload) => void;
