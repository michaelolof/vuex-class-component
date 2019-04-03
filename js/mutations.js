import { _mutations } from "./symbols";
export function mutation(target, key, descriptor) {
    var _a;
    var func = descriptor.value || new Function();
    var newFunc = function (state, payload) {
        func.call(state, payload);
    };
    var mutations = target[_mutations];
    if (mutations === undefined) {
        target[_mutations] = (_a = {},
            _a[key] = newFunc,
            _a);
    }
    else {
        target[_mutations][key] = newFunc;
    }
}
//# sourceMappingURL=mutations.js.map