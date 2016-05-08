'use strict';

const assert = require ('assert');
const Duplex = require('stream').Duplex;

/**
 * Creates in memory writable and readable stream
 * @return {MemDuplex} a MemDuplex instance
 */
class MemDuplex extends Duplex {
    constructor(totalLength) {
        super();
        this.buffers = [];
        this.cur = 0;
        this.totalLength = totalLength;
        this.receivedLength = 0;
    }
    _write(chunk, enc, cb) {
        assert(Buffer.isBuffer(chunk));
        this.buffers.push(chunk);
        this.receivedLength += chunk.length;
        cb();
    }
    _read() {
        while (this.cur < this.buffers.length) {
            this.push(this.buffers[this.cur], 'binary');
            this.cur++;
        }
        // If do not have new data yet, push empty string
        if (this.cur >= this.buffers.length &&
            this.receivedLength < this.totalLength){
            this.push('');
        }
        if (this.cur >= this.buffers.length &&
            this.receivedLength >= this.totalLength) {
            this.push(null); // End of buffer
        }
    }
}

module.exports = MemDuplex;
