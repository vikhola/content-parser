'use strict'

const assert = require('node:assert');
const { describe, it } = require('node:test');
const { Readable } = require('stream');
const { ContentParserStrategy, TextContentParserStrategy, JSONContentParserStrategy } = require('../lib/strats.js');

const data = [ Buffer.from('t'), Buffer.from('e'), Buffer.from('s'), Buffer.from('t') ]
const strData = 'test'

class RequestMock {

    constructor(headers = {}) {
        this.contentType = headers['Content-Type']
        this.contentLength = headers['Content-Length']
    }

}

describe("ContentParserStrategy test", async function() {

    it('constuctor', function() {
        assert.throws(_ => new ContentParserStrategy({ type: "Array" }), { message: 'Strategy "type" should be "string" or "buffer".' })
        assert.doesNotThrow(_ => new ContentParserStrategy({ type: "string" }), { message: 'Strategy "type" should be "string" or "buffer".' })
        assert.doesNotThrow(_ => new ContentParserStrategy({ type: "buffer" }), { message: 'Strategy "type" should be "string" or "buffer".' })
    })

    describe('"parse" method', function() {

        it('should parse plain text body', async function() {
            const aBody = Readable.from(data)
            const aStrategy = new ContentParserStrategy({ limit: 10 })

            aBody.pause()
            aBody.on("data", (chunk) => {
                aBody.pause() 
                process.nextTick(_ => aBody.resume())
            })

            assert.deepStrictEqual(await aStrategy.parse(new RequestMock({ ['Content-Legth']: 4 }), aBody), Buffer.from(strData))
        })

        it('should parse binary body', async function() {
            const aBody = Readable.from(data)
            const aStrategy = new ContentParserStrategy({ limit: 10 })

            aBody.pause()
            aBody.on("data", (chunk) => {
                aBody.pause() 
                process.nextTick(_ => aBody.resume())
            })

            assert.deepStrictEqual(await aStrategy.parse(new RequestMock, aBody), Buffer.from(strData))
        })

        it('should parse body as string', async function() {
            const aBody = Readable.from(data)
            const aStrategy = new ContentParserStrategy({ limit: 10, type: 'string' })

            aBody.pause()
            aBody.on("data", (chunk) => {
                aBody.pause() 
                process.nextTick(_ => aBody.resume())
            })

            assert.deepStrictEqual(await aStrategy.parse(new RequestMock({ ['Content-Legth']: 4 }), aBody), strData)
        })

        it("should remove parser listeners from the request body after end", async function() {
            const aBody = Readable.from(data)
            const aStrategy = new ContentParserStrategy({ limit: 10 })

            await aStrategy.parse(new RequestMock, aBody)

            assert.deepStrictEqual(aBody.listenerCount('end'), 0)
            assert.deepStrictEqual(aBody.listenerCount('data'), 0)
            assert.deepStrictEqual(aBody.listenerCount('error'), 0)
            assert.deepStrictEqual(aBody.listenerCount('close'), 0)
        })
    
        it("should throw an Error that occurs while parsing request body", async function() {
            const anError = new Error("expected")
            const aBody = Readable.from(data)
            const aStrategy = new ContentParserStrategy()

            aBody.on("resume", _ => process.nextTick(_ => aBody.emit("error", anError)))

            await assert.rejects(_ => aStrategy.parse(new RequestMock, aBody), anError)
        })

        it('shoud throw an Error when the request was aborted while parsing', async function() {
            const aBody = Readable.from(data)
            const aStrategy = new ContentParserStrategy()

            aBody.on('resume', _ => process.nextTick(_ => aBody.emit('aborted')))

            await assert.rejects(
                _ => aStrategy.parse(new RequestMock, aBody),  
                { message: 'Request was aborted.', code: 499, content: 'Client Closed Request' }
            )
        })

        it('shoud throw an Error when the request body actual length is larger than its "Content-Length" header', async function() {
            const aBody = Readable.from(data)
            const aStrategy = new ContentParserStrategy()
            const aContentLength = 3

            await assert.rejects(
                _ => aStrategy.parse(new RequestMock({ "Content-Length": aContentLength }), aBody),  
                { message: `Content actual "${4}" size did not match to the declared "${aContentLength}" size.`, code: 400, content: 'Bad Request' }
            )
        })

        it('shoud throw an Error when the request body actual length is less than its "Content-Length" header', async function() {
            const aBody = Readable.from(data)
            const aStrategy = new ContentParserStrategy()
            const aContentLength = 10

            await assert.rejects(
                _ => aStrategy.parse(new RequestMock({ "Content-Length": aContentLength }), aBody),  
                { message: `Content actual "${4}" size did not match to the declared "${aContentLength}" size.`, code: 400, content: 'Bad Request' }
            )
        })

        it('shoud throw an Error when the request body "Content-Length" header is exceed limit', async function() {
            const aBody = Readable.from(data)
            const aStrategy = new ContentParserStrategy({ limit: 4 })
            const aContentLength = 10

            await assert.rejects(
                _ => aStrategy.parse(new RequestMock({ "Content-Length": aContentLength }), aBody),  
                { message: `Content actual "${aContentLength}" size exceed the "${4}" limit.`, code: 413, content: "Content Too Large" }
            )
        })

        it('shoud throw an Error when the request body actual length is exceed limit', async function() {
            const aBody = Readable.from(data)
            const aStrategy = new ContentParserStrategy({ limit: 3 })

            await assert.rejects(
                _ => aStrategy.parse(new RequestMock(), aBody),  
                { message: `Content actual "${4}" size exceed the "${3}" limit.`, code: 413, content: "Content Too Large" }
            )

        })

        it("should remove parser listeners from the request body after Error throw", async function() {
            const aBody = Readable.from(data)
            const aStrategy = new ContentParserStrategy()

            aBody.on("resume", _ => process.nextTick(_ => aBody.emit("error", new Error('Oops'))))

            await assert.rejects(_ => aStrategy.parse(new RequestMock(), aBody))
            assert.deepStrictEqual(aBody.listenerCount('end'), 0)
            assert.deepStrictEqual(aBody.listenerCount('data'), 0)
            assert.deepStrictEqual(aBody.listenerCount('error'), 0)
            assert.deepStrictEqual(aBody.listenerCount('close'), 0)
        })

    })

})

