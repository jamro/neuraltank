import * as $ from 'jquery'
import * as tf from '@tensorflow/tfjs';
import Chart from 'chart.js/auto';

const INIT_DISCOUNT_RATE = 0.99

export default function initUI(trainer, agent) {
  const totalRewardField = $('#reward-total')
  const rewardField = [
    $('#reward-0'),
    $('#reward-1'),
    $('#reward-2'),
    $('#reward-3'),
    $('#reward-4'),
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
          },
          min: -1,
          max: 1
        },
      },
      elements: {
        point: {
          radius: 0
        },
      },
      plugins: {
        legend: legendSettings,
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
            text: 'action (mean)'
          },
          min: -1,
          max: 1
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
  const actionStdDevChart = new Chart(document.getElementById('action-stddev-chart'), {
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
            text: 'action (std dev)'
          },
          min: 0,
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

  const advantageChart = new Chart(document.getElementById('advantage-chart'), {
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
            text: 'advantage'
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

  function drawSingleTrajectory(chart, tensor, labelFormatter, datasetOptions={}) {
    const inputArray = tensor.arraySync()
    for(let i=chart.data.labels.length; i < inputArray.length; i++) {
      chart.data.labels.push(i)
      const row = inputArray[i]
      for(let j=0; j < row.length; j++) {
        while(!chart.data.datasets[j]) {
          chart.data.datasets.push({ data : [], label: labelFormatter ? labelFormatter(j) : `Series ${j+1}`, borderWidth: 2, ...datasetOptions})
        }
        chart.data.datasets[j].data.push(row[j])
      }
    }
    chart.update()
  }

  function drawTrajectory() {
    const actionLabels = ['gun', 'radar']
    drawSingleTrajectory(inputChart, agent.memory.episodeMemory.input, (index) => {
      const labels = ['distance', 'radar', 'enemyDirection', 'gunPos']
      if(labels[index]) {
        return labels[index]
      }
      return `Input #${index+1}`
    })
    drawSingleTrajectory(actionChart, agent.memory.episodeMemory.actionMean, (index) => {
      if(actionLabels[index]) {
        return actionLabels[index]
      }
      return `Input #${index+1}`
    })
    drawSingleTrajectory(actionStdDevChart, agent.memory.episodeMemory.actionStdDev, (index) => {
      if(actionLabels[index]) {
        return actionLabels[index]
      }
      return `Input #${index+1}`
    })

    // clean up the chart to include data corrections
    rewardChart.data.labels = []
    rewardChart.data.datasets = [] 
    drawSingleTrajectory(rewardChart, agent.memory.episodeMemory.reward, () => {
      return 'Reward'
    })
    drawSingleTrajectory(valueChart, agent.memory.episodeMemory.value, () => {
      return 'Value'
    }, {fill: 'origin'})

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

  trainer.addEventListener('epochComplete', async () => {
    agent.memory.aggregateGameResults()
    const reward = tf.concat(agent.memory.epochMemory.reward)
    const value = tf.concat(agent.memory.epochMemory.value)

    const advantage = agent.actorNet.getAdvantages(reward, value, INIT_DISCOUNT_RATE)

    drawSingleTrajectory(advantageChart, advantage, () => 'Generalized Advantage Estimation', {fill: 'origin'})

  })


}