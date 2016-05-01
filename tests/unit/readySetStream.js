const assert = require('assert');
const readySetStream = require('../../index').readySetStream;


describe('testing', () => {
    it('should test', () => {
        const expectedOutput = 'hello';
        assert.strictEqual('hello', expectedOutput);
    });
});