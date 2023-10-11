import * as $ from 'jquery'
import stages from '../../stages.js'


function getStageElement(index, name) {
  return `<div class="list-group-item">
    <strong>${index+1}.</strong> ${name}
    <button id="btn-stage-${index+1}" type="button" class="btn btn-danger btn-sm float-end"><i class="ri-rocket-line"></i> Train</button>
  </div>`
}

export default function initUI(settings, trainer, bootCamp) {
  console.log(settings)
  const buttonTrain = $('#btn-train')
  const inputShooterNetworkEnabled = $('#input-shooter-enabled')
  const inputDriverNetworkEnabled = $('#input-driver-enabled')
  const inputShooterNetworkTrainable = $('#input-shooter-trainable')
  const inputDriverNetworkTrainable= $('#input-driver-trainable')
  const inputEpochLen = $('#inputEpochLen')
  const inputEpisodeLen = $('#inputEpisodeLen')
  const inputLearningRate = $('#inputLearningRate')
  const inputEntropyCoef = $('#inputEntropyCoef')
  const inputEnv = $('#inputEnv')
  const expandCustomStageIndicator = $('#custom-stage-expand')
  const collapseCustomStageIndicator = $('#custom-stage-collapse')
  const buttonCustomStage = $('#custom-stage-toggle')
  const customStageContent = $('#custom-stage-content')
  const stageContainer = $('#stage-container')

  stages.forEach((stage, i) => {
    stageContainer.append($(getStageElement(i, stage.name)))
  })

  const stageButtons = stages.map((_, i) => $('#btn-stage-' + (i+1)))

  const inputRewardWeights = [
    $('#input-reward-weight-1'),
    $('#input-reward-weight-2'),
    $('#input-reward-weight-3'),
    $('#input-reward-weight-4'),
    $('#input-reward-weight-5'),
  ]

  const inputs = [
    inputEpochLen,
    inputEpisodeLen,
    inputLearningRate,
    inputEntropyCoef,
    inputEnv
  ].concat(inputRewardWeights)


  stageButtons.forEach((button, index) =>  button.on('click', async() => {
    const stage = stages[index]
    const keys = Object.keys(settings.data)
    for (let key of keys) {
      settings.prop(key, stage[key])
    }

    button.prop('disabled', true)
    await trainer.resetScoreHistory()
    bootCamp.inProgress = true
    window.location.replace('./train.html')
  }))

  buttonCustomStage.on('click', () => {
    if(customStageContent.css('display') == 'none') { // show
      customStageContent.show()
      expandCustomStageIndicator.hide()
      collapseCustomStageIndicator.show()
    } else { // hide
      customStageContent.hide()
      expandCustomStageIndicator.show()
      collapseCustomStageIndicator.hide()
    }
  })

  inputs.forEach(i => i.prop('disabled', !i.isEditable))

  inputShooterNetworkEnabled.prop("disabled", false );
  inputDriverNetworkEnabled.prop("disabled", false );
  inputShooterNetworkTrainable.prop("disabled", false );
  inputDriverNetworkTrainable.prop("disabled", false );

  inputEpochLen.val(settings.prop('epochSize'))
  inputEpisodeLen.val(settings.prop('episodeTimeLimit'))
  inputLearningRate.val(settings.prop('learningRate'))
  inputEntropyCoef.val(settings.prop('entropyCoefficient'))
  inputEnv.val(settings.prop('envId'))
  settings.prop('rewardWeights').forEach((v, i) => inputRewardWeights[i].val(v))
  inputShooterNetworkEnabled.prop( "checked", settings.prop('shooterEnabled'));
  inputDriverNetworkEnabled.prop( "checked", settings.prop('driverEnabled'));
  inputShooterNetworkTrainable.prop( "checked", settings.prop('shooterTrainable'));
  inputDriverNetworkTrainable.prop( "checked", settings.prop('driverTrainable'));


  editable(inputEpochLen, regexpValidator(/^[0-9]+$/), (v) => {
    settings.prop('epochSize', Number(v))
  })

  editable(inputEpisodeLen, regexpValidator(/^[0-9]+$/), (v) => {
    settings.prop('episodeTimeLimit', Number(v))
  })

  editable(inputEnv, () => true, (v) => {
    settings.prop('envId', v)
  })

  editable(inputLearningRate, regexpValidator(/^[0-9\.]+$/), (v) => {
    settings.prop('learningRate', Number(v))
  })

  editable(inputEntropyCoef, regexpValidator(/^[0-9\.\-]+$/), (v) => {
    settings.prop('entropyCoefficient', Number(v))
  })

  inputRewardWeights.forEach((field, index) =>  editable(field, regexpValidator(/^[0-9\.]+$/), (v) => {
    const weights = settings.prop('rewardWeights')
    weights[index] = Number(v)
    settings.prop('rewardWeights', weights)
  }))

  inputShooterNetworkEnabled.on('change', () => {
    settings.prop('shooterEnabled', inputShooterNetworkEnabled.prop('checked'))
  })

  inputDriverNetworkEnabled.on('change', () => {
    settings.prop('driverEnabled', inputDriverNetworkEnabled.prop('checked'))
  })

  inputShooterNetworkTrainable.on('change', () => {
    settings.prop('shooterTrainable', inputShooterNetworkTrainable.prop('checked'))
  })

  inputDriverNetworkTrainable.on('change', () => {
    settings.prop('driverTrainable', inputDriverNetworkTrainable.prop('checked'))
  })

  buttonTrain.on('click', async() => {
    buttonTrain.prop('disabled', true)
    await trainer.resetScoreHistory()
    bootCamp.inProgress = true
    window.location.replace('./train.html')
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