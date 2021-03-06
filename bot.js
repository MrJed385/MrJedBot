/****************************************
 * 
 *   AstralMod: Moderation bot for AstralPhaser Central and other Discord servers
 *   Copyright (C) 2017 Victor Tran and Rylan Arbour
 *
 *   This program is free software: you can redistribute it and/or modify
 *   it under the terms of the GNU General Public License as published by
 *   the Free Software Foundation, either version 3 of the License, or
 *   (at your option) any later version.
 *
 *   This program is distributed in the hope that it will be useful,
 *   but WITHOUT ANY WARRANTY; without even the implied warranty of
 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *   GNU General Public License for more details.
 *
 *   You should have received a copy of the GNU General Public License
 *   along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * 
 * *************************************/

const Discord = require('discord.js');
const api = require('./keys.js');
const fs = require('fs');
const client = new Discord.Client();

var expletiveFilter = false;
var doModeration = {};
var panicMode = {};
var lastMessages = {};
var sameMessageCount = {};
var smallMessageCount = {};
var lastUserInteraction = {};
var pendingNicks = {};
var pendingNickTimeout = {};
var suggestStates = {};
var poweroff = false;
var interrogMember = null;
var bulletinTimeout;
var runningCommands = true;
var bananaFilter = true;

var actionMember = {};
var actioningMember = {};
var actionStage = {};
var actionToPerform = {};

var dispatcher;
var connection;

process.on('unhandledRejection', function(err, p) {
    console.log("[ERROR] Unhandled Promise Rejection.");
});

function setGame() {
    var presence = {};
    presence.game = {};
    presence.status = "online";
    presence.afk = false;
    
    
    switch (Math.floor(Math.random() * 1000) % 27) {
        case 0:
            presence.game.name = "with ban buttons";
            break; //SCRUATCHO
        case 1:
            presence.game.name = "ShiftOS";
            break;
        case 2:
            presence.game.name = "Annoy Victor";
            break;
        case 3:
            presence.game.name = "with an internal bug";
            break;
        case 4:
            presence.game.name = "around";
            break;
        case 5:
            presence.game.name = "bot games";
            break;
        case 6:
            presence.game.name = "with ones and zeroes";
            break;
        case 7:
            presence.game.name = "being a stepswitcher";
            break;
        case 8:
            presence.game.name = "with supa weapon";
            break;
        case 9:
            presence.game.name = "solving puzzles";
            break;
        case 10:
            presence.game.name = "rewinding time";
            break;
        case 11:
            presence.game.name = "checking archives";
            break;
        case 12:
            presence.game.name = "being unbreakable";
            break;
        case 13:
            presence.game.name = "sandwiches";
            break;
        case 14:
            presence.game.name = "drawing pokemon";
            break;
        case 15:
            presence.game.name = "obsessing";
            break;
        case 16:
            presence.game.name = "the waiting game";
            break;
        case 17:
            presence.game.name = "bending space";
            break;
        case 18:
            presence.game.name = "with hexagons";
            break;
        case 19:
            presence.game.name = "with music";
            break;
        case 20:
            presence.game.name = "being a ninja";
            break;
        case 21:
            presence.game.name = "if money cant buy happiness then why is it so fabulous";
            break;
        case 22:
            presence.game.name = "bot:help for more info";
            break;
        case 23:
            presence.game.name = "TimeHACK";
            break;
        case 24:
            presence.game.name = "TiemHARK";
            break;
        case 25:
            presence.game.name = "harking tiem";
            break;
		case 26:
			presence.game.name = "trying to DJ";
			break;
    }
    client.user.setPresence(presence);
}

function getUserString(user) {
    var u = user;
    if (user.user != null) {
        u = user.user;
    }
    return u.username + "#" + u.discriminator;
}

function handleSuggest(message) {
    var state = suggestStates[message.author.id];
    if (state.lastEmbed != null) {
        state.lastEmbed.delete();
        state.lastEmbed = null;
    }

    if (message.content.toLowerCase() == "q") {
        //Abort
        
        var embed = new Discord.RichEmbed("test");
        embed.setAuthor("[CANCELLED]");
        embed.setColor("#FF0000");
        embed.setDescription("\u200B");
        
        var title;
        if (state.title == null) {
            title = "~~Title~~";
        } else {
            title = "~~" + state.title + "~~";
        }

        var suggestion;
        if (state.suggestion == null) {
            suggestion = "~~Suggestion~~";
        } else {
            suggestion = "~~" + state.suggestion + "~~";
        }

        embed.addField(title, suggestion);
        
        message.author.sendEmbed(embed);
        
        message.author.send(":octagonal_sign: Suggestion process cancelled.");
        state = null;
    } else {
        switch (state.state) {
            case 1: //Welcome to the suggestion tool
                if (message.content.toLowerCase() == "y") {
                    //Continue
                    state.state = 2;
                    
                    var embed = new Discord.RichEmbed("test");
                    embed.setAuthor("Suggestion");
                    embed.setColor("#00CA00");
                    embed.setDescription("\u200B");
                    
                    if (state.suggestion == null) {
                        embed.addField("__Title__\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_", "Suggestion");
                    } else {
                        embed.addField("__Title__\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_", state.suggestion);
                    }
                    
                    embed.setFooter("User ID: " + message.author.id);
                    message.author.sendEmbed(embed).then(function(message) {
                        state.lastEmbed = message;
                    });
                    
                    message.author.send("What's the title for this suggestion? It'll need to be 30 characters or less.");
                } else {
                    //Abort
                    message.author.send(":octagonal_sign: Suggestion process cancelled.");
                    state = null;
                }
                break;
            case 2: //Title
                if (message.content.length > 30) {
                    message.author.send(":no_entry_sign: Your response needs to be 30 characters or less.");
                } else if (containsExpletive(message.content)) {
                    message.author.send(":no_entry_sign: This looks like spam. And we don't like spam. Unless it's in a can. Try again, and be a bit nicer please.");
                } else if (message.content.length < 3) {
                    message.author.send(":no_entry_sign: That title seems WAY too short. Make it a bit longer, please?");
                } else {
                    state.title = message.content;
                    
                    if (state.suggestion == null) {
                        state.state = 3;
                        
                        var embed = new Discord.RichEmbed("test");
                        embed.setAuthor("Suggestion");
                        embed.setColor("#00CA00");
                        embed.setDescription("\u200B");
                        
                        embed.addField(state.title, "__Suggestion__\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_");
                        
                        message.author.sendEmbed(embed).then(function(message) {
                            state.lastEmbed = message;
                        });
                    
                        message.author.send("What is your suggestion? Be sure to be cohesive and to back your suggestion up with evidence.");
                    } else {
                        state.state = 4;

                        var embed = new Discord.RichEmbed("test");
                        embed.setAuthor("Suggestion");
                        embed.setColor("#00CA00");
                        embed.setDescription("\u200B");
                        
                        embed.addField(state.title, state.suggestion);
                        
                        message.author.sendEmbed(embed).then(function(message) {
                            state.lastEmbed = message;
                        });

                        message.author.send("Ready to submit this suggestion?");
                    }
                }
                break;
            case 3: //Suggestion
                if (message.content.length > 1000) {
                    message.author.send(":no_entry_sign: Your response needs to be 1000 characters or less.");
                } else if (containsExpletive(message.content)) {
                    message.author.send(":no_entry_sign: This looks like spam. And we don't like spam. Unless it's in a can. Try again, and be a bit nicer please.");
                } else {
                    state.suggestion = message.content;
                    state.state = 4;

                    var embed = new Discord.RichEmbed("test");
                    embed.setAuthor("Suggestion");
                    embed.setColor("#00CA00");
                    embed.setDescription("\u200B");
                    
                    embed.addField(state.title, state.suggestion);
                    
                    message.author.sendEmbed(embed).then(function(message) {
                        state.lastEmbed = message;
                    });

                    message.author.send("Ready to submit this suggestion?");
                }
                break;
            case 4: //Confirm
                if (message.content.toLowerCase().startsWith("y")) {
                    //Submit
                    var embed = new Discord.RichEmbed("test");
                    embed.setAuthor(message.author.username, message.author.displayAvatarURL);
                    embed.setColor("#00CA00");
                    
                    embed.addField(state.title, state.suggestion);
                    
                    embed.setFooter("Submitted at " + new Date().toUTCString());
                    
                    var channel;
                    if (state.guild == 277922530973581312) { //APHC
                        channel = client.channels.get("308499752993947649");
                    } else if (state.guild == 234414439330349056) { //ShiftOS
                        channel = client.channels.get("308518752557727746");
                    } else if (state.guild == 297057036292849680) { //ALA
                        channel = client.channels.get("308547573382250497");
                    }
                    
                    channel.sendEmbed(embed);
                    state = null;
                    message.author.send(":white_check_mark: OK: Your suggestion has been submitted to our staff. Thanks! :D");
                } else if (message.content.toLowerCase() == "r" || message.content.toLowerCase() == "start over" || message.content.toLowerCase() == "retry" || message.content.toLowerCase() == "start over" ||
                            message.content.toLowerCase() == "restart") {
                    state.state = 1;
                    state.suggestion = null;
                    message.author.send("**Make a suggestion**\n" +
                                        "Here's how this will work.\n\n" +
                                        "- I'll walk you through the process of creating a suggestion on the suggestions channel.\n" +
                                        "- Just respond to my prompts by typing a message in this DM and sending it.\n" +
                                        "- At any time, simply respond with `q` to cancel the suggestion.\n\n" +
                                        "However, please be aware of the following:\n" +
                                        "- Your Discord Username will be recorded and sent along with the suggestion.\n" +
                                        "- Your suggestion will be publicly visible.\n" +
                                        "- Any misuse of this command, including (but not limited to) spam will lead to appropriate discipline from staff.\n\n" +
                                        "Respond with `y` if you understood the above.");
                } else {
                    message.author.send("Sorry, I didn't quite get that. Respond with `yes` or `retry`.");
                }
                break;
        }
    }
    suggestStates[message.author.id] = state;
}

