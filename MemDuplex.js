'use strict';

const assert = require ('assert');
const Duplex = require('stream').Duplex;
const Transform = require('stream').Transform;

/**
 * Creates in memory writable and readable stream
 * @return {MemDuplex} a MemDuplex instance
 */
class MemDuplex extends Duplex {
    constructor(location) {
        // Piping to the memDuplex will pause if writableBuffer
        // exceeds this amount
        // super({ highWaterMark: 8 * 1024 * 1024 });   // 8MB
        super();
        this.buffers = [];
        this.location = location;
        this.readyToReadMore = true;
        // Once writable stream is finished it will emit a finish
        // event
        this.once('finish', () => {
            this._read();
        });
    }
    _write(chunk, enc, cb) {
        assert(Buffer.isBuffer(chunk));
        this.buffers.push(chunk);
        if (this._readableState.length <
            this._readableState.highWaterMark
            || this._readableState.needReadable) {
            this._read(this._readableState.highWaterMark);
            }
        cb();
    }
    _read() {
        // console.log("this in read!!", this)
        if (this.buffers.length > 0 && this._readableState.length < this._readableState.highWaterMark) {
            let upAtBat = this.buffers.shift();
            const pushed = this.push(upAtBat, 'binary');
            upAtBat = null;
            // if (!pushed) {
            //     break;
            // }
        }

        // finished is property of writable stream
        // indicating writing is done.
        // Once the writing is done and we have pushed
        // out everything buffered, we're done
        if (this.buffers.length === 0 && this._writableState.finished) {
            // delete this.buffers;
            console.log("this!!", this)
            this.push(null); // End of buffer
        }
    }



    // _transform(chunk, enc, cb){
    //     return cb(null, chunk);
    // }
}

module.exports = MemDuplex;

