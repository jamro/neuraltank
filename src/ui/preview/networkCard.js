import * as $ from 'jquery'
import { SVG } from '@svgdotjs/svg.js'


function renderNetwork(layers, canvas) {
  canvas.clear()
  const width = canvas.node.clientWidth
  const layerSpacing = width/(layers.length+1)
  const height = canvas.node.clientHeight

  for(let i=0; i < layers.length; i++) {
    const layer = layers[i]
    const currentNodeSpacing = height/(layer.length+1)
    const nextNodeSpacing = height/(layer[0].length+1)

    // connections
    for(let j=0; j < layer.length; j++) {
      for(let k=0; k < layer[j].length; k++) {
        canvas.line(
          layerSpacing*(i+0.5), 
          currentNodeSpacing*(j+1), 
          layerSpacing*(i+1.5), 
          nextNodeSpacing*(k+1),
        ).stroke({ width: 1, color: '#000000', opacity: Math.abs(layer[j][k]) })
      }
    }

    // nodes
    for(let j=0; j < layer.length; j++) {
      canvas.circle(4, 4)
        .attr({ fill: '#f06' })
        .move(
          layerSpacing*(i+0.5)-2,
          currentNodeSpacing*(j+1)-2
        )
    }
  }

  //output
  const layer = layers[layers.length-1]
  const nodeSpacing = height/(layer[0].length+1)
  for(let j=0; j < layer[0].length; j++) {
    canvas.circle(4, 4)
      .attr({ fill: '#f06' })
      .move(
        layerSpacing*(layers.length+0.5)-2,
        nodeSpacing*(j+1)-2
      )
  }

}

export default function initUI(trainer, agent) {
  const criticNetwork = []
  for(let layer of agent.criticNet.net.layers) {
    const weights = layer.getWeights()
    if(weights.length == 0) continue
    const kernel = weights[0].arraySync()
    criticNetwork.push(kernel)
  }
  const driverNetwork = []
  for(let layer of agent.driverNet.net.layers) {
    const weights = layer.getWeights()
    if(weights.length == 0) continue
    const kernel = weights[0].arraySync()
    driverNetwork.push(kernel)
  }
  const shooterNetwork = []
  for(let layer of agent.driverNet.net.layers) {
    const weights = layer.getWeights()
    if(weights.length == 0) continue
    const kernel = weights[0].arraySync()
    shooterNetwork.push(kernel)
  }

  const criticCanvas = SVG().addTo('#critic-preview').width('100%')
  const driverCanvas = SVG().addTo('#driver-preview').width('100%')
  const shooterCanvas = SVG().addTo('#shooter-preview').width('100%')

  renderNetwork(criticNetwork, criticCanvas)
  renderNetwork(driverNetwork, driverCanvas)
  renderNetwork(shooterNetwork, shooterCanvas)


}