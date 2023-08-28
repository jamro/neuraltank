import * as $ from 'jquery'
import Chart from 'chart.js/auto';

export default function initUI(messageBus) {
  const criticLoss = $('#critic-loss')

  const ctx = document.getElementById('loss-chart');

  const lossChartData = {
    labels : [],
    datasets : [
      { data : [], label: "critic-mean", borderColor: '#dc3545' },
      { data : [], label: "critic-min", borderColor: '#eea1a9' },
      { data : [], label: "critic-max", borderColor: '#eea1a9' }
    ]
  }

  const lossChart = new Chart(ctx, {
		type : 'line',
		data: lossChartData,
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

 
  messageBus.addEventListener('epochStats', ({data}) => {
    criticLoss.text(data.criticLossHistory.length ? data.criticLossHistory[data.criticLossHistory.length-1].mean.toFixed(2) : '-')

    lossChartData.labels = data.criticLossHistory.map(e => 'epoch ' + e.x)
    lossChartData.datasets[0].data = data.criticLossHistory.map(e => e.mean)
    lossChartData.datasets[1].data = data.criticLossHistory.map(e => e.min)
    lossChartData.datasets[2].data = data.criticLossHistory.map(e => e.max)
    lossChart.update()
  })

}