function handleAction(message) {
    var msg = message.content;
    var member = actionMember[message.guild.id];
    if (actionStage[message.guild.id] == 0) { //Select Action
        if (msg == "cancel") {
            message.channel.send(':gear: Cancelled. Exiting action menu.');
            member = null;
            actioningMember[message.guild.id] = null;
        } else if (msg.toLowerCase() == "interrogate" && message.guild.id == 277922530973581312) {
            if (message.guild.id == 277922530973581312) {
                member.addRole(member.guild.roles.get("292630494254858241"));
            } else {
                member.addRole(member.guild.roles.get("295336966285950977"));
            }
            member.setVoiceChannel(member.guild.channels.get(member.guild.afkChannelID));
            message.channel.send(':gear: ' + getUserString(member) + " has been placed in interrogation.");
            member = null;
            actioningMember[message.guild.id] = null;
        } else if (msg.toLowerCase() == "jail" && message.guild.id == 277922530973581312) {
            member.addRole(member.guild.roles.get("277942939915780099"));
            member.setVoiceChannel(member.guild.channels.get(member.guild.afkChannelID));
            message.channel.send(':gear: ' + getUserString(member) + " has been placed in jail.");
            member = null;
            actioningMember[message.guild.id] = null;
        } else if (msg.toLowerCase() == "mute" && message.guild.id == 277922530973581312) {
            member.addRole(member.guild.roles.get("294782894625390593"));
            message.channel.send(':gear: ' + getUserString(member) + " has been placed on time out.");
            member = null;
            actioningMember[message.guild.id] = null;
        } else if (msg.toLowerCase() == "kick") {
            actionStage[message.guild.id] = 1;
            message.channel.send(":gear: Enter reason for kicking " + getUserString(member) + " or `cancel`.");
            actionToPerform[message.guild.id] = "kick";
        } else if (msg.toLowerCase() == "ban") {
            actionStage[message.guild.id] = 1;
            message.channel.send(":gear: Enter reason for banning " + getUserString(member) + " or `cancel`.");
            actionToPerform[message.guild.id] = "ban";
        } else if (msg.toLowerCase() == "nick" || msg.toLowerCase == "nickname") {
            actionStage[message.guild.id] = 1;
            message.channel.send(":gear: Enter new nickname for " + getUserString(member) + ". Alternatively type `clear` or `cancel`.");
            actionToPerform[message.guild.id] = "nick";
        } else {
            message.channel.send(':gear: Unknown command. Exiting action menu.');
            member = null;
            actioningMember[message.guild.id] = null;
        }
            message.delete();
    } else if (actionStage[message.guild.id] == 1) {
        if (msg == "cancel") {
            message.channel.send(':gear: Cancelled. Exiting action menu.');
            member = null;
            actioningMember[message.guild.id] = null;
        } else if (actionToPerform[message.guild.id] == "kick") {
            member.kick(msg).then(function(member) {
                message.channel.send(':gear: ' + getUserString(member) + " has been kicked from the server.");
                member = null;
                actioningMember[message.guild.id] = null;
            }).catch(function() {
                message.channel.send(':gear: ' + getUserString(member) + " couldn't kicked from the server. Exiting action menu");
                member = null;
                actioningMember[message.guild.id] = null;
            });
        } else if (actionToPerform[message.guild.id] == "ban") {
            member.ban(msg).then(function(member) {
                message.channel.send(':gear: ' + getUserString(member) + " has been banned from the server.");
                member = null;
                actioningMember[message.guild.id] = null;
            }).catch(function() {
                message.channel.send(':gear: ' + getUserString(member) + " couldn't banned from the server. Exiting action menu");
                member = null;
                actioningMember[message.guild.id] = null;
            });
        } else if (actionToPerform[message.guild.id] == "nick") {
            if (msg == "clear") {
                msg = "";
            }
            
            member.setNickname(msg).then(function(member) {
                message.channel.send(':gear: ' + getUserString(member) + " has changed his nickname.");
                member = null;
                actioningMember[message.guild.id] = null;
            }).catch(function() {
                message.channel.send(':gear: ' + getUserString(member) + " couldn't have his nickname changed. Exiting action menu");
                member = null;
                actioningMember[message.guild.id] = null;
            });
        }
        message.delete();
    }
    actionMember[message.guild.id] = member;
}

function playAudio() {
    dispatcher = connection.playFile("forecastvoice.mp3");
    dispatcher.on('end', playAudio);
}

client.on('ready', () => {
    console.log("[STATUS] AstralMod is now ready!");
    client.setInterval(setGame, 300000);
    setGame();
    
    //Jump into waiting room
    client.channels.get("235803958822699010").join().then(function(conn) {
        console.log("[STATUS] AstralMod is connected to the ready to play room, please tell your staff not to move it");
        connection = conn;
        playAudio();
    });
});

function nickExpletiveCheck(phrase) {
	if (containsExpletive(phrase)) return true;
	
	var exp = phrase.search(/(hentai|asl|a55|ass|anal|ballsack|bong|cocaine|cum|dick|dp|pedo|pube|rape|scat|semen|testes|tits|anus|arse|bitch|b1tch|b17ch|boob|cock|foreskin|hardon|jerk)+/i);

	if (exp == -1) {
		return false;
	} else {
		return true;
	}
}

function containsExpletive(phrase) {
    var exp = phrase.search(/(shit|shite|shitty|bullshit|fuck|fucking|ass|penis|cunt|faggot|damn|wank|wanker|nigger|bastard|shut up|piss|vagina|thisisnotarealwordbutatestword)+/i);
    
    if (exp == -1) {
        return false;
    } else {
        return true;
    }
}

function getBoshyTime(guild) {
    if (guild.emojis.exists('name', 'vtBoshyTime')) {
        return "<:vtBoshyTime:" + guild.emojis.find('name', 'vtBoshyTime').id + ">";
    } else { 
        return ":warning:";
    }
}

function isMod(member) {
    if (member.roles.find("name", "Admin") || member.roles.find("name", "Moderator") || member.roles.find("name", "Super Admin") || member.roles.find("name", "Head Admin") || member.roles.find("name", "Super Head Admin") || member.roles.find("name", "Co-Owner") || member.roles.find("name", "Trial Moderator") || member.roles.find("name","Owner")) {
        return true;
    } else {
        return false;
    }
}

//var prank = true;

function postBulletin() {
    var channel = client.channels.get("308576038324142081");
    
    switch (Math.floor(Math.random() * 1000) % 6) {
        case 0:
            channel.send("<:vtBoshyTime:280178631886635008> PING! Don't forget, the **no expletive** rule is now in effect. Thanks!");
            break;
        case 1:
            channel.send("<:vtBoshyTime:280178631886635008> PING! If you missed out, don't forget to check out the AstralPhaser channel for a review of the chat!");
            break;
        case 2:
            channel.send("<:vtBoshyTime:280178631886635008> PING! Thanks for coming to the chat everyone!");
            break;
        case 3:
            channel.send("<:vtBoshyTime:280178631886635008> PING! Welcome to AstralPhaser Central!");
            break;
        case 4:
            channel.send("<:vtBoshyTime:280178631886635008> PING! For anyone who asks: we're not doing rotations!");
            break;
        case 5:
            channel.send("<:vtBoshyTime:280178631886635008> PING! Hip Hip Hooray for the mods!");
            break;
    }
}

function handleDM(message) {
    if (suggestStates[message.author.id] != null) {
        handleSuggest(message);
        return;
    } else {
        var msg = message.content;
        var command = msg;
        if (msg.toLowerCase().startsWith("mod:") || msg.toLowerCase().startsWith("bot:")) {
            command = msg.substr(4);
        }
    }
}

