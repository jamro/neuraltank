import * as $ from 'jquery'

const INIT_DISCOUNT_RATE = 0.99

export default function initUI(trainer, agent) {
  const totalRewardField = $('#reward-total')
  const rewardField = [
    $('#reward-0'),
    $('#reward-1'),
    $('#reward-2'),
    $('#reward-3'),
    $('#reward-4'),
    $('#reward-5'),
  ]
  const valueField = $('#value')


  trainer.addEventListener('step', () => {
    // scoring card
    totalRewardField.text(agent.stats.totalReward.toFixed(2))
    valueField.text(agent.stats.expectedValue.toFixed(2))
    for(let i=0; i < agent.stats.rewardComponents.length; i++) {
      rewardField[i].text(agent.stats.rewardComponents[i].toFixed(2))
    }
  })
}