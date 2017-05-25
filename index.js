'use strict';

const MemDuplex = require('./MemDuplex.js');

const MemTransform = require('./MemTransform.js');


// function _sendMemDuplexToResponse(memDuplexes, index, response, logger){
//     // if(memDuplexes[index] === undefined){
//     //     return response.end();
//     // }
//     //
//
//     // still node issue if just simply pipe to response
//     const memDuplexOnCall = memDuplexes[index];
//     memDuplexOnCall.pipe(response)
//     // memDuplexOnCall.on('data', chunk => {
//     //     response.write(chunk);
//     // });
//     // memDuplexOnCall.on('error', () => {
//     //     logger.error('error piping data from source');
//     //     return response.end();
//     // });
//     // memDuplexOnCall.on('end', () => {
//     //     // still mem issue if just end here
//     //     return response.end();
//     //     // return process.nextTick(_sendMemDuplexToResponse,
//     //     //     memDuplexes, index + 1, response, logger);
//     // });
// }

// function _fillMemDuplex(memDuplexes, index, dataRetrievalFn, response, logger){
//     return dataRetrievalFn(memDuplexes[index].location, logger,
//         (err, readable) => {
//         if(err){
//             logger.error('failed to get full object', {
//                 error: err,
//                 method: '_fillMemDuplex',
//             });
//             return response.connection.destroy();
//         }
//         // no mem isssue if pipe directly to response
//         // readable.pipe(response);
//         //
//
//         // but still node issue with this (though a little less)
//         readable.pipe(memDuplexes[index]);
//         // if(memDuplexes[index + 2]){
//         //     readable.on('end', () => {
//         //         return process.nextTick(_fillMemDuplex, memDuplexes, index + 2,
//         //             dataRetrievalFn, response, logger);
//         //     });
//         // }
//         // readable.on('error', () => {
//         //     logger.error('error piping data from readable to memDuplex');
//         //     return response.connection.destroy();
//         // });
//     });
// }

exports.readySetStream = function readySetStream(locations, dataRetrievalFn,
    response, logger) {
    if (!logger) {
        logger = console;
    }
    if (locations.length === 0) {
        return response.end();
    }
    const memDuplexes = locations.map((location) => {
        return new MemTransform(location);
    });
    console.log("memDuplexes[0]!!!", memDuplexes[0])

    dataRetrievalFn(memDuplexes[0].location, logger,
        (err, readable) => {
        // if(err){
        //     logger.error('failed to get full object', {
        //         error: err,
        //         method: '_fillMemDuplex',
        //     });
        //     return response.connection.destroy();
        // }
        // no mem isssue if pipe directly to response
        // readable.pipe(response);
        //
        console.log("err retrieving!!", err)
        readable.pipe(memDuplexes[0]);
        memDuplexes[0].pipe(response);
        // if(memDuplexes[index + 2]){
        //     readable.on('end', () => {
        //         return process.nextTick(_fillMemDuplex, memDuplexes, index + 2,
        //             dataRetrievalFn, response, logger);
        //     });
        // }
        // readable.on('error', () => {
        //     logger.error('error piping data from readable to memDuplex');
        //     return response.connection.destroy();
        // });
    });





    // _sendMemDuplexToResponse(memDuplexes, 0, response, logger);
    // _fillMemDuplex(memDuplexes, 0, dataRetrievalFn, response, logger);
    // if (memDuplexes.length > 1){
    //     _fillMemDuplex(memDuplexes, 1, dataRetrievalFn, response, logger);
    // }
}
