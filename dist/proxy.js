"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var module_1 = require("./module");
var utils_1 = require("./utils");
function clearProxyCache(cls) { }
exports.clearProxyCache = clearProxyCache;
function createProxy($store, cls) {
    //@ts-ignore
    var VuexClass = cls;
    // Check cache and return from cache if defined.
    if (VuexClass.prototype.__vuex_proxy_cache__) {
        return VuexClass.prototype.__vuex_proxy_cache__;
    }
    var namespacedPath = VuexClass.prototype.__namespacedPath__ ? VuexClass.prototype.__namespacedPath__ + "/" : "";
    // Create Proxy and cache
    var proxy = _createProxy(cls, $store, namespacedPath);
    // Setup Local Watchers
    createLocalWatchers(VuexClass, $store, namespacedPath || "");
    // Setup local mutation subscribers
    createLocalSubscriber(VuexClass, $store, namespacedPath || "");
    // Setup local subscrube action.
    createLocalSubscriberAction(VuexClass, $store, namespacedPath || "");
    // Setup proxy watcher
    //@ts-ignore
    proxy.$watch = function (field, callback, options) {
        var getterNames = VuexClass.prototype.__explicit_getter_names__;
        // If field is a getter use the normal getter path if not use internal getters.
        if (typeof field === "string" && getterNames.indexOf(field) > -1) {
            return $store.watch(function () { return (namespacedPath ? ($store.rootGetters || $store.getters) : $store.getters)[namespacedPath + field]; }, callback, options);
        }
        var className = cls.name.toLowerCase();
        return $store.watch(function () { return (namespacedPath ? ($store.rootGetters || $store.getters) : $store.getters)[namespacedPath + ("__" + className + "_internal_getter__")](field); }, callback, options);
    };
    // Setup proxy subscription
    //@ts-ignore
    proxy.$subscribe = function (field, callback) {
        return $store.subscribe(function (mutation) {
            if (mutation.type === namespacedPath + field) {
                callback(mutation.payload);
            }
        });
    };
    //@ts-ignore
    proxy.$subscribeAction = function (field, callback) {
        if (typeof callback === "function") {
            return $store.subscribeAction(function (action) {
                //@ts-ignore
                if (action.type === namespacedPath + field)
                    callback(action.payload);
            });
        }
        if (typeof callback === "object") {
            return $store.subscribeAction({
                before: function (action) {
                    //@ts-ignore
                    if (action.type === namespacedPath + field)
                        callback.before(action.payload);
                },
                after: function (action) {
                    //@ts-ignore
                    if (action.type === namespacedPath + field)
                        callback.after(action.payload);
                }
            });
        }
    };
    if (VuexClass.prototype.__store_cache__ === undefined)
        VuexClass.prototype.__store_cache__ = $store;
    VuexClass.prototype.__vuex_proxy_cache__ = proxy;
    return proxy;
}
exports.createProxy = createProxy;
function createLocalProxy(cls, $store) {
    // Check cache and return from cache
    //@ts-ignore
    var VuexClass = cls;
    if (VuexClass.prototype.__vuex_local_proxy_cache__) {
        return VuexClass.prototype.__vuex_local_proxy_cache__;
    }
    // Create proxy and cache
    var proxy = _createProxy(cls, $store, "");
    VuexClass.prototype.__vuex_local_proxy_cache__ = proxy;
    return proxy;
}
exports.createLocalProxy = createLocalProxy;
function _createProxy(cls, $store, namespacedPath) {
    if (namespacedPath === void 0) { namespacedPath = ""; }
    //@ts-ignore
    var VuexClass = cls;
    var proxy = {};
    var classPath = utils_1.getClassPath(VuexClass.prototype.__namespacedPath__) || utils_1.toCamelCase(VuexClass.name);
    var _a = module_1.extractVuexModule(VuexClass)[classPath], state = _a.state, mutations = _a.mutations, actions = _a.actions, getters = _a.getters, modules = _a.modules;
    // For nuxt support state returns as a function
    // We need to handle this. 
    if (typeof state === "function")
        state = state();
    createGettersAndMutationProxyFromState({ cls: VuexClass, proxy: proxy, state: state, $store: $store, namespacedPath: namespacedPath });
    createGettersAndGetterMutationsProxy({ cls: VuexClass, mutations: mutations, getters: getters, proxy: proxy, $store: $store, namespacedPath: namespacedPath });
    createExplicitMutationsProxy(VuexClass, proxy, $store, namespacedPath);
    createActionProxy({ cls: VuexClass, actions: actions, proxy: proxy, $store: $store, namespacedPath: namespacedPath });
    createSubModuleProxy($store, VuexClass, proxy, modules);
    //@ts-ignore
    return proxy;
}
exports._createProxy = _createProxy;
function createLocalSubscriberAction(cls, $store, namespacedPath) {
    var subscriberIsEnabled = cls.prototype.__options__ && cls.prototype.__options__.enableLocalWatchers;
    if (!subscriberIsEnabled)
        return;
    var field = "$subscribeAction";
    // Access Static Class Field.
    //@ts-ignore
    var subscriptionMap = cls[field];
    if (subscriptionMap === undefined)
        return;
    var _loop_1 = function (field_1) {
        var watcher = subscriptionMap[field_1];
        if (typeof watcher === "function") {
            $store.subscribeAction(function (action) {
                if (action.type === namespacedPath + field_1) {
                    var proxiedFunction = function (payload) { return watcher.call(cls.prototype.__vuex_proxy_cache__, payload); };
                    proxiedFunction(action.payload);
                }
            });
            return "continue";
        }
        if (typeof watcher === "object") {
            $store.subscribeAction({
                before: function (action) {
                    if (action.type === namespacedPath + field_1 && watcher.before) {
                        var proxiedFunc = function (payload) { return watcher.before.call(cls.prototype.__vuex_proxy_cache__, payload); };
                        proxiedFunc(action.payload);
                    }
                },
                after: function (action) {
                    if (action.type === namespacedPath + field_1 && watcher.after) {
                        var proxiedFunc = function (payload) { return watcher.after.call(cls.prototype.__vuex_proxy_cache__, payload); };
                        proxiedFunc(action.payload);
                    }
                }
            });
        }
    };
    for (var field_1 in subscriptionMap) {
        _loop_1(field_1);
    }
}
function createLocalSubscriber(cls, $store, namespacedPath) {
    var subscriberIsEnabled = cls.prototype.__options__ && cls.prototype.__options__.enableLocalWatchers;
    if (!subscriberIsEnabled)
        return;
    var field = "$subscribe";
    // Access Static Class Field
    //@ts-ignore
    var subscriptionMap = cls[field];
    if (subscriptionMap === undefined)
        return;
    $store.subscribe(function (mutation, state) {
        var _loop_2 = function (field_2) {
            var subscribeFunc = subscriptionMap[field_2];
            var proxiedFunc = function (payload) { return subscribeFunc.call(cls.prototype.__vuex_proxy_cache__, payload); };
            if (mutation.type === namespacedPath + field_2) {
                proxiedFunc(mutation.payload);
            }
        };
        for (var field_2 in subscriptionMap) {
            _loop_2(field_2);
        }
    });
}
function createLocalWatchers(cls, $store, namespacedPath) {
    var watcherIsEnabled = cls.prototype.__options__ && cls.prototype.__options__.enableLocalWatchers;
    if (!watcherIsEnabled)
        return;
    var field = "$watch";
    // Access Class Static Field
    //@ts-ignore
    var watchMap = cls[field];
    if (watchMap === undefined)
        return;
    var getterNames = cls.prototype.__explicit_getter_names__;
    var className = cls.name.toLowerCase();
    var _loop_3 = function (field_3) {
        var fieldIsAnExplicitGetter = getterNames.indexOf(field_3) > -1;
        var watchFunc = watchMap[field_3];
        var proxiedWatchFunc = function (newVal, oldVal) {
            return watchFunc.call(cls.prototype.__vuex_proxy_cache__, newVal, oldVal);
        };
        if (fieldIsAnExplicitGetter) {
            $store.watch(function () { return (namespacedPath ? ($store.rootGetters || $store.getters) : $store.getters)[namespacedPath + field_3]; }, proxiedWatchFunc);
        }
        else { // This is so we can also watch implicit getters.
            $store.watch(function () { return (namespacedPath ? ($store.rootGetters || $store.getters) : $store.getters)[namespacedPath + ("__" + className + "_internal_getter__")](field_3); }, proxiedWatchFunc);
        }
    };
    for (var field_3 in watchMap) {
        _loop_3(field_3);
    }
}
function createSubModuleProxy($store, cls, proxy, modules) {
    var store = cls.prototype.__store_cache__ || $store;
    for (var field in modules) {
        var subModuleClass = cls.prototype.__submodules_cache__[field];
        var namespacedPath = module_1.getNamespacedPath(subModuleClass);
        subModuleClass.prototype.__namespacedPath__ = cls.prototype.__namespacedPath__ + "/" + namespacedPath;
        proxy[field] = createProxy(store, subModuleClass);
    }
}
function createGettersAndMutationProxyFromState(_a) {
    var cls = _a.cls, proxy = _a.proxy, state = _a.state, $store = _a.$store, _b = _a.namespacedPath, namespacedPath = _b === void 0 ? "" : _b, _c = _a.currentField, currentField = _c === void 0 ? "" : _c, _d = _a.maxDepth, maxDepth = _d === void 0 ? 1 : _d;
    /**
     * 1. Go through all fields in the object and check the values of those fields.
     *
     *  1.1.  If the value of the field is not an object.
     *    1.1.1   Define a getter that returns that value
     *            and a setter that calls a mutation commit on that value and move to the next field.
     *
     *  1.2.  If the value of the field is an object,
     *    1.2.1   Define a getter that returns that value
     *            and a setter that calls a mutation commit on that value.
     *    1.2.2.  Go back to STEP 1.
     */
    var className = cls.name.toLowerCase();
    namespacedPath = utils_1.refineNamespacedPath(namespacedPath);
    var strict = cls.prototype.__options__ && cls.prototype.__options__.strict;
    var submoduleNames = Object.keys(cls.prototype.__submodules_cache__);
    var _loop_4 = function (field) {
        var fieldIsSubmodule = submoduleNames.indexOf(field) > -1;
        var value = state[field];
        if (currentField.length && !currentField.endsWith("."))
            currentField += ".";
        var path = currentField + field;
        if (maxDepth === 0 || typeof value !== "object" || (typeof value === 'object' && !fieldIsSubmodule)) {
            if (!strict || fieldIsSubmodule) {
                Object.defineProperty(proxy, field, {
                    get: function () {
                        // When creating local proxies getters doesn't exist on that context, so we have to account
                        // for that.
                        var getters = cls.prototype.__namespacedPath__ ? ($store.rootGetters || $store.getters) : $store.getters;
                        if (getters) {
                            var getterPath = utils_1.refineNamespacedPath(cls.prototype.__namespacedPath__) + ("__" + className + "_internal_getter__");
                            return getters[getterPath](path);
                        }
                        else
                            return $store["__" + className + "_internal_getter__"](path);
                    },
                    set: function (payload) {
                        var commit = $store.commit || cls.prototype.__store_cache__.commit;
                        if (commit)
                            commit(utils_1.refineNamespacedPath(cls.prototype.__namespacedPath__) + ("__" + className + "_internal_mutator__"), { field: path, payload: payload }, { root: true });
                        else {
                            // We must be creating local proxies hence, $store.commit doesn't exist
                            var store = cls.prototype.__context_store__;
                            store.commit("__" + className + "_internal_mutator__", { field: path, payload: payload }, { root: true });
                        }
                    },
                });
            }
            else {
                Object.defineProperty(proxy, field, {
                    get: function () {
                        // When creating local proxies getters doesn't exist on that context, so we have to account
                        // for that.
                        if ($store.getters) {
                            return $store.getters[namespacedPath + ("__" + className + "_internal_getter__")](path);
                        }
                        else
                            return $store["__" + className + "_internal_getter__"](path);
                    },
                });
            }
            return "continue";
        }
        proxy[field] = {};
        createGettersAndMutationProxyFromState({
            cls: cls, proxy: proxy[field],
            state: value,
            $store: $store, namespacedPath: namespacedPath,
            currentField: currentField + field,
            maxDepth: maxDepth - 1,
        });
    };
    for (var field in state) {
        _loop_4(field);
    }
    return proxy;
}
/*
 * @deprecated
 */
