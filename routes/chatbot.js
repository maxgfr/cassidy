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
    res.render('chatbot.index', {
      conversation: conversation
    });
  }
});

function postV1() {
  router.post('/', function(req, res, next) {
    //console.log(req.body.input);
    //console.log(context);
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
            name_image = 'images/Access' + color + '.jpg';
          }
        }
        res.send([response, type, name_image]);
      }
    });
  });
}

var macrocontext = require('../francis_orchestration/macrocontext').createInstance()

// TODO:
//  - init only wwhen page refreshed
//  - Show image, and then the question
//  - Associate to session
//  - Do callback for below

function postV2() {
  router.post('/', function(req, res, next) {

    if (!req.body.input) {
      macrocontext.init()
    }
    var prompt2 = macrocontext.processResponse(req.body.input)

    var text = prompt2.output ? prompt2.output : 'We are done! Are you ready to order?'

    var response = {
      'output': {
        'text': [text]
      }
    }

    var type = 'nothing'
    var image = ''

    if (prompt2.options) {
      console.log('prompt2.options:')
        console.log(prompt2.options)
      type = 'display_car'
      image = {
        'name_image': 'images/' + prompt2.options.image + '.jpg',
        'justifications': [{
          'text': prompt2.options.model.value,
          'justification': prompt2.options.model.justification
        }, {
          'text': prompt2.options.trim_level.value,
          'justification': prompt2.options.trim_level.justification
        }, {
          'text': prompt2.options.color.value,
          'justification': prompt2.options.color.justification
        }, {
          'text': prompt2.options.price.value,
          'justification': prompt2.options.price.justification
        }, {
          'text': prompt2.options.delay.date,
          'justification': prompt2.options.delay.justification
        }]
      }
    }

    // if (text.includes('What is your top priority')) { // // TODO: Improve
    if (text.includes('What is important to you?')) {
      console.log('******* YES ********>')
      type = "find_priority"
    }

    res.send([response, type, image]);
  });
}

postV2()

function giveinfo1() {
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
}

function giveinfo2() {
  router.post('/giveinfo', function(req, res, next) {
    // console.log(req.body);
    /*
    var value_security = req.body['input[security]'];
    var value_comfort = req.body['input[confort]'];
    var value_vitesse = req.body['input[vitesse]'];
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
    */

console.log(req.body)
console.log(req.body['input[Safety]'])
// macrocontext.ratings = req.body
// macrocontext.setMicrogoalValue(goals.MICROGOALratings, req.body)
// console.log(macrocontext.ratings['input[Safety]'])
    var prompt2 = macrocontext.processResponse(req.body)

    var text = prompt2.output ? prompt2.output : 'We are done! Are you ready to order?'

    var response = {
      'output': {
        'text': [text]
      }
    }
    var type = 'nothing'
    var image = ''

    res.send([response, type, image]);
  })
}

giveinfo2()

module.exports = router;
