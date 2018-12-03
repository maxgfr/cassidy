const express = require('express');
const router = express.Router();
const uuidv4 = require('uuid/v4');
const _ = require('lodash');
const request = require('request');

const assistant_delai = 'da2663a3-b5b3-4784-856a-1d8bc7f80d3a';
const assistant_main = '31230de8-925f-42a8-99d3-0c6139733c71';
const assistant_max = '188405aa-5d2d-482a-a416-dcfaaec224eb';
var context_array,
  text_usage,
  text_color,
  num_msg,
  session_delai,
  session_main,
  session_max,
  user_id,
  isColor,
  isOptions,
  isDelai,
  car,
  price_all_options,
  options_odm,
  usage = null;

router.get('/', function(req, res, next) {
  user_id = uuidv4();
  car = {};
  options_odm = {};
  context_array = [];
  text_usage = text_color = '';
  isColor = isUsage = isOptions = isDelai = false;
  num_msg = price_all_options = 0;
  if (!conversation) {
    console.log("Conversation non initialisée");
    res.render('error');
  } else {
    console.log("Conversation initialisée");
    createSession(assistant_main, (result) => {
      session_main = result.session_id;
      console.log('Session main : ',session_main)
    });
    createSession(assistant_delai, (result) => {
      session_delai = result.session_id;
      console.log('Session delai : ',session_delai)
    });
    createSession(assistant_max, (result) => {
      session_max = result.session_id;
      console.log('Session max : ',session_max)
    });
    res.render('index', {
      conversation: conversation
    });
  }
});

router.post('/find_car', function(req, res, next) {
  var input = req.body.input;
  var additional = {
    from: req.body.from,
    to: req.body.to,
  }
  var selector = _.cloneDeep(req.body);
  delete selector["input"];
  delete selector["from"];
  delete selector["to"];
  if(context_array.length == 0) {
    context_array.push({
      "global": {
        "system": {
          "turn_count": 0
        }
      },
      "skills": {
        "main skill": {
          "user_defined": {
            "gearbox": req.body.bv,
            "energy": req.body.energie,
            "from": req.body.from,
            "to": req.body.to,
            "vehicle": '5008',
            "user_id": user_id
          }
        }
      }
    });
  }
  cloudantFindPreciselyCar(additional, selector, (result) => {
      if(result == null || result.length != 1) {
        sendConversationMessage(assistant_main, session_main, input, context_array[context_array.length - 1], function(response){
            var data = analyseResponse(response);
            if(data.entities.usage) {
              isUsage = true;
              text_usage = data.entities["usage"];
              _.assign(response.context, {'usage' : data.entities["usage"]});
              saveDialog(user_id, input, data.response, context_array.length);
              context_array.push(response.context);
              num_msg++;
              res.send([data.response, 'find_priority', {usage: text_usage}, '/find_closest_car']);
            } else {
              saveDialog(user_id, input, data.response, context_array.length);
              context_array.push(response.context);
              num_msg++;
              res.send([data.response, '', {usage: text_usage}, '/find_car']);
            }
          });
      }
      else {
        car = result[0];
        car["usage"]= '';
        saveDialog(user_id, input, "We found a car which matches your expectation ! Now, choose a color.", num_msg);
        res.send(["We found a car which matches your expectation ! Now, choose a color.", 'display_data', car, '/find_color']);
      }
    });
});

router.post('/find_closest_car', function(req, res, next) {
  var input = req.body.input;
  var additional = {
    from: req.body.from,
    to: req.body.to,
    esthetique: req.body.esthetique,
    confort: req.body.confort,
    multimedia: req.body.multimedia,
    assistance: req.body.assistance,
  }
  var selector = _.cloneDeep(req.body);
  selector["usage"] = text_usage;
  delete selector["input"];
  delete selector["from"];
  delete selector["to"];
  delete selector["esthetique"];
  delete selector["confort"];
  delete selector["multimedia"];
  delete selector["assistance"];
  cloudantFindClosestCar(additional, selector, function(myResult) {
    isCar = true;
    car = myResult;
    //console.log('Usage: ', text_usage);
    _.assign(car, {'usage' : text_usage});
    res.send(['We found a car that best matches your expectation. Now tell me the color', 'display_data', car, '/find_color']);
  });
});

router.post('/find_color', function(req, res, next) {
  console.log('FIND_COLOR')
  var input = req.body.input;
  sendConversationMessage(assistant_max, session_max, input, context_array[context_array.length - 1], function(response){
      var data = analyseResponse(response);
      if(data.entities["color"]) {
        isColor = true;
        text_color = data.entities["color"];
        console.log(text_color)
        _.assign(car, {'color' : text_color});
        decisionGet(car.modele.toUpperCase(), (result) => {
          options_odm = JSON.parse(result);
          car["prix"] = parseInt(car["prix"]) + 650;
          var reponseuh = 'Here is your new car. According to our stats, the users have choosen those options :';
          for(var i = 0; i< options_odm.resultat.PRIX.length; i++) {
            price_all_options += options_odm.resultat.PRIX[i];
          }
          for(var i = 0; i< options_odm.resultat.OPTIONS.length; i++) {
            reponseuh += '<br> - ' + options_odm.resultat.OPTIONS[i]
          }
          saveDialog(user_id, input, reponseuh, context_array.length);
          context_array.push(response.context);
          num_msg++;
          res.send([reponseuh, 'change_color', car, '/find_options']);
        });
      } else {
        saveDialog(user_id, input, data.response, context_array.length);
        context_array.push(response.context);
        num_msg++;
        res.send([data.response, '', car, '/find_color']);
      }
    });
});

