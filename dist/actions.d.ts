import { VuexClassConstructor, VuexModule } from "./module";
export declare type ActionDescriptor = TypedPropertyDescriptor<(payload?: any) => Promise<any>>;
export interface ActionRegister {
    name: string;
    descriptor: ActionDescriptor;
}
export declare function action(target: any, key: string, descriptor: ActionDescriptor): void;
export declare function getActions<T extends VuexModule>(cls: VuexClassConstructor<T>): Record<any, any> | undefined;
