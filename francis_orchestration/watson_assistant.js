// Set up Assistant service wrapper.
var AssistantV1 = require('watson-developer-cloud/assistant/v1')
var prompt = require('prompt-sync')()

var service = new AssistantV1({
  username: 'c19e4829-5b39-42f5-a3a5-370eb7c6174d',
  password: 'c2VoxIimdCsN',
  version: '2018-02-16'
})

var workspace_id = '49121608-3ca6-4d59-8b48-128ca7aa3c89'

exports.init = function(callback) {

  service.message({
      workspace_id: workspace_id
    },
    function(err, response) {
      if (err) {
        console.error(err);
        return
      }

      if (response.output.text.length != 0) {
        console.log('*** ' + response.output.text[0])
      }
      callback(response.context)
    })
}

exports.microchat = function(macrocontext, microgoalName, postMicrochatCallback) {
  macrocontext.watsonContext.microgoal = microgoalName

  service.message({
    workspace_id: workspace_id,
    input: {
      text: "hello"
    },
    context: macrocontext.watsonContext,
  }, builProcessResponseCallback(macrocontext, postMicrochatCallback))
}

function builProcessResponseCallback(macrocontext, postMicrochatCallback) {
  return function(err, response) {
    if (err) {
      console.error(err);
      return;
    }
    macrocontext.watsonContext = response.context
    if (response.output.text.length != 0) {
      console.log("*** " + response.output.text[0])
    }
    if (response.output.value == undefined) {
      service.message({
        workspace_id: workspace_id,
        input: {
          text: prompt('')
        },
        context: macrocontext.watsonContext,
      }, builProcessResponseCallback(macrocontext, postMicrochatCallback))
    } else {
      postMicrochatCallback(response.output.value)
    }
  }
}
