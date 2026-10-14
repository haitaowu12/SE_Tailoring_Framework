import test from 'node:test';
import assert from 'node:assert/strict';
import { deepClone } from '../src/utils/clone.js';

test('deepClone preserves nested JSON __proto__ keys as independent own data', () => {
    // JSON.parse creates an own property; an object-literal __proto__ does not.
    const source = JSON.parse(`{
        "__proto__": { "securityCritical": true, "nested": { "score": 4 } },
        "projectInfo": { "__proto__": { "securityCritical": true } },
        "entries": [{ "__proto__": { "status": "approved" } }]
    }`);
    const cloned = deepClone(source);

    assert.deepEqual(cloned, source);
    assert.equal(JSON.stringify(cloned), JSON.stringify(source));
    assert.deepEqual(JSON.parse(JSON.stringify(cloned)), source);
    for (const object of [cloned, cloned.projectInfo, cloned.entries[0]]) {
        assert.equal(Object.getPrototypeOf(object), Object.prototype);
        assert.equal(Object.hasOwn(object, '__proto__'), true);
        const descriptor = Object.getOwnPropertyDescriptor(object, '__proto__');
        assert.equal(descriptor.enumerable, true);
        assert.equal(descriptor.writable, true);
        assert.equal(descriptor.configurable, true);
    }
    assert.equal(cloned.securityCritical, undefined);
    assert.equal(cloned.projectInfo.securityCritical, undefined);
    assert.equal(cloned.entries[0].status, undefined);
    assert.equal(Object.prototype.securityCritical, undefined);

    cloned.__proto__.nested.score = 1;
    cloned.projectInfo.__proto__.securityCritical = false;
    cloned.entries[0].__proto__.status = 'draft';
    assert.equal(source.__proto__.nested.score, 4);
    assert.equal(source.projectInfo.__proto__.securityCritical, true);
    assert.equal(source.entries[0].__proto__.status, 'approved');
});

test('deepClone preserves every JSON value of an own __proto__ property', () => {
    for (const value of [null, false, 0, 'node', [], { nested: ['data'] }]) {
        const source = JSON.parse(`{"__proto__":${JSON.stringify(value)}}`);
        const cloned = deepClone(source);
        assert.equal(Object.getPrototypeOf(cloned), Object.prototype);
        assert.equal(Object.hasOwn(cloned, '__proto__'), true);
        assert.deepEqual(cloned.__proto__, value);
        assert.equal(JSON.stringify(cloned), JSON.stringify(source));
        if (value !== null && typeof value === 'object') {
            assert.notEqual(cloned.__proto__, source.__proto__);
        }
    }
});

test('deepClone retains ordinary JSON cloning behavior and ignores inherited properties', () => {
    const source = Object.assign(Object.create({ inherited: 'omit' }), {
        name: 'Assessment', nested: { score: 3, omitted: undefined },
        entries: [undefined, null, { score: 4 }], omitted: undefined
    });
    const cloned = deepClone(source);
    assert.deepEqual(cloned, JSON.parse(JSON.stringify(source)));
    assert.equal(Object.getPrototypeOf(cloned), Object.prototype);
    assert.equal(Object.hasOwn(cloned, 'inherited'), false);
    assert.equal(Object.hasOwn(cloned, 'omitted'), false);
    cloned.nested.score = 1;
    cloned.entries[2].score = 2;
    assert.equal(source.nested.score, 3);
    assert.equal(source.entries[2].score, 4);
});
