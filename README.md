![logo](readysetstream.png)

Node streaming with double buffering
------------

This lightweight module (no runtime dependencies!) speeds up the streaming of data retrieved from multiple sources.

If you have an object that is broken up into multiple parts and you have to retrieve each part and send to a response object, this module will significantly increase the speed of the response while maintaining the order of the parts.

For instance, if data was put via a multipart upload and you have to retrieve all of the parts to respond to a get request, this module allows you to easily buffer two parts in memory at a time while streaming the next required part to the response.

Installation
------------

    $ npm install --save ready-set-stream

Usage
---------------

First, import the `readySetStream` function into your program:

```javascript
import { readySetStream } from 'ready-set-stream';
```

Second, call the `readySetStream` function
with the following arguments:

    (a) an array of locations (each location serves as the first argument to your data retrieval function),
    (b) a data retrieval function which takes a location, a logger and a callback as arguments,
    (c) the response object, and
    (d) a logger object (optional)

Example
---------------

If you would like to stream a number of files in a certain order to a response object simply:

First, define your locations array with the file paths:

```javascript
    const locations = ["read me first", "i'm second", "don't forget about me!"];
```

Second, wrap the fs.createReadStream function in a function so that you can send it a location argument, a logger argument and a callback argument.

```javascript
function dataRetrievalFunction(location, logger, callback) {
    const readStream = fs.createReadStream(location);
    return callback(null, readStream);
}
```

Third, call `readySetStream` with your locations array, dataRetrievalFunction and response object as arguments.

```javascript
readySetStream(locations, dataRetrievalFunction, response);
```

Tests
------------

    $ npm install -g mocha
    $ npm test

Thanks
------
