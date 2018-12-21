export declare type MutationDescriptor = TypedPropertyDescriptor<(payload?: any) => void>;
export declare function mutation<T, U>(target: T, key: string, descriptor: MutationDescriptor): void;
