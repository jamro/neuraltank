import * as $ from 'jquery'
import Chart from 'chart.js/auto';
import annotationPlugin from 'chartjs-plugin-annotation';
Chart.register(annotationPlugin);

export default function initUI(messageBus) {
  const criticLoss = $('#critic-loss')
  const shooterObjective = $('#shooter-objective')
  const driverObjective = $('#driver-objective')

  const lossChartData = {
    labels : [],
    datasets : [
      { data : [], label: "critic", borderColor: '#dc3545', yAxisID: 'critic'},
      { data : [], label: "shooter", borderColor: '#0d6efd', yAxisID: 'actor' },
      { data : [], label: "driver", borderColor: '#0dcaf0', yAxisID: 'actor' },
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
      { data : [], label: "Shooter", backgroundColor: '#dc3545' },
      { data : [], label: "Driver", backgroundColor: '#ffc107' },
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
        y: {
          min: 0,
          max: 1.4
        }
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
    shooterObjective.text(data.lossHistory.length ? (-data.lossHistory[data.lossHistory.length-1].shooter).toFixed(2) : '-')
    driverObjective.text(data.lossHistory.length ? (-data.lossHistory[data.lossHistory.length-1].driver).toFixed(2) : '-')

    lossChartData.labels = data.lossHistory.map(e => 'epoch ' + e.x)
    lossChartData.datasets[0].data = data.lossHistory.map(e => e.critic)
    lossChartData.datasets[1].data = data.lossHistory.map(e => -e.shooter)
    lossChartData.datasets[2].data = data.lossHistory.map(e => -e.driver)
    lossChart.update()

    entropyChartData.labels = data.lossHistory.map(e => 'epoch ' + e.x)
    entropyChartData.datasets[0].data = data.lossHistory.map(e => e.shooterEntropy)
    entropyChartData.datasets[1].data = data.lossHistory.map(e => e.driverEntropy)
    entropyChart.update()
  })

  messageBus.addEventListener('settings', ({data}) => {
    entropyChart.options.plugins.annotation.annotations.entropyMin.yMin = entropyChart.options.plugins.annotation.annotations.entropyMin.yMax = data.entropyLimits[0]
    entropyChart.options.plugins.annotation.annotations.entropyMax.yMin = entropyChart.options.plugins.annotation.annotations.entropyMax.yMax = data.entropyLimits[1]
    entropyChart.update()
  })



}
