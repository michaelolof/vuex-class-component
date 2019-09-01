import { ActionDescriptor, ActionOption, VuexModule } from "./interfaces";
import { ActionContext } from 'vuex';
export declare const internalAction: (state: any, context: any) => undefined;
export declare function action(options?: ActionOption): (target: any, key: string, descriptor: ActionDescriptor) => any;
export declare function action(target: any, key: string, descriptor: ActionDescriptor): any;
export declare function getRawActionContext<T extends VuexModule, R>(thisArg: ThisType<T>): ActionContext<T, R>;
