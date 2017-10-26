var restify = require('restify');
var builder = require('botbuilder');
var request = require('request');
var cheerio = require('cheerio');
var wikiUrl = 'https://en.wikipedia.org';
var wikiUrlMobile = 'https://en.m.wikipedia.org';
var searchUrl = wikiUrlMobile+'/w/index.php?title=Special:Search&profile=default&fulltext=1&search=';
//=========================================================
// Bot Setup
//=========================================================

// Setup Restify Server
var server = restify.createServer();

// server.get(/\/.*/, restify.plugins.serveStatic({
// 	'directory': './public',
// 	'default': 'index.html'
// }));

server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url);
});

// Create chat bot
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});
var bot = new builder.UniversalBot(connector, [
    function (session) {
        session.send("Hi, I am wikibot!");
        session.beginDialog("searchWiki");
    }
]);

bot.dialog("searchWiki", [
    function (session, args, next) {
        if (args && args.reprompt) {
            session.dialogData.reprompt = true;
            builder.Prompts.text(session, "Which topic interests you? You can click one of the topics above or type in a new one.");
        } else {
            builder.Prompts.text(session, "Which topic interests you?");
        }
    },

    function (session, results, next) {
        session.dialogData.topic = session.message.text,
        session.dialogData.url = searchUrl+session.dialogData.topic;
        if (session.dialogData.reprompt) {
            session.send("Let me lookup the Wikipedia page... ");
        } else {
            session.send("Let me search for a matching Wikipedia page... ");
        }
        session.sendTyping();
        request(session.dialogData.url, function(err, resp, body){
            $ = cheerio.load(body);
            var link = $('.searchresults .mw-search-exists a').attr('href');
            if (link) {
                request(wikiUrlMobile+link, function(err, resp, body) {
                    $ = cheerio.load(body);
                    var text = $('#mf-section-0 p').text();
                    if (text.indexOf("may refer to:") >= 0) {
                        session.dialogData.alt = text;
                        session.dialogData.searchResults = $('#mf-section-0 ul li a');
                        next();
                    } else {
                        session.send(text);
                        session.send(wikiUrl+link);
                        session.endDialog();
                    }
                });
            } else {
                if ($('.searchdidyoumean').length) {
                    session.dialogData.dym = $('#mw-search-DYM-rewritten').text();
                }
                session.dialogData.searchResults = $('.mw-search-results li a');
                next();
            }
        });
    },

    function(session, results) {
        var links = [],
            text;
        session.dialogData.searchResults.each(function (i, e) {
            links.push($(e).attr("title"));
        });
        if (session.dialogData.alt) {
            text = session.dialogData.alt;
        } else if (session.dialogData.dym) {
            text = "Sadly I could not find any direct match. Did you maybe mean \""+session.dialogData.dym+"\"?";
        } else {
            text = "Sadly I could not find any direct match. How about these alternatives?";
        }
        session.send(text);
        var card = createThumbnailCard(session, links);
        var msg = new builder.Message(session).addAttachment(card);
        session.send(msg);
        session.replaceDialog('searchWiki', { reprompt: true });
    }
]);
server.post('/api/messages', connector.listen());


function createThumbnailCard(session, options) {
    var buttons = [];
    for (var i=0;i<options.length;i++) {
        var card = builder.CardAction.imBack(session, options[i], options[i]);
        buttons.push(card);
    }
    return new builder.ThumbnailCard(session)
        .title('Available topics')
        .subtitle('')
        .text('Click one of the available topics to get a summary.')
        .buttons(buttons);
}
