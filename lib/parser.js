'use strict'

const { RegExpDictionary, ContentTypesDictionary } = require('./repos.js')
const { TextContentParserStrategy, JSONContentParserStrategy } = require('./strats.js')

class ContentTypeKeyTypeError extends Error {
    constructor() { 
        super(`Parser key should be instance of "string" or regular expression.`) 
    }
}

class ContentParser {

    constructor() {
        this._regExps = new RegExpDictionary()
        this._contentTypes = new ContentTypesDictionary()
        this.set('text/plain', new TextContentParserStrategy())
        this.set('application/json', new JSONContentParserStrategy())
    }

    set(key, handler) {

        if(key instanceof RegExp)
            this._regExps.set(key, handler)

        else if(typeof key === 'string')
            this._contentTypes.set(key, handler)

        else
            throw new ContentTypeKeyTypeError()  

        return this
    }

    get(key) {
        return this._contentTypes.get(key) || this._regExps.get(key)
    }

    has(key) {
        return this._contentTypes.has(key) || this._regExps.has(key)
    }

    delete(key) {

        if(key instanceof RegExp) 
            return this._regExps.delete(key)

        else if(typeof key === 'string')
            return this._contentTypes.delete(key)

        else
            throw new ContentTypeKeyTypeError()
    }

    clear() {
        this._regExps.clear()
        this._contentTypes.clear()
    }

    parse(source, options) {
        source.on('kernel.parse', (event) => this._parse(event), options)   
    }

    async _parse(event) {
        let aStrategy

        const aMethod = event.request.method
        const aContentType = event.request.contentType

        if(
            aMethod !== 'GET' && 
            aMethod !== 'HEAD' && 
            aContentType != null && 
            (aStrategy = (this._contentTypes.find(aContentType) || this._regExps.find(aContentType) || this._contentTypes.get('*'))) != null
        ) 
            event.body = await aStrategy.parse(event.request, event.body)

    }

}

module.exports = { ContentParser }