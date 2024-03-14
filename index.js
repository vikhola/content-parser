const { ContentParser } = require('./lib/parser.js')
const { ContentParserStrategy, JSONContentParserStrategy, TextContentParserStrategy } = require('./lib/strats.js')

module.exports = { 
    ContentParser, 
    ContentParserStrategy,
    JSONContentParserStrategy,
    TextContentParserStrategy
}