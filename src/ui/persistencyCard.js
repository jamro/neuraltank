import * as $ from 'jquery'

export default function initUI(trainer, tankLogic, policy) {
  const policySaveDate = $('#policy-save-date')
  const removeModelButton = $('#btn-remove-stored-model')

  removeModelButton.on('click', async () => {
    removeModelButton.prop('disabled',true)
    await trainer.removeStored()
    removeModelButton.prop('disabled', !trainer.policy.dateSaved)
  })

  removeModelButton.prop('disabled', !trainer.policy.dateSaved)
  policySaveDate.text((trainer.policy.dateSaved || '-').toString())

  trainer.addEventListener('save', () => {
    policySaveDate.text(trainer.policy.dateSaved.toString())
    removeModelButton.prop('disabled', !trainer.policy.dateSaved)
  })

  trainer.addEventListener('remove', () => {
    policySaveDate.text('-')
    removeModelButton.prop('disabled', !trainer.policy.dateSaved)
  })
}
