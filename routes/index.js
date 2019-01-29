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
  choose_car,
  usage = null;

router.get('/', function(req, res, next) {
  user_id = uuidv4();
  car = options_odm = {};
  context_array = choose_car = [];
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
              res.send([data.response, '', {}, '/find_car']);
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
    if(myResult == null) {
      res.send(['We don\'t find a car which matches those criterias with this usage : '+text_usage+ '. Please tell me another usage :', '', {}, '/find_car']);
    } else {
      isCar = true;
      car = myResult;
      _.assign(car, {'usage' : text_usage});
      res.send(['We found a car that best matches your expectation. Now tell me the color', 'display_data', car, '/find_color']);
    }
  });
});

router.post('/find_color', function(req, res, next) {
  console.log('FIND_COLOR')
  var input = req.body.input;
  sendConversationMessage(assistant_max, session_max, input, context_array[context_array.length - 1], function(response){
      var data = analyseResponse(response);
      if(data.entities["color"]) {
        isColor = true;
        text_color = data.entities["color"].toUpperCase();
        console.log(text_color)
        _.assign(car, {'color' : text_color});
        decisionGet(car.modele.toUpperCase(), (result) => {
          options_odm = JSON.parse(result);
          car["prix"] = parseInt(car["prix"]) + 650;
          var reponseuh = 'Here is your new car. People who have selected this trim have also chosen these options :<br>';
          for(var i = 0; i< options_odm.resultat.OPTIONS.length; i++) {
            reponseuh += '<br><input type="checkbox" name="options[]" value="'+options_odm.resultat.PRIX[i]+'"> '+options_odm.resultat.OPTIONS[i]+ ' - ' + options_odm.resultat.PRIX[i] + '€';
          }
          reponseuh += '<br><br><button id="validate_options" class="btn btn-md" style="background: #1976d2; border: none; color: white;">DONE</button>';
          saveDialog(user_id, input, reponseuh, context_array.length);
          context_array.push(response.context);
          num_msg++;
          res.send([reponseuh, 'change_color', car, '/find_options']);
        });
      } else {
        saveDialog(user_id, input, data.response, context_array.length);
        context_array.push(response.context);
        num_msg++;
        res.send([data.response, '', {}, '/find_color']);
      }
    });
});

router.post('/find_options', function(req, res, next) {
  var input = req.body.input;
  var price_all_options = req.body.price_options;
  console.log(price_all_options)
  isOptions = true;
  car['prix'] = parseInt(car["prix"]) + parseInt(price_all_options);
  if (parseInt(price_all_options) == 0) {
    message = 'Right. You have selected 0 options.';
  } else {
    message = 'We updated the price with the options selected.';
  }
  sendConversationMessage(assistant_delai, session_delai, '', context_array[context_array.length - 1], function(response){
      var data = analyseResponse(response);
      message += data.response;
      res.send([message, 'display_data', car, '/find_delai']);
  });
});

router.post('/find_delai', function(req, res, next) {
  var input = req.body.input;
  console.log(input);
  sendConversationMessage(assistant_delai, session_delai, input, context_array[context_array.length - 1], function(response){
      var data = analyseResponse(response);
      if(data.entities["sys-number"]) {
        isDelai = true;
        var watson_delay = 0;
        if(data.entities["period"] == 'months') {
          watson_delay = data.entities["sys-number"] * 30;
        }
        if(data.entities["period"] == 'weeks') {
          watson_delay = data.entities["sys-number"] * 7;
        }
        if(data.entities["period"] == 'days') {
          watson_delay = data.entities["sys-number"];
        }
        var additional = {
          from: req.body.from,
          to: req.body.to,
          delai: String(watson_delay)
        }
        var selector = _.cloneDeep(req.body);
        selector["usage"] = text_usage;
        selector["inventary"] = true;
        delete selector["input"];
        delete selector["bv"];
        delete selector["energie"];
        delete selector["from"];
        delete selector["to"];
        cloudantFindClosestCarInventary(additional, selector, function(myResult) {
          if(myResult == null || myResult.length == 0) {
            res.send(['We don\'t find a car in our WIP & Inventary which matches your criterias, so your potential car is not updated.', '', {}, '/final']);
          } else {
            var resp = data.response;
            choose_car = myResult;
            var num = 1;
            resp += '-> 0 to keep your initial choice<br>.';
            for (var i=0; i<myResult.length; i++) {
              var days = parseInt(myResult[i].delai);
              var weeks =  parseInt(days / 7)
              if(weeks == 0) {
                weeks = 'right now';
              }
              resp += '-> '+num+' choice<br>';
              resp += '&emsp;Model: <span style="color:#f3f716">'+myResult[i].modele+'</span><br>';
              resp += '&emsp;Color: <span style="color:#f3f716">'+myResult[i].color+'</span><br>';
              resp += '&emsp;Usage: <span style="color:#f3f716">'+myResult[i].usage+'</span><br>';
              resp += '&emsp;Energy: <span style="color:#f3f716">'+myResult[i].energie+'</span><br>';
              resp += '&emsp;Gearbox: <span style="color:#f3f716">'+myResult[i].bv+'</span><br>';
              resp += '&emsp;Options: <span style="color:#f3f716">'+myResult[i].options+'</span><br>';
              resp += '&emsp;Price: <span style="color:#f3f716">'+myResult[i].prix+'</span><br>';
              resp += '&emsp;Time Limit: <span style="color:#f3f716">'+weeks+' weeks</span><br>.';
              num++;
            }
            resp += 'Now, tell me the corresponding number for your choice';
            res.send([resp, '', {}, '/choose_car']);
          }
        });
      }
      else {
        saveDialog(user_id, input, data.response, context_array.length);
        context_array.push(response.context);
        num_msg++;
        res.send([data.response, '', {}, '/find_delai']);
      }

    });

});

router.post('/choose_car', function(req, res, next) {
  var result_number = parseInt(req.body.input) - 1;
  if(!isNumber(result_number)) {
    res.send(['Tell me a good number please...', '', {}, '/choose_car']);
  } else {
    if(result_number !=0) {
      console.log(car);
      var car_choosen = choose_car[result_number];
      var color = car_choosen.color;
      car.bv = car_choosen.bv;
      car.energie = car_choosen.energie;
      car.modele = car_choosen.modele;
      car.usage = car_choosen.usage;
      car.delai = car_choosen.delai;
      car.price = parseInt(car_choosen.prix);
      car.color = color.toUpperCase();
      console.log(car);
      res.send(['We will order the car that you selected.', 'change_color', car, '/final']);
    } else {
      res.send(['Right, you keep your initial choice.', '', {}, '/final']);
    }

  }
});

router.post('/final', function(req, res, next) {
    res.send(['I have finished to help you. :)', '', {}, '/final']);
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
    if(!mydb) {
      callback(null);
    }
    mydb.find({ selector: params }, function(err, result) {
      if (!err) {
        for (var i = 0; i < result.docs.length; i++) {
          if (result.docs[i].prix < additional.to && result.docs[i].prix > additional.from &&result.docs[i].delai < additional.delai) {
            data.push(result.docs[i])
          }
        }
        console.log(data);
        callback(data);
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

function isNumber(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

module.exports = router;
