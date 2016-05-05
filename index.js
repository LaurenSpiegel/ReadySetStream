'use strict';

const MemDuplex = require('./MemDuplex.js');

exports.readySetStream = function readySetStream(locations, dataRetrievalFn,
    response, logger){
        if(!logger){
            logger = console;
        }
    // If shifted all locations out of array, stop
    if (locations.length === 0) {
        return response.end();
    }
    // Take the lead item that has not yet
    // been streamed out
    const item = locations.shift();
    // Take the next item
    const nextItem = locations.shift();
    const memDuplex = new MemDuplex();
    let outerScopeNextReadable;
    if (nextItem) {
      // Get the next item from data and pipe
      // into the in-memory duplex
        dataRetrievalFn(nextItem, logger, (err, nextReadable) => {
            if (err) {
                logger.error('failed to get full object');
                return response.socket.end();
            }
            outerScopeNextReadable = nextReadable;
            nextReadable.pipe(memDuplex);
            nextReadable.on('error', () => {
                logger.error('error piping data from source');
                return response.socket.end();
            });
            // Need to listen here for the end on streaming
            // to the memDuplex in case the pipe to
            // the memDuplex finishes before the pipe
            // from the lead item to the response
            nextReadable.on('end', () => {
                memDuplex.finish = true;
            });
        });
    }
    // Get the data, pipe the lead item to the response and keep
    // the response stream open
    dataRetrievalFn(item, logger, (err, readable) => {
        if (err) {
            logger.error('failed to get full object');
            return response.socket.end();
        }
        readable.pipe(response, { end: false });
        readable.on('error', () => {
            logger.error('error piping data from source');
            return response.socket.end();
        });
        readable.on('end', () => {
            if (nextItem) {
              // Check whether the pipe from the nextItem
              // to the memDuplex already finished
                if (memDuplex.finish) {
                    // Pipe from the memDuplex to the
                    // response
                    memDuplex.pipe(response,
                        { end: false });
                    memDuplex.on('error', () => {
                        logger.error('error piping ' +
                        'data from in memory duplex');
                        return response.socket.end();
                    });
                    memDuplex.on('end', () => {
                        // Move on to the next items in the
                        // group (or get a new group if
                        // group array is now empty due to
                        // the shifts out)
                        readySetStream(locations, dataRetrievalFn,
                            response, logger);
                    });
                } else {
                    // If piping from the lead item to the
                    // response was faster than piping the
                    // nextItem to the memDuplex, wait until
                    // the nextItem has finished streaming to
                    // the memDuplex
                    outerScopeNextReadable.on('end', () => {
                        memDuplex.finish = true;
                        // Pipe from the memDuplex to the
                        // response
                        memDuplex.pipe(response,
                          { end: false });
                        memDuplex.on('error', () => {
                            logger.error('error piping data ' +
                            'from in memory duplex');
                            return response.socket.end();
                        });
                        memDuplex.on('end', () => {
                            // Move on to the next items
                            // in the group
                            readySetStream(locations, dataRetrievalFn,
                                response, logger);
                        });
                    });
                }
            } else {
                return readySetStream(locations, dataRetrievalFn,
                    response, logger);
            }
        });
    });
};