import * as $ from 'jquery'

export default function initUI(trainer, tankLogic, agent) {
  const inputEpochLen = $('#inputEpochLen')
  const inputEpisodeLen = $('#inputEpisodeLen')
  const inputActorLearningRate = $('#inputActorLearningRate')
  const inputCriticLearningRate = $('#inputCriticLearningRate')
  const inputDiscountRate = $('#inputDiscountRate')
  const inputReward = $('#inputReward')
  const settingsLock = $('#settingsLock')

  const inputs = [
    inputEpochLen,
    inputEpisodeLen,
    inputActorLearningRate,
    inputActorLearningRate,
    inputCriticLearningRate,
    inputDiscountRate,
    inputReward
  ]

  function disableForm() {
    inputs.forEach(i => i.prop('disabled', true))
    settingsLock.show()
  }

  function enableForm() {
    inputs.forEach(i => i.prop('disabled', !i.isEditable))
    settingsLock.hide()
  }

  inputEpochLen.val(trainer.epochSize)
  inputEpisodeLen.val(trainer.episodeTimeLimit)
  inputActorLearningRate.val(agent.actorLearningRate)
  inputCriticLearningRate.val(agent.criticLearningRate)
  inputDiscountRate.val(agent.discountRate)

  enableForm()
  inputReward.val(trainer.rewardType)

  window.addEventListener('fastMode', () => disableForm())
  window.addEventListener('previewMode', () => enableForm())

  editable(inputEpochLen, regexpValidator(/^[0-9]+$/), (v) => {
    trainer.epochSize = v
  })
  editable(inputEpisodeLen, regexpValidator(/^[0-9]+$/), (v) => {
    trainer.episodeTimeLimit = v
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
  input.on('focusout', () => onChange())
  input.on('keypress',function(e) {
    if(e.which == 13) {
      input.blur()
    }
});

}