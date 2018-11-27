const express = require('express');
const router = express.Router();
const uuidv4 = require('uuid/v4');
const _ = require('lodash');
const axios = require('axios');
const request = require('request');
/* Read Credentials */
const cfenv = require("cfenv");
var vcapLocal;
try {
  vcapLocal = require('../vcap-local.json');
} catch (e) { }
const appEnvOpts = vcapLocal ? { vcap: vcapLocal} : {}
const appEnv = cfenv.getAppEnv(appEnvOpts);
/* End - Read Credentials */

const assistant_delai = '6c7e70c7-be84-422d-9b45-8f0a45e8bc32';
const assistant_main = '8ad1f141-a944-4aac-b49c-d992c7b5fa62';
var context_array, usage, number, session_delai, session_main, user_id, entity_list, chatbot_response = null;

router.get('/', function(req, res, next) {
  entity_list = {}
  context_array = [];
  session_delai = session_main  = usage = chatbot_response = '';
  user_id = uuidv4();
  number = 0;
  if (!conversation) {
    console.log("Conversation non initialisée");
    res.render('error');
  } else {
    console.log("Conversation initialisée");
    createSession(assistant_main, function(result) {
      session_main = result.session_id;
    });
    createSession(assistant_delai, function(result) {
      session_delai = result.session_id;
    });
    res.render('index', {
      conversation: conversation
    });
  }
});

router.post('/', function(req, res, next) {
  var input = req.body.input;
  var current_assistant = '';
  var current_session = '';
  decisionGet('ACTIVE');
  if(context_array.length == 0) {
    context_array.push({
      gearbox: req.body.bv,
      energy: req.body.energie,
      from: req.body.from,
      to: req.body.to,
      vehicle: '5008',
      timezone: 'Europe/Paris',
      user_id: user_id
    });
  }
  //console.log(context_array);
  makeCloudantRequest(req.body, function(result){
    if(result == null || result.length != 1) {
      console.log('Not found');
      if(usage) {
        current_assistant = assistant_delai;
        current_session = session_delai;
      } else {
        current_assistant = assistant_main;
        current_session = session_main;
      }
      sendConversationMessage(current_assistant, current_session, input, context_array[context_array.length - 1], function(response){
        console.log('input:', input);
        chatbot_response = '';
        for(var i=0; i<response.output.generic.length; i++) {
          //console.log(response.output.generic[i]);
          chatbot_response += response.output.generic[i].text + '. ';
        }
        for(var i=0; i<response.output.entities.length; i++) {
          //console.log(response.output.entities[i]);
          entity_list[response.output.entities[i].entity] = response.output.entities[i].value;
        }
        if(entity_list["usage"]) {
          usage = entity_list["usage"];
          _.assign(response.context, {'usage' : entity_list["usage"]});
          // Initialization chatbot 2
          sendConversationMessage(assistant_delai, session_delai, '', context_array[context_array.length - 1], function(response2){
            console.log(chatbot_response);
            for(var i=0; i<response2.output.generic.length; i++) {
              //console.log(response2.output.generic[i]);
              chatbot_response +=  response2.output.generic[i].text + '. ';
            }
            saveDialog(user_id, input, chatbot_response, context_array.length);
            context_array.push(response2.context);
            number++;
          });
        } else {
          saveDialog(user_id, input, chatbot_response, context_array.length);
          context_array.push(response.context);
          number++;
        }
        res.send([chatbot_response, '', {}, usage]);
      });
    }
    else {
      console.log('Found');
      var myResponse = "We found a car which matches your expectation !"
      saveDialog(user_id, input, myResponse, number);
      res.send([myResponse, 'display_data', result, usage]);
    }
  });
});

function makeCloudantRequest(params, callback) {
    var from = params["from"];
    var to = params["to"];
    delete params["input"];
    delete params["from"];
    delete params["to"];
    if(usage) {
      params["usage"] = usage;
    }
    //console.log(params);
    var data = [];
    if(!mydb) {
      callback(data);
    }
    mydb.find({ selector: params }, function(err, result) {
      if (!err) {
        for (var i = 0; i < result.docs.length; i++) {
          if (result.docs[i].prix < to && result.docs[i].prix > from) {
            //console.log(result.docs[i])
            data.push(result.docs[i])
          }
        }
        callback(data);
      } else {
        console.log(err);
        callback(data);
      }
    });
}

function saveDialog(conv_uid, question, response, order) {
    var data = [];
    if(!mydb) {
      console.log("No database initialized");
    }
    mydb.insert({ "user_id": user_id, "question": question, "response": response, "ordre": order}, function(err, body, header) {
      if (err) {
        console.log('[mydb.insert] ', err.message);
      }
      console.log("New entry in the database");
    });
}

function createSession(assistant_id, callback) {
  conversation.createSession({
      assistant_id: assistant_id,
    }, function(err, response) {
      if (err) {
        console.error(err);
      } else{
        callback(response)
      }
    });
}

function sendConversationMessage(assistant_id, session_id, msg, context, callback) {
    conversation.message({
        assistant_id: assistant_id,
        session_id: session_id,
        context: context,
        input: {
          'message_type': 'text',
          'text': msg
        }
      }, function(err, response) {
      if (err) {
        console.error(err);
      } else {
        console.log(response);
        callback(response);
      }
    });
}

function decisionGet (mdl, callback) {
  if (appEnv.services['decision']) {
    var headers = {
        'Content-Type': 'application/json',
        'Authorization': 'ApiKey '+appEnv.services['decision'][0].credentials.apiKey
    };

    var dataString = '{"modele":"'+mdl+'"}';

    var options = {
        url: appEnv.services['decision'][0].credentials.url,
        method: 'POST',
        headers: headers,
        body: dataString
    };

    request(options, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            //console.log(body);
            callback(body);
        }
    });
  }
}

module.exports = router;
