import { VuexModule } from "./interfaces";
import { LegacyVuexModule } from './module.legacy';
/*
 * We need a Vuex action to always be present so we can
 * guarantee access to the context object always exist when creating a
 * proxy.
 */
export var internalAction = function (state, context) { return undefined; };
export function action() {
    var params = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        params[_i] = arguments[_i];
    }
    var firstParam = params[0];
    if (firstParam === undefined)
        return handleMutateActionMode;
    if (firstParam instanceof VuexModule || firstParam instanceof LegacyVuexModule) {
        return handleMutateActionMode(firstParam, params[1], params[2]);
    }
    switch (firstParam.mode) {
        case "raw": return handleRawActionMode;
        case "mutate": return handleMutateActionMode;
        default: return handleMutateActionMode(firstParam, params[1], params[2]);
    }
}
export function getRawActionContext(thisArg) {
    return thisArg;
}
function handleMutateActionMode(target, key, descriptor) {
    initializeActionsCache(target);
    target.__actions__.push({
        __name__: key,
        __type__: "mutate",
    });
}
function handleRawActionMode(target, key, descriptor) {
    initializeActionsCache(target);
    target.__actions__.push({
        __name__: key,
        __type__: "raw",
    });
}
function initializeActionsCache(target) {
    if (target.__actions__ === undefined) {
        target.__actions__ = [];
    }
}
//# sourceMappingURL=actions.js.map