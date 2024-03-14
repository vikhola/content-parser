'use strict';

const { parse } = require('bytes');

class StrategyTypeError extends Error {
    constructor(expected, recieved) { 
        super(`Strategy "type" should be "string" or "buffer".`) 
    }
}

class RequestAbortedError extends Error {
    constructor(expected, recieved) { 
        super(`Request was aborted.`) 
        this.code = 499
        this.content = 'Client Closed Request'
    }
}

class BadRequestError extends Error {
    constructor(expected, recieved) { 
        super(`Content actual "${recieved}" size did not match to the declared "${expected}" size.`) 
        this.code = 400
        this.content = 'Bad Request'
    }
}

class ContenTooLargeError extends Error {
    constructor(expected, recieved) { 
        super(`Content actual "${recieved}" size exceed the "${expected}" limit.`) 
        this.code = 413
        this.content = 'Content Too Large'
    }
}

class ContentParserStrategy {

    constructor({ limit = null, type = 'buffer' } = {}) {

        if(type !== 'string' && type !== 'buffer')
            throw new StrategyTypeError()

        this._type = type
        this._limit = parse(limit)
    }

    parse(request, source) {
        let aListeners
        const asString = this._type === 'string'
        const aParserLimit = this._limit
        const aContentLength = request.contentLength

        const aParserLimitDefined = aParserLimit != null
        const aContentLengthDefined = aContentLength != null && aContentLength != 0

        if(aParserLimitDefined && aContentLength > aParserLimit)
            return Promise.reject(new ContenTooLargeError(aParserLimit, aContentLength))

        return new Promise((resolve, reject) => {
            let anOutput = asString ? "" : [] 
            let aContentActualLength = 0

            const onData = (chunk) => {

                if(aContentLengthDefined || aParserLimitDefined) {
                    const tmp = aContentActualLength + Buffer.byteLength(chunk)
        
                    if(aContentLengthDefined && (tmp > aContentLength))
                        return reject(new BadRequestError(aContentLength, tmp))
            
                    if(aParserLimitDefined && (tmp > aParserLimit))
                        return reject(new ContenTooLargeError(aParserLimit, tmp))
                        
                    aContentActualLength = tmp
                }

                asString ? 
                    anOutput += chunk :  
                    anOutput.push(chunk)
               
            }

            const onEnd = (err) => {
            
                if(err)
                    return reject(err)

                if(aContentLength && aContentLength !== aContentActualLength)
                    return reject(new BadRequestError(aContentLength, aContentActualLength))

                resolve(asString ? anOutput : Buffer.concat(anOutput))
            }


            const onAbort = _ => reject(new RequestAbortedError)
                
            aListeners = [ ['end', onEnd], ['data', onData], ['error', onEnd], ['aborted', onAbort] ]
            aListeners.forEach(listener => source.addListener(...listener))

            if(source.isPaused()) 
                source.resume()

        }).finally(
            _ => aListeners.forEach(listener => source.removeListener(...listener))
        )

    }

}

class TextContentParserStrategy extends ContentParserStrategy {

    constructor({ limit = '10mb' } = {}) {
        super({ limit, type: 'string' })
    }

    parse(request, source) {
        return super.parse(request, source)
    }

}

class JSONContentParserStrategy extends ContentParserStrategy {

    constructor({ limit = '10mb' } = {}) {
        super({ limit, type: 'string' })
    }

    parse(request, source) {
        return super.parse(request, source).then(content => JSON.parse(content))
    }

}

module.exports = { ContentParserStrategy, TextContentParserStrategy, JSONContentParserStrategy }