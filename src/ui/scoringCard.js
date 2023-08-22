import * as $ from 'jquery'
import Chart from 'chart.js/auto';

export default function initUI(trainer, tankLogic, policy) {
  const bestScore = $('#best-score')
  const resetHistoryButton = $('#btn-reset-scoring-history')

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

  resetHistoryButton.on('click', async () => {
    resetHistoryButton.prop('disabled',true)
    await trainer.resetScoreHistory()
    scoreChartData.labels = []
    scoreChartData.datasets[0].data = []
    scoreChartData.datasets[1].data = []
    scoreChartData.datasets[2].data = []
    scoreChart.update()
    bestScore.text('-')
    resetHistoryButton.prop('disabled', false)
  })

  bestScore.text(trainer.scoreHistory.length ? trainer.scoreHistory[trainer.scoreHistory.length-1].mean.toFixed(2) : '-')

  trainer.addEventListener('epochComplete', () => {
    bestScore.text(trainer.scoreHistory[trainer.scoreHistory.length-1].mean.toFixed(2))
    scoreChartData.labels = trainer.scoreHistory.map(e => 'epoch ' + e.x)
    scoreChartData.datasets[0].data = trainer.scoreHistory.map(e => e.mean)
    scoreChartData.datasets[1].data = trainer.scoreHistory.map(e => e.min)
    scoreChartData.datasets[2].data = trainer.scoreHistory.map(e => e.max)
    scoreChart.update()
  })
}
