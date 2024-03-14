# @vikhola/content-parser

# About

Provides a simple infrastructure vikhola framework module for parsing request content.

# Installation

```sh
$ npm i @vikhola/content-parser
```

# Usage

Package could be required as ES6 module 

```js
import { ContentType } from '@vikhola/content-parser'
```

Or as commonJS module.

```js
const { ContentType } = require('@vikhola/content-parser');
```

## ContentParser

To start using parser enough to initialize it and subscribe to the desirable scope of the vikhola framework. By default, parser already have several strategies and can parse requests with `application/json` and `text/plain` content types.

```js
const server = new Server();
const parser = new ContentParser();

parser.subscribe(server);

server.post('/', (request) => {
	// some logic	
});
```

Parser will parse the request body by the strategy whose key exactly or as closely as possible matches the request `Content-Type` header by its type and every parameter.

```js
parser.subscribe(server);

// POST / HTTP 1.1
// Content-Type: 'application/json; foo=bar; bar=foo'
server.post('/', (request) => {
	// some logic	
});
```

For the requests with `Content-Type` header other than `application/json` and `text/plain` the parser supports custom keys and strategies where the first ones is the `Content-Type` header or corresponding to it RegExp. 

### parser.set(key, strategy)

The `parser.set()` method binds the strategy for the passed key.

```js
const strategy = new ContentParserStrategy();

parser.set('application/xml', strategy);
```

As mention before the strategy key could be `Content-Type` header or corresponding to it RegExp.

```js
const strategy = new ContentParserStrategy();

parser.set(/^application\/xml/, strategy);
```

If the strategy key type of RegExp, parser will try to match it only if there is no strategies with a string key matching the request `Content-Type` header.

```js
const strategyOne = { parse(request, source) { return 'bar' } };
const strategyTwo = { parse(request, source) { return 'foo' } };

parser.set(/^application\/xml/, strategyOne);
parser.set('application/xml; foo=bar; bar=baz', strategyTwo);

// POST / HTTP 1.1
// Content-Type: 'application/xml; foo=bar; bar=foo'
server.post('/', (request) => {
	// print: bar
	console.log(request.body);
});
```

Another strategy key is `*`. Strategy with this key will be executed if the request has a `Content-Type` that does not match any other strategy key.

```js
const strategy = { parse(request, source) { return 'bar' } };

parser.set('*', strategy);

// POST / HTTP 1.1
// Content-Type: 'application/xml; foo=bar; bar=foo'
server.post('/', (request) => {
	// print: bar
	console.log(request.body);
});
```

There is no restriction to type of strategy, it could be any object that has `parse()` method. 

```js
const parser = new ContentParser();
const strategy = {
	parse(request, source) {
		// process data
	}
};

parser.set('application/xml', strategy);
```

### parser.has(key)

The `parser.has()` method checks whether any strategy is associated with the passed key.

```js
const strategy = new ContentParserStrategy();

// print: false
console.log(parser.has('application/xml'));

parser.set('application/xml', strategy);

// print: true
console.log(parser.has('application/xml'));
```

The method will compare the keys also by their payload, and if it is the same, `true` will be returned.

```js
const strategy = new ContentParserStrategy();

parser.set('application/xml; foo=bar; bar=foo', strategy);

// print: true
console.log(parser.has('application/xml; bar=foo; foo=bar'));
```

### parser.get(key)

The `parser.get()` method returns the strategy associated with the passed key.

```js
const strategy = new ContentParserStrategy();

parser.set('application/xml', strategy);

// print: true
console.log(parser.get('application/xml') === strategy);
```

The method will compare the keys also by their payload, and if it is the same, strategy will be returned.

```js
const strategy = new ContentParserStrategy();

parser.set('application/xml; foo=bar; bar=foo', strategy);

// print: true
console.log(parser.get('application/xml; bar=foo; foo=bar') === strategy);
```

### parser.delete(key)

The `parser.delete()` method remove key and bound to it strategy from the parser.

```js
const strategy = new ContentParserStrategy();

parser.set('application/xml', strategy);

parser.delete('application/xml');

// print: false
console.log(parser.has('application/xml'));
```

### parser.parse(event)

The `parser.parse()` method parses body of the provided event using a strategy whose key exactly or as closely as possible matches the `Content-Type` of the request.

```js
const strategy = { parse(request, source) { return 'bar' } };

parser.set('application/xml', strategy);

// Content-Type: 'application/xml'
parser.parse(event);

// print: bar
console.log(event.body);
```

### parser.clear()

The `parser.clear()` method removes all key-value pairs from the parser.

```js
const strategy = new ContentParserStrategy();

parser.set('application/xml', strategy);

parser.clear();

// print: false
console.log(parser.has('application/xml'));
```

### parser.subscribe(target[, priority])

The `parser.subscribe()` method subscribes to the event target `kernel.parse` event with provided optional priority.

```js
parser.subscribe(server, 10)
```

### parser.unsubscribe(target)

The `parser.unsubscribe()` method unsubscribes from the `kernel.parse` event.

```js
parser.unsubscribe(server)
```

## ContentParserStrategy

Except parser, module also exports a default strategy and its more specialized versions as `JSONContentParserStrategy` and `TextContentParserStrategy` which helps parse the provided request body and return a promise with its contents. The strategy accepts an optional `limit` and `type` parameters.

```js
const strategy = new ContentParserStrategy({ limit: '10mb', type: 'string' });
```

The `limit` parameter specifies the maximum content size that will cause an error if exceeded. The limit can be represented as a number of bytes or a string with a number and its units.

```js
const strategy = new ContentParserStrategy({ limit: '1mb' });
```

The `type` parameter specifies the type of data returned by the `parse()` method. It could be `buffer` or `string`. By default its equal to `buffer`. 

```js
const strategy = new ContentParserStrategy({ type: 'string' });
```

### strategy.parse(request, source)

The `strategy.parse()` method parses the provided source and return promise with its content.

```js
strategy.parse(request, source);
```

## License

[MIT](https://github.com/vikhola/content-parser/blob/main/LICENSE)