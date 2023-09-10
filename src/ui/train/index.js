import trainingCard from './trainingCard'
import persistencyCard from './persistencyCard'
import scoringCard from './scoringCard'
import settingsCard from './settingsCard'
import lossCard from './lossCard'

export default (...args) => {
  trainingCard(...args)
  persistencyCard(...args)
  scoringCard(...args)
  settingsCard(...args)
  lossCard(...args)
}