export declare type MutationDescriptor = TypedPropertyDescriptor<(payload?: any) => void>;
export declare function mutation(target: any, key: string, descriptor: MutationDescriptor): void;
