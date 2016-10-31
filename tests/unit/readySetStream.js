'use strict';

const assert = require('assert');
const async = require('async');
const crypto = require('crypto');
const EventEmitter = require('events').EventEmitter;
const fs = require('fs');
const httpMocks = require('node-mocks-http');
const proc = require('child_process');
const readySetStream = require('../../index').readySetStream;


const b256KB = require("../256KB.js").b256KB;
const b1MB = Buffer.concat([b256KB, b256KB, b256KB, b256KB]);
const b10MB = Buffer.concat([b1MB, b1MB, b1MB, b1MB, b1MB, b1MB, b1MB, b1MB, b1MB, b1MB]);
const file10MBData = b10MB;
const file20MBData = new Buffer(20971520).fill('**wildcard**');
const file30MBData = Buffer.concat([b10MB, b10MB, b10MB]);
const file40MBData = new Buffer(41943040)
    .fill('Random numbers should not be generated with a method chosen at random.');

const files = {
    file10MB: file10MBData,
    file20MB: file20MBData,
    file30MB: file30MBData,
    file40MB: file40MBData,
};

function createFiles(fileNamesSizes, callback) {
    return async.forEachOf(fileNamesSizes,
        function createFile(data, name, next) {
            return fs.writeFile(name, data, next);
        },
        err => {
            assert.ifError(err);
            return callback();
        });
}

function deleteFiles(files, callback) {
    proc.spawn('rm', files).on('exit', code => {
        assert.strictEqual(code, 0);
        return callback();
    });
}

function dataRetrieval(key, logger, callback) {
    const readStream = fs.createReadStream(key);
    return callback(null, readStream);
}

function testBody(filesTested, callback) {
    let expectedHash = crypto.createHash('md5');
    filesTested.forEach(fileName => {
        expectedHash.update(`${files[fileName]}`);
    });
    expectedHash = expectedHash.digest('hex');
    const response = httpMocks.createResponse({
        eventEmitter: EventEmitter,
    });
    response.on('end', () => {
        const data = response._getData();
        const finalHash = crypto.createHash('md5')
        .update(data).digest('hex');
        assert.strictEqual(finalHash, expectedHash);
        return callback();
    });
    readySetStream(filesTested, dataRetrieval, response);
}

describe('readySetStream', () => {
    before(done => {
        createFiles(files, done);
    });

    after(done => {
        deleteFiles(Object.keys(files), done);
    });


    it('should get data that is stored in one location', done => {
        return testBody(['file10MB'], done);
    });


    it('should get data of two parts where each part is of equal ' +
        'size', done => {
        return testBody(['file10MB', 'file10MB'], done);
    });


    it('should get data of two parts where the first part is bigger ' +
        'than the second part', done => {
        return testBody(['file20MB', 'file10MB'], done);
    });


    it('should get data of two parts where the first part is much bigger ' +
        'than the second part', done => {
        return testBody(['file40MB', 'file10MB'], done);
    });


    it('should get data of two parts where the first part is smaller ' +
        'than the second part', done => {
        return testBody(['file10MB', 'file20MB'], done);
    });


    it('should get data of two parts where the first part is ' +
        'much smaller than the second part', done => {
        return testBody(['file10MB', 'file40MB'], done);
    });


    it('should get data of three parts where the size of each part is ' +
        'bigger than the previous', done => {
        return testBody(['file10MB', 'file20MB', 'file30MB'], done);
    });


    it('should get data of three parts where the size of each part is ' +
        'smaller than the previous', done => {
        return testBody(['file40MB', 'file30MB', 'file20MB'], done);
    });


    it('should get data of four parts where the size of each part is ' +
        'bigger than the previous', done => {
        return testBody(['file10MB', 'file20MB', 'file30MB', 'file40MB'], done);
    });


    it('should get data of four parts where the size of each part is ' +
        'smaller than the previous', done => {
        return testBody(['file40MB', 'file30MB', 'file20MB', 'file10MB'], done);
    });


    it('should get data of four parts with mixed part sizes', done => {
        return testBody(['file20MB', 'file10MB', 'file30MB', 'file40MB'], done);
    });


    it('should get data of five parts with mixed part sizes', done => {
        return testBody(['file20MB', 'file30MB', 'file40MB', 'file10MB',
            'file30MB'], done);
    });
});

describe('ready set stream errors', () => {
    it('should destroy connection if error retrieving data', done => {
        // No file created to retrieve so will error.
        const response = httpMocks.createResponse({
            eventEmitter: EventEmitter,
        });
        response.connection = {
            destroy: () => {
                done();
            },
        };
        response.on('end', () => {
            return done(new Error('end reached instead of destroying connection'));
        });
        readySetStream(['file10MB'], dataRetrieval, response);
    })
})
