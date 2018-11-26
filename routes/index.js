const express = require('express');
const router = express.Router();
const uuidv4 = require('uuid/v4');
const _ = require('lodash');

const worskpace_delai = '82d35a5b-c0e2-4fd8-8ac9-df6248f0042d';
const worskpace_main = 'e3c52413-34fd-4dd3-b407-a84919a8251e';
var conversation_id, context_array, usage, number = null;

router.get('/', function(req, res, next) {
  context_array = [];
  conversation_id = '';
  usage= '';
  number = 0;
  if (!conversation) {
    console.log("Conversation non initialisée");
    res.render('error');
  } else {
    console.log("Conversation initialisée");
    conversation.message({
      input: { text: '' },
      workspace_id: worskpace_main
    }, function(err, response) {
      if (err) {
        console.error(err);
      } else {
        console.log(response);
        conversation_id = response.context.conversation_id;
        res.render('index', {
          conversation: conversation
        });
      }
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
      conversation_id: conversation_id
    });
  }
  //console.log(context_array);
  makeCloudantRequest(req.body, function(result){
    if(result == null || result.length != 1) {
      console.log('Not found');
      if(usage) {
        console.log('On a l"usage');
      } else {
        conversation.message({
          input: {
            text: input
          },
          context: context_array[context_array.length - 1],
          workspace_id: worskpace_main
        }, function(err, response) {
          if (err) {
            console.error(err);
          } else {
            console.log(response);
            saveDialog(conversation_id, req.body.input, response.output.text[0], context_array.length);
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
          }
        });
      }
    }
    else {
      console.log('Found');
      var myResponse = "We found a car which matches your expectation !"
      saveDialog(conversation_id, req.body.input, myResponse, number);
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
    mydb.insert({ "conversation_id": conv_uid, "question": question, "response": response, "ordre": order}, function(err, body, header) {
      if (err) {
        console.log('[mydb.insert] ', err.message);
      }
      console.log("New entry in the database");
    });
}

module.exports = router;
