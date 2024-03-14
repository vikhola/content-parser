'use strict'

const assert = require('node:assert');
const { describe, it } = require('node:test');
const { RegExpDictionary, ContentTypesDictionary } = require('../lib/repos.js');

class ContentParserStrategyMock {

    parse() {}

}

describe("RegExpDictionary test", function() {

    it('"size" option', function() {
        const aStrategy = new ContentParserStrategyMock()
        const aCollection = new RegExpDictionary()

        aCollection.set(/^text\/html.*/, aStrategy)
        assert.strictEqual(aCollection.size, 1)

        aCollection.set(/^application\/.+\+jsoff/, aStrategy)
        assert.strictEqual(aCollection.size, 2)
    })

    describe('"get" method', function() {

        it('should return strategy by key', function() {
            const aKey = /^application\/.+\+jsoff/
            const aStrategy = new ContentParserStrategyMock()
            const aCollection = new RegExpDictionary()

            assert.strictEqual(aCollection.get(aKey), undefined)

            aCollection.set(aKey, aStrategy)

            assert.strictEqual(aCollection.get(aKey), aStrategy)
        })

        it('should return strategy by catch all key', function() {
            const aKey = '*'
            const aStrategy = new ContentParserStrategyMock()
            const aCollection = new RegExpDictionary()

            assert.strictEqual(aCollection.get(aKey), undefined)

            aCollection.set(aKey, aStrategy)

            assert.strictEqual(aCollection.get(aKey), aStrategy)
        })
        
    })

    describe('"set" method', function() {

        it('should bind key to strategy', function() {
            const aKey = /^application\/.+\+jsoff/
            const aStrategy = new ContentParserStrategyMock()
            const aCollection = new RegExpDictionary()

            assert.strictEqual(aCollection.set(aKey, aStrategy), aCollection)
            assert.strictEqual(aCollection.get(aKey), aStrategy)
        }) 

    }) 

    describe('"has" method', function() {

        it('should check if key is binded', function() {
            const aKey = /^application\/.+\+jsoff/
            const aStrategy = new ContentParserStrategyMock()
            const aCollection = new RegExpDictionary()

            assert.strictEqual(aCollection.has(aKey), false)

            aCollection.set(aKey, aStrategy)

            assert.strictEqual(aCollection.has(aKey), true)
        })
        
    })

    describe('"find" method', function() {

        it('should return a strategy whose key matches the provided key', function() {
            const aKey = /^text\/html.*/
            const aStrategy = new ContentParserStrategyMock()
            const aCollection = new RegExpDictionary()

            assert.strictEqual(aCollection.find(aKey), undefined)

            aCollection.set(aKey, aStrategy)
            
            assert.strictEqual(aCollection.find(aKey), aStrategy)
        }) 

        it('should return a strategy whose key matches the provided Content-Type', function() {
            const aKey = /^text\/html.*/
            const aStrategy = new ContentParserStrategyMock()
            const aCollection = new RegExpDictionary()

            aCollection.set(aKey, aStrategy)
            assert.strictEqual(aCollection.find('text/html'), aStrategy)
        }) 

    })

    describe('"delete" method', function() {

        it('should delete key and its strategy', function() {
            const aKey = /^application\/.+\+jsoff/
            const aStrategy = new ContentParserStrategyMock()
            const aCollection = new RegExpDictionary()

            assert.strictEqual(aCollection.delete(aKey), false)

            aCollection.set(aKey, aStrategy)
            assert.strictEqual(aCollection.delete(aKey), true)
            assert.strictEqual(aCollection.size, 0)
        }) 

    })

})

