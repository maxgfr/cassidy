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
    return
  }

  var question = microgoal.name

  if (microgoal === goals.MICROGOALmodel) {
    question = 'Do you already know what model you want? Type 3008, 5008 or "?"'
  } else if (microgoal === goals.MICROGOALtop_priority) {
    question = 'What is your top priority (' + goals.Safety + ', ' + goals.Comfort_and_Convenience + ', ' + goals.In_Car_Entertainment_and_Communication + ')?'

  }

  console.log('*** ' + question)
  console.log('--- justification: ' + justification)
  console.log('--- advice: ' + advice)
  postMicrochatCallback(prompt(''))

}
