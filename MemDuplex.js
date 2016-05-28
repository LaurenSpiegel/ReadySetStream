
'use strict';

const assert = require ('assert');
const Duplex = require('stream').Duplex;

/**
 * Creates in memory writable and readable stream
 * @return {MemDuplex} a MemDuplex instance
 */
class MemDuplex extends Duplex {
    constructor() {
        super({ highWaterMark: 8 * 1024 * 1024 });   // 8MB
        this.buffers = [];
        this.cur = 0;
        // Once writable stream is finished it will emit a finish
        // event
        this.once('finish', () => {
            this._read();
        });
    }
    _write(chunk, enc, cb) {
        assert(Buffer.isBuffer(chunk));
        this.buffers.push(chunk);
        this._read();
        cb();
    }
    _read() {
        while (this.cur < this.buffers.length) {
            const pushed = this.push(this.buffers[this.cur], 'binary');
            this.cur++;
            if (!pushed) {
                break;
            }
        }
        // finished is property of writable stream
        // indicating writing is done.
        // Once the writing is done and we have pushed
        // out everything buffered, we're done
        if (this.cur >= this.buffers.length && this._writableState.finished) {
            this.push(null); // End of buffer
        }
    }
}

module.exports = MemDuplex;