function __createGettersAndMutationProxyFromState(_a) {
    var cls = _a.cls, proxy = _a.proxy, state = _a.state, $store = _a.$store, _b = _a.namespacedPath, namespacedPath = _b === void 0 ? "" : _b;
    var className = cls.name.toLowerCase();
    namespacedPath = utils_1.refineNamespacedPath(namespacedPath);
    var strict = cls.prototype.__options__ && cls.prototype.__options__.strict;
    var submoduleNames = Object.keys(cls.prototype.__submodules_cache__);
    var _loop_5 = function (field) {
        /*
         * ATTENTION
         *-----------------------------------
         * The boolean condition below is necessary for handling an edge case.
         * For some strange reason, submodules are included in the state.
         * I'm still trying to figure out why this is happening.
         * The consequence is making the proxy getter only will cause problems
         * So even if autoMutation is disabled we need to make the submodule field getter setter.
         */
        var fieldIsSubmodule = submoduleNames.indexOf(field) > -1;
        if (!strict || fieldIsSubmodule) {
            Object.defineProperty(proxy, field, {
                get: function () {
                    // When creating local proxies getters doesn't exist on that context, so we have to account
                    // for that.
                    if ($store.getters) {
                        return $store.getters[namespacedPath + ("__" + className + "_internal_getter__")](field);
                    }
                    else
                        return $store["__" + className + "_internal_getter__"](field);
                },
                set: function (payload) {
                    if ($store.commit)
                        $store.commit(namespacedPath + ("__" + className + "_internal_mutator__"), { field: field, payload: payload });
                    else {
                        // We must be creating local proxies hence, $store.commit doesn't exist
                        var store = cls.prototype.__context_store__;
                        store.commit("__" + className + "_internal_mutator__", { field: field, payload: payload }, { root: true });
                    }
                },
            });
        }
        else {
            Object.defineProperty(proxy, field, {
                get: function () {
                    // When creating local proxies getters doesn't exist on that context, so we have to account
                    // for that.
                    if ($store.getters) {
                        return $store.getters[namespacedPath + ("__" + className + "_internal_getter__")](field);
                    }
                    else
                        return $store["__" + className + "_internal_getter__"](field);
                },
            });
        }
    };
    for (var field in state) {
        _loop_5(field);
    }
    return proxy;
}
function createExplicitMutationsProxy(cls, proxy, $store, namespacedPath) {
    var mutations = cls.prototype.__mutations_cache__ && cls.prototype.__mutations_cache__.__explicit_mutations__ || {};
    var commit = cls.prototype.__store_cache__ ? cls.prototype.__store_cache__.commit : $store.commit;
    namespacedPath = utils_1.refineNamespacedPath(cls.prototype.__namespacedPath__.length ? cls.prototype.__namespacedPath__ + "/" : namespacedPath);
    var _loop_6 = function (field) {
        proxy[field] = function (payload) { return commit(namespacedPath + field, payload, { root: true }); };
    };
    for (var field in mutations) {
        _loop_6(field);
    }
}
function createGettersAndGetterMutationsProxy(_a) {
    var cls = _a.cls, getters = _a.getters, mutations = _a.mutations, proxy = _a.proxy, $store = _a.$store, namespacedPath = _a.namespacedPath;
    var getterMutations = Object.keys(cls.prototype.__mutations_cache__ && cls.prototype.__mutations_cache__.__setter_mutations__ || {});
    var className = cls.name.toLowerCase();
    // If there are defined setter mutations that do not have a corresponding getter, 
    // throw an error. 
    if ($store && $store["__" + className + "_internal_getter__"]) {
        $store["__" + className + "_internal_mutator__"] = mutations["__" + className + "_internal_mutator__"];
    }
    namespacedPath = utils_1.refineNamespacedPath(namespacedPath);
    var _loop_7 = function (field) {
        if ($store === undefined || proxy[field])
            return "continue";
        var fieldHasGetterAndMutation = getterMutations.indexOf(field) > -1;
        if (fieldHasGetterAndMutation) {
            Object.defineProperty(proxy, field, {
                get: function () {
                    var storeGetters = namespacedPath ? ($store.rootGetters || $store.getters) : $store.getters;
                    if (storeGetters)
                        return storeGetters[namespacedPath + field];
                    else
                        return $store[namespacedPath + field];
                },
                set: function (payload) { return $store.commit(namespacedPath + field, payload, { root: !!namespacedPath }); },
            });
            return "continue";
        }
        // The field has only a getter.
        if (Object.prototype.hasOwnProperty.call(proxy, field))
            return "continue";
        Object.defineProperty(proxy, field, {
            get: function () {
                var storeGetters = namespacedPath ? ($store.rootGetters || $store.getters) : $store.getters;
                if (storeGetters)
                    return storeGetters[namespacedPath + field];
                else
                    return $store[namespacedPath + field];
            }
        });
    };
    for (var field in getters) {
        _loop_7(field);
    }
}
function createActionProxy(_a) {
    var cls = _a.cls, actions = _a.actions, proxy = _a.proxy, $store = _a.$store, namespacedPath = _a.namespacedPath;
    var dispatch = cls.prototype.__store_cache__ ? cls.prototype.__store_cache__.dispatch : $store.dispatch;
    namespacedPath = utils_1.refineNamespacedPath(cls.prototype.__namespacedPath__.length ? cls.prototype.__namespacedPath__ + "/" : namespacedPath);
    var _loop_8 = function (field) {
        proxy[field] = function (payload) {
            return dispatch(namespacedPath + field, payload);
        };
    };
    for (var field in actions) {
        _loop_8(field);
    }
}
//# sourceMappingURL=proxy.js.map