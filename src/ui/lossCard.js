import * as $ from 'jquery'
import Chart from 'chart.js/auto';

export default function initUI(messageBus) {
  const criticLoss = $('#critic-loss')
  const actorObjective = $('#actor-objective')

  const ctx = document.getElementById('loss-chart');

  const lossChartData = {
    labels : [],
    datasets : [
      { data : [], label: "critic", borderColor: '#dc3545', yAxisID: 'critic'},
      { data : [], label: "actor", borderColor: '#0d6efd', yAxisID: 'actor' },
    ]
  }

  const lossChart = new Chart(ctx, {
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

 
  messageBus.addEventListener('epochStats', ({data}) => {
    criticLoss.text(data.lossHistory.length ? data.lossHistory[data.lossHistory.length-1].critic.toFixed(2) : '-')
    actorObjective.text(data.lossHistory.length ? data.lossHistory[data.lossHistory.length-1].actor.toFixed(2) : '-')

    lossChartData.labels = data.lossHistory.map(e => 'epoch ' + e.x)
    lossChartData.datasets[0].data = data.lossHistory.map(e => e.critic)
    lossChartData.datasets[1].data = data.lossHistory.map(e => -e.actor)
    lossChart.update()
  })

}
