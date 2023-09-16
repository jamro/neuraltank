import settingsCard from './settingsCard'
import persistencyCard from './persistencyCard'

document.body.style.display = 'block'

export default (...args) => {
  persistencyCard(...args)
  settingsCard(...args)
}