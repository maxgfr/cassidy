var prompt = require('prompt-sync')()
const wallpaper = require('wallpaper');
var macrocontext_factory = require('./macrocontext')


wallpaper.set('images/Gray.jpg')
var macrocontext = macrocontext_factory.createInstance()
var response
while (true) {

  var prompt2 = macrocontext.processResponse(response)
  console.log(JSON.stringify(prompt2, null, 2))

  if (prompt2.options) {
    prompt('Type to see your new options:')
    wallpaper.set('images/' + prompt2.options.image + '.jpg')
  }

  if (prompt2.output) {
    response = prompt(' ****************** ' + prompt2.output + ': ')
  } else {
    break
  }
}
wallpaper.set('images/Gray.jpg')
