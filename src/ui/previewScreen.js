import * as $ from 'jquery'
import Chart from 'chart.js/auto';


export default function initUI(trainer, agent) {
  const totalRewardField = $('#reward-total')
  const rewardField = [
    $('#reward-0'),
    $('#reward-1'),
    $('#reward-2'),
    $('#reward-3'),
  ]
  const valueField = $('#value')

  const legendSettings = {
    display: true,
    labels: {
      boxHeight: 3,
      boxWidth: 9,
      padding: 3,
    }
  }

  const inputChart = new Chart(document.getElementById('input-chart'), {
		type : 'line',
		data: {
      labels : [],
      datasets : []
    },
    options: {
      animation: false, 
      scales:{
        x: {
          ticks: false,
        },
        y: {
          title: {
            display: true,
            text: 'input'
          }
        },
      },
      elements: {
        point: {
          radius: 0
        }
      },
      plugins: {
        legend: legendSettings
      }
    }
	});
  const actionChart = new Chart(document.getElementById('action-chart'), {
		type : 'line',
		data: {
      labels : [],
      datasets : []
    },
    options: {
      animation: false, 
      scales:{
        x: {
          ticks: false,
        },
        y: {
          title: {
            display: true,
            text: 'action'
          }
        },
      },
      elements: {
        point: {
          radius: 0
        }
      },
      plugins: {
        legend: legendSettings
      }
    }
	});
  const rewardChart = new Chart(document.getElementById('reward-chart'), {
		type : 'line',
		data: {
      labels : [],
      datasets : []
    },
    options: {
      animation: false, 
      scales:{
        x: {
          ticks: false,
        },
        y: {
          title: {
            display: true,
            text: 'reward'
          }
        },
      },
      elements: {
        point: {
          radius: 0
        }
      },
      plugins: {
        legend: legendSettings
      }
    }
	});
  const valueChart = new Chart(document.getElementById('value-chart'), {
		type : 'line',
		data: {
      labels : [],
      datasets : []
    },
    options: {
      animation: false, 
      scales:{
        x: {
          ticks: false,
        },
        y: {
          title: {
            display: true,
            text: 'value'
          }
        },
      },
      elements: {
        point: {
          radius: 0
        }
      },
      plugins: {
        legend: legendSettings
      }
    }
	});

  let stepCounter = 0

  function drawSingleTrajectory(chart, tensor, labelFormatter) {
    const inputArray = tensor.arraySync()
    for(let i=chart.data.labels.length; i < inputArray.length; i++) {
      chart.data.labels.push(i)
      const row = inputArray[i]
      for(let j=0; j < row.length; j++) {
        while(!chart.data.datasets[j]) {
          chart.data.datasets.push({ data : [], label: labelFormatter ? labelFormatter(j) : `Series ${j+1}`, borderWidth: 2})
        }
        chart.data.datasets[j].data.push(row[j])
      }
    }
    chart.update()
  }

  function drawRangeTrajectory(chart, minTensor, maxTensor, meanTensor, labelFormatter) {
    const colors = ['#0d6efd', '#dc3545', '#0dcaf0', '#ffc107', '#000000']
    const inputMinArray = minTensor.arraySync()
    const inputMaxArray = maxTensor.arraySync()
    const inputMeanArray = meanTensor.arraySync()
    for(let i=chart.data.labels.length; i < inputMinArray.length; i++) {
      chart.data.labels.push(i)
      const rowMin = inputMinArray[i]
      const rowMax = inputMaxArray[i]
      const rowMean = inputMeanArray[i]
      for(let j=0; j < rowMin.length; j++) {
        while(!chart.data.datasets[3*j]) {
          chart.data.datasets.push({ data : [], label: labelFormatter ? labelFormatter(3*j) : `Series ${3*j} (min)`, borderWidth: 1, borderColor: colors[j % colors.length], borderDash: [5, 5]})
        }
        chart.data.datasets[3*j].data.push(rowMin[j])
        
        while(!chart.data.datasets[3*j+1]) {
          chart.data.datasets.push({ data : [], label: labelFormatter ? labelFormatter(3*j+1) : `Series ${3*j+1} (max)`, borderWidth: 1, borderColor: colors[j % colors.length], borderDash: [5, 5]})
        }
        chart.data.datasets[3*j+1].data.push(rowMax[j])
        
        while(!chart.data.datasets[3*j+2]) {
          chart.data.datasets.push({ data : [], label: labelFormatter ? labelFormatter(3*j+2) : `Series ${3*j+2} (mean)`, borderWidth: 2, borderColor: colors[j % colors.length]})
        }
        chart.data.datasets[3*j+2].data.push(rowMean[j])
      }
    }
    chart.update()
  }

  function drawTrajectory() {
    drawSingleTrajectory(inputChart, agent.memory.episodeMemory.input, (index) => {
      const labels = ['distance', 'radar', 'enemyDirection']
      if(labels[index]) {
        return labels[index]
      }
      return `Input #${index+1}`
    })
    drawRangeTrajectory(actionChart, agent.memory.episodeMemory.actionMin, agent.memory.episodeMemory.actionMax, agent.memory.episodeMemory.actionMean, (index) => {
      const labels = ['radar (min)', 'radar (max)', 'radar']
      if(labels[index]) {
        return labels[index]
      }
      return `Action #${index+1}`
    })
    drawSingleTrajectory(rewardChart, agent.memory.episodeMemory.reward, () => {
      return 'Reward'
    })
    drawSingleTrajectory(valueChart, agent.memory.episodeMemory.value, () => {
      return 'Value'
    })

  }

  trainer.addEventListener('step', () => {
    // scoring card
    totalRewardField.text(agent.stats.totalReward.toFixed(2))
    valueField.text(agent.stats.expectedValue.toFixed(2))
    for(let i=0; i < agent.stats.rewardComponents.length; i++) {
      rewardField[i].text(agent.stats.rewardComponents[i].toFixed(2))
    }

    stepCounter ++

    if(stepCounter % 5 === 0) {
      drawTrajectory()
    }



  })


}