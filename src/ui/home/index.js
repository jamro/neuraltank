import settingsCard from './settingsCard'
import persistencyCard from './persistencyCard'
import playbackCard from './playbackCard'

document.body.style.display = 'block'

export default (...args) => {
  persistencyCard(...args)
  settingsCard(...args)
  playbackCard(...args)
}