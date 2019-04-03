"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var symbols_1 = require("./symbols");
function mutation(target, key, descriptor) {
    var _a;
    var func = descriptor.value || new Function();
    var newFunc = function (state, payload) {
        func.call(state, payload);
    };
    var mutations = target[symbols_1._mutations];
    if (mutations === undefined) {
        target[symbols_1._mutations] = (_a = {},
            _a[key] = newFunc,
            _a);
    }
    else {
        target[symbols_1._mutations][key] = newFunc;
    }
}
exports.mutation = mutation;
//# sourceMappingURL=mutations.js.map