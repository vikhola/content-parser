declare module '@vikhola/content-parser' {

    import { IncomingMessage } from 'http'
    import { IEventTarget } from 'vikhola/types/target'
    import { IHttpRequest } from 'vikhola/types/request'
    import { IServerParseEvent } from 'vikhola/types/events'

    type ContentParserStrategyOptions = {
        limit: string | number
        type: 'string' | 'buffer'
    }

    type DefaultContentParserStrategyOptions = {
        limit: string | number
    }

    interface IContentParserStrategy {
        /**
         * The `strategy.parse()` method parses the provided source and return promise with its content.
         * 
         * @param request Request with metadata. 
         * @param source Source to parse.
         */
        parse(request: IHttpRequest, source: IncomingMessage): any
    }

    export class ContentParserStrategy<T = Buffer | string> implements IContentParserStrategy {
        /** 
         * @param options.type The `type` parameter specifies the type of data returned by the `parse()` method. 
         * @param options.limit The `limit` parameter specifies the maximum content size that will cause an error if exceeded.
         */
        constructor(options: ContentParserStrategyOptions);
        parse(request: IHttpRequest, source: IncomingMessage): Promise<T>
    }

    export class TextContentParserStrategy extends ContentParserStrategy<string> {
        /** 
         * @param options.limit The `limit` parameter specifies the maximum content size that will cause an error if exceeded.
         */
        constructor(options: DefaultContentParserStrategyOptions);
        /**
         * The `strategy.parse()` method parse  the provided source as JSON and return promise with its content.
         */
        parse(request: IHttpRequest, source: IncomingMessage): Promise<string>
    }

    export class JSONContentParserStrategy extends ContentParserStrategy<{ [key: string]: any }> {
        /** 
         * @param options.limit The `limit` parameter specifies the maximum content size that will cause an error if exceeded.
         */
        constructor(options: DefaultContentParserStrategyOptions);
        /**
         * The `strategy.parse()` method parses the provided source and return promise with its content as a string.
         */
        parse(request: IHttpRequest, source: IncomingMessage): Promise<{ [key: string]: any }>
    }

    export class ContentParser {
        /**
         * The `parser.get()` method returns the strategy associated with the passed key.
         * 
         * @param key The `Content-Type` header or corresponding to it RegExp.
         */
        get(key: string | RegExp): IContentParserStrategy
        /**
         * The `parser.set()` method binds the strategy for the passed key.
         * 
         * @param key The `Content-Type` header or corresponding to it RegExp.
         */
        set(key: string | RegExp, strategy: IContentParserStrategy): this
        /**
         * The `parser.has()` method checks whether any strategy is associated with the passed key.
         * 
         * @param key The `Content-Type` header or corresponding to it RegExp.
         * @returns `true` if any strategy is associated with provided `key`, otherwise `false`.
         */
        has(key: string | RegExp): Boolean
        /**
         * The `parser.delete()` method remove key and bound to it strategy from the parser.
         * 
         * @param key The `Content-Type` header or corresponding to it RegExp.
         * @returns `true` if an pair has been removed, otherwise `false`.
         */
        delete(key: string | RegExp): Boolean 
        /**
         * The `parser.clear()` method removes all key-value pairs from the parser.
         */
        clear(): void
        /**
         * The `parser.parse()` method parses body of the provided event using a strategy whose key exactly or as closely as possible matches the `Content-Type` of the request.
         * 
         * @param request Request with metadata. 
         * @param source Source to parse.
         */
        parse(event: IServerParseEvent): void | Promise<void>
        /**
         * The `parser.subscribe()` method subscribes to the event target `kernel.parse` event with provided optional priority.
         * 
         * @param target Target to subscribe.
         * @param priority The listener priority.
         */
        subscribe(target: IEventTarget, priority: number): void
        /**
         * The `parser.unsubscribe()` method unsubscribes from the `kernel.parse` event.
         * 
         * @param target Target to unsubscribe.
         */
        unsubscribe(target: IEventTarget): void
    }

}