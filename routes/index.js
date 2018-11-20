var express = require('express');
var router = express.Router();

var context_array = [];
var number = 0;
var context = null;

router.get('/', function(req, res, next) {
  context_array = [];
  number = 0;
  context = null;
  if (!conversation) {
    console.log("Conversation non initialisée");
    res.render('error');
  } else {
    console.log("Conversation initialisée");
    res.render('index', {
      conversation: conversation
    });
  }
});

router.post('/', function(req, res, next) {
  var message = req.body.input;
  var result = makeCloudantRequest(req.body);
  if(result.length != 1) {
    console.log('Not found');
    conversation.message({
      input: {
        text: msg
      },
      context: context_array[context_array.length - 1],
      workspace_id: '635a4d6e-022d-4e16-88d6-4844c2cdcc99'
    }, function(err, response) {
      if (err) {
        console.error(err);
      } else {
        console.log(response);
        var rep = response.output.text[0];
        context = response.context;
        context_array[number] = response.context;
        number++;
        res.send([rep, '', {}]);
      }
    });
  }
  else {
    console.log('Found');
    res.send(["We found a car which matches your expectation !", '', result]);
  }

});

function makeCloudantRequest(params) {
    var from = params["from"];
    var to = params["to"];
    delete params["input"];
    delete params["from"];
    delete params["to"];
    console.log(params);
    var data = [];
    if(!mydb) {
      return data;
    }
    mydb.find({ selector: params }, function(err, result) {
      if (!err) {
        //console.log('Found %d documents', result.docs.length);
        for (var i = 0; i < result.docs.length; i++) {
          if (result.docs[i].prix < to && result.docs[i].prix > from) {
            //console.log(result.docs[i])
            data.push(result.docs[i])
          }
        }
        return data;
      } else {
        console.log(err);
        return data;
      }
    });
}

module.exports = router;
