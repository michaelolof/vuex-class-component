import { FieldPayload, MutationDescriptor } from "./interfaces";
export declare function mutation(target: any, key: string, descriptor: MutationDescriptor): void;
export declare const internalMutator: (state: Record<string | number | symbol, any>, { field, payload }: FieldPayload) => void;
