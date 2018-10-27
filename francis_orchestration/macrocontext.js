var goals = require('./goals')
var rules = require('./rules')
var macrogoals = rules.getMacrogoals()

let This_is_the_default_value = 'This is the entry level'

exports.createInstance = function() {
  var macrocontext = {}

  macrocontext.init = function() {
    console.log('initializing')
    this.macrogoalValues = {}
    this.microgoalValues = {}
    this.askedWhy = false
    this.askedAdvice = false
    // this.forceDefaultMacrogoals() // In the case the first macrogoals have no micrigoals (or are filled-in from a database)
    this.processResponse(undefined)
  }

  macrocontext.getMicrogoalValue = function(microgoal) {
    return this.microgoalValues[microgoal.name]
  }

  macrocontext.setMicrogoalValue = function(microgoal, value) {
    this.microgoalValues[microgoal.name] = value
  }

  macrocontext.getMacrogoalValue = function(macrogoal) {
    var record = this.macrogoalValues[macrogoal.name]
    if (record) {
      return record.value
    }
  }

  macrocontext.getRating = function(rating) {
    var record = this.macrogoalValues[goals.MACROGOALratings.name]
    if (record) {
      return record.value['input[' + rating + ']']
    }
  }

  macrocontext.getMacrogoalJustification = function(macrogoal) {
    var record = this.macrogoalValues[macrogoal.name]
    if (record) {
      return record.justification
    }
  }

  macrocontext.setMacrogoalValue = function(macrogoal, value, justification) {
    this.macrogoalValues[macrogoal.name] = {
      'value': value,
      'justification': justification
    }
  }

  macrocontext.dumpValues = function() {
    console.log('  Dump:')
    for (var key in this.microgoalValues) {
      console.log('    ' + key + ' => ' + this.microgoalValues[key])
    }
    for (var key in this.macrogoalValues) {
      console.log('    ' + key + ' => ' + JSON.stringify(this.macrogoalValues[key], null, 10))
    }
  }

  macrocontext.getNextUndefinedMacrogoal = function() {
    for (var i = 0; i < macrogoals.length; i++) {
      if (this.getMacrogoalValue(macrogoals[i]) == undefined) {
        return macrogoals[i]
      }
    }
  }

  macrocontext.getNextUndefinedJustifiedMicrogoal = function(macrogoal) {
    var justifiedMicrogoals = rules.getJustifiedMicrogoals(this, macrogoal)
    // console.log('Here ' + JSON.stringify(justifiedMicrogoals, null, 2))
    for (var j = 0; j < justifiedMicrogoals.length; j++) {
      var justifiedMicrogoal = justifiedMicrogoals[j]
      if (this.getMicrogoalValue(justifiedMicrogoal.microgoal) == undefined) {
        return justifiedMicrogoal
      }
    }
  }

  macrocontext.forceDefaultMacrogoals = function() { // TODO: Put at beginning too
    // Makes sure the next unset macrogoal has an unset microgoal
    // DO NOT APPLY DEFAULT PAST THAT UNSET MACROGOAL
    this.justifiedMicrogoal = undefined
    for (var i = 0; i < macrogoals.length; i++) {

      if (this.getMacrogoalValue(macrogoals[i]) != undefined) {
        // console.log('>> skipping ' + macrogoals[i].name + ' because it is set')
        continue
      } // SKIP THE FIRST SET MACROGOALS

      var unsetMicrogoal = this.getNextUndefinedJustifiedMicrogoal(macrogoals[i])
      if (!unsetMicrogoal) {
        // console.log('>> FORCING DEFAULT VALUE FOR ' + macrogoals[i].name)
        this.setMacrogoalValue(macrogoals[i], rules.getMacrogoalDefaultValue(macrogoals[i]), This_is_the_default_value)
        continue
      }
      this.justifiedMicrogoal = unsetMicrogoal
      break // STOP AS THE RULES THAT DETERMINR MICROGOALS ARE DYNAMIC
    }
  }

  macrocontext.getPrompt = function() {

    if (this.askedWhy) {
      var justification = this.justifiedMicrogoal.justification
      return {
        'output': justification != undefined ? justification : 'This is an important question to define the best car for you'
      }
    }

    if (this.askedAdvice) {
      var advice = rules.getAdvice(this, this.justifiedMicrogoal.microgoal)
      return {
        'output': advice != undefined ? advice : 'It\'s up to you'
      }
    }

    var prompt = {}

    if (this.optionsUpdated) {
      prompt.options = this.options
    }

    if (this.justifiedMicrogoal) {
      prompt.output = this.justifiedMicrogoal.microgoal.name
    }

    return prompt

    var macrogoal = this.getNextUndefinedMacrogoal();
    if (!macrogoal) {
      // console.log(' // you are all set')
      return prompt
    }

    // The next does not return undefined because if a macrogoal has no undefined microgoal
    // the value of this macrogoal is set either by a rule, or as a default value
    var justifiedMicrogoal = this.getNextUndefinedJustifiedMicrogoal(macrogoal);
    // console.log('justifiedMicrogoal=' + JSON.stringify(justifiedMicrogoal, null, 2))
    this.justifiedMicrogoal = justifiedMicrogoal
    prompt.output = justifiedMicrogoal.microgoal.name

    return prompt
  }

  macrocontext.processResponse = function(response) {

    if (response != undefined && response !== '') {
      if (this.justifiedMicrogoal.microgoal.type !== 'json') {
        if (response.toUpperCase().includes('WHY') && response.includes('?')) {
          var justification = this.justifiedMicrogoal.justification
          return {
            'output': justification != undefined ? justification : 'This is an important question to define the best car for you'
          }
        }

        if (response.toUpperCase().includes('ADVI')) {
          var advice = rules.getAdvice(this, this.justifiedMicrogoal.microgoal)
          return {
            'output': advice != undefined ? advice : 'It\'s up to you'
          }
        }

        this.askedWhy = response.toUpperCase().includes('WHY') && response.includes('?')
        this.askedAdvice = response.toUpperCase().includes('ADVI')

        if (this.askedWhy || this.askedAdvice) {
          return
        }
      }
      var value

      if (this.justifiedMicrogoal.microgoal.type === 'int') {
        value = Number(response)

      } else if (this.justifiedMicrogoal.microgoal.type === 'boolean') {
        value = response.toUpperCase()
        value = value === 'Y' || value === 'YES' || value === 'TRUE'

      } else if (this.justifiedMicrogoal.microgoal === goals.MICROGOALmodel) {

        if (response.includes('5008')) {
          value = '5008'
          console.log('value=' + value)
        } else if (response.includes('3008')) {
          value = '3008'
        } else if (containsOneOf(response, ['6', '7', 'six', 'seven', 'big', 'huge', 'expensive'])) {
          value = '5008'
        } else if (containsOneOf(response, ['2', '3', '4', '5', 'two', 'three', 'four', 'five', 'small', 'medium', 'regular', 'cheap'])) {
          value = '3008'
        } else {
          value = '?'
        }
      } else if (this.justifiedMicrogoal.microgoal === goals.MICROGOALcolors) {
        value = response.toUpperCase()
        if (value === goals.Green.toUpperCase()) {
          value = goals.Green
        } else {
          value = value.startsWith('G') ? goals.Gray :
            value.startsWith('B') ? goals.Black : goals.White
        }
      } else {
        value = response
      }

      this.setMicrogoalValue(this.justifiedMicrogoal.microgoal, value)
    }

    var prompt = {}

    // Rename macrogoals
    rules.updateGoals(this)
    // and now, if there are macrogoals unset with no microgoals unset, force the default value
    this.forceDefaultMacrogoals() // Put in module rules

    this.updateOptions()

    if (this.optionsUpdated) {
      prompt.options = this.options
    }

    if (this.justifiedMicrogoal) {
      switch (this.justifiedMicrogoal.microgoal) {
        case goals.MICROGOALcarry_goods:
          prompt.output = 'Will you carry large or heavy items?'
          break
        case goals.MICROGOALcolors:
          prompt.output = 'What exterior color (Black, White, Gray, Green)?'
          break
        case goals.MICROGOALdrive_in_the_mountain:
          prompt.output = 'Will you drive in the mountain?'
          break
        case goals.MICROGOALinterior_color:
          prompt.output = 'What interior color (Black, White)?'
          break
        case goals.MICROGOALmodel:
          prompt.output = 'Do you have a model in mind, such as 3008, 5008?'
          break
        case goals.MICROGOALnumber_of_dogs:
          prompt.output = 'How many dogs do you have?'
          break
        case goals.MICROGOALnumber_of_passengers:
          prompt.output = 'How many passengers will there be, driver included?'
          break
        case goals.MICROGOALpark_in_the_city:
          prompt.output = 'Will you park in the city?'
          break
        case goals.MICROGOALratings:
          prompt.output =
            'What is important to you?'
          break
        case goals.MICROGOALtrim_levels: // Not used
          prompt.output = 'What trim level do you have in mind?'
          break
        default:
          prompt.output = this.justifiedMicrogoal.microgoal.name
      }
    }

    return prompt
  }

  macrocontext.updateOptions = function() {

    var options

    if (this.getMacrogoalValue(goals.MACROGOALmodel) == 3008 || this.getMacrogoalValue(goals.MACROGOALmodel) == 5008) {
      var options = {
        'model': {
          'value': this.getMacrogoalValue(goals.MACROGOALmodel),
          'justification': this.getMacrogoalJustification(goals.MACROGOALmodel)
        },
        'trim_level': {
          'value': this.getMacrogoalValue(goals.MACROGOALtrim_levels) || goals.Access,
          'justification': this.getMacrogoalJustification(goals.MACROGOALtrim_levels) || This_is_the_default_value
        },
        'color': {
          'value': this.getMacrogoalValue(goals.MACROGOALcolors) || goals.White,
          'justification': this.getMacrogoalJustification(goals.MACROGOALcolors) || This_is_the_default_value
        }
      }

      var priceAndJustification = rules.getPriceAndJustification(options.model.value, options.trim_level.value, options.color.value)

      options.price = {
        'value': formatPrice(priceAndJustification.price),
        'justification': priceAndJustification.justification
      }

      var delayAndJustification = rules.getDelayAndJustification(options.trim_level.value)

      options.delay = delayAndJustification

      options.image = options.model.value + options.trim_level.value + options.color.value
    }

    this.optionsUpdated = !this.match(options, this.options)

    this.options = options
  }

  macrocontext.match = function(options1, options2) {
    var undefined1 = options1 == undefined
    var undefined2 = options2 == undefined
    if (undefined1 || undefined2) {
      return undefined1 && undefined2
    }
    return options1.model.value === options2.model.value &&
      options1.trim_level.value === options2.trim_level.value &&
      options1.color.value === options2.color.value
  }

  macrocontext.init()

  return macrocontext
}

function formatPrice(price) {
  var thousand_separator = ',';

  var price_string = price.toString(),
    rest = price_string.length % 3,
    result = price_string.substr(0, rest),
    thousands = price_string.substr(rest).match(/\d{3}/gi);

  if (thousands) {
    separator = rest ? thousand_separator : '';
    result += separator + thousands.join(thousand_separator);
  }

  result += '€'

  return result
}

function containsOneOf(str, array) {
  var str2 = str.toUpperCase()
  var r = false
  array.forEach(function(item, index, array2) {
    if (str2.includes(item.toUpperCase())) {
      r = true
    }
  })
  return r
}
