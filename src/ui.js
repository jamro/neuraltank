import * as $ from 'jquery'
import Chart from 'chart.js/auto';

export default function initUI(trainer, tankLogic, policy) {
  const trainButton = $('#btn-train')
  const previewButton = $('#btn-preview')
  const battlefield = $('#battlefield')
  const epochStats = $('#epoch-stats')
  const epochNumber = $('#epoch-number')
  const episodeNumber = $('#episode-number')
  const epochDuration = $('#epoch-duration')
  const epochProgressBar = $('#epoch-progressbar')
  const episodeProgressBar = $('#episode-progressbar')
  const bestScore = $('#best-score')
  const policySaveDate = $('#policy-save-date')
  const removeModelButton = $('#btn-remove-stored-model')
  const resetHistoryButton = $('#btn-reset-scoring-history')

  const inputEpochLen = $('#inputEpochLen')
  const inputEpisodeLen = $('#inputEpisodeLen')
  const inputLearningRate = $('#inputLearningRate')
  const inputDiscountRate = $('#inputDiscountRate')
  const inputReward = $('#inputReward')

  const ctx = document.getElementById('score-chart');

  const scoreChartData = {
    labels : trainer.scoreHistory.map(e => 'epoch ' + e.x),
    datasets : [
      { data : trainer.scoreHistory.map(e => e.mean), label: "mean", borderColor: '#0d6efd' },
      { data : trainer.scoreHistory.map(e => e.min), label: "min", borderColor: '#bbbbbb' },
      { data : trainer.scoreHistory.map(e => e.max), label: "max", borderColor: '#bbbbbb' }
    ]
  }

  const scoreChart = new Chart(ctx, {
		type : 'line',
		data: scoreChartData,
    options: {
      animation: false, 
      scales:{
        x: {
          ticks: false
        }
      },
      elements: {
        point: {
          radius: 0
        }
      },
      plugins: {
        legend: false
      }
    }
	});


  trainButton.on('click', () => {
    trainButton.hide()
    previewButton.show()
    battlefield.hide()
    epochStats.show()
    trainer.simSpeed = 100
  })

  previewButton.on('click', () => {
    trainButton.show()
    previewButton.hide()
    battlefield.show()
    epochStats.hide()
    trainer.simSpeed = 1
  })

  removeModelButton.on('click', async () => {
    removeModelButton.prop('disabled',true)
    await trainer.removeStored()
    removeModelButton.prop('disabled', !trainer.policy.dateSaved)
  })

  resetHistoryButton.on('click', async () => {
    resetHistoryButton.prop('disabled',true)
    await trainer.resetScoreHistory()
    scoreChartData.labels = []
    scoreChartData.datasets[0].data = []
    scoreChartData.datasets[1].data = []
    scoreChartData.datasets[2].data = []
    scoreChart.update()
    bestScore.text('-')
    epochNumber.text(trainer.epochIndex+1)
    resetHistoryButton.prop('disabled', false)
    
  })

  removeModelButton.prop('disabled', !trainer.policy.dateSaved)
  episodeNumber.text(`${trainer.episodeIndex} / ${trainer.epochSize}`)
  epochNumber.text(trainer.epochIndex+1)
  policySaveDate.text((trainer.policy.dateSaved || '-').toString())
  bestScore.text(trainer.scoreHistory.length ? trainer.scoreHistory[trainer.scoreHistory.length-1].mean.toFixed(2) : '-')
  epochDuration.text(ms2txt(trainer.epochDuration))
  inputEpochLen.val(trainer.epochSize)
  inputEpisodeLen.val(trainer.episodeTimeLimit)
  inputLearningRate.val(policy.learningRate)
  inputDiscountRate.val(policy.discountRate)

  inputEpochLen.prop('readonly', true);
  inputEpisodeLen.prop('readonly', true);
  inputLearningRate.prop('readonly', true);
  inputDiscountRate.prop('readonly', true);
  inputReward.prop('disabled', true);
  inputReward.val(trainer.rewardType)

  trainer.addEventListener('save', () => {
    policySaveDate.text(trainer.policy.dateSaved.toString())
    removeModelButton.prop('disabled', !trainer.policy.dateSaved)
  })

  trainer.addEventListener('remove', () => {
    policySaveDate.text('-')
    removeModelButton.prop('disabled', !trainer.policy.dateSaved)
  })

  trainer.addEventListener('epochComplete', () => {
    epochNumber.text(trainer.epochIndex+1)
    epochDuration.text(ms2txt(trainer.epochDuration))
    bestScore.text(trainer.scoreHistory[trainer.scoreHistory.length-1].mean.toFixed(2))
    epochProgressBar.css('width', '0%')
    episodeProgressBar.css('width', '0%')
    episodeNumber.text(`0 / ${trainer.epochSize}`)

    scoreChartData.labels = trainer.scoreHistory.map(e => 'epoch ' + e.x)
    scoreChartData.datasets[0].data = trainer.scoreHistory.map(e => e.mean)
    scoreChartData.datasets[1].data = trainer.scoreHistory.map(e => e.min)
    scoreChartData.datasets[2].data = trainer.scoreHistory.map(e => e.max)
    scoreChart.update()
  })

  trainer.addEventListener('episodeComplete', () => {
    episodeNumber.text(`${trainer.episodeIndex+1} / ${trainer.epochSize}`)
    episodeProgressBar.css('width', '0%')
  })

  setInterval(() => {
    let progress = 0
    if(trainer.simulation) {
      progress = trainer.simulation.timeElapsed / trainer.simulation.timeLimit
    }
    progress = Math.round(100*progress)+ "%"
    episodeProgressBar.css('width', progress)

    progress = trainer.episodeIndex / trainer.epochSize
    progress = Math.round(100*progress)+ "%"
    epochProgressBar.css('width', progress)
    
  }, 200)
  
}

function ms2txt(timeMs) {
  if(timeMs === null || isNaN(timeMs)) {
    return "-"
  }

  timeMs = Math.round(timeMs)
  let ms = String(timeMs % 1000)
  let ss = String(Math.floor(timeMs/1000) % 60)
  let mm = String(Math.floor(timeMs/60000))

  return `${mm}:${ss.padStart(2, '0')}.${ms.padStart(3, '0')}`
}