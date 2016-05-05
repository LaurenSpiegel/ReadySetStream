'use strict';

const assert = require ('assert');
const Duplex = require('stream').Duplex;

/**
 * Creates in memory writable and readable stream
 * @return {MemDuplex} a MemDuplex instance
 */
class MemDuplex extends Duplex {
    constructor() {
        super();
        this.buffers = [];
        this.cur = 0;
        this.finish = false;
    }
    _write(chunk, enc, cb) {
        assert(Buffer.isBuffer(chunk));
        this.buffers.push(chunk);
        cb();
    }
    _read() {
        while (this.cur < this.buffers.length) {
            this.push(this.buffers[this.cur], 'binary');
            this.cur++;
        }
        if (this.cur >= this.buffers.length && this.finish) {
            this.push(null); // End of buffer
        }
    }
}

module.exports = MemDuplex;