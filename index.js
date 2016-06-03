'use strict';

const MemDuplex = require('./MemDuplex.js');

function _getMore(locations, dataRetrievalFn, logger, memDuplex){
    return dataRetrievalFn(locations.shift(), logger, (err, readable) => {
        if(err){
            logger.error('failed to get full object');
            return response.socket.end();
        }
        if(locations.length >= 1){
            readable.pipe(memDuplex, {end: false});
            readable.on('end', () => {
                return process.nextTick(_getMore, locations,
                    dataRetrievalFn, logger, memDuplex);
            });
        } else {
            // This will call end on writable when done
            // since no {end: false} parameter
            readable.pipe(memDuplex);
        }
        readable.on('error', () => {
            logger.error('error piping data from readable to memDuplex');
            return response.socket.end();
        });
    });
}

exports.readySetStream = function readySetStream(locations, dataRetrievalFn,
    response, logger) {
    if (!logger) {
        logger = console;
    }
    if (locations.length === 0) {
        return response.end();
    }
    const memDuplex = new MemDuplex();
    memDuplex.on('data', chunk => {
        response.write(chunk);
    });
    memDuplex.on('error', () => {
        logger.error('error piping data from source');
        return response.socket.end();
    });
    memDuplex.on('end', () => {
        return response.end();
    });
    return _getMore(locations, dataRetrievalFn, logger, memDuplex);
}
