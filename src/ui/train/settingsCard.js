import * as $ from 'jquery'

export default function initUI(messageBus) {
  const inputShooterNetworkEnabled = $('#input-shooter-enabled')
  const inputDriverNetworkEnabled = $('#input-driver-enabled')
  const inputShooterNetworkTrainable = $('#input-shooter-trainable')
  const inputDriverNetworkTrainable= $('#input-driver-trainable')
  const inputReload = $('#input-reload')
  const inputReloadLabel = $('#input-reload-label')
  const inputEpochLen = $('#inputEpochLen')
  const inputEpisodeLen = $('#inputEpisodeLen')
  const inputLearningRate = $('#inputLearningRate')
  const inputEntropyCoef = $('#inputEntropyCoef')
  const settingsLock = $('#settingsLock')
  const inputEnv = $('#inputEnv')
  const inputRewardWeights = [
    $('#input-reward-weight-1'),
    $('#input-reward-weight-2'),
    $('#input-reward-weight-3'),
    $('#input-reward-weight-4'),
    $('#input-reward-weight-5'),
  ]

  inputReload.on('change', () => {
    inputReloadLabel.text(inputReload.is(':checked') ? 'On' : 'Off')
  })

  const inputs = [
    inputEpochLen,
    inputEpisodeLen,
    inputLearningRate,
    inputEntropyCoef,
    inputEnv
  ].concat(inputRewardWeights)

  function disableForm() {
    inputs.forEach(i => i.prop('disabled', true))
    settingsLock.show()
  }

  function enableForm() {
    inputs.forEach(i => i.prop('disabled', !i.isEditable))
    settingsLock.hide()
  }
  inputShooterNetworkEnabled.prop("disabled", false );
  inputDriverNetworkEnabled.prop("disabled", false );
  inputShooterNetworkTrainable.prop("disabled", false );
  inputDriverNetworkTrainable.prop("disabled", false );

  enableForm()

  messageBus.addEventListener('settings', ({data}) => {
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

  editable(inputEntropyCoef, regexpValidator(/^[0-9\.\-]+$/), (v) => {
    messageBus.send('config', {key: 'entropyCoefficient', value: Number(v)})
  })

  inputRewardWeights.forEach((field, index) =>  editable(field, regexpValidator(/^[0-9\.]+$/), (v) => {
    messageBus.send('config', {key: 'rewardWeights', value: Number(v), index })
  }))

  inputShooterNetworkEnabled.on('change', () => {
    messageBus.send('config', {key: 'shooterEnabled', value: inputShooterNetworkEnabled.prop('checked') })
  })

  inputDriverNetworkEnabled.on('change', () => {
    messageBus.send('config', {key: 'driverEnabled', value: inputDriverNetworkEnabled.prop('checked') })
  })

  inputShooterNetworkTrainable.on('change', () => {
    messageBus.send('config', {key: 'shooterTrainable', value: inputShooterNetworkTrainable.prop('checked') })
  })

  inputDriverNetworkTrainable.on('change', () => {
    messageBus.send('config', {key: 'driverTrainable', value: inputDriverNetworkTrainable.prop('checked') })
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