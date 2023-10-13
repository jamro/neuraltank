import * as $ from 'jquery'

export default function initUI(messageBus) {
  const inputShooterNetworkEnabled = $('#input-shooter-enabled')
  const inputDriverNetworkEnabled = $('#input-driver-enabled')
  const inputShooterNetworkTrainable = $('#input-shooter-trainable')
  const inputDriverNetworkTrainable= $('#input-driver-trainable')
  const inputReload = $('#input-reload')
  const inputReloadLabel = $('#input-reload-label')
  const inputTrainingStage = $('#inputTrainingStage')
  const inputEpochLen = $('#inputEpochLen')
  const inputEpisodeLen = $('#inputEpisodeLen')
  const inputLearningRate = $('#inputLearningRate')
  const inputEntropyCoef = $('#inputEntropyCoef')
  const inputEnv = $('#inputEnv')
  const inputRewardWeights = [
    $('#input-reward-weight-1'),
    $('#input-reward-weight-2'),
    $('#input-reward-weight-3'),
    $('#input-reward-weight-4'),
    $('#input-reward-weight-5'),
    $('#input-reward-weight-6'),
  ]

  inputReload.on('change', () => {
    inputReloadLabel.text(inputReload.is(':checked') ? 'On' : 'Off')
  })

  messageBus.addEventListener('settings', ({data}) => {
    inputTrainingStage.val(data.stageName)
    inputEpochLen.val(data.epochSize)
    inputEpisodeLen.val(data.episodeTimeLimit)
    inputLearningRate.val(data.learningRate)
    inputEntropyCoef.val(data.entropyCoefficient)
    inputEnv.val(data.envId)
    data.rewardWeights.forEach((v, i) => inputRewardWeights[i].val(v))
    inputShooterNetworkEnabled.prop( "checked", data.activeNetworks.shooter );
    inputDriverNetworkEnabled.prop( "checked", data.activeNetworks.driver );
    inputShooterNetworkTrainable.prop( "checked", data.trainableNetworks.shooter );
    inputDriverNetworkTrainable.prop( "checked", data.trainableNetworks.driver );
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