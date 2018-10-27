var goals = require('./goals')

// These rules will move to Decision Composer

exports.getMacrogoals = function() {
  console.log('getting macrogoals')
  return [goals.MACROGOALmodel, goals.MACROGOALratings, goals.MACROGOALtrim_levels, goals.MACROGOALcolors, goals.MACROGOALinterior_color]
}

function addJustifiedMicrogoal(array, microgoal, justification) {
  array.push({
    'microgoal': microgoal,
    'justification': justification
  })
}

exports.getJustifiedMicrogoals = function(macrocontext, macrogoal) {
  var array = []
  if (macrogoal === goals.MACROGOALmodel) {
    addJustifiedMicrogoal(array, goals.MICROGOALmodel, 'I am asking in case you already know the model you want')
    addJustifiedMicrogoal(array, goals.MICROGOALnumber_of_passengers, 'I am asking because a 3008 has 5 seats only while a 5008 has 7 seats')
    addJustifiedMicrogoal(array, goals.MICROGOALnumber_of_dogs, 'I am asking because a dog counts almost as a passenger!')
    addJustifiedMicrogoal(array, goals.MICROGOALcarry_goods, 'I am asking because 5008 has much more space than 3008 for carrying goods!')
  }
  // if (macrogoal === goals.MACROGOALtop_priority) {
  // addJustifiedMicrogoal(array, goals.MICROGOALtop_priority)
  // }
  if (macrogoal === goals.MACROGOALratings) {
    addJustifiedMicrogoal(array, goals.MICROGOALratings)
  }
  if (macrogoal === goals.MACROGOALtrim_levels) {

    if (macrocontext.getRating(goals.Comfort_and_Convenience) > 3) {
      addJustifiedMicrogoal(array, goals.MICROGOALpark_in_the_city, 'I am asking because comfort and convenience are important to you and trim level Active has City Park driver assistance!')
    }

    if (macrocontext.getRating(goals.Safety) > 3) {
      addJustifiedMicrogoal(array, goals.MICROGOALdrive_in_the_mountain, 'I am asking because safety is important to you and trim level Active has front fog beams!')
    }

  }
  if (macrogoal === goals.MACROGOALcolors) {
    addJustifiedMicrogoal(array, goals.MICROGOALcolors)
  }
  if (macrogoal === goals.MACROGOALinterior_color) {
    addJustifiedMicrogoal(array, goals.MICROGOALinterior_color)
  }

  return array
}

exports.getJustifiedMicrogoals2 = function(macrocontext, macrogoal, callback) {
  callbcack(getJustifiedMicrogoals(macrocontext, macrogoal))
}

exports.getAdvice = function(macrocontext, microgoal) {
  if (microgoal === goals.MICROGOALcolors) {
    // if (macrocontext.getMacrogoalValue(goals.MACROGOALtop_priority) === goals.Safety) {
    if (macrocontext.getRating(goals.Safety) > 3) {
      return 'Safety is important to you, bear in mind that recent studies concluded that black cars were the most accident prone'
    }
  }

  if (microgoal === goals.MICROGOALinterior_color) {
    var number_of_dogs = macrocontext.getMicrogoalValue(goals.MICROGOALnumber_of_dogs)
    if (number_of_dogs == undefined) {
      return 'If you have dogs, we do not recommend black interior'
    } else if (number_of_dogs === 0) {
      return 'As you do not have a dog, any color would be good for you'
    } else if (number_of_dogs === 1) {
      return 'You have a dog! We do not recommend black interior'
    } else {
      return 'You have ' + number_of_dogs + ' dogs! We do not recommend black interior'
    }
  }
}

exports.getMacrogoalDefaultValue = function(macrogoal) {

  if (macrogoal === goals.MACROGOALmodel) {
    return 3008
  }

  if (macrogoal === goals.MACROGOALtrim_levels) {
    return goals.Access
  }

  return 'default'
}

function updateGoal(macrocontext, macrogoal, macrogoalValue, justification) {
  macrocontext.setMacrogoalValue(macrogoal, macrogoalValue, justification)
}

