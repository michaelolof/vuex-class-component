"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getter = void 0;
/*
 * The getter decorator exists just for backward compatibility.
 * Not doing anything.
 */
exports.getter = function (target, propertyKey) {
    if (target.__decorator_getter_names__ === undefined) {
        target.__decorator_getter_names__ = [propertyKey];
    }
    else
        target.__decorator_getter_names__.push(propertyKey);
};
//# sourceMappingURL=getters.legacy.js.map