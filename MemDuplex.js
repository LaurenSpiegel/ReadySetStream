'use strict';

const PassThrough = require('stream').PassThrough;

/**
 * Creates a PassThrough stream with a higher than usual
 * highWaterMark (default is usually 16KB)
 * @return {MemDuplex} a MemDuplex instance
 */
class MemDuplex extends PassThrough {
    constructor(location) {
        super({ highWaterMark: 2 * 1024 * 1024 });   // 2MB
        this.location = location;
    }

}

module.exports = MemDuplex;
