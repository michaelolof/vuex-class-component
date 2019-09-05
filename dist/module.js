"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
//@ts-ignore
var object_getownpropertydescriptors_1 = __importDefault(require("object.getownpropertydescriptors"));
var interfaces_1 = require("./interfaces");
var submodule_1 = require("./submodule");
var proxy_1 = require("./proxy");
var utils_1 = require("./utils");
var actions_1 = require("./actions");
var mutations_1 = require("./mutations");
var getters_1 = require("./getters");
function createModule(options) {
    /**
     * We do it like this because we don't want intelissense to pick up the
     * options variable as it is an internal variable.
     */
    interfaces_1.VuexModule.prototype.__options__ = options;
    return interfaces_1.VuexModule;
}
exports.createModule = createModule;
function initializeModuleInternals(cls) {
    cls.prototype.__namespacedPath__ = "";
    cls.prototype.__vuex_module_cache__ = undefined;
    cls.prototype.__vuex_proxy_cache__ = undefined;
    cls.prototype.__vuex_local_proxy_cache__ = undefined;
    cls.prototype.__submodules_cache__ = {};
    cls.prototype.__context_store__ = {};
    cls.prototype.__watch__ = {};
    cls.prototype.__explicit_getter_names__ = [];
}
function extractVuexModule(cls) {
    var _a, _b, _c, _d;
    var VuexClass = cls;
    // Check if module has been cached, 
    // and just return the cached version.
    if (VuexClass.prototype.__vuex_module_cache__) {
        return VuexClass.prototype.__vuex_module_cache__;
    }
    initializeModuleInternals(VuexClass);
    // If not extract vuex module from class.
    var fromInstance = extractModulesFromInstance(VuexClass);
    var fromPrototype = extractModulesFromPrototype(VuexClass);
    // console.log( "Class Name", VuexClass, VuexClass.name, VuexClass.prototype.__mutations_cache__ )
    // console.log( "Mutation Names", VuexClass.name, VuexClass.prototype.__actions__ )
    // Cache explicit mutations and getter mutations.
    VuexClass.prototype.__mutations_cache__ = {
        __explicit_mutations__: fromPrototype.mutations.explicitMutations,
        __setter_mutations__: fromPrototype.mutations.setterMutations,
    };
    var className = VuexClass.name.toLowerCase();
    var vuexModule = {
        namespaced: VuexClass.prototype.__options__ && VuexClass.prototype.__options__.namespaced ? true : false,
        state: fromInstance.state,
        mutations: __assign({}, fromPrototype.mutations.explicitMutations, fromPrototype.mutations.setterMutations, (_a = {}, _a["__" + className + "_internal_mutator__"] = mutations_1.internalMutator, _a)),
        getters: __assign({}, fromPrototype.getters, fromInstance.getters, (_b = {}, _b["__" + className + "_internal_getter__"] = getters_1.internalGetter, _b)),
        actions: __assign({}, fromPrototype.actions, (_c = {}, _c["__" + className + "_internal_action__"] = actions_1.internalAction, _c)),
        modules: fromInstance.submodules,
    };
    // Cache the vuex module on the class.
    var path = getNamespacedPath(VuexClass) || utils_1.toCamelCase(VuexClass.name);
    var rtn = (_d = {}, _d[path] = vuexModule, _d);
    VuexClass.prototype.__vuex_module_cache__ = rtn;
    return rtn;
}
exports.extractVuexModule = extractVuexModule;
function getNamespacedPath(cls) {
    if (cls.prototype.__options__ && cls.prototype.__options__.namespaced) {
        switch (cls.prototype.__options__.namespaced) {
            case true:
                cls.prototype.__namespacedPath__ = utils_1.toCamelCase(cls.name);
                break;
            default:
                cls.prototype.__namespacedPath__ = cls.prototype.__options__.namespaced.split("/")[0];
        }
    }
    return cls.prototype.__namespacedPath__;
}
exports.getNamespacedPath = getNamespacedPath;
function extractModulesFromInstance(cls) {
    var instance = new cls();
    var classFields = Object.getOwnPropertyNames(instance);
    var state = {};
    var mutations = {};
    var submodules = {};
    var submodulesCache = cls.prototype.__submodules_cache__;
    var moduleOptions = cls.prototype.__options__ || {};
    for (var _i = 0, classFields_1 = classFields; _i < classFields_1.length; _i++) {
        var field = classFields_1[_i];
        // Check if field is a submodule.
        var fieldIsSubModule = submodule_1.isFieldASubModule(instance, field);
        if (fieldIsSubModule) {
            // Cache submodule class
            submodulesCache[field] = instance[field]["__submodule_class__"];
            var submodule = submodule_1.extractVuexSubModule(instance, field);
            submodules[field] = submodule;
            continue;
        }
        // If field is not a submodule, then it must be a state.
        state[field] = instance[field];
    }
    return {
        submodules: submodules,
        mutations: mutations,
        getters: extractDecoratorGetterNames(cls.prototype.__decorator_getter_names__),
        // Check if the vuex module is targeting nuxt return state as function. if not define state as normal.    
        state: moduleOptions.target === "nuxt" ? function () { return state; } : state,
    };
}
function extractModulesFromPrototype(cls) {
    var setterMutations = {};
    var explicitMutations = {};
    var actions = {};
    var getters = {};
    var descriptors = object_getownpropertydescriptors_1.default(cls.prototype);
    var gettersList = Object.keys(descriptors).filter(function (field) { return descriptors[field].get; });
    var explicitMutationNames = cls.prototype.__explicit_mutations_names__;
    var actionNames = cls.prototype.__actions__ || [];
    var _loop_1 = function (field) {
        // Ignore the constructor and module interals.
        var fieldIsInternal = (field === "constructor" ||
            field === "__options__" ||
            field === "__vuex_module_cache__" ||
            field === "__vuex_proxy_cache__" ||
            field === "__mutations_cache__" ||
            field === "__explicit_mutations__" ||
            field === "__getter_mutations__");
        if (fieldIsInternal)
            return "continue";
        var descriptor = descriptors[field];
        var actionType = (typeof descriptor.value === "function") && actionNames.find(function (action) { return action.__name__ === field; });
        // If prototype field is an mutate action
        if (actionType && actionType.__type__ === "mutate") {
            var func_1 = descriptor.value;
            var action = function (context, payload) {
                cls.prototype.__context_store__ = context;
                var proxy = proxy_1.createLocalProxy(cls, context);
                if (proxy["$store"] === undefined) {
                    Object.defineProperty(proxy, "$store", { value: context });
                }
                return func_1.call(proxy, payload);
            };
            actions[field] = action;
            return "continue";
        }
        // if prototype field is a raw action
        if (actionType && actionType.__type__ === "raw") {
            var func_2 = descriptor.value;
            var action = function (context, payload) { return func_2.call(context, payload); };
            actions[field] = action;
            return "continue";
        }
        // If prototype field is an explicit mutation
        var fieldIsExplicitMutation = (typeof descriptor.value === "function" &&
            explicitMutationNames.indexOf(field) > -1);
        if (fieldIsExplicitMutation) {
            var mutation = function (state, payload) { return descriptor.value.call(state, payload); };
            explicitMutations[field] = mutation;
            return "continue";
        }
        // If the prototype field has a getter.
        if (descriptor.get) {
            var getter = function (state, context) {
                var proxy = proxy_1.createLocalProxy(cls, context);
                return descriptor.get.call(proxy);
            };
            getters[field] = getter;
        }
        // if the prototype field has setter mutation.
        if (descriptor.set) {
            var mutation = function (state, payload) { return descriptor.set.call(state, payload); };
            // Before we push a setter mutation We must verify 
            // if that mutation has a corresponding getter.
            // If not, we dissallow it.
            var mutationHasGetter = gettersList.indexOf(field) > -1;
            if (mutationHasGetter === false) {
                // Throw an Error.
                throw new Error("\nImproper Use of Setter Mutations:\n" +
                    "at >>\n" +
                    ("set " + field + "( payload ) {\n") +
                    "\t...\n" +
                    "}\n" +
                    "\n" +
                    "Setter mutations should only be used if there is a corresponding getter defined.\n" +
                    "\n" +
                    "Either define a corresponding getter for this setter mutation or,\n" +
                    "Define them as an explicit mutation using function assignment.\n" +
                    "Example:\n" +
                    "--------------------\n" +
                    (field + " = ( payload ) => {\n") +
                    " ...\n" +
                    "}");
            }
            setterMutations[field] = mutation;
        }
        // Stash getters list. To be used later when creating $watch functionality.
        cls.prototype.__explicit_getter_names__ = gettersList;
    };
    for (var field in descriptors) {
        _loop_1(field);
    }
    return {
        actions: actions,
        mutations: {
            explicitMutations: explicitMutations,
            setterMutations: setterMutations,
        },
        getters: getters
    };
}
function extractDecoratorGetterNames(names) {
    if (names === void 0) { names = []; }
    var decorator = {};
    for (var _i = 0, names_1 = names; _i < names_1.length; _i++) {
        var name_1 = names_1[_i];
        decorator[name_1] = new Function("state", "return state." + name_1);
    }
    return decorator;
}
//# sourceMappingURL=module.js.map