router.post('/find_options', function(req, res, next) {
  var input = req.body.input;
  var val_uppercase = input.toUpperCase();
  if(val_uppercase == 'YES' || val_uppercase == 'NO') {
    var message = '';
    isOptions = true;
    if(val_uppercase == 'YES') {
      car['prix'] = parseInt(car["prix"]) + price_all_options;
      message = 'We updated the price with the options selected.';
    } else if(val_uppercase == 'NO') {
      message = 'It is ok, we will set 0 options.';
    }
    /*sendConversationMessage(assistant_delai, session_delai, '', context_array[context_array.length - 1], function(response){
        var data = analyseResponse(response);
        message += '<br>' + data.response;
        res.send([message, 'display_data', car, '/find_delai']);
      });*/
  } else {
    res.send(['Can you tell me yes or no instead of saying complex sentences, I\'m so tiredddd today', 'display_data', car, 'find_options']);
  }
});

router.post('/find_delai', function(req, res, next) {
  var input = req.body.input;
  console.log(input);
  sendConversationMessage(assistant_delai, session_delai, input, context_array[context_array.length - 1], function(response){
      var data = analyseResponse(response);
      if(data.entities["sys-number"]) {
        isDelai = true;
        var additional = {
          from: req.body.from,
          to: req.body.to,
          esthetique: req.body.esthetique,
          confort: req.body.confort,
          multimedia: req.body.multimedia,
          assistance: req.body.assistance,
        }
        var selector = _.cloneDeep(req.body);
        selector["usage"] = text_usage;
        delete selector["input"];
        delete selector["from"];
        delete selector["to"];
        delete selector["esthetique"];
        delete selector["confort"];
        delete selector["multimedia"];
        delete selector["assistance"];
        cloudantFindClosestCar(additional, selector, function(myResult) {
          car = myResult;
          res.send([data.response+'<br>'+'Here is the car', 'display_data', car, '/find_delai']);
        });
      }
      else {
        saveDialog(user_id, input, data.response, context_array.length);
        context_array.push(response.context);
        num_msg++;
        res.send([data.response, '', car, '/find_delai']);
      }

    });

});

function analyseResponse (response) {
  var chatbot_rep =  "";
  var entity_rep = [];
  for(var i=0; i<response.output.generic.length; i++) {
    //console.log(response.output.generic[i]);
    chatbot_rep += response.output.generic[i].text + '. ';
  }
  for(var i=0; i<response.output.entities.length; i++) {
    //console.log(response.output.entities[i]);
    entity_rep[response.output.entities[i].entity] = response.output.entities[i].value;
  }
  return {entities: entity_rep, response: chatbot_rep};
}

function cloudantFindClosestCarInventary(additional, params, callback) {
    var data = [];
    var resultat = [];
    var actual_value = 100;
    if(!mydb) {
      callback(null);
    }
    mydb.find({ selector: params }, function(err, result) {
      if (!err) {
        for (var i = 0; i < result.docs.length; i++) {
          if (result.docs[i].prix < additional.to && result.docs[i].prix > additional.from) {
            data.push(result.docs[i])
          }
        }
        for (var i = 0; i < data.length; i++) {
          var dif_confort = Math.abs(data[i].confort - additional.confort);
          var dif_esthetique = Math.abs(data[i].esthetique - additional.esthetique);
          var dif_assistance = Math.abs(data[i].assistance - additional.assistance);
          var dif_multimedia = Math.abs(data[i].multimedia - additional.multimedia);
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
        callback(null);
      }
    });
}

function cloudantFindPreciselyCar(additional, params, callback) {
    var data = [];
    if(!mydb) {
      callback(data);
    }
    mydb.find({ selector: params }, function(err, result) {
      if (!err) {
        for (var i = 0; i < result.docs.length; i++) {
          if (result.docs[i].prix < additional.to && result.docs[i].prix > additional.from) {
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

function cloudantFindClosestCar(additional, params, callback) {
    var data = [];
    var resultat = [];
    var actual_value = 100;
    if(!mydb) {
      callback(null);
    }
    mydb.find({ selector: params }, function(err, result) {
      if (!err) {
        for (var i = 0; i < result.docs.length; i++) {
          if (result.docs[i].prix < additional.to && result.docs[i].prix > additional.from) {
            data.push(result.docs[i])
          }
        }
        for (var i = 0; i < data.length; i++) {
          var dif_confort = Math.abs(data[i].confort - additional.confort);
          var dif_esthetique = Math.abs(data[i].esthetique - additional.esthetique);
          var dif_assistance = Math.abs(data[i].assistance - additional.assistance);
          var dif_multimedia = Math.abs(data[i].multimedia - additional.multimedia);
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
        callback(null);
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
          'text': msg,
          'options': {
            'return_context': true
          }
        }
      }, function(err, response) {
      if (err) {
        console.error(err);
      } else {
        //console.log(response);
        //console.log(JSON.stringify(response, null, 2));
        callback(response);
      }
    });
}

function decisionGet (mdl, callback) {
  var headers = {
      'Content-Type': 'application/json',
      'Authorization': 'ApiKey '+process.env.DECISION_API_KEY
  };

  var dataString = '{"modele":"'+mdl+'"}';

  var options = {
      url: process.env.DECISION_URL,
      method: 'POST',
      headers: headers,
      body: dataString
  };

  console.log(options);

  request(options, function(error, response, body) {
      if (!error && response.statusCode == 200) {
          //console.log(body);
          callback(body);
      }
  });
}

module.exports = router;
