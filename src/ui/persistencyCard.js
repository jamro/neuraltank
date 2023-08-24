import * as $ from 'jquery'

export default function initUI(trainer, tankLogic, agent) {
  const agentSaveDate = $('#agent-save-date')
  const removeModelButton = $('#btn-remove-stored-model')

  removeModelButton.on('click', async () => {
    removeModelButton.prop('disabled',true)
    await trainer.removeStored()
    removeModelButton.prop('disabled', !trainer.agent.dateSaved)
  })

  removeModelButton.prop('disabled', !trainer.agent.dateSaved)
  agentSaveDate.text((trainer.agent.dateSaved || '-').toString())

  trainer.addEventListener('save', () => {
    agentSaveDate.text(trainer.agent.dateSaved.toString())
    removeModelButton.prop('disabled', !trainer.agent.dateSaved)
  })

  trainer.addEventListener('remove', () => {
    agentSaveDate.text('-')
    removeModelButton.prop('disabled', !trainer.agent.dateSaved)
  })
}
