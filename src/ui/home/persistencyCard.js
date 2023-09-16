import * as $ from 'jquery'

export default function initUI(settings, trainer, bootCamp) {
  const agentSaveDate = $('#agent-save-date')
  const removeModelButton = $('#btn-remove-stored-model')

  agentSaveDate.text(trainer.agent.dateSaved || '-')
  removeModelButton.prop('disabled', !trainer.agent.dateSaved)
  removeModelButton.show()

  removeModelButton.on('click', async () => {
    removeModelButton.prop('disabled',true)
    removeModelButton.hide()
    await trainer.removeStored()
    agentSaveDate.text('-')
  })
}