describe("ContentTypesDictionary test", function() {

    it('"size" option', function() {
        const aStrategy = new ContentParserStrategyMock()
        const aCollection = new ContentTypesDictionary()

        aCollection.set('text/html', aStrategy)
        assert.strictEqual(aCollection.size, 1)
        
        aCollection.set('application/json', aStrategy)
        assert.strictEqual(aCollection.size, 2)
    }) 

    describe('"get" method', function() {

        it('should return strategy by key', function() {
            const contenType = 'text/html'
            const aCollection = new ContentTypesDictionary()
            const aStrategy = new ContentParserStrategyMock()

            assert.strictEqual(aCollection.get(contenType), undefined)

            aCollection.set(contenType, aStrategy)

            assert.strictEqual(aCollection.get(contenType), aStrategy)
        })

        it('should return strategy by weakly equal key', function() {
            const contenType = 'text/html; foo=bar; bar=raz'
            const aStrategy = new ContentParserStrategyMock()
            const aCollection = new ContentTypesDictionary()

            aCollection.set(contenType, aStrategy)
            assert.strictEqual(aCollection.get('text/html; bar=raz; foo=bar'), aStrategy)
        }) 
        
    })

    describe('"set" method', function() {

        it('should bind key to strategy', function() {
            const aKey = 'text/html'
            const aStrategy = new ContentParserStrategyMock()
            const aCollection = new ContentTypesDictionary()

            assert.strictEqual(aCollection.set(aKey, aStrategy), aCollection)
            assert.strictEqual(aCollection.get(aKey), aStrategy)
        }) 

        it('should be able to handle catch all strategy', function() {
            const aStrategy = new ContentParserStrategyMock()
            const aCollection = new ContentTypesDictionary()

            aCollection.set("*", aStrategy)
            for(const [key, value] of aCollection) {
                assert.strictEqual(key, '')
                assert.strictEqual(value, aStrategy)
            }
        })

        it('should throw an Error when key is empty string', function() {
            const aStrategy = new ContentParserStrategyMock()
            const aCollection = new ContentTypesDictionary()

            assert.throws(() => aCollection.set('', aStrategy))
        }) 

    }) 

    describe('"has" method', function() {

        it('should check if key is binded', function() {
            const contenType = 'text/html'
            const aCollection = new ContentTypesDictionary()
            const aStrategy = new ContentParserStrategyMock()

            assert.strictEqual(aCollection.has(contenType), false)

            aCollection.set(contenType, aStrategy)

            assert.strictEqual(aCollection.has(contenType), true)
        })

        it('should check if weaklyly equal key is binded', function() {
            const contenType = 'text/html; foo=bar; bar=raz'
            const aStrategy = new ContentParserStrategyMock()
            const aCollection = new ContentTypesDictionary()

            aCollection.set(contenType, aStrategy)
            assert.strictEqual(aCollection.has(contenType), true)
            assert.strictEqual(aCollection.has('text/html; bar=raz; foo=bar'), true)
        }) 
        
    })

    describe('"find" method', function() {

        it('must return a strategy that exactly matches the key', function() {
            const contenType = 'text/html; foo=bar; bar=raz'
            const aStrategy = new ContentParserStrategyMock()
            const aCollection = new ContentTypesDictionary()

            aCollection.set(contenType, aStrategy)
            assert.strictEqual(aCollection.find(contenType), aStrategy)
            assert.strictEqual(aCollection.find('application/jsoff'), undefined)
        }) 

        it('must return a strategy that matches the key only by type', function() {
            const contenType = 'text/html; foo=bar; bar=raz'
            const aStrategy = new ContentParserStrategyMock()
            const aCollection = new ContentTypesDictionary()

            aCollection.set('text/html', aStrategy)
            assert.strictEqual(aCollection.find(contenType), aStrategy)
            assert.strictEqual(aCollection.find('application/jsoff'), undefined)
        }) 

        it('should return a strategy that match key with parameters', function() {
            const contenType = 'text/html ; charset=utf-8 ; foo=bar '
            const aStrategy = new ContentParserStrategyMock()
            const aCollection = new ContentTypesDictionary()

            aCollection.set(contenType, aStrategy)
            assert.strictEqual(aCollection.find('text/html ; foo=bar ; charset=utf-8 '), aStrategy)
        }) 

        it('should return a strategy that match key with additional parameters', function() {
            const contenType = 'application/jsoff; foo=bar '
            const aStrategy = new ContentParserStrategyMock()
            const aCollection = new ContentTypesDictionary()

            aCollection.set(contenType, aStrategy)
            assert.strictEqual(aCollection.find('application/jsoff; foo=bar; bar=foo'), aStrategy)
        }) 

        it('should return a strategy that match most corresponding key', function() {
            const contenType = 'application/jsoff; foo=bar; bar=foo'
            const aCommonHandler = new ContentParserStrategyMock()
            const aSpecifiedHandler = new ContentParserStrategyMock()

            const aCollection = new ContentTypesDictionary()

            aCollection.set('application/jsoff', aCommonHandler)
            aCollection.set('application/jsoff; foo=bar', aCommonHandler)
            aCollection.set('application/jsoff; bar=foo; foo=bar', aSpecifiedHandler)

            assert.strictEqual(aCollection.find(contenType), aSpecifiedHandler)
        }) 
   
    })

    describe('"delete" method', function() {

        it('should delete key and its strategy', function() {
            const contenType = 'text/html; foo=bar; bar=raz'
            const aStrategy = new ContentParserStrategyMock()
            const aCollection = new ContentTypesDictionary()

            assert.strictEqual(aCollection.delete(contenType), false)
            aCollection.set(contenType, aStrategy)

            assert.strictEqual(aCollection.delete(contenType), true)
            assert.strictEqual(aCollection.size, 0)
        }) 

    })

})