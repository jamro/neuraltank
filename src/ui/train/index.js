import trainingCard from './trainingCard'
import scoringCard from './scoringCard'
import settingsCard from './settingsCard'
import lossCard from './lossCard'

document.body.style.display = 'block'

export default (...args) => {
  trainingCard(...args)
  scoringCard(...args)
  settingsCard(...args)
  lossCard(...args)
}