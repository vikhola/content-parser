'use strict'

const { ContentType } = require('@vikhola/content-type');

class ContentTypeEmptyKeyError extends Error {
    constructor() { 
        super(`Parser key is empty.`) 
    }
}

class RegExpDictionary extends Map {

    constructor() {
        super()
    }

    find(key) {
        if(super.has(key))
            return super.get(key)

        for(const regexp of this.keys())
            if(regexp.test(key))
                return super.get(regexp)
    }

}

class ContentTypesDictionary extends Map {

    constructor() {
        super()
        this._contentTypes = new Map()
    }

    get(key) {

        if(key === '*')
            return super.get('')

        if(super.has(key))
            return super.get(key)

        const aContentType = ContentType.from(key)

        for(const [ key, value ] of this._contentTypes)
            if(this._equal(value, aContentType))
                return this.get(key)

    }

    set(key, parser) {

        if(!key.length) 
            throw new ContentTypeEmptyKeyError()

        if(key === '*') 
            return super.set('', parser)

        this._contentTypes.set(key, ContentType.from(key))
        return super.set(key, parser)
    }

    has(key) {

        if(super.has(key))
            return true

        const aContentType = ContentType.from(key)

        for(const [ key, value ] of this._contentTypes)
            if(this._equal(value, aContentType))
                return true

        return false
    }

    delete(key) {
        this._contentTypes.delete(key)
        return super.delete(key)
    }

    clear() {
        this._contentTypes.clear()
        return super.clear()
    }

    find(key) {
        
        if(super.has(key))
            return super.get(key)

        let matchKey
        let matchLength = 0
        const aContentType = ContentType.from(key)

        for(const [ key, value ] of this._contentTypes) {
            const curr = this._match(value, aContentType)

            if(curr <= matchLength)
                continue;

            matchKey = key
            matchLength = curr
        }

        return super.get(matchKey)
    }

    _equal(source, target) {

        if(typeof source !== 'object' || typeof target !== 'object')
            return source === target ? true : false

        const aSourceKeys = Object.keys(source)
        const aTargetKeys = Object.keys(target)

        if(aSourceKeys.length !== aTargetKeys.length)
            return false

        return aSourceKeys.every(key => this._equal(source[key], target[key])) ? true : false

    }

    _match(source, target) {

        if(typeof source !== 'object' || typeof target !== 'object') 
            return source === target ? 1 : -1
        
        let curr
        let length = 0
        const aSourceKeys = Object.keys(source)

        for(const key of aSourceKeys)
            if((curr = this._match(source[key], target[key])) === -1)
                return -1
            else 
                length += curr
        
        return length
        
    }

}

module.exports = { RegExpDictionary, ContentTypesDictionary }
