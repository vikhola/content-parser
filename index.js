const { ContentParser } = require('./lib/parser.js')
const { BaseContentParserStrategy, JSONContentParserStrategy, TextContentParserStrategy } = require('./lib/strats.js')

module.exports = { 
    ContentParser, 
    BaseContentParserStrategy,
    JSONContentParserStrategy,
    TextContentParserStrategy
}