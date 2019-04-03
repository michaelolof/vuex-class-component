import { VuexModule, createProxy } from "./module";
import { _actions_register, _actions, _namespacedPath, _contextProxy } from "./symbols";
export function action() {
    var params = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        params[_i] = arguments[_i];
    }
    var firstParam = params[0];
    if (firstParam === undefined)
        return mutateAction;
    if (firstParam instanceof VuexModule)
        return mutateAction(firstParam, params[1], params[2]);
    switch (firstParam.mode) {
        case "raw": return rawAction;
        case "mutate": return mutateAction;
        default: return mutateAction;
    }
}
export function getRawActionContext(thisArg) {
    return thisArg;
}
function rawAction(target, key, descriptor) {
    var _a;
    var func = descriptor.value || new Function();
    var vuexFunc = function (context, payload) {
        return func.call(context, payload);
    };
    var actions = target[_actions];
    if (actions === undefined) {
        target[_actions] = (_a = {},
            _a[key] = vuexFunc,
            _a);
    }
    else {
        target[_actions][key] = vuexFunc;
    }
}
function mutateAction(target, key, descriptor) {
    if (target[_actions_register] === undefined) {
        target[_actions_register] = [{ name: key, descriptor: descriptor }];
    }
    else {
        target[_actions_register].push({ name: key, descriptor: descriptor });
    }
}
export function getMutatedActions(cls) {
    var actions = {};
    var actionsRegister = cls.prototype[_actions_register];
    if (actionsRegister === undefined || actionsRegister.length === 0)
        return actions;
    var _loop_1 = function (action_1) {
        var func = action_1.descriptor.value;
        actions[action_1.name] = function (context, payload) {
            //@ts-ignore
            cls.prototype[_namespacedPath] = "";
            var proxy = createProxy(context, cls, _contextProxy);
            return func.call(proxy, payload);
        };
    };
    for (var _i = 0, actionsRegister_1 = actionsRegister; _i < actionsRegister_1.length; _i++) {
        var action_1 = actionsRegister_1[_i];
        _loop_1(action_1);
    }
    return actions;
}
//# sourceMappingURL=actions.js.map