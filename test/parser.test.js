'use strict'

const assert = require("node:assert");
const { describe, it } = require("node:test");
const { Readable } = require('stream')
const { ContentParser } = require('../lib/parser.js')
const { ContentParserStrategy } = require("../lib/strats.js");

class EventMock {

    constructor(request, body) {
        this.body = body
        this.request = request
    }

}

class StrategyMock {

    constructor(data) {
        this.data = data
    }

    parse() {
        return this.data
    }

}

class RequestMock {

    constructor(headers = {}, method = "POST") {
        this.method = "POST"
        this.contentType = headers['Content-Type']
        this.contentLength = headers['Content-Length']
    }

}

class EventTargetMock {

    constructor() {
        this._events = { }
    }

    on(event, listener) {

        if(!this._events[event])
            this._events[event] = new Set()

        this._events[event].add(listener)
    }

    off(event, listener) {
        this._events[event].delete(listener)
    }

    emit(event, ...args) {

        if(this._events[event])
            return Promise.all([ ...this._events[event].values() ].map(listener => listener(...args)))

    }

}

describe('ContentParser test', function() {

    describe('"get" method', function() {

        it('should return strategy binded to string key', function() {
            const aKey = 'text/html'
            const aParser = new ContentParser()
            const aStrategy = new ContentParserStrategy()

            assert.strictEqual(aParser.get(aKey), undefined)
            aParser.set(aKey, aStrategy)
            assert.strictEqual(aParser.get(aKey), aStrategy)
        })

        it('should return strategy binded to weakly equal key', function() {
            const aKey = 'text/html; foo=bar; bar=raz'
            const aStrategy = new ContentParserStrategy()
            const aParser = new ContentParser()

            aParser.set(aKey, aStrategy)
            assert.strictEqual(aParser.get('text/html ; bar=raz ; foo=bar   '), aStrategy)
        }) 

        it('should return strategy binded to RegExp', function() {
            const aKey = /^application\/.+\+xml/
            const aParser = new ContentParser()
            const aStrategy = new ContentParserStrategy()

            assert.strictEqual(aParser.get(aKey), undefined)
            aParser.set(aKey, aStrategy)
            assert.strictEqual(aParser.get(aKey), aStrategy)
        })

    })

    describe('"set" method', function() {

        it('should handle string content-type', function() {
            const contentType = 'text/html; charset=utf-8; foo=bar'
            const aStrategy = new ContentParserStrategy()
            const aParser = new ContentParser()

            aParser.set(contentType, aStrategy)
            assert.strictEqual(aParser.get(contentType), aStrategy)
        })

        it('should handle regexp content-type', function() {
            const contentType = /^text\/html.*/
            const aStrategy = new ContentParserStrategy()
            const aParser = new ContentParser()

            aParser.set(contentType, aStrategy)
            assert.strictEqual(aParser.get(contentType), aStrategy)
        })

        it('should throw when content-type is invalid', function() {
            const contentType = {}
            const aStrategy = new ContentParserStrategy()
            const aParser = new ContentParser()

            assert.throws(() => aParser.set(contentType, aStrategy))
        })

        it('should be able to override strategies by key', async function() { 
            const aBody = Symbol('body')
            const aContentType = 'application/json'

            const aParser = new ContentParser()
            const aStrategy = new ContentParserStrategy()

            aParser.set(aContentType, aStrategy)
            assert.strictEqual(aParser.get(aContentType), aStrategy)
        })

    }) 

    describe('"has" method', function() {

        it('should check if string key exist', function() {
            const aKey = 'text/html'
            const aParser = new ContentParser()
            const aStrategy = new ContentParserStrategy()

            assert.strictEqual(aParser.has(aKey), false)
            aParser.set(aKey, aStrategy)
            assert.strictEqual(aParser.has(aKey), true)
        })

        it('should check if parameterized key exist', function() {
            const aKey = 'text/html; foo=bar; bar=raz'
            const aStrategy = new ContentParserStrategy()
            const aParser = new ContentParser()

            aParser.set(aKey, aStrategy)
            assert.strictEqual(aParser.has('text/html; bar=raz; foo=bar'), true)
        }) 

        it('should check if regexp key exist', function() {
            const aKey = /^application\/.+\+xml/
            const aParser = new ContentParser()
            const aStrategy = new ContentParserStrategy()

            assert.strictEqual(aParser.has(aKey), false)
            aParser.set(aKey, aStrategy)
            assert.strictEqual(aParser.has(aKey), true)
        })

    })

    describe('"delete" method', function() {

        it('should delete key and strategy', function() {
            const aKey = 'text/html; foo=bar; bar=raz'
            const aStrategy = new ContentParserStrategy()
            const aParser = new ContentParser()

            assert.strictEqual(aParser.delete(aKey), false)
            aParser.set(aKey, aStrategy)
            assert.strictEqual(aParser.delete(aKey), true)
        })
        
        it('should delete regexp key and its strategy', function() {
            const regexp = /^text\/html.*/
            const aStrategy = new ContentParserStrategy()
            const aParser = new ContentParser()

            assert.strictEqual(aParser.delete(regexp), false)
            aParser.set(regexp, aStrategy)
            assert.strictEqual(aParser.delete(regexp), true)
        }) 

        it('should throw when key is invalid', function() {
            const contentType = {}
            const aStrategy = new ContentParserStrategy()
            const aParser = new ContentParser()

            assert.throws(() => aParser.delete(contentType, aStrategy))
        })

    })

    describe('"parse" method', function() { 

        it('should not change the event body if request method is "GET" or "HEAD"', async function(t) {
            const aBody = Symbol('body')
            const aContentType = 'text/html'

            const aParser = new ContentParser()
            const aStrategy = new StrategyMock(aBody)
            const aRequest = new RequestMock({ 'Content-Type': 'application/jsoff' })
            const aEvent = new EventMock(aRequest)

            aParser.set(aContentType, aStrategy)

            aRequest.method = "GET"
            aParser.parse(aEvent)
            assert.strictEqual(aEvent.body, undefined)

            aRequest.method = "HEAD"
            aParser.parse(aEvent)
            assert.strictEqual(aEvent.body, undefined)
            
        })

        it('should not change the event body if no strategy corresponding to the "Content-Type" of the event request', async function(t) {
            const aBody = Symbol('body')
            const aContentType = 'text/html'

            const aParser = new ContentParser()
            const aStrategy = new StrategyMock(aBody)
            const aRequest = new RequestMock({ 'Content-Type': 'application/jsoff' })
            const aEvent = new EventMock(aRequest)

            aParser.set(aContentType, aStrategy)
            aParser.parse(aEvent)

            assert.strictEqual(aEvent.body, undefined)
        })

        it('should execute the strategy with a key identical to "Content-Type" of the event request', function() {
            const aBody = Symbol('body')
            const aContentType = 'text/html'

            const aParser = new ContentParser()
            const aStrategy = new StrategyMock(aBody)
            const aRequest = new RequestMock({ 'Content-Type': aContentType })
            const aEvent = new EventMock(aRequest)

            aParser.set(aContentType, aStrategy)
            aParser.parse(aEvent)

            assert.strictEqual(aEvent.body, aBody)
        }) 

        it('should execute the strategy with RegExp key that matches "Content-Type" of the event request', function() {
            const aBody = Symbol('body')
            const aContentType = 'text/html ; foo=bar ; charset=utf-8 '

            const aParser = new ContentParser()
            const aStrategy = new StrategyMock(aBody)
            const aRequest = new RequestMock({ 'Content-Type': aContentType })
            const aEvent = new EventMock(aRequest)

            aParser.set(/^text\/html.*/ , aStrategy)
            aParser.parse(aEvent)

            assert.strictEqual(aEvent.body, aBody)
        })

        it('should prioritize strategies with string key', function() {
            const aStrBody = Symbol('body')
            const aRegExpBody = Symbol('body')
            const aContenType = 'text/html ; foo=bar ; charset=utf-8 ' 

            const aParser = new ContentParser()
            const aStrStrategy = new StrategyMock(aStrBody)
            const aRegExpStrategy = new StrategyMock(aRegExpBody)
            const aRequest = new RequestMock({ 'Content-Type': aContenType })
            const aEvent = new EventMock(aRequest)

            aParser.set('text/html', aStrStrategy)
            aParser.set(/^text\/html/, aRegExpStrategy)
            aParser.parse(aEvent)

            assert.strictEqual(aEvent.body, aStrBody)
        })

        it('should parse event body by default "text/plain" strategy', async function() { 
            const aBody = 'foo: bar; a=1 blah blah'
            const aContenType = 'text/plain ; foo=bar ; charset=utf-8 ' 

            const aParser = new ContentParser()
            const aRequest = new RequestMock({ 'Content-Type': aContenType })
            const aEvent = new EventMock(aRequest, Readable.from(aBody))

            await aParser.parse(aEvent)

            assert.strictEqual(aEvent.body, aBody)
        })

        it('should get default application json content handler', async function() { 
            const aBody = { a: 1, foo: 'bar', message: 'bar' }
            const aContenType = 'application/json ; foo=bar ; charset=utf-8 '

            const aParser = new ContentParser()
            const aRequest = new RequestMock({ 'Content-Type': aContenType })
            const aEvent = new EventMock(aRequest, Readable.from(JSON.stringify(aBody)))

            await aParser.parse(aEvent)

            assert.deepStrictEqual(aEvent.body, aBody)
        })

    })

    describe('"subscribe" method', function() {

        it('should add listener to the event target', function(t) {
            const aParser = new ContentParser()
            const aTarget = new EventTargetMock()

            const aOnMock = t.mock.method(aTarget, 'on', (event, listener, { priority } = {}) => {
                assert.strictEqual(event, 'kernel.parse')
                assert.strictEqual(typeof listener, 'function')
                assert.strictEqual(priority, undefined)
            })

            aParser.subscribe(aTarget)
            assert.strictEqual(aOnMock.mock.callCount(), 1)
        })
        
        it('should add listener with provided priority to the event target', function(t) {
            const aParser = new ContentParser()
            const aTarget = new EventTargetMock()

            const aOnMock = t.mock.method(aTarget, 'on', (event, listener, { priority } = {}) => {
                assert.strictEqual(event, 'kernel.parse')
                assert.strictEqual(typeof listener, 'function')
                assert.strictEqual(priority, 10)
            })

            aParser.subscribe(aTarget, 10)
            assert.strictEqual(aOnMock.mock.callCount(), 1)
        })

    })

    describe('"unsubscribe" method', function() {

        it('should remove listener from the event target', function(t) {
            let aListener
            const aParser = new ContentParser()
            const aTarget = new EventTargetMock()

            const aOnMock = t.mock.method(aTarget, 'on', (event, listener) => {
                aListener = listener
            })

            const aOffMock = t.mock.method(aTarget, 'off', (event, listener) => {
                assert.strictEqual(event, 'kernel.parse')
                assert.strictEqual(listener, aListener)
            })

            aParser.subscribe(aTarget)
            aParser.unsubscribe(aTarget)
            assert.strictEqual(aOnMock.mock.callCount(), 1)
            assert.strictEqual(aOffMock.mock.callCount(), 1)
        })
        
    })

})