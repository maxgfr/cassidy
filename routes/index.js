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
var context_array,
  text_usage,
  num_msg,
  session_delai,
  session_main,
  user_id,
  entity_list,
  text_color,
  chatbot_response,
  criteria,
  color,
  isOptions,
  car,
  price_all_options,
  options_odm,
  usage = null;

router.get('/', function(req, res, next) {
  car = {};
  options_odm = {};
  entity_list = {};
  context_array = [];
  session_delai = session_main  = text_usage = chatbot_response = text_color = '';
  criteria = color = usage = isOptions = false;
  user_id = uuidv4();
  num_msg = price_all_options = 0;
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
  var val_u = input.toUpperCase();
  if(input === 'pref_selectionned') {
    criteria = true;
  }
  if(val_u == 'BLACK' || val_u == 'PEARL' || val_u == 'BLUE') {
    color = true;
    _.assign(car, {'color' : val_u});
    console.log(car);
    decisionGet(car.modele.toUpperCase(), function(result){
      console.log(result);
      options_odm = JSON.parse(result);
      car["prix"] = parseInt(car["prix"]) + 650;
      var reponseuh = 'Here is your new car. According to your stats, the users have choosen those options :';
      for(var i = 0; i< options_odm.resultat.PRIX.length; i++) {
        price_all_options += options_odm.resultat.PRIX[i];
      }
      for(var i = 0; i< options_odm.resultat.OPTIONS.length; i++) {
        reponseuh += ' - ' + options_odm.resultat.OPTIONS[i]
      }
      res.send([reponseuh, 'change_color', car, text_usage]);
    });
  } else {
      if(val_u == 'YES') {
        isOptions = true;
        car['prix'] = parseInt(car["prix"]) + price_all_options;
        res.send(['We updated the price with the options selected.', 'display_data', car, text_usage]);
        return;
      }
      if(val_u == 'NO') {
        isOptions = true;
        res.send(['It is ok, we will set 0 options', 'display_data', car, text_usage]);
        return;
      }
      makeCloudantRequest(req.body, function(result){
        if(result == null || result.length != 1) {
          console.log('Not found');
          if (usage && criteria && !color) {
            makeCloudantClosest(req.body, function(myResult){
              car = myResult;
              res.send(['We found a car that best matches your expectation. Now tell me the color', 'display_data', myResult, text_usage]);
            });
          }
          else {
            if (usage && criteria && color) {
              current_assistant = assistant_delai;
              current_session = session_delai;
            }
            else {
              current_assistant = assistant_main;
              current_session = session_main;
            }
            sendConversationMessage(current_assistant, current_session, input, context_array[context_array.length - 1], function(response){
              //console.log('input:', input);
              chatbot_response = '';
              for(var i=0; i<response.output.generic.length; i++) {
                //console.log(response.output.generic[i]);
                chatbot_response += response.output.generic[i].text + '. ';
              }
              for(var i=0; i<response.output.entities.length; i++) {
                //console.log(response.output.entities[i]);
                entity_list[response.output.entities[i].entity] = response.output.entities[i].value;
              }
              var priority = '';
              if(entity_list["usage"]) {
                text_usage = entity_list["usage"];
                _.assign(response.context, {'usage' : entity_list["usage"]});
                usage = true;
                priority = 'find_priority';
              }
              saveDialog(user_id, input, chatbot_response, context_array.length);
              context_array.push(response.context);
              num_msg++;
              res.send([chatbot_response, priority, {}, text_usage]);
            });
          }
        }
        else {
          console.log('Found');
          car = result[0];
          var myResponse = "We found a car which matches your expectation ! Now, choose a color."
          saveDialog(user_id, input, myResponse, num_msg);
          res.send([myResponse, 'display_data', result[0], text_usage]);
        }
      });
    }
});

function makeCloudantRequest(params, callback) {
    var from = params["from"];
    var to = params["to"];
    var selector = _.cloneDeep(params);
    delete selector["input"];
    delete selector["from"];
    delete selector["to"];
    if(text_usage) {
      selector["usage"] = text_usage;
    }
    console.log(selector)
    var data = [];
    if(!mydb) {
      callback(data);
    }
    mydb.find({ selector: selector }, function(err, result) {
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

function makeCloudantClosest(params, callback) {
    var esthetique = params["esthetique"];
    var confort = params["confort"];
    var multimedia = params["multimedia"];
    var assistance = params["assistance"];
    var from = params["from"];
    var to = params["to"];
    var selector = _.cloneDeep(params);
    delete selector["input"];
    delete selector["from"];
    delete selector["to"];
    delete selector["esthetique"];
    delete selector["confort"];
    delete selector["multimedia"];
    delete selector["assistance"];
    if(text_usage) {
      selector["usage"] = text_usage;
    }
    console.log(selector, from, to);
    var data = [];
    var resultat = [];
    var actual_value = 100;
    if(!mydb) {
      callback(data);
    }
    mydb.find({ selector: selector }, function(err, result) {
      if (!err) {
        for (var i = 0; i < result.docs.length; i++) {
          if (result.docs[i].prix < to && result.docs[i].prix > from) {
            data.push(result.docs[i])
          }
        }
        for (var i = 0; i < data.length; i++) {
          var dif_confort = Math.abs(data[i].confort - confort);
          var dif_esthetique = Math.abs(data[i].esthetique - esthetique);
          var dif_assistance = Math.abs(data[i].assistance - assistance);
          var dif_multimedia = Math.abs(data[i].multimedia - multimedia);
          var total_dif = dif_confort + dif_esthetique + dif_assistance + dif_multimedia;
          if(total_dif<actual_value) {
            actual_value = total_dif;
            resultat.push(data[i])
          }
        }
        console.log(data);
        console.log(resultat);
        callback(resultat[resultat.length - 1]);
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
