var express = require('express');
var router = express.Router();

var context_array = [];
var number = 0;
var context = null;

/* GET home page. */
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
  conversation.message({
    input: {
      text: req.body.input
    },
    context: context_array[context_array.length - 1],
    workspace_id: '635a4d6e-022d-4e16-88d6-4844c2cdcc99'
  }, function(err, response) {
    if (err) {
      console.error(err);
    } else {
      var type = 'nothing';
      var name_image = '';
      console.log(response);
      //var rep = response.output.text;
      context = response.context;
      context_array[number] = response.context;
      number++;
      if (response.output.text == 'What is your priority ?') {
        type = "find_priority";
      }
      if (response.entities[0]) {
        //console.log(response.entities[0].entity);
        if (response.entities[0].entity == 'color') {
          type = "display_car";
          var color = response.entities[0].value;
          name_image = 'images/5008Access' + color + '.jpg';
        }
      }
      res.send([response, type, name_image]);
    }
  });
});


router.post('/giveinfo', function(req, res, next) {
  console.log(req.body);

  var value_security = req.body['input[Safety]'];
  var value_comfort = req.body['input[Comfort_and_Convenience]'];
  var value_vitesse = req.body['input[In_Car_Entertainment_and_Communication]'];
  var value_style = req.body['input[style]'];
  var dictionary = {
    "security": value_security,
    "comfort": value_comfort,
    "speed": value_vitesse,
    "style": value_style
  };
  // Create items array
  var items = Object.keys(dictionary).map(function(key) {
    return [key, dictionary[key]];
  });
  // Sort the array based on the second element
  items.sort(function(first, second) {
    return second[1] - first[1];
  });
  console.log(items);
  var value_max = items[0][0];
  console.log(value_max);
  conversation.message({
    input: {
      text: value_max
    },
    context: context_array[context_array.length - 1],
    workspace_id: '635a4d6e-022d-4e16-88d6-4844c2cdcc99'
  }, function(err, response) {
    if (err) {
      console.error(err);
    } else {
      console.log(response);
      res.send([response, "", ""]);
    }
  });

});

module.exports = router;
