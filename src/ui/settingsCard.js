import * as $ from 'jquery'

export default function initUI(trainer, tankLogic, policy) {
  const inputEpochLen = $('#inputEpochLen')
  const inputEpisodeLen = $('#inputEpisodeLen')
  const inputLearningRate = $('#inputLearningRate')
  const inputDiscountRate = $('#inputDiscountRate')
  const inputReward = $('#inputReward')

  
  inputEpochLen.val(trainer.epochSize)
  inputEpisodeLen.val(trainer.episodeTimeLimit)
  inputLearningRate.val(policy.learningRate)
  inputDiscountRate.val(policy.discountRate)

  inputEpochLen.prop('readonly', true);
  inputEpisodeLen.prop('readonly', true);
  inputLearningRate.prop('readonly', true);
  inputDiscountRate.prop('readonly', true);
  inputReward.prop('disabled', true);
  inputReward.val(trainer.rewardType)
  
}
