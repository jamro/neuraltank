import * as $ from 'jquery'

export default function initUI(trainer, tankLogic, agent) {
  const trainButton = $('#btn-train')
  const previewButton = $('#btn-preview')
  const battlefield = $('#battlefield')
  const epochStats = $('#epoch-stats')
  const epochNumber = $('#epoch-number')
  const episodeNumber = $('#episode-number')
  const epochDuration = $('#epoch-duration')
  const epochProgressBar = $('#epoch-progressbar')
  const episodeProgressBar = $('#episode-progressbar')

  trainButton.on('click', () => {
    trainButton.hide()
    previewButton.show()
    battlefield.hide()
    epochStats.show()
    trainer.simSpeed = 100
    window.dispatchEvent(new Event('fastMode'))
  })

  previewButton.on('click', () => {
    trainButton.show()
    previewButton.hide()
    battlefield.show()
    epochStats.hide()
    trainer.simSpeed = 1
    window.dispatchEvent(new Event('previewMode'))
  })

  episodeNumber.text(`${trainer.episodeIndex} / ${trainer.epochSize}`)
  epochNumber.text(trainer.epochIndex+1)
  epochDuration.text(ms2txt(trainer.epochDuration))

  trainer.settings.addEventListener('change_epochSize', () => {
    episodeNumber.text(`${trainer.episodeIndex+1} / ${trainer.epochSize}`)
  })

  trainer.addEventListener('epochComplete', () => {
    epochNumber.text(trainer.epochIndex+1)
    epochDuration.text(ms2txt(trainer.epochDuration))
    epochProgressBar.css('width', '0%')
    episodeProgressBar.css('width', '0%')
    episodeNumber.text(`0 / ${trainer.epochSize}`)
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