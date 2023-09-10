import * as $ from 'jquery'

export default function initUI(messageBus) {
  const inputEpochLen = $('#inputEpochLen')
  const inputEpisodeLen = $('#inputEpisodeLen')
  const inputLearningRate = $('#inputLearningRate')
  const settingsLock = $('#settingsLock')
  const inputEnv = $('#inputEnv')

  const inputs = [
    inputEpochLen,
    inputEpisodeLen,
    inputLearningRate,
    inputEnv
  ]

  function disableForm() {
    inputs.forEach(i => i.prop('disabled', true))
    settingsLock.show()
  }

  function enableForm() {
    inputs.forEach(i => i.prop('disabled', !i.isEditable))
    settingsLock.hide()
  }

  enableForm()

  messageBus.addEventListener('settings', ({data}) => {
    inputEpochLen.val(data.epochSize)
    inputEpisodeLen.val(data.episodeTimeLimit)
    inputLearningRate.val(data.learningRate)
    inputEnv.val(data.envId)
  })
  

  editable(inputEpochLen, regexpValidator(/^[0-9]+$/), (v) => {
    messageBus.send('config', {key: 'epochSize', value: Number(v)})
  })
  editable(inputEpisodeLen, regexpValidator(/^[0-9]+$/), (v) => {
    messageBus.send('config', {key: 'episodeTimeLimit', value: Number(v)})
  })

  editable(inputEnv, () => true, (v) => {
    messageBus.send('config', {key: 'envId', value: v})
  })

  editable(inputLearningRate, regexpValidator(/^[0-9\.]+$/), (v) => {
    messageBus.send('config', {key: 'learningRate', value: Number(v)})
  })

}


function regexpValidator(regexp) {
  return (val) => {
    if(regexp.test(val)) return true
    return "The value must match " + regexp.toString()
  }
}

function editable(input, validator, executor) {
  let isProcessing = false
  input.isEditable = true

  const onChange = () => {
    if(isProcessing) return
    isProcessing = true
    const newVal = input.val()
    const isValid = validator(newVal)
    if(isValid !== true) {
      alert(`Value "${newVal}" is invalid. ${isValid}.`)
      input.focus()
      input.select()
      setTimeout(() => { isProcessing = false })
      return
    }
    executor(newVal)
    isProcessing = false
  }
  input.prop('disabled', false);
  input.on('change', () => onChange())
  input.on('keypress',function(e) {
    if(e.which == 13) {
      input.blur()
    }
  });

}