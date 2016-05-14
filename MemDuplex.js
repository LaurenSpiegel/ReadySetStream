
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
        // Once writable stream is finished it will emit a finish
        // event
        this.once('finish', () => {
            this.push(null);
        });
    }
    _write(chunk, enc, cb) {
        assert(Buffer.isBuffer(chunk));
        this.push(chunk);
        cb();
    }

    // _read() function not necessary since pushing
    // into the readable directly
}

module.exports = MemDuplex;
