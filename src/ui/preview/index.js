import trajectoryCard from './trajectoryCard'
import controlsCard from './controlsCard'
import scoringCard from './scoringCard'
import networkCard from './networkCard'

export default (...args) => {
  trajectoryCard(...args)
  scoringCard(...args)
  controlsCard(...args)
  networkCard(...args)
}