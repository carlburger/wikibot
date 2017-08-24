var restify = require('restify');
var builder = require('botbuilder');
var request = require('request');
var cheerio = require('cheerio');
var searchUrl = 'https://en.wikipedia.org/w/index.php?title=Spezial:Suche&profile=default&fulltext=1&search=';
var wikiUrl = 'https://en.m.wikipedia.org';
var wikiUrlFull = 'https://en.wikipedia.org';
//=========================================================
// Bot Setup
//=========================================================

// Setup Restify Server
var server = restify.createServer();

server.get(/\/.*/, restify.serveStatic({
	'directory': './public',
	'default': 'index.html'
}));

server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url);
});

// Create chat bot
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});
var bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());

//=========================================================
// Bots Dialogs
//=========================================================

bot.dialog('/', new builder.SimpleDialog(function (session, results) {
    var searchString = session.message.text,
        url = searchUrl+searchString;
    session.send("Let me search for a matching Wikipedia page... ");
    request(url, function(err, resp, body){
        $ = cheerio.load(body);
        var link = $('.searchresults .mw-search-exists a').attr('href');
        if (link) {
            url = wikiUrl+link;
            request(url, function(err, resp, body) {
                $ = cheerio.load(body);
                var text = $('#mf-section-0 p').text();
                session.send(text);
                session.send(wikiUrlFull+link);
            });
        } else {
            var searchResults = $('.mw-search-results li a'),
                links = [];
            searchResults.each(function (i, e) {
                links.push($(e).attr("title"));
            });
            
            var card = createThumbnailCard(session, links);
            var msg = new builder.Message(session).addAttachment(card);
            session.send(msg);
        }
    });
}));


function createThumbnailCard(session, options) {
    var buttons = [];
    for (var i=0;i<options.length;i++) {
        var card = builder.CardAction.imBack(session, options[i], options[i]);
        buttons.push(card);
    }
    return new builder.ThumbnailCard(session)
        .title('Wikibot')
        .subtitle('')
        .text('Sadly I could not find any direct match. How about these alternatives?')
        .buttons(buttons);
}