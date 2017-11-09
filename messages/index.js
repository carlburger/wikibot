/*-----------------------------------------------------------------------------
This template demonstrates how to use Waterfalls to collect input from a user using a sequence of steps.
For a complete walkthrough of creating this type of bot see the article at
https://aka.ms/abs-node-waterfall
-----------------------------------------------------------------------------*/
"use strict";
var builder = require("botbuilder");
var botbuilder_azure = require("botbuilder-azure");
var request = require('request');
var cheerio = require("cheerio");
var path = require('path');
var wikiUrl = 'https://en.wikipedia.org';
var wikiUrlMobile = 'https://en.m.wikipedia.org';
var searchUrl = wikiUrlMobile+'/w/index.php?title=Special:Search&profile=default&fulltext=1&search=';

var useEmulator = (process.env.NODE_ENV == 'development');

var connector = useEmulator ? new builder.ChatConnector() : new botbuilder_azure.BotServiceConnector({
    appId: process.env['MicrosoftAppId'],
    appPassword: process.env['MicrosoftAppPassword'],
    stateEndpoint: process.env['BotStateEndpoint'],
    openIdMetadata: process.env['BotOpenIdMetadata']
});

var bot = new builder.UniversalBot(connector, [
    function (session) {
        session.send("Hello, I am wikibot!");
        session.beginDialog("searchWiki");
    }
]);

bot.localePath(path.join(__dirname, './locale'));

bot.dialog("searchWiki", [
    function (session, args, next) {
        if (args && args.reprompt) {
            session.dialogData.reprompt = true;
            builder.Prompts.text(session, "Which topic interests you? You can click one of the topics above or type in a new one.");
        } else if (args && args.another) {
            session.dialogData.another = true;
            builder.Prompts.text(session, "Another topic? Type 'No' to end conversation.");
        } else {
            builder.Prompts.text(session, "Which topic interests you?");
        }
    },

    function (session, results, next) {
        session.dialogData.topic = session.message.text;
        session.dialogData.url = searchUrl+session.dialogData.topic;
        if (session.dialogData.another && (session.dialogData.topic == "No" || session.dialogData.topic == "no")) {
            session.dialogData.end = true;
            next();
        }
        if (session.dialogData.reprompt) {
            session.send("Let me lookup the Wikipedia page... ");
        } else {
            session.send("Let me search for a matching Wikipedia page... ");
        }
        session.sendTyping();
        request(session.dialogData.url, function(err, resp, body){
            var $ = cheerio.load(body);
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
                        session.replaceDialog('searchWiki', { another: true });
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

    function(session, results, next) {
        if (session.dialogData.end) {
            next();
        } else {
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
    },

    function(session, results) {
        session.endConversation("Thank you for using wikibot. Goodbye.");
    }
]);

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

if (useEmulator) {
    var restify = require('restify');
    var server = restify.createServer();
    server.listen(3978, function() {
        console.log('test bot endpont at http://localhost:3978/api/messages');
    });
    server.post('/api/messages', connector.listen());
} else {
    module.exports = { default: connector.listen() }
}
