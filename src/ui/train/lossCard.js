import * as $ from 'jquery'
import Chart from 'chart.js/auto';
import annotationPlugin from 'chartjs-plugin-annotation';
Chart.register(annotationPlugin);

export default function initUI(messageBus) {
  const criticLoss = $('#critic-loss')
  const actorObjective = $('#actor-objective')

  const lossChartData = {
    labels : [],
    datasets : [
      { data : [], label: "critic", borderColor: '#dc3545', yAxisID: 'critic'},
      { data : [], label: "actor", borderColor: '#0d6efd', yAxisID: 'actor' },
    ]
  }

  const lossChart = new Chart(document.getElementById('loss-chart'), {
		type : 'line',
		data: lossChartData,
    options: {
      animation: false, 
      scales:{
        x: {
          ticks: false,
        },
        actor: {
          position: 'left',
          grid: {display: false}
        },
        critic: {
          position: 'right',
          grid: {display: false}
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

  const entropyChartData = {
    labels : [],
    datasets : [
      { data : [], label: "entropy", backgroundColor: '#ffc107' },
    ]
  }

  const entropyChart = new Chart(document.getElementById('entropy-chart'), {
		type : 'bar',
		data: entropyChartData,
    options: {
      animation: false, 
      scales:{
        x: {
          ticks: false,
        },

      },
      elements: {
        point: {
          radius: 0
        }
      },
      plugins: {
        legend: true,
        annotation: {
          annotations: {
            entropyMin: {
              type: 'line',
              yMin: 0,
              yMax: 0,
              borderColor: '#ff0000'
            },
            entropyMax: {
              type: 'line',
              yMin: 1,
              yMax: 1,
              borderColor: '#ff0000'
            }
          }
        }
      }
    }
	});

 
  messageBus.addEventListener('epochStats', ({data}) => {
    criticLoss.text(data.lossHistory.length ? data.lossHistory[data.lossHistory.length-1].critic.toFixed(4) : '-')
    actorObjective.text(data.lossHistory.length ? (-data.lossHistory[data.lossHistory.length-1].actor).toFixed(2) : '-')

    lossChartData.labels = data.lossHistory.map(e => 'epoch ' + e.x)
    lossChartData.datasets[0].data = data.lossHistory.map(e => e.critic)
    lossChartData.datasets[1].data = data.lossHistory.map(e => -e.actor)
    lossChart.update()

    entropyChartData.labels = data.lossHistory.map(e => 'epoch ' + e.x)
    entropyChartData.datasets[0].data = data.lossHistory.map(e => e.entropy)
    entropyChart.update()
  })

  messageBus.addEventListener('settings', ({data}) => {
    entropyChart.options.plugins.annotation.annotations.entropyMin.yMin = entropyChart.options.plugins.annotation.annotations.entropyMin.yMax = data.entropyLimits[0]
    entropyChart.options.plugins.annotation.annotations.entropyMax.yMin = entropyChart.options.plugins.annotation.annotations.entropyMax.yMax = data.entropyLimits[1]
    entropyChart.update()
  })



}