exports.updateGoals = function(macrocontext) {

  // MACROGOALmodel
  if (macrocontext.getMicrogoalValue(goals.MICROGOALmodel) !== '?') {
    updateGoal(macrocontext, goals.MACROGOALmodel, macrocontext.getMicrogoalValue(goals.MICROGOALmodel), 'This is the model that you specified')
  }

  if (macrocontext.getMicrogoalValue(goals.MICROGOALnumber_of_passengers) > 5) {
    updateGoal(macrocontext, goals.MACROGOALmodel, 5008, 'For more than 5 passengers we do recommend the 5008')
  }

  if (macrocontext.getMicrogoalValue(goals.MICROGOALnumber_of_passengers) +
    macrocontext.getMicrogoalValue(goals.MICROGOALnumber_of_dogs) > 5) {
    updateGoal(macrocontext, goals.MACROGOALmodel, 5008, 'For more than 5 passengers + dogs we do recommend the 5008')
  }

  if (macrocontext.getMicrogoalValue(goals.MICROGOALcarry_goods)) {
    updateGoal(macrocontext, goals.MACROGOALmodel, 5008, 'As you want to carry goods we do recommend the 5008')
  }

  // MACROGOALtop_priority
  // var top_priority = macrocontext.getMicrogoalValue(goals.MICROGOALtop_priority)
  // if (top_priority) {
  // updateGoal(macrocontext, goals.MACROGOALtop_priority, top_priority, 'This is the top priority that you specified')
  // }

  // MACROGOALratings
  var ratings = macrocontext.getMicrogoalValue(goals.MICROGOALratings)
  if (ratings) {
    console.log('YES!!! => ' + JSON.stringify(ratings, null, 2))
    updateGoal(macrocontext, goals.MACROGOALratings, ratings, 'These are the ratings that you specified')
  }

  // MACROGOALtrim_levels
  // var top_priority2 = macrocontext.getMacrogoalValue(goals.MACROGOALtop_priority)
  var drive_in_the_mountain = macrocontext.getMicrogoalValue(goals.MICROGOALdrive_in_the_mountain)
  // if (top_priority2 === goals.Safety && drive_in_the_mountain) {
  if (macrocontext.getRating(goals.Safety) > 3 && drive_in_the_mountain) {
    updateGoal(macrocontext, goals.MACROGOALtrim_levels, goals.Active, 'Safety is your top priority and you drive in the mountains, so we recommend the ' + goals.Active + ' trim level for its front fog beams')
  }
  var park_in_the_city = macrocontext.getMicrogoalValue(goals.MICROGOALpark_in_the_city)
  // if (top_priority2 === goals.Comfort_and_Convenience && park_in_the_city) {
  if (macrocontext.getRating(goals.Comfort_and_Convenience) > 3 && park_in_the_city) {
    updateGoal(macrocontext, goals.MACROGOALtrim_levels, goals.Active, 'Comfort and convenience are your top priority and you park in the city, so we recommend the ' + goals.Active + ' trim level for its City Park driver assistance')
  }

  // MACROGOALcolors
  var colors = macrocontext.getMicrogoalValue(goals.MICROGOALcolors)
  if (colors) { // Keep the test
    updateGoal(macrocontext, goals.MACROGOALcolors, colors, 'This is the color that you picked')
  }

  // MACROGOALcolors
  var interior_color = macrocontext.getMicrogoalValue(goals.MICROGOALinterior_color)
  if (interior_color) {
    updateGoal(macrocontext, goals.MACROGOALinterior_color, interior_color, 'This is the interior color that you picked')
  }
}

/* exports.getPrices = function(trim_level, color) {
  return {
    'trim_level': trim_level === goals.Access ? 27100 : 31100,
    'color': color === goals.White ? 0 : 650
  }
} */

exports.getPriceAndJustification = function(model, trim_level, color) {
  var priceTrimLevel
  console.log('model:' + model)
  if (model == '3008') {
    priceTrimLevel = trim_level === goals.Access ? 26300 : 28400;
  } else {
    priceTrimLevel = trim_level === goals.Access ? 27100 : 31100;
  }
  var trimLevelJustification = trim_level === goals.Access ? 'Promotion on Access' : 'Paris Motor Show price for Active'
  var priceColor = color === goals.White ? 0 : 650;
  var priceAndJustification = {
    'price': priceTrimLevel + priceColor,
    'justification': '' + priceTrimLevel + ' (' + trimLevelJustification + ') + ' + priceColor + ' (' + color + ')'
  }
  return priceAndJustification
}

exports.getDelayAndJustification = function(trim_level) {
  var date = new Date();
  var nbWeeks = trim_level === goals.Access ? 2 : 3;
  date = new Date(date.getFullYear(), date.getMonth(), date.getDate() + nbWeeks * 7, 0, 0, 0, 0);
  var delayAndJustification = {
    'date': ('' + date).substring(4, 10),
    'justification': 'Delay for ' + trim_level + ' is ' + nbWeeks + ' weeks'
  }
  return delayAndJustification
}
