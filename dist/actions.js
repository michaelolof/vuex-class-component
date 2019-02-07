"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var module_1 = require("./module");
var _1 = require(".");
function action(options) {
    if (options === void 0) { options = { mode: "mutate" }; }
    switch (options.mode) {
        case "mutate": return mutateAction;
        case "raw": return rawAction;
    }
}
exports.action = action;
function getRawActionContext(thisArg) {
    return thisArg;
}
exports.getRawActionContext = getRawActionContext;
function rawAction(target, key, descriptor) {
    var func = descriptor.value || new Function();
    var vuexFunc = function (context, payload) {
        return func.call(context, payload);
    };
    var actions = target[_1._actions];
    if (actions === undefined) {
        target[_1._actions] = (_a = {},
            _a[key] = vuexFunc,
            _a);
    }
    else {
        target[_1._actions][key] = vuexFunc;
    }
    var _a;
}
function mutateAction(target, key, descriptor) {
    if (target[_1._actions_register] === undefined) {
        target[_1._actions_register] = [{ name: key, descriptor: descriptor }];
    }
    else {
        target[_1._actions_register].push({ name: key, descriptor: descriptor });
    }
}
function getMutatedActions(cls) {
    var actions = {};
    var actionsRegister = cls.prototype[_1._actions_register];
    if (actionsRegister === undefined || actionsRegister.length === 0)
        return actions;
    var _loop_1 = function (action_1) {
        var func = action_1.descriptor.value;
        actions[action_1.name] = function (context, payload) {
            //@ts-ignore
            cls.prototype[_1._namespacedPath] = "";
            var proxy = module_1.createProxy(context, cls, _1._contextProxy);
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