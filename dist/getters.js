import { _getters } from "./symbols";
var getterBuilder = function (field) { return new Function("state", "return state." + field); };
export function getter(target, propertyKey) {
    var ctr = Object.getPrototypeOf(new target.constructor());
    if (ctr[_getters] === undefined) {
        ctr[_getters] = (_a = {},
            _a[propertyKey] = getterBuilder(propertyKey),
            _a);
    }
    else {
        ctr[_getters][propertyKey] = getterBuilder(propertyKey);
    }
    var _a;
}
//# sourceMappingURL=getters.js.map