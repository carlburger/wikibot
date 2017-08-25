Wikibot
=========================

A bot for Microsoft Teams.

This bot waits for chat input and searches wikipedia for a matching page. If a page is found the abstract is parsed from the page and posted back into the chat.

If no matching page exists it uses the wikipedia search and reports back the search results.

## Terms of Service

Wikibot provides content from websites operated by Wikimedia Foundation Inc. for use in chat systems. It posts abstracts of Wikipedia content into chats if it receives chat messages which are used as search queries for Wikipedia pages.

Wikibot does not take any responsibility regarding the Wikipedia content used in its chat messages. If there are abstract paragraphs on a matching Wikipedia page these paragraphs are only processed for readability. Otherwise the content stays unchanged.

The content of Wikipedia pages is free to use and modify under the [Creative Commons Attribution-ShareAlike 3.0 Unported License](https://en.wikipedia.org/wiki/Wikipedia:Text_of_Creative_Commons_Attribution-ShareAlike_3.0_Unported_License).
For more information visit the [copyright page of Wikipedia](https://en.wikipedia.org/wiki/Wikipedia:Copyrights).


## Privacy Policy

Wikibot is owned and operated by Carl Burger. Wikibot is enabled by Microsoft Bot Framework. The Microsoft Bot Framework is a set of web-services that enable intelligent services and connections using conversation channels you authorize. As a service provider, Microsoft will transmit content you provide to our bot/service in order to enable the service. For more information about Microsoft privacy policies please see their privacy statement here: http://go.microsoft.com/fwlink/?LinkId=521839. In addition, your interactions with this bot/service are also subject to the conversational channel's applicable terms of use, privacy and data collection policies. To report abuse when using a bot that uses the Microsoft Bot Framework to Microsoft, please visit the Microsoft Bot Framework website at https://www.botframework.com and use the “Report Abuse” link in the menu to contact Microsoft.

Wikibot does not share your data with third parties. The only data Wikibot uses are your chat messages directed at Wikibot. These are sent as a search string to one of the official Wikipedia sites operated by Wikimedia Foundation Inc. The response to the search string is then parsed for an abstract paragraph which is posted back into the chat. If no direct match for the search is found Wikibot parses for suggestions and posts these back into the chat.
