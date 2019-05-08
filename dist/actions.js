"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var module_1 = require("./module");
var symbols_1 = require("./symbols");
function action() {
    var params = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        params[_i] = arguments[_i];
    }
    var firstParam = params[0];
    if (firstParam === undefined)
        return mutateAction;
    if (firstParam instanceof module_1.VuexModule)
        return mutateAction(firstParam, params[1], params[2]);
    switch (firstParam.mode) {
        case "raw": return rawAction;
        case "mutate": return mutateAction;
        default: return mutateAction;
    }
}
exports.action = action;
function getRawActionContext(thisArg) {
    return thisArg;
}
exports.getRawActionContext = getRawActionContext;
function rawAction(target, key, descriptor) {
    var _a;
    var func = descriptor.value || new Function();
    var vuexFunc = function (context, payload) {
        return func.call(context, payload);
    };
    var actions = target[symbols_1._actions];
    if (actions === undefined) {
        target[symbols_1._actions] = (_a = {},
            _a[key] = vuexFunc,
            _a);
    }
    else {
        target[symbols_1._actions][key] = vuexFunc;
    }
}
function mutateAction(target, key, descriptor) {
    if (target[symbols_1._actions_register] === undefined) {
        target[symbols_1._actions_register] = [{ name: key, descriptor: descriptor }];
    }
    else {
        target[symbols_1._actions_register].push({ name: key, descriptor: descriptor });
    }
}
function getMutatedActions(cls) {
    var actions = {};
    var actionsRegister = cls.prototype[symbols_1._actions_register];
    if (actionsRegister === undefined || actionsRegister.length === 0)
        return actions;
    var _loop_1 = function (action_1) {
        var func = action_1.descriptor.value;
        actions[action_1.name] = function (context, _a) {
            var payload = _a.payload, $store = _a.$store;
            var proxy = module_1.createProxy(context, cls, "", symbols_1._contextProxy);
            Object.defineProperty(proxy, '$store', {
                value: $store
            });
            return func.call(proxy, payload);
        };
    };
    for (var _i = 0, actionsRegister_1 = actionsRegister; _i < actionsRegister_1.length; _i++) {
        var action_1 = actionsRegister_1[_i];
        _loop_1(action_1);
    }
    return actions;
}
exports.getMutatedActions = getMutatedActions;
//# sourceMappingURL=actions.js.map