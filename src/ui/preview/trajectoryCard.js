import * as $ from 'jquery'
import * as tf from '@tensorflow/tfjs';
import Chart from 'chart.js/auto';
import annotationPlugin from 'chartjs-plugin-annotation';
Chart.register(annotationPlugin);

const INIT_DISCOUNT_RATE = 0.99

export default function initUI(trainer, agent) {

  const commonOptions = {
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    },
    animation: false, 
    elements: {
      point: {
        radius: 0
      },
    },
    plugins: {
      legend: {
        display: true,
        labels: {
          boxHeight: 3,
          boxWidth: 9,
          padding: 3,
        }
      },
      tooltip: {
        enabled: true,
        intersect: false,
      }
    }
  }

  const shooterInputChart = new Chart(document.getElementById('shooter-input-chart'), {
		type : 'line',
		data: {
      labels : [],
      datasets : []
    },
    options: {
      ...commonOptions,
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
    }
	});
  const shooterActionChart = new Chart(document.getElementById('shooter-action-chart'), {
		type : 'line',
		data: {
      labels : [],
      datasets : []
    },
    options: {
      ...commonOptions,
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
      }
    }
	});
  const shooterStdDevChart = new Chart(document.getElementById('shooter-action-stddev-chart'), {
		type : 'line',
		data: {
      labels : [],
      datasets : []
    },
    options: {
      ...commonOptions,
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
      }
    }
	});
  const driverInputChart = new Chart(document.getElementById('driver-input-chart'), {
		type : 'line',
		data: {
      labels : [],
      datasets : []
    },
    options: {
      ...commonOptions,
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
    }
	});
  const driverActionChart = new Chart(document.getElementById('driver-action-chart'), {
		type : 'line',
		data: {
      labels : [],
      datasets : []
    },
    options: {
      ...commonOptions,
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
      }
    }
	});
  const driverStdDevChart = new Chart(document.getElementById('driver-action-stddev-chart'), {
		type : 'line',
		data: {
      labels : [],
      datasets : []
    },
    options: {
      ...commonOptions,
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
      ...commonOptions,
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
    }
	});
  const valueChart = new Chart(document.getElementById('value-chart'), {
		type : 'line',
		data: {
      labels : [],
      datasets : []
    },
    options: {
      ...commonOptions,
      scales: {
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
    }
	});

  const advantageChart = new Chart(document.getElementById('advantage-chart'), {
		type : 'line',
		data: {
      labels : [],
      datasets : []
    },
    options: {
      ...commonOptions,
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
    }
	});

  let stepCounter = 0

  function drawSingleTrajectory(chart, inputArray, labelFormatter, datasetOptions={}) {
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

  function clearSingleTrajectory(chart) {
    chart.data.labels = []

    for(let i=0; i < chart.data.datasets.length; i++) {
      chart.data.datasets[i].data = []
    }
    chart.update()
  }

  function drawTrajectory() {
    const shooterActionLabels = ['gun', 'radar']
    const driverActionLabels = ['turn', 'throttle']
    drawSingleTrajectory(shooterInputChart, agent.memory.episodeMemory.shooterInput, (index) => {
      const labels = ['distance', 'radar', 'enemyDirection', 'gunPos', 'tankAngle', 'turnControl']
      if(labels[index]) {
        return labels[index]
      }
      return `Input #${index+1}`
    })
    drawSingleTrajectory(shooterActionChart, agent.memory.episodeMemory.shooterActionMean, (index) => {
      if(shooterActionLabels[index]) {
        return shooterActionLabels[index]
      }
      return `Input #${index+1}`
    })
    drawSingleTrajectory(shooterStdDevChart, agent.memory.episodeMemory.shooterActionStdDev, (index) => {
      if(shooterActionLabels[index]) {
        return shooterActionLabels[index]
      }
      return `Input #${index+1}`
    })
    drawSingleTrajectory(driverInputChart, agent.memory.episodeMemory.driverInput, (index) => {
      const labels = ['distance', 'radar', 'enemyDirection', 'wall', 'tankAngle', 'collision', 'bullets']
      if(labels[index]) {
        return labels[index]
      }
      return `Input #${index+1}`
    })
    drawSingleTrajectory(driverActionChart, agent.memory.episodeMemory.driverActionMean, (index) => {
      if(driverActionLabels[index]) {
        return driverActionLabels[index]
      }
      return `Input #${index+1}`
    })
    drawSingleTrajectory(driverStdDevChart, agent.memory.episodeMemory.driverActionStdDev, (index) => {
      if(driverActionLabels[index]) {
        return driverActionLabels[index]
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
    stepCounter ++

    if(stepCounter % 5 === 0) {
      drawTrajectory()


      const index = 1
      const tooltipPoint = shooterInputChart.getDatasetMeta(0).data[index]
      shooterInputChart.tooltip.active = [tooltipPoint]
      shooterInputChart.tooltip.update(true);
      shooterInputChart.update()

    }
    
  })

  trainer.addEventListener('epochComplete', async () => {
    agent.memory.aggregateGameResults()
    const reward = tf.tensor2d(agent.memory.epochMemory.reward.flat())
    const value = tf.tensor2d(agent.memory.epochMemory.value.flat())

    const advantage = agent.shooterNet.getAdvantages(reward, value, INIT_DISCOUNT_RATE).arraySync()

    drawSingleTrajectory(advantageChart, advantage, () => 'Generalized Advantage Estimation', {fill: 'origin'})

  })

  window.addEventListener('restartPreview', async () => {
    clearSingleTrajectory(shooterInputChart)
    clearSingleTrajectory(shooterActionChart)
    clearSingleTrajectory(shooterStdDevChart)
    clearSingleTrajectory(driverInputChart)
    clearSingleTrajectory(driverActionChart)
    clearSingleTrajectory(driverStdDevChart)
    clearSingleTrajectory(rewardChart)
    clearSingleTrajectory(valueChart)
    clearSingleTrajectory(advantageChart)
  })

  $('#driver-collapse').on('click', () => {
    $('#driver-collapse').hide()
    $('#driver-expand').show()
    $('#driver-content').hide()
  })

  $('#driver-expand').on('click', () => {
    $('#driver-collapse').show()
    $('#driver-expand').hide()
    $('#driver-content').show()
  })

  $('#shooter-collapse').on('click', () => {
    $('#shooter-collapse').hide()
    $('#shooter-expand').show()
    $('#shooter-content').hide()
  })

  $('#shooter-expand').on('click', () => {
    $('#shooter-collapse').show()
    $('#shooter-expand').hide()
    $('#shooter-content').show()
  })
}