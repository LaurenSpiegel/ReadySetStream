var http = require('http');

http.createServer(function (request, response) {
    console.log('request ', request.url);
    var contentType = 'application/octet-stream';
    response.writeHead(200, { 'Content-Type': contentType });
    response.end(Buffer.alloc(1073741824, 'a'), 'utf-8');

}).listen(8125);
console.log('Server running at http://127.0.0.1:8125/');