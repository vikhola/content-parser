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
        this._listeners = [ ['kernel.parse', (event) => this.parse(event)] ]
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

    parse(event) {
        let aHandler

        const aMethod = event.request.method
        const aContentType = event.request.contentType

        if(
            aMethod === 'GET' || aMethod === 'HEAD' || aContentType == null || 
            (aHandler = (this._contentTypes.find(aContentType) || this._regExps.find(aContentType) || this._contentTypes.get('*'))) == null
        ) 
            return

        const content = aHandler.parse(event.request, event.body)

        if(content != null && typeof content.then === 'function')
            return content.then(content => { event.body = content })
        else 
            event.body = content
            
    }

    subscribe(source, priority) {
        this._listeners.forEach(([event, listener]) => source.on(event, listener, { priority }))
    }

    unsubscribe(source) {
        this._listeners.forEach(([event, listener]) => source.off(event, listener))
    }


}

module.exports = { ContentParser }