describe("TextContentParserStrategy test", async function() {

    describe('"parse" method', function() {

        it('should parse plain text body', async function() {
            const aBody = Readable.from(data)
            const aStrategy = new TextContentParserStrategy()

            aBody.pause()
            aBody.on("data", (chunk) => {
                aBody.pause() 
                process.nextTick(_ => aBody.resume())
            })

            assert.deepStrictEqual(await aStrategy.parse(new RequestMock, aBody), strData)
        })

        it('shoud throw an Error when the request body "Content-Length" header is exceed limit', async function() {
            const aBody = Readable.from(data)
            const aStrategy = new TextContentParserStrategy({ limit: 4 })
            const aContentLength = 10

            await assert.rejects(
                _ => aStrategy.parse(new RequestMock({ "Content-Length": aContentLength }), aBody),  
                { message: `Content actual "${aContentLength}" size exceed the "${4}" limit.`, code: 413, content: "Content Too Large" }
            )
        })

    })

})

describe("JSONContentParserStrategy test", async function() {

    describe('"parse" method', function() {

        it('should parse plain text body as json', async function() {
            const expected = { a: 2, foo: 'bar' }
            const aBody = Readable.from(JSON.stringify(expected))
            const aStrategy = new JSONContentParserStrategy()

            aBody.pause()
            aBody.on("data", (chunk) => {
                aBody.pause() 
                process.nextTick(_ => aBody.resume())
            })

            assert.deepStrictEqual(await aStrategy.parse(new RequestMock, aBody), expected)
        })

        it('shoud throw an Error when the request body "Content-Length" header is exceed limit', async function() {
            const expected = { a: 2, foo: 'bar' }
            const aBody = Readable.from(JSON.stringify(expected))
            const aStrategy = new JSONContentParserStrategy({ limit: 4 })
            const aContentLength = 10

            await assert.rejects(
                _ => aStrategy.parse(new RequestMock({ "Content-Length": aContentLength }), aBody),  
                { message: `Content actual "${aContentLength}" size exceed the "${4}" limit.`, code: 413, content: "Content Too Large" }
            )
        })

    })

})