import * as $ from 'jquery'
import Agent from '../../agent/Agent'

async function reloadSnapshotList(onRestore, onLabelChange) {
  const agents = Object.values(await Agent.getAgents()).filter(s => s.name !== 'latest')
  const container = $('#snapshot-list')
  if(agents.length === 0) {
    container.html('<li class="list-group-item"><em>No snapshots found</em></li>')
    return 
  }
  container.html('')
  for(let agent of agents) {
    container.append(getSnapshotElement(agent))
    $(`#btn-delete-snapshot-${agent.name}`).on('click', async () => {
      if(!confirm("Really? This operation cannot be undone.")) return
      await Agent.delAgent(agent.name)
      reloadSnapshotList(onRestore, onLabelChange)
    })    
    $(`#btn-restore-snapshot-${agent.name}`).on('click', async () => {
      await onRestore(agent.name)
    })
    let changeTimeout = null
    $(`#snapshot-label-${agent.name}`).on('keyup', async (e) => {
      if(changeTimeout) {
        clearTimeout(changeTimeout)
      }
      changeTimeout = setTimeout(async () => {
        onLabelChange(agent.name, e.target.value)
      }, 500)

    })
  }

}

function getSnapshotElement({name, trainedAt, label}) {
  return `
    <li class="list-group-item">
      <div class="row">
        <div class="col-xxl-4 col-xl-12 mb-xl-2">
          <i class="ri-brain-line"></i> ${new Date(trainedAt).toLocaleString()}
        </div>
        <div class="col-xxl-4 col-xl-7 col-md-6 col-sm-8">
          <input id="snapshot-label-${name}" type="text" class="form-control" placeholder="no label" style="font-size: 0.75em" value="${label}">
        </div>
        <div class="col-xxl-4 col-xl-5 col-md-6 col-sm-4">
          <button id="btn-delete-snapshot-${name}" type="button" class="btn btn-danger btn-sm float-end" style="margin: 0 0.5em"><i class="ri-delete-bin-fill"></i> Delete</button>
          <button id="btn-restore-snapshot-${name}" type="button" class="btn btn-warning btn-sm float-end" style="margin: 0 0.5em"><i class="ri-upload-line"></i> Restore</button>
        </div>
      </row>
    </li>
  `;
}

export default function initUI(settings, trainer, bootCamp) {
  const agentTrainDate = $('#agent-train-date')
  const agentSaveDate = $('#agent-save-date')
  const agentLabel = $('#agent-label')
  const removeModelButton = $('#btn-remove-stored-model')
  const snapshotButton = $('#btn-snapshot-model')

  const refreshWorkspace = () => {
    agentTrainDate.text(trainer.agent.trainDate ? trainer.agent.trainDate.toLocaleString() : '-')
    agentSaveDate.text(trainer.agent.saveDate ? trainer.agent.saveDate.toLocaleString() : '-')
    removeModelButton.prop('disabled', !trainer.agent.saveDate)
    snapshotButton.prop('disabled', !trainer.agent.trainDate)
    agentLabel.text(trainer.agent.label || '-')
  }
  refreshWorkspace()

  
  removeModelButton.on('click', async () => {
    removeModelButton.prop('disabled',true)
    snapshotButton.prop('disabled',true)
    await trainer.removeStored()
    agentTrainDate.text('-')
    agentSaveDate.text('-')
    agentLabel.text('-')
  })

  const restoreSnapshot = async (name) => {
    await trainer.agent.restoreModelFrom(name)
    await trainer.agent.saveModel()
    refreshWorkspace()
  }

  const updateActorLabel  = async (name, label) => {
    const tempAgent = new Agent(settings, name)
    await tempAgent.restoreModel()
    tempAgent.label = label
    await tempAgent.saveModel()
  }

  snapshotButton.on('click', async () => {
    const snapshotName = new Date().toISOString().replace(/[\-:\.Z]/g, "").replace(/T/g, "_")
    await trainer.agent.saveModelAs(snapshotName)
    await reloadSnapshotList(restoreSnapshot, updateActorLabel)
  })

  setTimeout(async() => {
    await reloadSnapshotList(restoreSnapshot, updateActorLabel)
  })
}
