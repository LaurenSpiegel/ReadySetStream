
'use strict';

const assert = require ('assert');
const Duplex = require('stream').Duplex;
const Transform = require('stream').Transform;

/**
 * Creates in memory writable and readable stream
 * @return {MemTransform} a MemDuplex instance
 */
class MemTransform extends Transform {
    constructor(location) {
        // Piping to the memDuplex will pause if writableBuffer
        // exceeds this amount
        super({ highWaterMark: 8 * 1024 * 1024 });   // 8MB
        // this.buffers = [];
        this.location = location;
        // // Once writable stream is finished it will emit a finish
        // // event
        // this.once('finish', () => {
        //     this._read();
        // });
    }

    _write(chunk, encoding, cb) {
        assert(Buffer.isBuffer(chunk));
        // this.buffers.push(chunk);
        var ts = this._transformState;
        ts.writecb = cb;
        // ts.buffersIndex = this.buffers.length -1;
        // ts.writechunk = this.buffers[ts.buffersIndex];
        ts.writechunk = chunk;
        ts.writeencoding = encoding;
        if (!ts.transforming) {
            var rs = this._readableState;
            if (ts.needTransform ||
                rs.needReadable ||
                rs.length < rs.highWaterMark)
                this._read(rs.highWaterMark);
            }
        // if enable this, deviating from standard transform stream code and
        // cause memory issue. without it, no memory issue.
        ts.needTransform = true;
    }


    _transform(chunk, enc, cb){
        cb(null, chunk);
        // this._transformState.writechunk = undefined;
        // this.buffers[this._transformState.buffersIndex] = undefined;
        // gc(true);
        return;
    }

    _flush(){
        // this.buffers.length = 0;
        // gc(true);
    }

}

module.exports = MemTransform;
