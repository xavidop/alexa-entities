# Alexa Entities

In Alexa Live 2020, the Amazon Alexa Team launched a feature called Alexa Entities. This feature is aimed to use the Alexa Graph Knowledge to retrieve extra information from some Built-in Slots like places, actors, people, etc. After a year, this feature has been launched in more locales including Spanish, German, French and Italian. Wew! With Alexa Entities you don't need to access to external API to get some extra data. Each entity will provide an URL from the Alexa Knowledge graph where you can get that information.

<!-- TOC -->

- [Alexa Entities](#alexa-entities)
  - [Prerequisites](#prerequisites)
  - [Setting up our Alexa Skill](#setting-up-our-alexa-skill)
  - [Alexa Entities Resolution](#alexa-entities-resolution)
  - [Play with Alexa Entities](#play-with-alexa-entities)
    - [English](#english)
    - [Spanish](#spanish)
  - [Which Alexa Entities are available?](#which-alexa-entities-are-available)
  - [Resources](#resources)
  - [Conclusion](#conclusion)

<!-- /TOC -->

## Prerequisites

Here you have the technologies used in this project
1. Node.js v14.x
2. Visual Studio Code
3. Alexa Extension on VS Code

## Setting up our Alexa Skill

As I pointed above, when we add a built-in slot in our interaction model, let's say `AMAZON.Actor` for example, and that slot has a successful match, we will receive on our AWS Lambda that this slot has been matched and also some extra info. That extra info will be a slot resolution with the Alexa Entity information. What is that information? It will be a link where we can fetch all the data from that Alexa Entity that has been matched. This link looks like this: `https://ld.amazonalexa.com/entities/v1/KmHs1W4gVQDE9HHq72eDLs'`

Because of this this, we need to set up our Alexa Skill backend. As we are going to fetch some data, the first step we need to do is add one package npm: `axios`

To install this dependency you have to run these commands:
1. For npm:
```bash
    npm install --save axios
```
2. For yarn:
```bash
    yarn add axios
```

Axios is one of the most common libraries used in Node.js to make HTTP requests.

With this packages installed/updated we have done good progress on this journey!! Let's continue with the following steps.

## Alexa Entities Resolution

As it says the official documentation: "Each entity is a node linked to other entities in the knowledge graph". 

![image](/img/knowledge_graph.jpeg)

So let's go back to our example, the `AMAZON.Actor` one. Imagine that we have an slot called `actor` with that built-in type. When we request information of an actor and that actor is matched with the intent and also that actor exists on the Alexa Knowledge graph, we will get an URL to fetch its data.

But, where can we find that URL? where is it located within the request? This is what Alexa calls **Slot Resolution**. The Slot Resolution is the way that Alexa tells you, as a developer that a slot has successfully matched and which is the authority that resolved the value of that slot. For instance a slot can be resolved by these 3 authorities ways:
1. As a **Custom value**. For example a custom actor that we added manually.
2. As a **Dynamic entity**. The custom values that we can add programmatically.
3. As an **Alexa Entity**. When the actor exists in the Alexa Knowledge Graph.

The Slot resolution authorities and their resolutions can be found within the request here:

![image](/img/entity_resolution.png)

In this example, when we fetch that data, we will see some properties like `birthdate`, `birthplace` or an array called `child`. This array contains the child or children of the actor that we have requested. In each object of the `child` array we will find a URL where we can fetch the data of that child. 

![image](/img/entity_graph.png)

It is important to note here that each entity has its own schema. All the types are explained [here](https://developer.amazon.com/en-US/docs/alexa/custom-skills/alexa-entities-reference.html#entity-classes-and-properties).
## Play with Alexa Entities

Once we have the packages we need installed/upgraded and we understood the Alexa Entities resolution and how it works, we need modify our AWS Lambda to play with Alexa Entities.

For this example I created one intent to get information of actors:

![image](/img/intent.png)

The actor is using the `AMAZON.Actor` built-in slot:

![image](/img/slot.png)


Then we have a handler for this intent called `EntityIntentHandler`. The first thing that this handler going to do is to check if the slot `actor` is matched and if it is matched with and Alexa Entity:

```javascript
const actor = Alexa.getSlot(handlerInput.requestEnvelope, 'actor')

const resolutions = getSlotResolutions(actor);
```

This is how the `getSlotResolutions` function looks like: 

```javascript
function getSlotResolutions(slot) {
    return slot.resolutions
        && slot.resolutions.resolutionsPerAuthority
        && slot.resolutions.resolutionsPerAuthority.find(resolutionMatch);
}

function resolutionMatch(resolution) {
    return resolution.authority === 'AlexaEntities'
        && resolution.status.code === 'ER_SUCCESS_MATCH';
}
```

When we have the slot and it is successfully resolved as an Alexa Entity we need to get a token. This token is included in each request. For that you just need to call this function:

```javascript
const apiAccessToken = Alexa.getApiAccessToken(handlerInput.requestEnvelope);
```

Note that the `Alexa` object is the object we got by importing the `ask-sdk-core` lib:

```javascript
const Alexa = require('ask-sdk-core');
```

With that information collected we can call the Alexa Knowledge Graph using `axios` (make sure you have already imported it):

```javascript
const entityURL = resolutions.values[0].value.id;
const headers = {
    'Authorization': `Bearer ${apiAccessToken}`,
    'Accept-Language': Alexa.getLocale(handlerInput.requestEnvelope)
};
const response = await axios.get(entityURL, { headers: headers });
```

It is important to add the locale in order to get the data in the proper language.

If the call is successful, we can prepare our string that we are going to return to Alexa using the data from the Alexa Knowledge Graph:

```javascript
if (response.status === 200) {
    const entity = response.data;
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
```

And this is the final result:
### English
![image](/img/execution_en.png)

### Spanish
![image](/img/execution_es.png)

## Which Alexa Entities are available?

It is important to notice that not all the Alexa built-in slots have the Alexa Entities resolution. It depends on the locale and the built-in slot itself. To make sure which ones are available you can check the [official documentation](https://developer.amazon.com/en-US/docs/alexa/custom-skills/alexa-entities-reference.html#bist-er-support).


## Resources
* [Official Alexa Skills Kit Node.js SDK](https://www.npmjs.com/package/ask-sdk) - The Official Node.js SDK Documentation
* [Official Alexa Skills Kit Documentation](https://developer.amazon.com/docs/ask-overviews/build-skills-with-the-alexa-skills-kit.html) - Official Alexa Skills Kit Documentation
* [Official Alexa Entities Documentation](https://developer.amazon.com/en-US/docs/alexa/custom-skills/alexa-entities-reference.html) - Official Alexa Entities Documentation
## Conclusion 

As you can see the Alexa Entities can help us to build nice voice interactions with rich content. Looking forward to seeing what you are going to develop!

I hope this example project is useful to you.

That's all folks!

Happy coding!




