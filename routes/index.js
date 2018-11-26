const express = require('express');
const router = express.Router();
const uuidv4 = require('uuid/v4');

const worskpace_delai = '82d35a5b-c0e2-4fd8-8ac9-df6248f0042d';
const worskpace_main = 'e3c52413-34fd-4dd3-b407-a84919a8251e';
var conversation_id, context_array  = null;

router.get('/', function(req, res, next) {
  context_array = [];
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
  var bdy = req.body;
  if(context_array.length == 0) {
    context_array.push({
      "context": {
        "Gear": req.body.bv,
        "Energy": req.body.energie,
        "budget": req.body.to,
        "vehicle": "5008",
        "timezone": "Europe/Paris",
        "conversation_id": conversation_id
      }
    });
  }
  console.log(context_array);
  makeCloudantRequest(bdy, function(result){
    if(result == null || result.length != 1) {
      console.log('Not found');
      conversation.message({
        input: {
          text: req.body.input
        },
        context: context_array[context_array.length - 1],
        workspace_id: worskpace_main
      }, function(err, response) {
        if (err) {
          console.error(err);
        } else {
          console.log(response);
          saveDialog(conversation_id, req.body.input, response.output.text[0], context_array.length);
          context_array.push(response.context);
          res.send([response.output.text[0], '', {}]);
        }
      });
    }
    else {
      console.log('Found');
      var myResponse = "We found a car which matches your expectation !"
      saveDialog(conversation_id, req.body.input, myResponse, number);
      res.send([myResponse, 'display_data', result]);
    }
  }.bind(req));
});

function makeCloudantRequest(params, callback) {
    var from = params["from"];
    var to = params["to"];
    delete params["input"];
    delete params["from"];
    delete params["to"];
    console.log(params);
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
