/**
 * A fast, JSON-compatible deep clone function.
 * This is meant to be a high-performance drop-in replacement for JSON.parse(JSON.stringify(value)).
 * It drops undefined values in objects and converts them to null in arrays, matching JSON.stringify.
 */
export function deepClone(value) {
    if (value === undefined) return undefined;
    if (value === null || typeof value !== 'object') return value;

    if (Array.isArray(value)) {
        const arr = new Array(value.length);
        for (let i = 0; i < value.length; i++) {
            arr[i] = value[i] === undefined ? null : deepClone(value[i]);
        }
        return arr;
    }

    // For plain objects
    const clonedObj = {};
    for (const key in value) {
        if (Object.prototype.hasOwnProperty.call(value, key)) {
            if (value[key] !== undefined) {
                clonedObj[key] = deepClone(value[key]);
            }
        }
    }
    return clonedObj;
}
