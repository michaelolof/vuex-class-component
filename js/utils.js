export function toCamelCase(str) {
    return str[0].toLocaleLowerCase() + str.substring(1);
}
export function getClassPath(path) {
    if (!path) {
        return '';
    }
    var arr = path.split("/");
    return arr[arr.length - 1];
}
export function refineNamespacedPath(path) {
    var rtn = path.split("/").filter(function (str) { return str.trim().length > 0; }).join("/").trim();
    if (rtn.length > 0)
        return rtn + "/";
    else
        return rtn;
}
//# sourceMappingURL=utils.js.map