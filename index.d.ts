declare module '@vikhola/content-parser' {

    import { IncomingMessage } from 'http'
    import { ListenerOptions } from '@vikhola/events'
    import { KernelEmitter, HttpRequest } from 'vikhola'

    type ContentParserStrategyOptions = {
        limit: string | number
        type: 'string' | 'buffer'
    }

    interface ContentParserStrategy {
        /**
         * The `strategy.parse()` method parses the provided source and return promise with its content.
         * 
         * @param request Request with metadata. 
         * @param source Source to parse.
         */
        parse(request: HttpRequest, source: IncomingMessage): any
    }

    export class BaseContentParserStrategy<T = Buffer | string> implements ContentParserStrategy {
        /** 
         * @param options.type The `type` parameter specifies the type of data returned by the `parse()` method. 
         * @param options.limit The `limit` parameter specifies the maximum content size that will cause an error if exceeded.
         */
        constructor(options: ContentParserStrategyOptions);
        parse(request: HttpRequest, source: IncomingMessage): Promise<T>
    }

    export class TextContentParserStrategy extends BaseContentParserStrategy<string> {
        /** 
         * @param options.limit The `limit` parameter specifies the maximum content size that will cause an error if exceeded.
         */
        constructor(options: Omit<ContentParserStrategyOptions, "type">);
        /**
         * The `strategy.parse()` method parse  the provided source as JSON and return promise with its content.
         */
        parse(request: HttpRequest, source: IncomingMessage): Promise<string>
    }

    export class JSONContentParserStrategy extends BaseContentParserStrategy<{ [key: string]: any }> {
        /** 
         * @param options.limit The `limit` parameter specifies the maximum content size that will cause an error if exceeded.
         */
        constructor(options: Omit<ContentParserStrategyOptions, "type">);
        /**
         * The `strategy.parse()` method parses the provided source and return promise with its content as a string.
         */
        parse(request: HttpRequest, source: IncomingMessage): Promise<{ [key: string]: any }>
    }

    export class ContentParser {
        /**
         * The `parser.get()` method returns the strategy associated with the passed key.
         * 
         * @param key The `Content-Type` header or corresponding to it RegExp.
         */
        get(key: string | RegExp): ContentParserStrategy
        /**
         * The `parser.set()` method binds the strategy for the passed key.
         * 
         * @param key The `Content-Type` header or corresponding to it RegExp.
         */
        set(key: string | RegExp, strategy: ContentParserStrategy): this
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
         * The `parser.parse()` method subscribes  with the provided parameters to the target `kernel.parse` event, 
         * during which parses its body using a strategy whose key matches exactly or as closely as possible the `Content-Type` of the request.
         * 
         * @param target Target to subscribe.
         * @param options The listener options.
         */
        parse(target: KernelEmitter, options: ListenerOptions): void
    }

}