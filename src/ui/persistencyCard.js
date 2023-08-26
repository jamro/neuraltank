import * as $ from 'jquery'

export default function initUI(messageBus) {
  const agentSaveDate = $('#agent-save-date')
  const removeModelButton = $('#btn-remove-stored-model')


  removeModelButton.on('click', async () => {
    removeModelButton.prop('disabled',true)
    removeModelButton.hide()
    messageBus.send('clearSave')
  })

  messageBus.addEventListener('saveDate', (e) => {
    agentSaveDate.text(e.data.value || '-')
    removeModelButton.prop('disabled', !e.data.value)
    removeModelButton.show()
  })
}
