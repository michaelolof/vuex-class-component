"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _1 = require(".");
var getterBuilder = function (field) { return new Function("state", "return state." + field); };
function getter(target, propertyKey) {
    var ctr = Object.getPrototypeOf(new target.constructor());
    if (ctr[_1._getters] === undefined) {
        ctr[_1._getters] = (_a = {},
            _a[propertyKey] = getterBuilder(propertyKey),
            _a);
    }
    else {
        ctr[_1._getters][propertyKey] = getterBuilder(propertyKey);
    }
    var _a;
}
exports.getter = getter;
//# sourceMappingURL=getters.js.map