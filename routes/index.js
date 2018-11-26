const express = require('express');
const router = express.Router();
const uuidv4 = require('uuid/v4');
const _ = require('lodash');

const assistant_delai = '6c7e70c7-be84-422d-9b45-8f0a45e8bc32';
const assistant_main = '8ad1f141-a944-4aac-b49c-d992c7b5fa62';
var context_array, usage, number, session_delai, session_main, user_id = null;

router.get('/', function(req, res, next) {
  context_array = [];
  session_delai = session_main  = usage = '';
  user_id = uuidv4();
  number = 0;
  if (!conversation) {
    console.log("Conversation non initialisée");
    res.render('error');
  } else {
    console.log("Conversation initialisée");
    createSession(assistant_main, function(result) {
      session_main = result.session_id;
      //
    });
    createSession(assistant_delai, function(result) {
      session_delai = result.session_id;
      //sendConversationMessage(assistant_delai,session_delai, '', function(result){console.log(result)});
    });
    res.render('index', {
      conversation: conversation
    });
  }
});

router.post('/', function(req, res, next) {
  var input = req.body.input;
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
        console.log('On a l"usage');
        sendConversationMessage(assistant_delai, session_delai, input, context_array[context_array.length - 1], function(result){
          console.log(response);
        });
      } else {
        sendConversationMessage(assistant_main, session_main, input, context_array[context_array.length - 1], function(result){
          console.log(response);
          saveDialog(user_id, req.body.input, response.output.text[0], context_array.length);
          var object = _.find(response.entities, 'entity');
          if(object) {
            //console.log(object);
            _.assign(response.context, {'usage' :object.entity});
            usage = object.entity;
          }
          number++;
          context_array.push(response.context);
          if(response.output.nodes_visited == 'Opening') {
            res.send([response.output.text[0], '', {}]);
          } else {
            res.send([response.output.text[0], '', {}]);
          }
        });
      }
    }
    else {
      console.log('Found');
      var myResponse = "We found a car which matches your expectation !"
      saveDialog(user_id, req.body.input, myResponse, number);
      res.send([myResponse, 'display_data', result]);
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

module.exports = router;
