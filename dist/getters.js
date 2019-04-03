"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var symbols_1 = require("./symbols");
var getterBuilder = function (field) { return new Function("state", "return state." + field); };
function getter(target, propertyKey) {
    var _a;
    var ctr = Object.getPrototypeOf(new target.constructor());
    if (ctr[symbols_1._getters] === undefined) {
        ctr[symbols_1._getters] = (_a = {},
            _a[propertyKey] = getterBuilder(propertyKey),
            _a);
    }
    else {
        ctr[symbols_1._getters][propertyKey] = getterBuilder(propertyKey);
    }
}
exports.getter = getter;
//# sourceMappingURL=getters.js.map