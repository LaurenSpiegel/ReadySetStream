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
    let memDuplex;
    if (nextItem) {
        memDuplex = new MemDuplex(nextItem.size);
      // Get the next item from data and pipe
      // into the in-memory duplex
        dataRetrievalFn(nextItem.key, logger, (err, nextReadable) => {
            if (err) {
                logger.error('failed to get full object');
                return response.socket.end();
            }
            nextReadable.pipe(memDuplex);
            nextReadable.on('error', () => {
                logger.error('error piping data from source');
                return response.socket.end();
            });
        });
    }
    // Get the data, pipe the lead item to the response and keep
    // the response stream open
    dataRetrievalFn(item.key, logger, (err, readable) => {
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
                    // Move on to the next items
                    // (or finish if no more locations)
                    process.nextTick(readySetStream, locations,
                        dataRetrievalFn, response, logger);
                });
            } else {
                return readySetStream(locations, dataRetrievalFn,
                    response, logger);
            }
        });
    });
};

