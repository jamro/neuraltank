import trainingCard from './trainingCard'
import persistencyCard from './persistencyCard'
import scoringCard from './scoringCard'
import settingsCard from './settingsCard'

export default (...args) => {
  trainingCard(...args)
  persistencyCard(...args)
  scoringCard(...args)
  settingsCard(...args)
}