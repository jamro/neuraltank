import * as $ from 'jquery'
import Chart from 'chart.js/auto';

export default function initUI(messageBus) {
  const bestScore = $('#best-score')
  const resetHistoryButton = $('#btn-reset-scoring-history')

  const ctx = document.getElementById('score-chart');

  const scoreChartData = {
    labels : [],
    datasets : [
      { data : [], label: "mean", borderColor: '#0d6efd' },
      { data : [], label: "min", borderColor: '#bbbbbb' },
      { data : [], label: "max", borderColor: '#bbbbbb' }
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
    messageBus.send('clearHistory')
    scoreChartData.labels = []
    scoreChartData.datasets[0].data = []
    scoreChartData.datasets[1].data = []
    scoreChartData.datasets[2].data = []
    scoreChart.update()
    bestScore.text('-')
  })
 
  messageBus.addEventListener('epochStats', ({data}) => {
    bestScore.text(data.scoreHistory.length ? data.scoreHistory[data.scoreHistory.length-1].mean.toFixed(2) : '-')
    scoreChartData.labels = data.scoreHistory.map(e => 'epoch ' + e.x)
    scoreChartData.datasets[0].data = data.scoreHistory.map(e => e.mean)
    scoreChartData.datasets[1].data = data.scoreHistory.map(e => e.min)
    scoreChartData.datasets[2].data = data.scoreHistory.map(e => e.max)
    scoreChart.update()
  })

}
