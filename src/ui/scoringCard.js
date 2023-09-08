import * as $ from 'jquery'
import Chart from 'chart.js/auto';

export default function initUI(messageBus) {
  const bestReward = $('#best-reward')
  const resetHistoryButton = $('#btn-reset-reward-history')
  const rewardFields = [
    $('#reward-0'),
    $('#reward-1'),
    $('#reward-2'),
    $('#reward-3'),
    $('#reward-4'),
  ]

  const componentCtx = document.getElementById('component-chart');
  const componentChartData = {
    labels : [],
    datasets : [
      { data : [], label: "mean", borderColor: '#000000', type: 'line', borderWidth: 3, tension: 0.4},
      { data : [], label: "score", borderColor: '#dc3545', backgroundColor: '#dc3545'},
      { data : [], label: "radar", borderColor: '#0d6efd', backgroundColor: '#0d6efd'},
      { data : [], label: "energy", borderColor: '#ffc107', backgroundColor: '#ffc107' },
      { data : [], label: "collision", borderColor: '#5c636a', backgroundColor: '#5c636a' },
      { data : [], label: "bullets", borderColor: '#666666', backgroundColor: '#666666' },
    ]
  }

  const componentChart = new Chart(componentCtx, {
		type : 'bar',
		data: componentChartData,
    options: {
      categoryPercentage: 1,
      barPercentage: 1,
      animation: false, 
      scales:{
        x: {
          stacked: true,
          ticks: false
        },
        y: {
          stacked: true
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
    componentChartData.labels = []

    for(let i=0; i < componentChartData.datasets.length; i++) {
      componentChartData.datasets[0].data = []
    }
    for(let i=0; i < 4; i++) {
      rewardFields[i].text('-')
    }
    componentChart.update()
    bestReward.text('-')
  })
 
  messageBus.addEventListener('epochStats', ({data}) => {
    bestReward.text(data.scoreHistory.length ? data.scoreHistory[data.scoreHistory.length-1].mean.toFixed(2) : '-')

    componentChartData.labels = data.scoreHistory.map(e => 'epoch ' + e.x)
    componentChartData.datasets[0].data = data.scoreHistory.map(e => e.mean)
    const offset = 1
    for(let i=0; i < 5; i++) {
      const arr = data.scoreHistory.map(a => a.rewardShare[i])
      componentChartData.datasets[i+offset].data = arr
      rewardFields[i].text(arr.length > 0 ? arr[arr.length-1].toFixed(1) : '-')
    }
    componentChart.update()
  })

}
