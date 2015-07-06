// Author: Pratik Desai
// Date: 7/5/2015

var http = require('http');
var qs = require('querystring');
var url = 'example.com';
/**
 * This sample shows how to create a simple Lambda function for handling speechlet requests.
 */

// Route the incoming request based on type (LaunchRequest, IntentRequest,
// etc.) The JSON body of the request is provided in the event parameter.
exports.handler = function (event, context) {
    try {
        console.log("event.session.application=" + event.session.application.applicationId);

        /**
         * Uncomment this if statement and replace application.id with yours
         * to prevent other voice applications from using this function.
         */
        /*
         if (event.session.application.id !== "amzn1.echo-sdk-ams.app.ae521eb3-c0ea-4e3f-9afb-45f0052d46b8") {
         context.fail("Invalid Application ID");
         }
         */

        if (event.session.new) {
            onSessionStarted({requestId: event.request.requestId}, event.session);
        }

        if (event.request.type === "LaunchRequest") {
            onLaunch(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        }  else if (event.request.type === "IntentRequest") {
            onIntent(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "SessionEndedRequest") {
            onSessionEnded(event.request, event.session);

            context.succeed();
        }
    } catch (e) {
        context.fail("Exception: " + e);
    }
};

/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
    console.log("onSessionStarted requestId=" + sessionStartedRequest.requestId
        + ", sessionId=" + session.sessionId);
}

/**
 * Called when the user launches the app without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
    console.log("onLaunch requestId=" + launchRequest.requestId
        + ", sessionId=" + session.sessionId);

    getWelcomeResponse(callback);
}

/**
 * Called when the user specifies an intent for this application.
 */
function onIntent(intentRequest, session, callback) {
    console.log("onIntent requestId=" + intentRequest.requestId
        + ", sessionId=" + session.sessionId);

    var intent = intentRequest.intent;
    var intentName = intentRequest.intent.name;

    if ("TvPowerIntent" === intentName) {
        console.log("TvPowerIntent");
        tvPowerStateChangeRequest(intent, session, callback);
    } else if ("ThankYouIntent" == intentName){
        console.log("ThankYouIntent");
        thankYouRequest(intent, session, callback);
    } else {
        console.log("Unknown intent");
        throw "Invalid intent";
    }
}

/**
 * Called when the user ends the session.
 * Is not called when the app returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {
    console.log("onSessionEnded requestId=" + sessionEndedRequest.requestId
        + ", sessionId=" + session.sessionId);
}

/**
 * Helpers that build all of the responses.
 */
function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        card: {
            type: "Simple",
            title: "SessionSpeechlet - " + title,
            content: "SessionSpeechlet - " + output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    }
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: "1.0",
        sessionAttributes: sessionAttributes,
        response: speechletResponse
    }
}

/**
 * Functions that control the app's behavior.
 */
function getWelcomeResponse(callback) {
    // If we wanted to initialize the session to have some attributes we could add those here.
    var sessionAttributes = {};
    var cardTitle = "Welcome";
    var speechOutput = "What would you like to do with TV? "
        + "You can say turn on or turn off.. ";
    // If the user either does not reply to the welcome message or says something that is not
    // understood, they will be prompted again with this text.
    var repromptText = "You can say turn on or turn off.. ";
    var shouldEndSession = false;

    callback(sessionAttributes,
        buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

/**
 * Sets the message in the session and prepares the speech to reply to the user.
 */
function tvPowerStateChangeRequest(intent, session, callback) {
    var cardTitle = intent.name;
    var messageSlot = intent.slots.Message;
    var repromptText = "";
    var sessionAttributes = {};
    var shouldEndSession = false;
    var speechOutput = "";
    if (messageSlot) {
        message = messageSlot.value;
        console.log("Message slot contains: " + message + ".");

        if ("on" == message) {
            sessionAttributes = createMessageAttributes(message);
            speechOutput = "Turning on TV.. ";
            repromptText = null;

            var postData = qs.stringify({
                'intents' : 'tv',
                'status':'on'
            });

            var options = {
                host: url,
                port: 9080,
                path: '/intents/post/',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': postData.length
                }
            };

            var req = http.request(options, function(res) {
                res.setEncoding('utf8');
                res.on('data', function (chunk) {
                    console.log(chunk);
                    callback(sessionAttributes,
                        buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
                });
            });
            req.on('error', function(e) {
                console.log('problem with request: ' + e.message);
                context.fail(e);
            });
            
            console.log(postData);
            req.write(postData);
            console.log("Done write() function");
            req.end();

        } else if ("off" == message) {
            sessionAttributes = createMessageAttributes(message);
            speechOutput = "Turning off TV.. ";
            repromptText = null;

            var postData = qs.stringify({
                'intents' : 'tv',
                'status':'off'
            });

            var options = {
                host: url,
                port: 9080,
                path: '/intents/post/',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': postData.length
                }
            };

            var req = http.request(options, function(res) {
                //res.setEncoding('utf8');
                res.on('data', function (chunk) {
                    callback(sessionAttributes,
                        buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
                });
            });
            req.on('error', function(e) {
                console.log('problem with request: ' + e.message);
                context.fail(e);
            });

            console.log(postData);
            req.write(postData);
            req.end();
        } else {
            speechOutput = "I didn't hear your message clearly, please try again";
            repromptText = "I didn't hear your message clearly, you can give me your "
                + "message by saying, my message is...";
            callback(sessionAttributes,
                buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
        }
    } else {
        speechOutput = "I didn't hear your message clearly, please try again";
        repromptText = "I didn't hear your message clearly, you can give me your "
            + "message by saying, my message is...";
        callback(sessionAttributes,
            buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
    }
}

function thankYouRequest(intent, session, callback){
    var cardTitle = "Thank you";
    var repromptText = null;
    var sessionAttributes = {};
    var shouldEndSession = false;
    var speechOutput = "";

    speechOutput = "You're welcome, goodbye";
    shouldEndSession = true;
    callback(sessionAttributes,
        buildSpeechletResponse(intent.name, speechOutput, repromptText, shouldEndSession));

}

function createMessageAttributes(message) {
    return {
        message: message
    };
}