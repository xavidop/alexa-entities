/* *
 * This sample demonstrates handling intents from an Alexa skill using the Alexa Skills Kit SDK (v2).
 * Please visit https://alexa.design/cookbook for additional examples on implementing slots, dialog management,
 * session persistence, api calls, and more.
 * */
const Alexa = require('ask-sdk-core');
const axios = require('axios');


function resolutionMatch(resolution) {
    return resolution.authority === 'AlexaEntities'
        && resolution.status.code === 'ER_SUCCESS_MATCH';
}

function getSlotResolutions(slot) {
    return slot.resolutions
        && slot.resolutions.resolutionsPerAuthority
        && slot.resolutions.resolutionsPerAuthority.find(resolutionMatch);
}

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {
        let speakOutput = 'Welcome, you can ask for any actor or request Help. Which would you like to try?';
        if (Alexa.getLocale(handlerInput.requestEnvelope).indexOf('es') != -1){
            speakOutput = 'Bienvenido, puedes preguntarme por cualquier actor o solicitar Ayuda. ¿Qué opción te gustaría probar?';
        }

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const EntityIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'EntityIntent';
    },
    async handle(handlerInput) {

        const actor = Alexa.getSlot(handlerInput.requestEnvelope, 'actor')
        const apiAccessToken = Alexa.getApiAccessToken(handlerInput.requestEnvelope);

        const resolutions = getSlotResolutions(actor);
        let speakOutput;

        if (resolutions) {
            const entityURL = resolutions.values[0].value.id;
            const headers = {
                'Authorization': `Bearer ${apiAccessToken}`,
                'Accept-Language': Alexa.getLocale(handlerInput.requestEnvelope)
            };
            const response = await axios.get(entityURL, { headers: headers });
        
            if (response.status === 200) {
                const entity = response.data;
                console.log(entity);
                const birthplace = entity.birthplace.name[0]['@value']
                const birthdate = new Date(Date.parse(entity.birthdate['@value'])).getFullYear()
                const childsNumber = entity.child.length
                const occupation = entity.occupation[0].name[0]['@value']
                const awards = entity.totalNumberOfAwards[0]['@value']
                const name =  entity.name[0]['@value']
                if (Alexa.getLocale(handlerInput.requestEnvelope).indexOf('es') != -1){
                    speakOutput = name + ' nació en ' + birthplace + ' en '+ birthdate +' y tiene ' + childsNumber + ' hijos. Actualmente trabaja como ' + occupation + '. Tiene un total de ' + awards + ' premios.'
                }else{
                    speakOutput = name + ' was borned in ' + birthplace + ' in ' + birthdate + ' and has ' + childsNumber + ' children. Now is working as a ' + occupation + '. Has won ' + awards + ' awards.'
                }
                
            }else{
                if (Alexa.getLocale(handlerInput.requestEnvelope).indexOf('es') != -1){
                    speakOutput = 'No he encontrado informacion sobre ese actor.'
                }else{
                    speakOutput = 'Didnt find information about that actor.'
                }
            }
        }

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        let speakOutput = 'You can ask for any actor! How can I help?';
        if (Alexa.getLocale(handlerInput.requestEnvelope).indexOf('es') != -1){
            speakOutput = 'Puedes preguntarme por cualquier actor! ¿Cómo puedo ayudarte?';
        }

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        let speakOutput = 'Goodbye movie lover!';
        if (Alexa.getLocale(handlerInput.requestEnvelope).indexOf('es') != -1){
            speakOutput = '¡Hasta luego cinéfilo!';
        }

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};
/* *
 * FallbackIntent triggers when a customer says something that doesn’t map to any intents in your skill
 * It must also be defined in the language model (if the locale supports it)
 * This handler can be safely added but will be ingnored in locales that do not support it yet 
 * */
const FallbackIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.FallbackIntent';
    },
    handle(handlerInput) {
        let speakOutput = 'Sorry, I don\'t know about that. Please try again.';
        if (Alexa.getLocale(handlerInput.requestEnvelope).indexOf('es') != -1){
            speakOutput = 'Perdona no he entendido eso, inténtalo más tarde';
        }

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};
/* *
 * SessionEndedRequest notifies that a session was ended. This handler will be triggered when a currently open 
 * session is closed for one of the following reasons: 1) The user says "exit" or "quit". 2) The user does not 
 * respond or says something that does not match an intent defined in your voice model. 3) An error occurs 
 * */
const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        console.log(`~~~~ Session ended: ${JSON.stringify(handlerInput.requestEnvelope)}`);
        // Any cleanup logic goes here.
        return handlerInput.responseBuilder.getResponse(); // notice we send an empty response
    }
};
/* *
 * The intent reflector is used for interaction model testing and debugging.
 * It will simply repeat the intent the user said. You can create custom handlers for your intents 
 * by defining them above, then also adding them to the request handler chain below 
 * */
const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
    },
    handle(handlerInput) {
        const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
        let speakOutput = `You just triggered ${intentName}`;
        if (Alexa.getLocale(handlerInput.requestEnvelope).indexOf('es') != -1){
            speakOutput = `Has ejecutado ${intentName}`;
        }

        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};
/**
 * Generic error handling to capture any syntax or routing errors. If you receive an error
 * stating the request handler chain is not found, you have not implemented a handler for
 * the intent being invoked or included it in the skill builder below 
 * */
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        let speakOutput = 'Sorry, I had trouble doing what you asked. Please try again.';
        if (Alexa.getLocale(handlerInput.requestEnvelope).indexOf('es') != -1){
            speakOutput = 'Lo siento, He tenido problemas para hacer lo que me pediste. Inténtalo de nuevo más tarde.';
        }
        console.log(`~~~~ Error handled: ${JSON.stringify(error)}`);

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

/**
 * This handler acts as the entry point for your skill, routing all request and response
 * payloads to the handlers above. Make sure any new handlers or interceptors you've
 * defined are included below. The order matters - they're processed top to bottom 
 * */
exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        EntityIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        FallbackIntentHandler,
        SessionEndedRequestHandler,
        IntentReflectorHandler)
    .addErrorHandlers(
        ErrorHandler)
    .withCustomUserAgent('sample/hello-world/v1.2')
    .lambda();