import * as $ from 'jquery'

export default function initUI(messageBus) {
  const trainButton = $('#btn-train')
  const previewButton = $('#btn-preview')
  const battlefield = $('#battlefield')
  const epochStats = $('#epoch-stats')
  const epochNumber = $('#epoch-number')
  const episodeNumber = $('#episode-number')
  const epochDuration = $('#epoch-duration')
  const stepDuration = $('#step-duration')
  const benchmarkDuration = $('#benchmark-duration')
  const epochProgressBar = $('#epoch-progressbar')
  const episodeProgressBar = $('#episode-progressbar')
  const inputReload = $('#input-reload')

  messageBus.addEventListener('epochStats', ({data}) => {
    epochNumber.text(data.epochIndex+1)
    epochDuration.text(ms2txt(data.epochDuration))
    epochProgressBar.css('width', '0%')
    episodeProgressBar.css('width', '0%')
    episodeNumber.text(`0 / ${data.epochSize}`)
  })

  messageBus.addEventListener('epochComplete', ({data}) => {
    console.log('inputReload.checked', inputReload, inputReload.prop('checked'))
    if(inputReload.prop('checked')) {
      location.reload()
    }
  })

  messageBus.addEventListener('episodeStats', ({data}) => {
    episodeNumber.text(`${data.episodeIndex+1} / ${data.epochSize}`)
    episodeProgressBar.css('width', '0%')
    stepDuration.text(data.stepAvgDuration ? data.stepAvgDuration.toFixed(2) + 'ms' : '-')
    benchmarkDuration.text(data.benchmarkAvgDuration ? data.benchmarkAvgDuration.toFixed(2) + 'ms' : '-')

    let progress = (data.episodeIndex+1) / data.epochSize
    progress = Math.round(100*progress)+ "%"
    epochProgressBar.css('width', progress)
  })

  messageBus.addEventListener('episodeProgress', ({data}) => {
    let progress = data.timeElapsed / data.timeLimit
    progress = Math.round(100*progress)+ "%"
    episodeProgressBar.css('width', progress)
  })

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