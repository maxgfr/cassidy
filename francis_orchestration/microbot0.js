// KEPT ONLY FOR THE RECORD
var param = require('./param')
var prompt = require('prompt-sync')()
var goals = require('./goals')
if (param.useWatson) {
  var watson_assistant = require('./watson_assistant')
}

exports.getValue = function(macrocontext, justifiedMicrogoal, postMicrochatCallback, advice) {

  var microgoal = justifiedMicrogoal.microgoal
  var justification = justifiedMicrogoal.justification

  if (microgoal === goals.MICROGOALmodel && param.useWatson) {
    // macrocontext.watsonContext.microgoal = goals.predefined_model
    watson_assistant.microchat(macrocontext, microgoal.name, postMicrochatCallback)
  } else if (microgoal === goals.MICROGOALmodel) {
    var value = prompt('Do you already know what model you want (3008, 5008)?' + ' ').toUpperCase()

    if (value.includes('5008')) {
      value = '5008'
    } else if (value.includes('3008')) {
      value = '3008'
    } else if (value.includes('YES') || value.includes('YEP') || value.includes('I DO') || value === 'Y') {
      value = prompt('Tell me: ')
      if (value.includes('5008')) {
        value = '5008'
      } else if (value.includes('3008')) {
        value = '3008'
      } else {
        console.log('Sorry, I did not understand.')
        value = '?'
      }
    } else {
      value = '?'
    }
    if (value === '?') {
      console.log("Let's determine the model")
    }
    postMicrochatCallback(value)

  } else if (microgoal === goals.MICROGOALtop_priority) {
    console.log('*** What is your top priority among the following?')
    console.log('*** ' + goals.Safety)
    console.log('*** ' + goals.Comfort_and_Convenience)
    console.log('*** ' + goals.In_Car_Entertainment_and_Communication)
    console.log('*** ' + goals.Interior_Features)
    console.log('*** ' + goals.Exterior_Features)
    console.log('*** ' + goals.Exterior_Lighting_and_Visibility)
    console.log('*** ' + goals.Seating)
    postMicrochatCallback(prompt(''))

  } else if (microgoal === goals.MICROGOALcolors) {
    console.log('*** What color do you pick? Options are ' + goals.White + ', ' + goals.Gray + ' and ' + goals.Black)
    var response = prompt('').toUpperCase()
    if (response.includes('ADVICE') || response.includes('ADVISE') || response.includes('RECOMMEND') || response.includes('SUGGEST')) {
      console.log('*** ' + (advice || 'I have no specific advice for the current context'))
      console.log('*** So what color would you like?')
      response = prompt('').toUpperCase()
    }
    postMicrochatCallback(response.startsWith('G') ? goals.Gray :
      response.startsWith('B') ? goals.Black : goals.White)

  } else {
    console.log('*** ' + microgoal.name)

    var value
    while (true) {
      value = prompt('').toUpperCase()
      if (value.includes('WHY') && value.toUpperCase().includes('?')) {
        console.log(justification)
        continue
      }
      if (value.includes('ADVICE') || value.includes('ADVISE') || value.includes('RECOMMEND') || value.includes('SUGGEST')) {
        console.log('*** ' + (advice || 'I have no specific advice for the current context'))
        continue
      }
      break
    }

    postMicrochatCallback(value)
}

}
