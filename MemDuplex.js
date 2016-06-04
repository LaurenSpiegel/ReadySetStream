
'use strict';

const assert = require ('assert');
const Duplex = require('stream').Duplex;

/**
 * Creates in memory writable and readable stream
 * @return {MemDuplex} a MemDuplex instance
 */
class MemDuplex extends Duplex {
    constructor(location) {
        // Piping to the memDuplex will pause if writableBuffer
        // exceeds this amount
        super({ highWaterMark: 8 * 1024 * 1024 });   // 8MB
        this.buffers = [];
        this.location = location;
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
        while (this.buffers.length > 0) {
            const pushed = this.push(this.buffers.shift(), 'binary');
            if (!pushed) {
                break;
            }
        }
        // finished is property of writable stream
        // indicating writing is done.
        // Once the writing is done and we have pushed
        // out everything buffered, we're done
        if (this.buffers.length === 0 && this._writableState.finished) {
            this.push(null); // End of buffer
        }
    }
}

module.exports = MemDuplex;