function messageChecker(oldMessage, newMessage) {
    var message;
    if (newMessage == null) {
        message = oldMessage;
    } else {
        message = newMessage;
    }
    var msg = message.content;
    
    if (message.guild == null) {
        handleDM(message);
        return;
    }
    
    if (!runningCommands) {
        if ((message.author.id == 114465624821989376) && msg == "mod:cmd") {
            runningCommands = true;
            message.reply(':white_check_mark: OK: AstralMod commands have been enabled.');
        }
        return;
    }
    
    if (actioningMember[message.guild.id] == message.author) {
        handleAction(message);
    }
    
    if (doModeration[message.guild.id] == null) {
        if (message.guild.id == 140241956843290625) { //Check if this is the test server
            doModeration[message.guild.id] = false;
        } else {
            doModeration[message.guild.id] = true;
        }
    }
    
    if (panicMode[message.guild.id] == null) {
        panicMode[message.guild.id] = false;
    }
    
    if (panicMode[message.guild.id]) {
        if (msg == "mod:panic" && (message.member.roles.find("name", "Co-Owner")  || message.member.roles.find("name", "Super Head Admin") || message.member.roles.find("name","Owner"))) {
            message.channel.send(':rotating_light: Panic mode is now off.');
            panicMode[message.guild.id] = false;
            console.log("[STATUS] Panic off.");
            message.delete();
            return;
        }
        message.delete();
    }
    
    if (msg == "mod:banana" && (message.author.id == 135169858689171456 || message.author.id == 278805875978928128)) {
        bananaFilter = !bananaFilter;
        if (bananaFilter) {
            message.reply(":white_check_mark: Banana filter is now on.");
            message.delete();
        } else {
            message.reply(":white_check_mark: Banana filter is now off.");
            message.delete();
        }
    } else {
        if (message.author.id == 135169858689171456 && bananaFilter) {
            if (message.attachments != null) {
                var block = false;
                for (let [key, attachment] of message.attachments) {
                    if (attachment.height != null) {
                        block = true;
                        break;
                    }
                }
                
                if (block) {
                    message.reply("Nope.");
                    message.delete();
                    return;
                }
            }
        }
    }
    
    if (!isMod(message.member) && msg.indexOf("@everyone") != -1 && message.guild.id == 277922530973581312) {
        message.reply("Nice try... but we disabled that.");
    }
    
    if (message.author.id != 280495817901473793 && !message.author.bot) {
        //Server Detection:
        //AstralPhaser Central: 277922530973581312
        //Michael's Stuff     : 234414439330349056
        //AKidFromTheUK       : 285740807854751754

        if (doModeration[message.guild.id]) { //Check if we should do moderation on this server
            if ((expletiveFilter && message.guild.id == 277922530973581312 && message.channel.id == 308576038324142081) || message.guild.id == 278824407743463424) { //Check for expletives only if on AstralPhaser Central or theShell
                //Check for expletives
                var exp;
                if (containsExpletive(msg)) { //Gah! They're not supposed to say that!
                    console.log("[FILTER] Expletive caught from " + getUserString(message.author));
                    switch (Math.floor(Math.random() * 1000) % 7) {
                        case 0:
                            message.reply("I'm very disappointed in you. This is me <:angryvt:282006699802361856>");
                            break;
                        case 1:
                            message.reply("Hey! Let's not have any of that please.");
                            break;
                        case 2:
                            message.reply("Did you just...");
                            break;
                        case 3:
                            message.reply("Cool. Now let's not forget the rules.");
                            break;
                        case 4:
                            message.reply("If I'm not going to delete it, a mod will. Let's save them some work.");
                            break;
                        case 5:
                            message.reply("Hey! That was a swear! No!");
                            break;
                        case 6:
                            message.reply("This situation calls for some passive resistance!");
                            break;
                    }
                    
                    message.delete();
                    return;
                }
                
                
                //Continue only if on AstralPhaser
                if (message.guild.id == 277922530973581312 && message.channel.id == 308576038324142081) {
                    //Check for links
                    
                    if (message.member != null && !(message.member.roles.find("name", "Patron Tier 5ive") || message.member.roles.find("name", "Patron Tier 2wo") || message.member.roles.find("name", "Patron Tier 3hree") ||message.member.roles.find("name", "Patron Tier 4our"))) {
                        exp = msg.search(/(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/i);
                        if (exp != -1) { //This is a link.
                        console.log("[FILTER] Link caught from " + getUserString(message.author));
                            switch (Math.floor(Math.random() * 1000) % 6) {
                                case 0:
                                    message.reply("I've replaced your link with a not-so-link-like link: click here");
                                    break;
                                case 1:
                                    message.reply("Whatever that link was... I hope it didn't contain some bad stuff...");
                                    break;
                                case 2:
                                    message.reply("Did you just...");
                                    break;
                                case 3:
                                    message.reply("Cool. Now let's not forget the rules.");
                                    break;
                                case 4:
                                    message.reply("If I'm not going to delete it, a mod will. Let's save them some work.");
                                    break;
                                case 5:
                                    message.reply("We don't want to download your FREE RAM.");
                                    break;
                            }
                            
                            message.delete();
                            return;
                        }
                    }
                    
                    //Check for images.
                    //Other attachments are ok.
                    if (message.attachments != null) {
                        var block = false;
                        for (let [key, attachment] of message.attachments) {
                            if (attachment.height != null) {
                                block = true;
                                break;
                            }
                        }
                        
                        if (block) {
                            console.log("[FILTER] Image caught from " + getUserString(message.author));
                            switch (Math.floor(Math.random() * 1000) % 5) {
                                case 0:
                                    message.reply("A picture says a thousand words. That picture said about fifteen words. These exact words.");
                                    break;
                                case 1:
                                    message.reply("Let's not make all the other things disappear...");
                                    break;
                                case 2:
                                    message.reply("Did you just...");
                                    break;
                                case 3:
                                    message.reply("Cool. Now let's not forget the rules.");
                                    break;
                                case 4:
                                    message.reply("If I'm not going to delete it, a mod will. Let's save them some work.");
                                    break;
                            }
                            message.delete();
                            return;
                        }
                    }
                    
                    //Check for caps
                    if (msg.match(/[A-Z]/gm) != null && msg.match(/[A-Z]/gm).length > (parseFloat(msg.length) * 0.8)) {
                        console.log("[FILTER] Caps caught from " + getUserString(message.author));
                        switch (Math.floor(Math.random() * 1000) % 6) {
                            case 0:
                                message.reply("Shh...");
                                break;
                            case 1:
                                message.reply("The community likes peace and quiet.");
                                break;
                            case 2:
                                message.reply("Isn't it weird when you're reading... and then you see a bunch of caps?");
                                break;
                            case 3:
                                message.reply("If you're going to type that, why not get out a pen and paper and do it yourself?");
                                break;
                            case 4:
                                message.reply("DON'T SHOUT IN HERE K");
                                break;
                            case 5:
                                message.reply("Whoa whoa, slow down, my friend! No need for raised voices!");
                                break;
                        }
                        message.delete();
                        return;
                    }
                }
            }
            
            //Universal friendly checks:
            //BotWarnings:
            //AstralPhaser Central: 282513354118004747
            //ShiftOS             : 282513112257658880
            //theShell            : 283184634400079872
            if (message.author.id != 282048599574052864 && msg.search(/\b(kys|kill yourself)\b/i) != -1) {
                var auth = message.author;
                if (message.guild.id == 201976968261009408) { //AstralPhaser
                    client.channels.get("255265100766773249").sendMessage(":red_circle: " + getUserString(auth) + " \"kys\" <#" + message.channel.id + ">.");
                } else if (message.guild.id == 234414439330349056) { //ShiftOS
                    client.channels.get("282513112257658880").sendMessage(":red_circle: " + getUserString(auth) + " \"kys\" <#" + message.channel.id + ">.");
                } else if (message.guild.id == 278824407743463424) { //theShell {
                    client.channels.get("283184634400079872").sendMessage(":red_circle: " + getUserString(auth) + " \"kys\" <#" + message.channel.id + ">.");
                } else if (message.guild.id == 281066689892974592) { //LE
                    client.channels.get("288272065109295104").sendMessage(":red_circle: " + getUserString(auth) + " \"kys\" <#" + message.channel.id + ">.");
                } else if (message.guild.id == 297057036292849680) { //ALA
                    client.channels.get("297762292823490570").sendmessage(":red_circle: " + getUserString(auth) + " \"kys\" <#" + message.channel.id + ">.");
                }
                message.reply("Right. We don't appreciate that here. (A notification has been sent to the mods.)");
                message.delete();
            }
        }
        
        if (message.mentions != null && message.mentions.users != null) {
            if (message.mentions.users.has("318421324534120448")) {
                if (message.author.id == 114465624821989376) {
                    message.reply("BEGONE. You called my creator mean. :sob:");
                } else {
                    if (msg.toLowerCase().includes("jxbot")) {
                        message.reply(":no_entry_sign: YA MENTIONED THE INFERIOR BOT. [punches hand and shakes head slowly]");
                    } else if (msg.toLowerCase().includes("stop") || (msg.toLowerCase().includes("shut") && msg.toLowerCase().includes("up"))) {
                        
                        switch (Math.floor(Math.random() * 1000) % 3) {
                            case 0:
                                message.reply(":no_entry_sign: NO: I shall talk as much as I like.");
                                break;
                            case 1:
                                message.reply(":no_entry_sign: NO: You shu... I'd better not say that actually");
                                break;
                            case 2:
                                message.reply(":no_entry_sign: NO: Just no.");
                                break;
                        }
                    } else if (msg.toLowerCase().includes("fuck you") || msg.toLowerCase().includes("fuck off") || msg.toLowerCase().includes("shit") || msg.toLowerCase().includes("stfu") ) {
                        message.reply("Want a :hammer:?");
                    } else if (msg.toLowerCase().includes("how") && msg.toLowerCase().includes("you")) {
                        message.reply("I'm doing OK I suppose.");
                    } else if (msg.toLowerCase().includes("yes") || msg.toLowerCase().includes("yep") || msg.toLowerCase().includes("right?") || msg.toLowerCase().includes("isn't it?")) {
                        message.reply("Well, I suppose so.");
                    } else if (msg.toLowerCase().includes("no") || msg.toLowerCase().includes("nope")) {
                        message.reply("I guess not.");
                    } else if (msg.toLowerCase().includes("?")) {
                        switch (Math.floor(Math.random() * 1000) % 4) {
                            case 0:
                                message.reply("Erm... Maybe? I dunno.");
                                break;
                            case 1:
                                message.reply("Consider this a polite dodge of the question.");
                                break;
                            case 2:
                                message.reply("I see someone is interested in seeing how I respond to a question.");
                                break;
                            case 3:
                                message.reply("Sausages.");
                                break;
                        }
                    } else if (msg.toLowerCase().includes("hello") || msg.toLowerCase().includes("hi")) {
                        message.reply("Is it me you're looking for?");
                    } else if (msg.toLowerCase().includes("i") && (msg.toLowerCase().includes("love") || msg.toLowerCase().includes(":heart:") || msg.toLowerCase().includes("<3"))) {
                        message.reply("Aww! Thanks! :heart:");
                    }
                }
            }
        }
        
        var commandProcessed = false;
        if (msg.toLowerCase().startsWith("mod:") || msg.toLowerCase().startsWith("bot:")) {
            var command = msg.substr(4);
            switch (command) {
                case "ping":
                    switch (Math.floor(Math.random() * 1000) % 5) {
                        case 0:
                            message.channel.send(getBoshyTime(message.guild) + ' PONG! I want to play pong too... :\'(');
                            break;
                        case 1:
                            message.channel.send(getBoshyTime(message.guild) + ' PONG! I love playing pong!'); 
                            break;
                        case 2:
                            message.channel.send(getBoshyTime(message.guild) + ' PONG! Thanks for playing pong with me!');
                            break;
                        case 3:
                            message.channel.send(getBoshyTime(message.guild) + ' PONG! Reflect upon this!');
                            break;
                        case 4:
                            message.channel.send(getBoshyTime(message.guild) + ' PONG!');
                            break;
                    }
                    commandProcessed = true;
                    break;
                case "pong":
                    switch (Math.floor(Math.random() * 1000) % 5) {
                        case 0:
                            message.channel.send(getBoshyTime(message.guild) + ' PING! Pings are also cool!');
                            break;
                        case 1:
                            message.channel.send(getBoshyTime(message.guild) + ' PING! Do you like playing pong?'); 
                            break;
                        case 2:
                            message.channel.send(getBoshyTime(message.guild) + ' PING! Here\'s the test message you wanted!');
                            break;
                        case 3:
                            message.channel.send(getBoshyTime(message.guild) + ' PING! I tried to save this server from pollution before it was cool!');
                            break;
                        case 4:
                            message.channel.send(getBoshyTime(message.guild) + ' PING!');
                            break;
                    }
                    commandProcessed = true;
                    break;
                case "time":
                    var localtime = new Date();
                    localtime.setTime(localtime.getTime() + (60*60*1000)); 
                    message.channel.send(':arrow_forward: The time now is ' + localtime.toUTCString());
                    message.delete();
                    commandProcessed = true;
                    break;
                case "help":
                    message.channel.send(
                        "Here are some things you can try:\n```\n" +
                        "time   [tz]       Gets the time at UTC +00:00.\n" + 
                        "                  Useful for checking jail time.\n" +
                        "                  PARAMETER 1 (OPTIONAL)\n" + 
                        "                  A timezone to query, for example, +10 or -5.\n\n" +
                        "suggest           Starts the suggestion process.\n" +
                        "about             Tells you about AstralMod\n" + 
                        "copyright         Tells you about AstralMod\n" + 
                        "license           Tells you about AstralMod\n" + 
                        "warranty          Tells you about AstralMod\n\n" + 
                        "ping|pong         Asks AstralMod to reply with a message\n\n" +
                        "These commands need to be prefixed with bot:\n" +
                        "```")
                    break;
                case "about":
                case "license":
                    message.author.sendMessage(
                        "AstralMod - Copyright © Victor Tran and Rylan Arbour 2017. Licensed under the GNU General Public License, version 3 (or any later version). For more info, type in bot:copyright in a channel with AstralMod.\n" +
                        "https://github.com/vicr123/AstralMod"
                    );
                    commandProcessed = true;
                    break;
                case "copyright":
                    message.author.sendMessage(
                        "Copyright (C) 2017 Victor Tran and Rylan Arbour\n\n" +

                        "This program is free software: you can redistribute it and/or modify\n" +
                        "it under the terms of the GNU General Public License as published by\n" +
                        "the Free Software Foundation, either version 3 of the License, or\n" +
                        "(at your option) any later version.\n\n" +
                        
                        "This program is distributed in the hope that it will be useful,\n" +
                        "but WITHOUT ANY WARRANTY; without even the implied warranty of\n" +
                        "MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the\n" +
                        "GNU General Public License for more details.\n\n" +

                        "You should have received a copy of the GNU General Public License\n" +
                        "along with this program.  If not, see <http://www.gnu.org/licenses/>"
                    );
                    commandProcessed = true;
                    break;
                case "warranty":
                    message.author.sendMessage(
                        "This program is distributed in the hope that it will be useful,\n" +
                        "but WITHOUT ANY WARRANTY; without even the implied warranty of\n" +
                        "MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the\n" +
                        "GNU General Public License for more details.\n"
                    );
                    commandProcessed = true;
                    break;
                case "honeyfry":
                case "honeyfries":
                    if (message.guild.id == 277922530973581312) {
                        message.channel.send('<:honeyfry:291805507428286475> The verdict is YES. GO HONEYFRIES! WOO!\nDon\'t you dare react with a negative emoji Stefan. *I\'m watching you...*');
                    } else {
                        message.channel.send(':no_entry_sign: Honeyfries have nothing to do with this server. Carry on...');
                    }
                    message.delete();
                    commandProcessed = true;
                    break;
                case "crayeeggs":
                    message.reply("You know that craye eggs has been banished?");
                    message.delete();
                    commandProcessed = true;
                    break;
                case "braces":
                    message.reply("On the same line my dear honeyfry. ```cpp\nvoid abc() {\n}```");
                    commandProcessed = true;
                    break;
                case "uptime":
                    message.reply(":clock1: AstralMod has been up for " + parseInt(client.uptime) + " milliseconds.");
                    commandProcessed = true;
                    break;
                case "suggest":
                    if (message.guild.id == 277922530973581312 || message.guild.id == 234414439330349056 || message.guild.id == 297057036292849680) {
                        suggestStates[message.author.id] = {};
                        suggestStates[message.author.id].state = 1;
                        suggestStates[message.author.id].guild = message.guild.id;
                        
                        message.reply(":arrow_left: Continue in DMs.");
                        message.author.send("**Make a suggestion**\n" +
                                            "Here's how this will work.\n\n" +
                                            "- I'll walk you through the process of creating a suggestion on the suggestions channel.\n" +
                                            "- Just respond to my prompts by typing a message in this DM and sending it.\n" +
                                            "- At any time, simply respond with `q` to cancel the suggestion.\n\n" +
                                            "However, please be aware of the following:\n" +
                                            "- Your Discord Username will be recorded and sent along with the suggestion.\n" +
                                            "- Your suggestion will be publicly visible.\n" +
                                            "- Any misuse of this command, including (but not limited to) spam will lead to appropriate discipline from staff.\n\n" +
                                            "Respond with `y` if you understood the above.");
                    } else {
                        message.reply(":no_entry_sign: ERROR: Suggestions are not accepted on this server via AstralMod. Speak directly to an admin to suggest something.");
                    }
                    message.delete();
                    commandProcessed = true;
                    break;
                default:
                    if (command.startsWith("time")) {
                            command = command.substr(5);

                            var hours;

                            switch (command.toLowerCase()) {
                                case "nzdt":
                                case "auckland":
                                case "christchurch":
                                case "new zealand":
                                case "nz":
                                    hours = +12;
                                    break;
                                case "aedt":
                                    hours = +11;
                                    break;
                                case "sydney":
                                case "canberra":
                                case "vicr":
                                case "kkg":
                                case "phil":
                                    hours = +10;
                                    break;
                                case "aest:":
                                    hours = +10;
                                    break;
                                case "acdt":
                                    hours = +10.5;
                                    break;
                                case "adelaide":
                                case "aedt":
                                    hours = +9.5;
                                    break;
                                case "sgt":
                                case "singapore":
                                    hours = +8;
                                    break;
                                case "sotiris":
                                    hours = +3;
                                    break;
                                case "alpha":
                                case "amsterdam":
                                case "jason":
                                case "berlin":
                                    hours = +2;
                                    break;
                                case "london":
                                case "uk":
                                case "jed":
                                case "letsexploreleader":
                                case "gmt":
                                    hours = +1;
                                    break;
                                case "utc":
                                    hours = 0;
                                    break;
                                case "ndt":
                                    hours = -2.5
                                    break;
                                case "brt":
                                case "vrabble":
                                case "vrabbers":
                                    hours = -3;
                                    break;
                                case "nst":
                                    hours = -3.5;
                                    break;
                                case "edt":
                                case "neb":
                                case "nebble":
                                case "new york":
                                case "lemp":
                                    hours = -4;
                                    break;
                                case "est":
                                case "cdt":
                                case "wisconsin":
                                case "texas":
                                case "dallas":
                                case "fort worth":
                                case "austin":
                                case "houston":
                                case "united":
                                        hours = -5;
                                        break;
                                case "cst":
                                case "mdt":
                                case "alkesta":
                                case "alk":
                                        hours = -6;
                                        break;
                                case "mst":
                                case "pdt":
                                case "arizona":
                                case "seattle":
                                        hours = -7;
                                        break;
                                case "pst":
                                        hours = -8;
                                        break;
                                default:
                                        hours = parseFloat(command);
                                        command = "UTC " + command + ":00";
                            }

                            if (hours > -14 && hours < 14) {
                                    var localtime = new Date();
                                    var date = new Date(localtime.valueOf() + (localtime.getTimezoneOffset() + hours * 60) * 60000);
                                    var dateString = date.toString();
                                    if (dateString == "Invalid Date") {
                                            message.channel.send(":no_entry_sign: ERROR: That ain't a valid timezone, my honeyfry. Don't try to confuse me... *or else...*");
                                    } else {
                                            dateString = dateString.substring(0, dateString.lastIndexOf(" "));
                                            dateString = dateString.substring(0, dateString.lastIndexOf(" "));
                                            message.channel.send(':arrow_forward: The time now at ' + command + ' is ' + dateString);
                                    }
                            } else {
                                    message.channel.send(":no_entry_sign: ERROR: That ain't a valid timezone, my honeyfry. Don't try to confuse me... *or else...*");
                            }
                            message.delete();
                            commandProcessed = true;
                    } else if (command.startsWith("attack") && (message.guild.id != 277922530973581312 && message.guild.id != 234414439330349056)) {
                            command = command.substr(7);
                            if (command.indexOf("@everyone") == -1) {
                                    if (command.indexOf("@here") == -1) {
                                            message.channel.send("<@" + message.author.id + "> :right_facing_fist: " + command);
                                    } else {
                                            message.reply("Nice try, but I ain't going to interrupt everyone who is online at this time. Kinda nice to not be bothered.");
                                    }
                            } else {
                                    message.reply("Nice try, but I ain't going to interrupt everyone. Kinda nice to not be bothered.");
                            }
                            commandProcessed = true;
                    } else if (command.startsWith("suggest")) {
                            command = command.substr(8);
                            if (message.guild.id == 277922530973581312 || message.guild.id == 234414439330349056) {
                                    suggestStates[message.author.id] = {};
                                    suggestStates[message.author.id].state = 1;
                                    suggestStates[message.author.id].guild = message.guild.id;
                                    suggestStates[message.author.id].suggestion = command;

                                    message.reply(":arrow_left: Continue in DMs.");
                                    message.author.send("**Make a suggestion**\n" +
                                            "Here's how this will work.\n\n" +
                                            "- I'll walk you through the process of creating a suggestion on the suggestions channel.\n" +
                                            "- Just respond to my prompts by typing a message in this DM and sending it.\n" +
                                            "- At any time, simply respond with `q` to cancel the suggestion.\n\n" +
                                            "However, please be aware of the following:\n" +
                                            "- Your Discord Username will be recorded and sent along with the suggestion.\n" +
                                            "- Your suggestion will be publicly visible.\n" +
                                            "- Any misuse of this command, including (but not limited to) spam will lead to appropriate discipline from staff.\n\n" +
                                            "Respond with `y` if you understood the above.");
                            } else {
                                    message.reply(":no_entry_sign: ERROR: Suggestions are not accepted on this server via AstralMod. Speak directly to an admin to suggest something.");
                            }
                            message.delete();
                            commandProcessed = true;
                    } else if (command.startsWith("clock")) {
                            command = command.substr(6);

                            var indexOfSpace = command.indexOf(" ");
                            var minutes;
                            if (indexOfSpace == -1) {
                                    minutes = parseFloat(command);
                                    var ms = minutes * 60000;

                                    if (ms <= 0) {
                                            message.channel.send(":no_entry_sign: ERROR: Yeah... timers don't go for 0 seconds or less.");
                                    } else if (isNaN(ms) || ms == Infinity || ms == -Infinity) {
                                            message.channel.send(":no_entry_sign: ERROR: Yeah nice try, but I don't break that easily.");
                                    } else if (ms > 86400000) {
                                            message.channel.send(":no_entry_sign: ERROR: Ain't one day enough for ya? I'm not a timekeeper ok? One day is already pushing it...");
                                    } else {
                                            var timeout = setTimeout(function () {
                                                    var msg = "<@" + message.author.id + "> :alarm_clock: Time's up! No description was provided.";

                                                    var mentions = "\nThese people were also mentioned: ";
                                                    var count = 0;
                                                    for (let [id, user] of message.mentions.users) {
                                                            count++;
                                                            mentions += "<@" + id + "> ";
                                                    }

                                                    if (count > 0) {
                                                            msg += mentions;
                                                    }

                                                    if (isMod(message.member)) {
                                                            message.channel.send(msg);
                                                    } else {
                                                            message.author.sendMessage(msg);
                                                    }
                                            }, ms);

                                            if (isMod(message.member)) {
                                                    message.channel.send(":white_check_mark: OK: I will ping <@" + message.author.id + "> in " + minutes + " minutes (" + ms / 1000 + " seconds).");
                                            } else {
                                                    message.channel.send(":white_check_mark: OK: I will DM <@" + message.author.id + "> in " + minutes + " minutes (" + ms / 1000 + " seconds).");
                                            }
                                    }
                            } else {
                                    minutes = parseFloat(command.substring(0, indexOfSpace));
                                    var reminder = command.substring(indexOfSpace + 1);
                                    var ms = minutes * 60000;

                                    if (ms <= 0) {
                                            message.channel.send(":no_entry_sign: ERROR: Yeah... timers don't go for 0 seconds or less.");
                                    } else if (isNaN(ms) || ms == Infinity || ms == -Infinity) {
                                            message.channel.send(":no_entry_sign: ERROR: Yeah nice try, but I don't break that easily.");
                                    } else if (ms > 86400000) {
                                            message.channel.send(":no_entry_sign: ERROR: Ain't one day enough for ya? I'm not a timekeeper ok? One day is already pushing it...");
                                    } else {
                                            var timeout = setTimeout(function () {
                                                    var msg = "<@" + message.author.id + "> :alarm_clock: Time's up: `" + reminder + "`";

                                                    var mentions = "\nThese people were also mentioned: ";
                                                    var count = 0;
                                                    for (let [id, user] of message.mentions.users) {
                                                            count++;
                                                            mentions += "<@" + id + "> ";
                                                    }

                                                    if (count > 0) {
                                                            msg += mentions;
                                                    }

                                                    if (isMod(message.member)) {
                                                            message.channel.send(msg);
                                                    } else {
                                                            message.author.sendMessage(msg);
                                                    }
                                            }, ms);

                                            if (isMod(message.member)) {
                                                    message.channel.send(":white_check_mark: OK: I will ping <@" + message.author.id + "> in " + minutes + " minutes (" + ms / 1000 + " seconds) to `" + reminder + "`.");
                                            } else {
                                                    message.channel.send(":white_check_mark: OK: I will DM <@" + message.author.id + "> in " + minutes + " minutes (" + ms / 1000 + " seconds) to `" + reminder + "`.");
                                            }
                                    }
                                    commandProcessed = true;
                            }
                    } else if (command.startsWith("nick")) {
                            command = command.substr(5);
                            if (message.guild.id == 277922530973581312) {

                                    if (pendingNickTimeout[message.author.id] == null) {
                                            pendingNickTimeout[message.author.id] = new Date().getTime() - 3600000;
                                    }

                                    if (new Date().getTime() > pendingNickTimeout[message.author.id]) {
                                            pendingNickTimeout[message.author.id] = new Date().getTime() + 3600000;

                                            if (nickExpletiveCheck(command)) {
                                                    message.channel.send(":no_entry_sign: NO: Preliminary nickname checks failed. Wait an hour and then choose a more... erm... *sensible* nickname please.");
                                            } else if (command.length >= 32) {
                                                    message.channel.send(":no_entry_sign: NO: Nicknames need to be less than 32 characters. Wait an hour and then try again.");
                                            } else {
                                                    var nick = command;
                                                    message.channel.send(":white_check_mark: OK: Preliminary nickname checks passed. Your nickname will be changed in 5 minutes if the mods agree with it.");

                                                    pendingNicks[message.author.id] = setTimeout(function () {
                                                            message.member.setNickname(nick);
                                                            pendingNicks[message.author.id] = null;
                                                    }, 300000, null);
                                                    client.channels.get("277923386959855626").sendMessage("<@" + message.author.id + "> is changing his nickname to `" + nick + "`. Type `mod:declnick " + message.author.id + "` to cancel this.");
                                            }
                                    } else {
                                            message.channel.send(":no_entry_sign: NO: Cool down. You'll need to wait an hour between each change. Ask a mod if you absolutely must have your nickname change *now.*");
                                    }
                            } else {
                                    message.reply(':no_entry_sign: ERROR: Unable to use that command in this server.');
                            }
                            commandProcessed = true;
                    }
            }
        } 
        
        if (msg.toLowerCase().startsWith("mod:") && !commandProcessed) {
            //Check for moderator/admin permission
            
            //Moderator ID: 282068037664768001
            //Admin ID:     282068065619804160
            if (isMod(message.member)) { //Thanks Aren! :D
                var command = msg.substr(4);
                switch (command) {
                    case "filter":
                        if (message.guild.id != 277922530973581312) {
                            message.reply(':no_entry_sign: ERROR: Unable to use that command in this server.');
                        } else {
                            if (expletiveFilter) {
                                message.channel.send(':arrow_forward: Expletive Filter: on');
                            } else {
                                message.channel.send(':arrow_forward: Expletive Filter: off');
                            }
                            message.delete();
                        }
                        break;
                    case "filter on":
                        if (message.guild.id != 277922530973581312) {
                            message.reply(':no_entry_sign: ERROR: Unable to use that command in this server.');
                        } else {
                            if (expletiveFilter) {
                                message.channel.send(':arrow_forward: Expletive Filter is already on.');
                            } else {
                                expletiveFilter = true;
                                message.channel.send(':white_check_mark: Expletive Filter is now turned on.');
                                console.log("[Status] Expletive filter on");
                                bulletinTimeout = client.setInterval(postBulletin, 60000);
                            }
                            message.delete();
                        }
                        break;
                    case "filter off":
                        if (message.guild.id != 277922530973581312) {
                            message.reply(':no_entry_sign: ERROR: Unable to use that command in this server.');
                        } else {
                            if (expletiveFilter) {
                                expletiveFilter = false;
                                message.channel.send(':white_check_mark: Expletive Filter is now turned off.');
                                console.log("[Status] Expletive filter off");
                                client.clearInterval(bulletinTimeout);
                            } else {
                                message.channel.send(':arrow_forward: Expletive Filter is already off.');
                            }
                            message.delete();
                        }
                        break;
                    case "mod":
                        if (doModeration[message.guild.id]) {
                            message.channel.send(':arrow_forward: Moderation: on');
                        } else {
                            message.channel.send(':arrow_forward: Moderation: off');
                        }
                        message.delete();
                        break;
                    case "mod on":
                        if (doModeration[message.guild.id]) {
                            message.channel.send(':arrow_forward: Moderation is already on.');
                        } else {
                            doModeration[message.guild.id] = true;
                            message.channel.send(':white_check_mark: Moderation is now turned on.');
                                console.log("[STATUS] Moderation on");
                        }
                        message.delete();
                        break;
                    case "mod off":
                        if (doModeration[message.guild.id]) {
                            doModeration[message.guild.id] = false;
                            message.channel.send(':white_check_mark: Moderation is now turned off. All messages on this server, spam, profane or whatever will be allowed through.');
                            console.log("[STATUS] Moderation off");
                        } else {
                            message.channel.send(':arrow_forward: Moderation is already off.');
                        }
                        message.delete();
                        break;
                    case "panic":
                        if (message.member.roles.find("name", "Co-Owner") || message.member.roles.find("name", "Super Head Admin") || message.member.roles.find("name","Owner")) {
                            message.channel.send(':rotating_light: Panic mode is now on. All message sending for this server has been turned off.').then(function() {
                                panicMode[message.guild.id] = true;
                            });
                            console.log("[STATUS] Panic on");
                            message.delete();
                        } else {
                            message.reply(':no_entry_sign: NO: This is an co-owner/super head admin only command.');
                            message.delete();
                        }
                        break;
                    case "fetch":
                        message.reply("Give me a minute...").then(function(newMessage, messageArray) {
                            message.guild.fetchMembers().then(function() {
                                message.reply(":white_check_mark: All members for this guild fetched.");
                                newMessage.delete();
                            }).catch(function() {
                                message.reply(":no_entry_sign: Something didn't work.");
                                newMessage.delete();
                            });
                        });
                        message.delete();
                        break;
                    case "help":
                        var helpMessage = "And here are the mod only commands:\n```\n" +
                            "mod    [on|off]   Queries moderation status.\n" +
                            "                  PARAMETER 1 (OPTIONAL)\n" + 
                            "                  Type on to start moderating the server.\n" +
                            "                  Type off to stop moderating the server.\n\n";
                            
                        if (message.guild.id == 201976968261009408) {
                        helpMessage = helpMessage + 
                            "filter [on|off]   Queries the chat filter.\n" +
                            "                  PARAMETER 1 (OPTIONAL)\n" + 
                            "                  Type on to set the filter on.\n" +
                            "                  Type off to set the filter off.\n\n" +
                            "deal user         Walks through the process of dealing\n" +
                            "                  with an unruly member\n";
                        }
                            
                        helpMessage = helpMessage + 
                            "rm num            Deletes a number of messages.\n" +
                            "                  PARAMETER 1\n" +
                            "                  Number of messages to delete.\n\n" +
                            "uinfo user        Gets information about a user.\n" +
                            "                  PARAMETER 1\n" +
                            "                  User ID. This can be obtained with the\n" +
                            "                  rtid command.\n\n" +
                            "rtid user         Gets a user's user ID.\n" +
                            "                  PARAMETER 1\n" +
                            "                  Username of the user to find.\n\n" +
                            "clock min [rem]   Sets a timer. This cannot be cancelled.\n" +
                            "                  PARAMETER 1\n" +
                            "                  Number of minutes to set the timer for.\n" +
                            "                  PARAMETER 2 (OPTIONAL)\n" +
                            "                  Reminder to be sent with the message.\n\n" +
                            "panic       -     Toggles panic mode.\n" +
                            "interrogate       Places the newest member of the server into interrogation.\n" +
                            "cancel            Cancels a pending operation.\n" +
                            "help              Prints this help message.\n" +
                            "\n" +
                            "- denotes an admin only command\n" +
                            "These commands need to be prefixed with mod:\n" +
                            "```";
                            
                        message.channel.send(helpMessage);
                        break;
                    case "cmd":
                        if (message.author.id == 278805875978928128 || message.author.id == 175760550070845451 || message.author.id == 209829628796338176) {
                            runningCommands = false;
                            message.reply(':white_check_mark: OK: AstralMod commands have been stopped in all servers, and moderation has been turned off in all servers.');
                        } else {
                            message.reply(':no_entry_sign: NO: Only 3 special people are allowed to use this command. To turn off moderation, use `mod:mod off`.');
                        }
                        break;
                    case "cancel":
                        if (poweroff) {
                            poweroff = false;
                            message.channel.send(':white_check_mark: OK, I won\'t leave... yet.')
                        } else {
                            message.reply(':no_entry_sign: ERROR: Nothing to cancel.');
                        }
                        message.delete();
                        break;
                    case "banterrogate":
                        if (message.guild.id != 277922530973581312 && message.guild.id != 234414439330349056) {
                            message.reply(':no_entry_sign: ERROR: Unable to use that command in this server.');
                        } else {
                            if (interrogMember == null) {
                                message.reply(':no_entry_sign: ERROR: No user to banterrogate. See mod:help for more information.');
                            } else {
                                if (interrogMember.guild.id == 277922530973581312) {
                                    interrogMember.sendMessage("You seem to be someone that has been making alts. If you're not, then to appeal, get in touch with vicr123#5096. Sorry about the kick. We've had to do this because of a special someone trying to break the rules.");
                                    interrogMember.ban();
                                    message.channel.send(':white_check_mark: OK: User has been banterrogated!');
                                    interrogMember = null;
                                } else {
                                    message.reply(':no_entry_sign: ERROR: No user to interrogate. See mod:help for more information.');
                                }
                            }
                        }
                        message.delete();
                        break;
					default:
						if (command.startsWith("uinfo")) {
							command = command.substr(6);
							command = command.replace("<", "").replace(">", "").replace("@", "").replace("!", "");

							message.guild.fetchMember(command).then(function (member) {
								embed = new Discord.RichEmbed("test");
								embed.setAuthor(getUserString(member), member.user.displayAvatarURL);
								embed.setColor("#FF0000");
								embed.setDescription("User Information");

								{
									var msg = "**Created** " + member.user.createdAt.toUTCString() + "\n";
									if (member.joinedAt.getTime() == 0) {
										msg += "**Joined** -∞... and beyond! Discord seems to be giving incorrect info... :(";
									} else {
										msg += "**Joined** " + member.joinedAt.toUTCString();
									}

									embed.addField("Timestamps", msg);
								}

								{
									var msg = "**Current Display Name** " + member.displayName + "\n";
									msg += "**Username** " + member.user.username + "\n";
									if (member.nickname != null) {
										msg += "**Nickname** " + member.nickname;
									} else {
										msg += "**Nickname** No nickname";
									}

									embed.addField("Names", msg);
								}

                                /*if (member.lastMessageID != null) {
                                    var lastMessage = null;
                                    
                                    message.channel.fetchMessage(member.lastMessage).then(function(retrievedMessage) {
                                        lastMessage = retrievedMessage;
                                    }).catch(function () {
                                        lastMessage = -1;
                                    });
                                    
                                    while (lastMessage == null) {}
                                    
                                    if (lastMessage != -1) {
                                        var msg = "**ID** " + member.lastMessageID + "\n";
                                        msg += "**Contents** " + lastMessage.content;
                                        
                                        embed.addField("Last Message", msg);
                                    }
                                }*/

								embed.setFooter("User ID: " + member.user.id);
								//embed.setDescription(msg);
								message.channel.sendEmbed(embed);

								lastUserInteraction[message.guild.id] = command;
							}).catch(function (reason) {
								switch (Math.floor(Math.random() * 1000) % 3) {
									case 0:
										message.channel.send(':no_entry_sign: ERROR: That didn\'t work. You might want to try again.');
										break;
									case 1:
										message.channel.send(':no_entry_sign: ERROR: Something\'s blocking us! You might want to try again.');
										break;
									case 2:
										message.channel.send(':no_entry_sign: ERROR: Too much cosmic interference! You might want to try again.');
										break;
								}
							});
						} else if (command.startsWith("rtid")) {
							command = command.substr(5);
							//Find a user's ID based on given name

							var foundUsers = client.users.findAll("username", command);
							if (foundUsers.length == 0) {
								message.channel.send(':no_entry_sign: ERROR: Couldn\'t find anyone with that username. You might want to try again.');
							} else {
								var reply = ":white_check_mark: OK: We found " + parseInt(foundUsers.length) + " users with that username.\n```\n";
								for (let user of foundUsers) {
									reply += getUserString(user) + ": " + user.id + "\n";

									message.guild.fetchMember(user).then(function (member) {
										message.channel.send(":white_check_mark: " + getUserString(user) + " exists on this server.");
									}).catch(function () {
										message.channel.send(":no_entry_sign: " + getUserString(user) + " does not exist on this server.");
									});
								}
								reply += "```";
								message.channel.send(reply);
							}
							message.delete();
						} else if (command.startsWith("cancel")) {
							command = command.substr(7);

							if (command.startsWith("clock")) {
								command = command.substr(6);

								clearTimeout(parseInt(command));
								message.channel.send(":white_check_mark: OK: If a timer with the ID `" + command + "` exists, it has been cancelled.");
							} else {
								message.channel.send(":no_entry_sign: ERROR: Not sure what to cancel.");
							}
						} else if (command.startsWith("deal") || command.startsWith("manage")) {
							if (actioningMember[message.guild.id] != null) {
                                message.channel.send(':no_entry_sign: ERROR: ' + getUserString(actioningMember[message.guild.id]) + " is already managing another user.");
							} else {
                                if (command.startsWith("deal")) {
                                    command = command.substr(5);
                                } else if (command.startsWith("manage")) {
                                    command = command.substr(7);
                                }
								command = command.replace("<", "").replace(">", "").replace("@", "").replace("!", "");

								message.guild.fetchMember(command).then(function (member) {
                                    if (member.highestRole.comparePositionTo(message.member.highestRole) >= 0) {
                                        message.channel.send(":gear: Cannot manage " + getUserString(member) + ".");
                                    } else {
                                        var canDoActions = false;
                                        var msg = ':gear: ' + getUserString(member) + ": `cancel` ";
                                        if (member.kickable) {
                                            msg += '`kick` ';
                                            canDoActions = true;
                                        }
                                        
                                        if (member.bannable) {
                                            msg += '`ban` `nick` ';
                                            canDoActions = true;
                                        }
                                        
                                        if (message.guild.id == 277922530973581312) {
                                            msg += "`interrogate` `jail` `mute` ";
                                            canDoActions = true;
                                        }
                                        
                                        if (canDoActions) {
                                            actionMember[message.guild.id] = member;
                                            actioningMember[message.guild.id] = message.author;
                                            actionStage[message.guild.id] = 0;
                                            message.channel.send(msg);
                                        } else {
                                            message.channel.send(":gear: Cannot manage " + getUserString(member) + ".");
                                        }
                                    }
								}).catch(function (reason) {
									switch (Math.floor(Math.random() * 1000) % 3) {
										case 0:
											message.channel.send(':no_entry_sign: ERROR: That didn\'t work. You might want to try again.');
											break;
										case 1:
											message.channel.send(':no_entry_sign: ERROR: Something\'s blocking us! You might want to try again.');
											break;
										case 2:
											message.channel.send(':no_entry_sign: ERROR: Too much cosmic interference! You might want to try again.');
											break;
									}
								});
							}
							message.delete();
						} else if (command.startsWith("rm")) {
							command = command.substr(3);
							var num = parseInt(command);
							if (num != command) {
								message.channel.send(":no_entry_sign: ERROR: That's not a number...");
							} else {
								num = num + 1; //Also remove the mod:rm command
								message.channel.bulkDelete(num).then(function () {
                                    if (num == 2) {
                                        message.channel.send(":white_check_mark: OK: I successfully deleted 1 message.");
                                    } else {
                                        message.channel.send(":white_check_mark: OK: I successfully deleted " + command + " messages.");
                                    }
								}).catch(function () {
									switch (Math.floor(Math.random() * 1000) % 3) {
										case 0:
											message.channel.send(':no_entry_sign: ERROR: That didn\'t work. You might want to try again.');
											break;
										case 1:
											message.channel.send(':no_entry_sign: ERROR: Something\'s blocking us! You might want to try again.');
											break;
										case 2:
											message.channel.send(':no_entry_sign: ERROR: Too much cosmic interference! You might want to try again.');
											break;
									}
								});
							}
						} else if (command.startsWith("declnick")) {
							command = command.substr(9);
							if (pendingNicks[command] != null) {
								clearTimeout(pendingNicks[command]);
								pendingNicks[command] = null;
								message.channel.send(':white_check_mark: OK: User nickname change has been cancelled.');
							} else {
								message.channel.send(':no_entry_sign: ERROR: That didn\'t work. Has 5 minutes passed?');
							}
						}
                }
                
                if (command == "poweroff") {
                    if (message.author.id == 114465624821989376) {
                        if (poweroff) {
                            switch (Math.floor(Math.random() * 1000) % 3) {
                                case 0:
                                    message.channel.send(':white_check_mark: AstralMod is now exiting. Goodbye!').then(function() {
                                        process.exit(0);
                                    }).catch(function() {
                                        process.exit(0);
                                    });
                                    break;
                                case 1:
                                    message.channel.send(':white_check_mark: Gah! Byte form is so last week!').then(function() {
                                        process.exit(0);
                                    }).catch(function() {
                                        process.exit(0);
                                    });
                                    break;
                                case 2:
                                    message.channel.send(':white_check_mark: They saw... right through me...').then(function() {
                                        process.exit(0);
                                    }).catch(function() {
                                        process.exit(0);
                                    });
                                    break;
                            }
                        } else {
                            message.channel.send(':information_source: If you\'re just trying to stop AstralMod from moderating, use `mod:mod off` instead. Otherwise, to power off AstralMod, type in `mod:poweroff` again.');
                            poweroff = true;
                        }
                    } else {
                        message.reply(':no_entry_sign: NO: Only **MrJed385** is allowed to power off the bot. To turn off moderation, use `mod:mod off`.');
                    }
                } else {
                    poweroff = false;
                }
            } else {
                message.reply(':no_entry_sign: NO: What? You\'re not a member of the staff! Why would you be allowed to type that!?');
                message.delete();
            }
        }
        
        var performModerationOnMessage = true;
        //Check for images.
        //Other attachments are ok.
        if (message.attachments != null) {
            for (let [key, attachment] of message.attachments) {
                if (attachment.height != null) {
                    performModerationOnMessage = false;
                    break;
                }
            }
        }
        
        if (doModeration[message.guild.id] && performModerationOnMessage) { //Check if we should do moderation on this server. If message contains an attachment, ignore it.
            //Spam limiting
            if (lastMessages[message.author.id] != msg) {
                sameMessageCount[message.author.id] = 0;
            }
            lastMessages[message.author.id] = msg
            sameMessageCount[message.author.id] += 1;
            
            if (lastMessages[message.author.id] == msg && sameMessageCount[message.author.id] == 10) {
                var auth = message.author;
                if (message.guild.id == 201976968261009408) { //MJC
                    client.channels.get("255265100766773249").sendMessage(":red_circle: " + getUserString(auth) + " was spamming on " + message.channel.name + ".");
                } else if (message.guild.id == 234414439330349056) { //ShiftOS
                    client.channels.get("282513112257658880").sendMessage(":red_circle: " + getUserString(auth) + " was spamming on " + message.channel.name + ".");
                } else if (message.guild.id == 278824407743463424) { //theShell
                    client.channels.get("283184634400079872").sendMessage(":red_circle: " + getUserString(auth) + " was spamming on " + message.channel.name + ".");
                } else if (message.guild.id == 281066689892974592) { //LE
                    client.channels.get("288272065109295104").sendMessage(":red_circle: " + getUserString(auth) + " was spamming on " + message.channel.name + ".");
                }
                
                message.reply("Quite enough of this. I'm not warning you any more. (A notification has been sent to the mods.)");
                message.delete();
            } else if (lastMessages[message.author.id] == msg && sameMessageCount[message.author.id] > 10) {
                message.delete();
            } else if (lastMessages[message.author.id] == msg && sameMessageCount[message.author.id] > 3) {
                console.log("[FILTER] Spam detected by " + getUserString(message.author));
                switch (Math.floor(Math.random() * 1000) % 5) {
                    case 0:
                        message.reply("Well... We all heard you.");
                        break;
                    case 1:
                        message.reply("Stop typing the same thing! You're like a broken record!");
                        break;
                    case 2:
                        message.reply("Hmm... Not sure if you'd actually say the same thing more than three times in public.");
                        break;
                    case 3:
                        message.reply("Is that the only phrase you know? Can you try typing something else?");
                        break;
                    case 4:
                        message.reply("Pollution is not the solution, my honeyfry.");
                        break;
                }
            
                message.delete();
            } else if (smallMessageCount[message.author.id] == 10) {
                var auth = message.author;
                if (message.guild.id == 201976968261009408) { //MJC
                    client.channels.get("255265100766773249").sendMessage(":red_circle: " + getUserString(auth) + " was spamming on " + message.channel.name + ".");
                } else if (message.guild.id == 234414439330349056) { //ShiftOS
                    client.channels.get("282513112257658880").sendMessage(":red_circle: " + getUserString(auth) + " was spamming on " + message.channel.name + ".");
                } else if (message.guild.id == 278824407743463424) { //theShell
                    client.channels.get("283184634400079872").sendMessage(":red_circle: " + getUserString(auth) + " was spamming on " + message.channel.name + ".");
                } else if (message.guild.id == 281066689892974592) { //LE
                    client.channels.get("288272065109295104").sendMessage(":red_circle: " + getUserString(auth) + " was spamming on " + message.channel.name + ".");
                }
                message.reply("Quite enough of this. I'm not warning you any more. (A notification has been sent to the mods.)");
                message.delete();
                console.log("[FILTER] Spam notification sent by " + getUserString(message.author));
            } else if (smallMessageCount[message.author.id] > 10) {
                message.delete();
            } else if (smallMessageCount[message.author.id] > 5) {
                console.log("[FILTER] Spam detected by " + getUserString(message.author));
                switch (Math.floor(Math.random() * 1000) % 4) {
                    case 0:
                        message.reply("This looks like spam. And we don't like spam.");
                        break;
                    case 1:
                        message.reply("Cut it out.");
                        break;
                    case 2:
                        message.reply("Very... scribbly...");
                        break;
                    case 3:
                        message.reply("If you're going to type that, why not get out a pen and paper and do it yourself?");
                        break;
                }
                
                message.delete();
            }
        }
    }
}

client.on('message', messageChecker);
client.on('messageUpdate', messageChecker);

client.on('guildMemberAdd', function(guildMember) {
    if (guildMember.guild.id == 234414439330349056 || guildMember.guild.id == 277922530973581312) {
        var channel;
        if (guildMember.guild.id == 277922530973581312) {
            channel = client.channels.get("284837615830695936");
            console.log("[STATUS] " + getUserString(guildMember) + " --> APHC");
            interrogMember = guildMember;
        } else {
            channel = client.channels.get("284826899413467136");
            console.log("[STATUS] " + getUserString(guildMember) + " --> SOS");
            interrogMember = guildMember;
        }
        
        channel.sendMessage(":arrow_right: <@" + guildMember.user.id + ">");
        
        embed = new Discord.RichEmbed();
        embed.setAuthor(guildMember.displayName, guildMember.user.displayAvatarURL);
        embed.setColor("#FF0000");
        var msg = "Discriminator: " + guildMember.user.discriminator + "\n" + 
                    "Created at: " + guildMember.user.createdAt.toUTCString() + "\n";
        if (guildMember.joinedAt.toUTCString() == "Thu, 01 Jan 1970 00:00:00 GMT") {
            msg += "Joined at: -∞... and beyond! Discord seems to be giving incorrect info... :(";
        } else {
            msg += "Joined at: " + guildMember.joinedAt.toUTCString();
        }
        embed.setDescription(msg);
        embed.setFooter("User ID for moderation actions: " + guildMember.user.id);
        channel.sendEmbed(embed);
        
        var now = new Date();
        var joinDate = guildMember.user.createdAt;
        if (joinDate.getDate() == now.getDate() && joinDate.getMonth() == now.getMonth() && joinDate.getFullYear() == now.getFullYear()) {
            if (guildMember.guild.id == 277922530973581312) {
                channel.sendMessage(":calendar: <@&313996053881815040> This member was created today.");
            } else {
                channel.sendMessage(":calendar: <@&317657591927013378> This member was created today.");
            }
        }
    }
});

client.on('guildMemberUpdate', function(oldUser, newUser) {
    if (newUser.guild.id == 277922530973581312) {
        if (/*!oldUser.roles.find("name", "I Broke The Rules!") &&*/ newUser.roles.find("name", "Jailed")) {
            console.log("[STATUS] " + getUserString(newUser) + " --> JAIL");
            client.channels.get("277943393231831040").sendMessage("<@" + newUser.id + "> :oncoming_police_car: You are now in jail. Appeal here to get out of jail. If you do not appeal successfully within 24 hours, an admin will **ban** you from the server.\n\n" + 
            "Additionally, if you leave and rejoin this server in an attempt to break out of jail, you will be **banned.**\n\n" + 
            "Timestamp: " + new Date().toUTCString());
        }
        
        if (/*!oldUser.roles.find("name", "I Broke The Rules!") &&*/ newUser.roles.find("name", "Interrogation")) {
            console.log("[STATUS] " + getUserString(newUser) + " --> INTERROGATION");
            client.channels.get("292630922040311808").sendMessage("<@" + newUser.id + "> :oncoming_police_car: A member of staff just wishes to make sure you're not someone we've banned before. If you have any social media accounts, just tell us so we can see that you're not someone that we've banned :)");
        }
        
        if (newUser.nickname != oldUser.nickname) {
            console.log("[STATUS] " + getUserString(newUser) + " --> N(" + newUser.nickname + ")");
            var channel = client.channels.get("282513354118004747"); //Bot Warnings
            if (newUser.nickname == null) {
                channel.send(":abcd: " + getUserString(oldUser) + " :arrow_right: [cleared]");
            } else {
                channel.send(":abcd: " + getUserString(oldUser) + " :arrow_right: " + newUser.nickname);
            }
        }
    } else if (newUser.guild.id == 234414439330349056) {
        if (/*!oldUser.roles.find("name", "I Broke The Rules!") &&*/ newUser.roles.find("name", "Interrogation")) {
            console.log("[STATUS] " + getUserString(newUser) + " --> INTERROGATION");
            client.channels.get("295337094128205826").sendMessage("<@" + newUser.id + "> :oncoming_police_car: A member of staff just wishes to make sure you're not someone we've banned before. If you have any social media accounts, just tell us so we can see that you're not someone that we've banned :)");
        }
    }
});

client.on('userUpdate', function(oldUser, newUser) {
    if (newUser.username != oldUser.username) {
        var aphcGuild = client.channels.get("282513354118004747").guild;
        aphcGuild.fetchMember(newUser).then(function(member) {
            console.log("[STATUS] " + getUserString(oldUser) + " --> U(" + newUser.username + ")");
            var channel = client.channels.get("282513354118004747"); //Admin Bot warnings
            channel.send(":ab: " + getUserString(oldUser) + " :arrow_right: " + newUser.username + ". Check spreadsheet!");
        }).catch(function() {
            
        });
    }
});

client.on('guildMemberRemove', function(user) {
    if (user.roles.find("name", "I Broke The Rules!")) {
            console.log("[STATUS] !!! <-- " + getUserString(user));
        client.channels.get("277943393231831040").sendMessage(":arrow_left: <@" + user.id + "> has left the server in jail.");
    }
    
    if (user.guild != null) {
        if (user.guild.id == 277922530973581312 || user.guild.id == 234414439330349056) {
            var channel;
            if (user.guild.id == 277922530973581312) {
                channel = client.channels.get("284837615830695936");
                console.log("[STATUS] APHC <-- " + getUserString(user));
            } else {
                channel = client.channels.get("284826899413467136");
                console.log("[STATUS]  SOS <-- " + getUserString(user));
            }
            
            channel.sendMessage(":arrow_left: <@" + user.user.id + "> (" + user.displayName + ")");
        }
    }
});

client.on('messageDelete', function(message) {
    if (message.content.startsWith("bot:") || message.content.startsWith("mod:")) return; //Don't want to warn about AstralMod deleted messages
    if (message.author.id == 155149108183695360) return; //Ignore Dyno
    var channel = null;
    
    if (message.guild != null) {
        if (panicMode[message.guild.id]) return; //Don't want to be doing this in panic mode!
        if (message.guild.id == 140241956843290625) return; //Ignore TGL
          
        if (message.guild.id == 201976968261009408) { //AstralPhaser Central
            channel = client.channels.get("257471345305059328");
        } else if (message.guild.id == 234414439330349056) { //ShiftOS
            channel = client.channels.get("290442327158292480");
        } else if (message.guild.id == 278824407743463424) { //theShell
            channel = client.channels.get("290444399731671040");
        } else if (message.guild.id == 287937616685301762) { //WoW
            channel = client.channels.get("295498899370803200");
        } else if (message.guild.id == 297057036292849680) { //ALA
            channel = client.channels.get("297762292823490570");
        } else if (message.guild.id == 281066689892974592) { //LE
            channel = client.channels.get("302821411821453312");
        } else if (message.guild.id == 266018132827570176) { //TH
            channel = client.channels.get("306041264933961728");
        }
    }
    
    if (channel != null && message.channel != channel) {
        var msg = ":wastebasket: **" + getUserString(message.author) + "** <#" + message.channel.id + "> `" + message.createdAt.toUTCString() + "`.";
        
        if (message.cleanContent.length) {
            msg += "\n```\n" +
                message.cleanContent + "\n" +
                "```";
        }
        
        if (message.attachments.size > 0) {
            msg += "\nThe following files were attached to this message:";
            
            for (let [key, attachment] of message.attachments) {
                if (attachment.height == null) {
                    msg += "\n```" + attachment.filename + " @ " + parseInt(attachment.filesize) + " bytes long```";
                } else {
                    msg += "\n" + attachment.proxyURL;
                }
            }
        }
            
        channel.send(msg);
    }
});

client.on('messageDeleteBulk', function(messages) {
    var channel = null;
    
    if (messages.first().guild != null) {
        if (panicMode[messages.first().guild.id]) return; //Don't want to be doing this in panic mode!
        if (messages.first().guild.id == 140241956843290625) return; //Ignore TGL
          
        if (messages.first().guild.id == 277922530973581312) { //AstralPhaser Central
            channel = client.channels.get("290439711258968065");
        } else if (messages.first().guild.id == 234414439330349056) { //ShiftOS
            channel = client.channels.get("290442327158292480");
        } else if (messages.first().guild.id == 278824407743463424) { //theShell
            channel = client.channels.get("290444399731671040");
        } else if (messages.first().guild.id == 287937616685301762) { //WoW
            channel = client.channels.get("295498899370803200");
        } else if (messages.first().guild.id == 297057036292849680) { //ALA
            channel = client.channels.get("297762292823490570");
        } else if (messages.first().guild.id == 281066689892974592) { //LE
            channel = client.channels.get("302821411821453312");
        } else if (messages.first().guild.id == 266018132827570176) { //TH
            channel = client.channels.get("306041264933961728");
        }
    }
    
    if (channel != null) {
        var message = ":wastebasket: " + parseInt(messages.length) + " messages in <#" + messages.first().channel.id + "> were deleted.\n"
        for (let [key, msg] of messages) {
            message += "```" + msg.cleanContent + "```";
        }
        channel.sendMessage(message);
    }
});

client.on('messageUpdate', function(oldMessage, newMessage) {
    if (oldMessage.cleanContent == newMessage.cleanContent) return; //Ignore
    var channel = null;
    if (oldMessage.guild != null) {
        if (oldMessage.guild.id == 277922530973581312) { //AstralPhaser Central
            channel = client.channels.get("290439711258968065");
        } else if (oldMessage.guild.id == 234414439330349056) { //ShiftOS
            channel = client.channels.get("290442327158292480");
        } else if (oldMessage.guild.id == 278824407743463424) { //theShell
            channel = client.channels.get("290444399731671040");
        } else if (oldMessage.guild.id == 287937616685301762) { //WoW
            channel = client.channels.get("295498899370803200");
        } else if (oldMessage.guild.id == 297057036292849680) { //ALA
            channel = client.channels.get("297762292823490570");
        } else if (oldMessage.guild.id == 281066689892974592) { //LE
            channel = client.channels.get("302821411821453312");
        } else if (oldMessage.guild.id == 266018132827570176) { //TH
            channel = client.channels.get("306041264933961728");
        }
    }
    
    if (channel != null && oldMessage.channel != channel) {
        var msg = ":pencil2: **" + getUserString(oldMessage.author) + "** <#" + oldMessage.channel.id + "> `" + oldMessage.createdAt.toUTCString() + "`.\n";
        
        
        if (oldMessage.cleanContent.length) {
            msg += "```\n" +
                oldMessage.cleanContent + "\n" +
                "```";
        } else {
            msg += "```\n[no content]\n```";
        }
        
        msg += "```\n" +
            newMessage.cleanContent + "\n" +
            "```";
            
        if (oldMessage.attachments.size > 0) {
            msg += "\nThe following files were attached to this message:";
            
            for (let [key, attachment] of oldMessage.attachments) {
                if (attachment.height == null) {
                    msg += "\n```" + attachment.filename + " @ " + parseInt(attachment.filesize) + " bytes long```";
                } else {
                    msg += "\n" + attachment.proxyURL;
                }
            }
        }
            
        channel.send(msg);
    }
});

client.on("guildBanAdd", function(guild, user) {
    if (guild.id == 234414439330349056 || guild.id == 277922530973581312) {
        var channel;
        console.log("[STATUS] " + getUserString(user) + " --> BAN");
        
        if (guild.id == 277922530973581312) {
            channel = client.channels.get("284837615830695936");
        } else {
            channel = client.channels.get("284826899413467136");
        }
        
        channel.sendMessage(":red_circle: " + user.username + " :hammer: ¯\\_(ツ)_/¯ :hammer:");
    }
});

client.login(api.key).catch(function() {
    console.log("[ERROR] Login failed.");
});
