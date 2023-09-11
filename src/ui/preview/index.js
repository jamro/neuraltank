import trajectoryCard from './trajectoryCard'
import controlsCard from './controlsCard'
import scoringCard from './scoringCard'

export default (...args) => {
  trajectoryCard(...args)
  scoringCard(...args)
  controlsCard(...args)
}