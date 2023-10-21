import * as $ from 'jquery'
import Agent from '../../agent/Agent'
import Chart from 'chart.js/auto';

async function getPlaybacks() {
  const agents = Object.values(await Agent.getAgents()).filter(s => s.name !== 'latest' && s.name.startsWith('playback_'))

  const playbacks = {}

  for(let agent of agents) {
    const meta = JSON.parse(agent.label)
    const fullName = new Date(meta.stageStartTime).toLocaleString() + " " + meta.stageName
    const id =  meta.stageId + '_' + meta.stageStartTime
    if(!playbacks[id]) {
      playbacks[id] = {
        id: id,
        fullName: fullName,
        stageId: meta.stageId,
        stageName: meta.stageName,
        stageStartTime: meta.stageStartTime,
        snapshots: []
      }
    }
    playbacks[id].snapshots.push({...agent, meta})
  }
  return Object.values(playbacks)
}

export default function initUI(settings, trainer, bootCamp) {
  const inputPlaybackStage = $('#inputPlaybackStage')
  const playbackChartContainer = $('#playbackChartContainer')
  const playbackSnapshotContainer = $('#playbackSnapshotContainer')
  const playbackSnapshotDate = $('#playbackSnapshotDate')
  const playbackSnapshotScore = $('#playbackSnapshotScore')
  const restorePlaybackButton = $('#btn-restore-playback')
  const removePlaybackButton = $('#btn-remove-playback')
  const playbackChartCtx = document.getElementById('playbackChart');
  let selectedStageId = null
  let playbacks = []
  let snapshotHistory = []
  let selectedSnapshot = null

  const playbackChartData = {
    labels : [],
    datasets : [
      { data : [], label: "score", backgroundColor: '#0d6efd' }
    ]
  }

  const playbackChart = new Chart(playbackChartCtx, {
		type : 'bar',
		data: playbackChartData,
    options: {
      onClick: (e, elements) => {
        if(elements.length === 0) return 
        const snapshotIndex = elements[0].index
        selectedSnapshot = snapshotHistory[snapshotIndex]
        playbackSnapshotContainer.css('display', 'block')
        playbackSnapshotScore.html(selectedSnapshot.meta.score.toFixed(2))
        playbackSnapshotDate.html(new Date(selectedSnapshot.trainedAt).toLocaleString())
      },
      animation: false, 
      plugins: {
        legend: false
      }
    }
	});

  function selectPlayback(id) {
    const playback = playbacks.find(p => p.id === id)
    playbackChartContainer.css('display', id ? 'block' : 'none')
    removePlaybackButton.css('display', id ? 'block' : 'none')
    playbackSnapshotContainer.css('display', 'none')
    snapshotHistory = []
    selectedSnapshot = null
    if(!playback) return
    playbackChartData.datasets[0].data = []
    playbackChartData.labels = []
    for(let i=0; i < playback.snapshots.length; i++) {
      const snapshot = playback.snapshots[i]
      playbackChartData.datasets[0].data.push(snapshot.meta.score)
      playbackChartData.labels.push(i+1)
    }
    playbackChart.update()
    snapshotHistory = playback.snapshots
  }

  async function reloadPlaybacks(playbacks) {
    inputPlaybackStage.find('option')
      .remove()
      .end()
      .append('<option value="">[Select]</option>')
      .val('')

    for(let playback of playbacks) {
      inputPlaybackStage
        .append(`<option value="${playback.id}">${playback.fullName}</option>`)
        .val(playback.id)
    }

    inputPlaybackStage.val('')
    inputPlaybackStage.on('change', async function() {
      selectedStageId = this.value || null
      await selectPlayback(selectedStageId)
    })
  }

  restorePlaybackButton.on('click', async () => {
    if(!selectedSnapshot) return;
    await trainer.agent.restoreModelFrom(selectedSnapshot.name)
    trainer.agent.label = `[Playback ${selectedSnapshot.meta.stageName}] score: ${selectedSnapshot.meta.score.toFixed(2)}`
    await trainer.agent.saveModel()
    window.dispatchEvent(new Event('workspaceChange'))
  })

  removePlaybackButton.on('click', async () => {
    if(!selectedStageId) return 
    const playback = playbacks.find(p => p.id === selectedStageId)
    if(!playback) return 
    removePlaybackButton.prop('disabled', 'disabled')
    inputPlaybackStage.prop('disabled', 'disabled')
    selectPlayback(null)

    for(let snapshot of playback.snapshots) {
      await Agent.delAgent(snapshot.name)
    }
    playbacks = await getPlaybacks()
    await reloadPlaybacks(playbacks)
    removePlaybackButton.prop('disabled', false)
    inputPlaybackStage.prop('disabled', false)
  })
    
  setTimeout(async() => {
    playbacks = await getPlaybacks()

    await reloadPlaybacks(playbacks)
  })
}
