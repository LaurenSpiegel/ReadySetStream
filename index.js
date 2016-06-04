'use strict';

const MemDuplex = require('./MemDuplex.js');


function _sendMemDuplexToResponse(memDuplexes, index, response){
    if(memDuplexes[index] === undefined){
        return response.end();
    }
    const memDuplexOnCall = memDuplexes[index];
    memDuplexOnCall.on('data', chunk => {
        response.write(chunk);
    });
    memDuplexOnCall.on('error', () => {
        logger.error('error piping data from source');
        return response.socket.end();
    });
    memDuplexOnCall.on('end', () => {
        return process.nextTick(_sendMemDuplexToResponse,
            memDuplexes, index + 1, response);
    });
}

function _fillMemDuplex(memDuplexes, index, dataRetrievalFn, logger){
    return dataRetrievalFn(memDuplexes[index].location, logger, (err, readable) => {
        if(err){
            logger.error('failed to get full object');
            return response.socket.end();
        }
        readable.pipe(memDuplexes[index]);
        if(memDuplexes[index + 2]){
            readable.on('end', () => {
                return process.nextTick(_fillMemDuplex, memDuplexes, index + 2,
                    dataRetrievalFn, logger);
            });
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
    const memDuplexes = locations.map((location) => {
        return new MemDuplex(location);
    });

    _sendMemDuplexToResponse(memDuplexes, 0, response);
    _fillMemDuplex(memDuplexes, 0, dataRetrievalFn, logger);
    if (memDuplexes.length > 1){
        _fillMemDuplex(memDuplexes, 1, dataRetrievalFn, logger);
    }
}
