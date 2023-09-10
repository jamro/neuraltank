import * as $ from 'jquery'

export default function initUI(trainer, agent) {
  const replayButton = $('#replay-preview')
  const speedButtons = {
    0.1: $('#sim-speed-0-1'),
    0.5: $('#sim-speed-0-5'),
    1: $('#sim-speed-1'),
  }
  const speedLevels = Object.keys(speedButtons)

  for(let speed of speedLevels) {
    speedButtons[speed].on('click', () => {
      trainer.simulation.setSpeed(speed)
    })
  }
 
  replayButton.on('click', () => {
    const event = new Event('restartPreview')
    window.dispatchEvent(event)
  })

  window.addEventListener('restartPreview', async () => {
    trainer.stop()
    agent.stats.reset()
    agent.memory.resetAll()
    await trainer.runEpoch()
  })

}