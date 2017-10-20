var restify = require('restify');
var builder = require('botbuilder');
var Store = require('./store');

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});

// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: '75bec105-156b-4295-8849-5e70682ef546',
    appPassword: 'oPegzQi6tLhzdZjSN78RrGR'
});

// Listen for messages from users 
server.post('/api/messages', connector.listen());

var bot = new builder.UniversalBot(connector, [
    
 function (session) {

session.endDialog('Hi, I\'m your Intelligent bot. I can keep records of your Assignment. Type \'help\' if you need assistance.');
}

]);


bot.dialog('CreateNote', [
    function (session, args, next) {
        // Resolve and store any Note.Title entity passed from LUIS.
        var intent = args.intent;
        var title = builder.EntityRecognizer.findEntity(intent.entities, 'Note.Title');

        var note = session.dialogData.note = {
          title: title ? title.entity : null,
        };
        
        // Prompt for title
        if (!note.title) {
            builder.Prompts.text(session, 'What is the name of your next Assignment ?');
        } else {
            next();
        }
    },
    function (session, results, next) {
        var note = session.dialogData.note;
        if (results.response) {
            note.title = results.response;
        }

        // Prompt for the text of the note
        if (!note.text) {
            builder.Prompts.text(session, 'Tell me about the content.');
        } else {
            next();
        }
    },
    function (session, results, next) {
        var note = session.dialogData.note;
        if (results.response) {
            note.text = results.response;
        }

        // Prompt for the text of the note
        if (!note.date) {
            builder.Prompts.text(session, 'What is the submission date ?');
        } else {
            next();
        }
    },
  function (session, results, next) {
        var note = session.dialogData.note;
        if (results.response) {
            note.date = results.response;
        }

        // Prompt for the text of the note
        if (!note.priority) {
            builder.Prompts.text(session, 'What should be its priority according to you ?');
        } else {
            next();
        }
    },
    function (session, results) {
        var note = session.dialogData.note;
        if (results.response) {
            note.priority = results.response;
        }
        
        // If the object for storing notes in session.userData doesn't exist yet, initialize it
        if (!session.userData.notes) {
            session.userData.notes = {};
            console.log("Initializing session.userData.notes in CreateNote dialog");
        }
        // Save notes in the notes object
        session.userData.notes[note.title] = note;

        // Send confirmation to user
        /*session.send('Assignment named "%s" with content "%s" added to your schedule',
            note.title, note.text);*/
     session.endDialog('Assignment named as "%s" with content "%s" with submission date "%s" is added to your schedule',
            note.title, note.text, note.date);

    }
]).triggerAction({
    matches: /^(create|make|build|add)$/i,
});


bot.dialog('DeleteNote', [
    function (session, args, next) {
        if (noteCount(session.userData.notes) > 0) {
            // Resolve and store any Note.Title entity passed from LUIS.
            var title;
            var intent = args.intent;
            var entity = builder.EntityRecognizer.findEntity(intent.entities, 'Note.Title');
            if (entity) {
                // Verify that the title is in our set of notes.
                title = builder.EntityRecognizer.findBestMatch(session.userData.notes, entity.entity);
            }
            
            // Prompt for note name
            if (!title) {
                builder.Prompts.choice(session, 'Which assignment would you like to delete?', session.userData.notes);
            } else {
                next({ response: title });
            }
        } else {
            session.endDialog("Sorry, There doesn't exist any assignment to delete.");
        }
    },
    function (session, results) {
        delete session.userData.notes[results.response.entity];        
        session.endDialog("Deleted the '%s' assignment, successfully.", results.response.entity);
    }
]).triggerAction({
         matches: /^(delete|discard)$/i,
});

bot.dialog('ReadNote', [
    function (session, args, next) {
        if (noteCount(session.userData.notes) > 0) {
           
            // Resolve and store any Note.Title entity passed from LUIS.
            var title;
            var intent = args.intent;
            var entity = builder.EntityRecognizer.findEntity(intent.entities, 'Note.Title');
            if (entity) {
                // Verify it's in our set of notes.
                title = builder.EntityRecognizer.findBestMatch(session.userData.notes, entity.entity);
            }
            
            // Prompt for note name
            if (!title) {
                builder.Prompts.choice(session, 'Which assignment would you like to read about ?', session.userData.notes);
            } else {
                next({ response: title });
            }
        } else {
            session.endDialog("You haven't added anything to your assignment .");
        }
    },
    function (session, results) {        
        session.endDialog(`Assignment details: <br/>Title : ${results.response.entity} <br/>Content : ${session.userData.notes[results.response.entity].text} <br/>Submission Date : ${session.userData.notes[results.response.entity].date} <br/>Priority : ${session.userData.notes[results.response.entity].priority} <br/> 'For more information related to your Assignment, Please type \'bing\''`);
    }
]).triggerAction({
    matches: /^(read|show)$/i,
});
bot.dialog('Help', function (session) {
    session.endDialog(`Hello..! You can ask me to :<br/>\'create\' (To create a new Assignment), <br/>\'delete\' (To delete an Assignment), <br/> \'read\' (To read an Assignment) or, <br/> \'bing\' (To search some links of books related to your Assignment)`);
}).triggerAction({
    matches: /^(help|Help)$/i,
});




bot.dialog('SearchHotels', [
     function (session, args, next) {
        if (noteCount(session.userData.notes) > 0) {
           
            // Resolve and store any Note.Title entity passed from LUIS.
            var title;
            var intent = args.intent;
            var entity = builder.EntityRecognizer.findEntity(intent.entities, 'Note.Title');
            if (entity) {
                // Verify it's in our set of notes.
                title = builder.EntityRecognizer.findBestMatch(session.userData.notes, entity.entity);
            }
            
            // Prompt for note name
            if (!title) {
                builder.Prompts.choice(session, 'Which assignment would you want to refer books for?', session.userData.notes);
            } else {
                next({ response: title });
            }
        } else {
            session.endDialog("Sorry, There doesn't exists any assignment to read.");
        }
    },
    function (session, results) {        
        session.endDialog("Here's your '%s' Assignment: '%s'.", results.response.entity, session.userData.notes[results.response.entity].text);
       var destination = results.response.entity;

        var message = 'searching for';
          message += ' %s...';
        

       session.send(message, destination);
       Store
            .searchHotels(destination)
            .then(function (hotels) {
                // args
                session.send('I found %d links for some books related to your assignment : (sorted according to user reviews)', hotels.length);

                var message = new builder.Message()
                    .attachmentLayout(builder.AttachmentLayout.carousel)
                    .attachments(hotels.map(hotelAsAttachment));

                session.send(message);

                // End
                session.endDialog();
});
    }
        
]).triggerAction({
    matches: /^(search|bing)$/i,
    
});

function hotelAsAttachment(hotel) {
    return new builder.HeroCard()
        .title(hotel.name)
        .subtitle('%d stars. %d reviews.', hotel.ReadersRating, hotel.numberOfReviews)
       /* .images([new builder.CardImage().url('https://media.istockphoto.com/photos/stack-of-books-picture-id507311349?k=6&m=507311349&s=612x612&w=0&h=eOFF8x1-CvOSvV6hIuZRp-q430OAmPtVUdvxgRc8zz8=')])*/
        
        .buttons([
            new builder.CardAction()
                .title('More details')
                .type('openUrl')
                .value('https://www.bing.com/search?q=books+about+' + encodeURIComponent(hotel.location))
        ]);
}


function noteCount(notes) {

    var i = 0;
    for (var name in notes) {
        i++;
    }
    return i;
}




