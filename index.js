'use strict';

const assert = require('assert');
const stream = require('stream');
const async = require('async');

exports.readySetStream = function readySetStream(locations, dataRetrievalFn,
    response, logger) {
    if (!logger) {
        logger = console;
    }
    if (locations.length === 0) {
        return response.end();
    }
    // If only one item (left), just stream it
    if (locations.length === 1) {
        // If just sent one location, it does not need to have a key attribute
        const key = locations[0].key ? locations[0].key : locations[0];
        return dataRetrievalFn(key, logger, (err, readable) => {
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
                return response.end();
            });
        });
    }

    // Get leading two locations and remove them from locations array
    const leadTwo = locations.splice(0, 2);
    assert(leadTwo[0].key, 'Location does not have a key');
    // Prepare an in-memory duplex stream for the second item in the pair
    const memDuplex = new stream.Transform({
      transform: function(chunk, encoding, next) {
        this.push(chunk);
        next();
      },
      // 5MB
      highWaterMark: 5*1024*1024,
    });
    // Map the two locations to readable streams by opening connections with
    // the data source
    return async.map(leadTwo,
        function getReadables(item, next) {
            return dataRetrievalFn(item.key, logger, next);
        },
        function streamIt(err, results) {
            if (err || !results[0] instanceof stream.Readable ||
                !results[1] instanceof stream.Readable) {
                logger.error('failed to get full object');
                return response.socket.end();
            }
            const firstReadable = results[0];
            const nextReadable = results[1];
            // Pipe the lead item directly to the response
            firstReadable.pipe(response, { end: false });
            firstReadable.on('error', () => {
                logger.error('error piping data from source');
                return response.socket.end();
            });
            firstReadable.on('end', () => {
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
                    // Move on to the next item(s) or end
                    return process.nextTick(readySetStream, locations,
                        dataRetrievalFn, response, logger);
                });
            });
            nextReadable.pipe(memDuplex);
            nextReadable.on('error', () => {
                logger.error('error piping data from source');
                return response.socket.end();
            });
        });
};


