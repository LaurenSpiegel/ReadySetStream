'use strict';

const MemDuplex = require('./MemDuplex.js');


function _sendMemDuplexToResponse(memDuplexes, index, errorHandlerFn,
                                  response, logger){
    if(memDuplexes[index] === undefined){
        return response.end();
    }
    const memDuplexOnCall = memDuplexes[index];
    memDuplexOnCall.on('data', chunk => {
        response.write(chunk);
    });
    memDuplexOnCall.on('error', err => {
        logger.error('error piping data from source');
        errorHandlerFn(err);
    });
    memDuplexOnCall.on('end', () => {
        return process.nextTick(_sendMemDuplexToResponse,
            memDuplexes, index + 1, errorHandlerFn, response, logger);
    });
}

function _fillMemDuplex(memDuplexes, index, dataRetrievalFn, errorHandlerFn,
                        response, logger){
    return dataRetrievalFn(memDuplexes[index].location, logger,
        (err, readable) => {
        if(err){
            logger.error('failed to get full object', {
                error: err,
                method: '_fillMemDuplex',
            });
            return errorHandlerFn(err);
        }
        readable.pipe(memDuplexes[index]);
        if(memDuplexes[index + 2]){
            readable.on('end', () => {
                return process.nextTick(_fillMemDuplex, memDuplexes, index + 2,
                    dataRetrievalFn, errorHandlerFn, response, logger);
            });
        }
        readable.on('error', err => {
            logger.error('error piping data from readable to memDuplex');
            return errorHandlerFn(err);
        });
    });
}

exports.readySetStream = function readySetStream(locations, dataRetrievalFn,
    response, logger, errorHandlerFn) {
    if (!logger) {
        logger = console;
    }
    if (locations.length === 0) {
        return response.end();
    }
    if (errorHandlerFn === undefined) {
        errorHandlerFn = err => { response.connection.destroy(); }
    }
    const memDuplexes = locations.map((location) => {
        return new MemDuplex(location);
    });

    _sendMemDuplexToResponse(memDuplexes, 0, errorHandlerFn,
                             response, logger);
    _fillMemDuplex(memDuplexes, 0, dataRetrievalFn, errorHandlerFn,
                   response, logger);
    if (memDuplexes.length > 1){
        _fillMemDuplex(memDuplexes, 1, dataRetrievalFn, errorHandlerFn,
                       response, logger);
    }
}
