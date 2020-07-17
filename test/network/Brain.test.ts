import { expect } from 'chai';
import Brain from '../../src/network/Brain';
import Node from '../../src/network/Node';
import { ActivationType } from '../../src/network/Activation';

describe('test Brain', () => {

  it('should create nodes', () => {
    let brain: Brain = new Brain();
    brain.createLayers([2, 4, 5, 3]);

    expect(brain.layerCount).to.be.equal(4);
    expect(brain.getLayerSize(0)).to.be.equal(2);
    expect(brain.getLayerSize(1)).to.be.equal(4);
    expect(brain.getLayerSize(2)).to.be.equal(5);
    expect(brain.getLayerSize(3)).to.be.equal(3);
    expect(brain.connectionCount).to.be.equal(2*4 + 4*5 + 5*3);
    expect(brain.nodeCount).to.be.equal(2+4+5+3);

  });

  it('should connect nodes', () => {
    let brain: Brain = new Brain();
    brain.createLayers([1, 2, 1]);
    let node1: Node = brain.getNode(0, 0);
    let node2: Node = brain.getNode(1, 0);
    let node3: Node = brain.getNode(1, 1);
    let node4: Node = brain.getNode(2, 0);

    expect(node1.getOutput(0)).to.be.equal(node2.getInput(0), "node1 not connected to node2");
    expect(node1.getOutput(1)).to.be.equal(node3.getInput(0), "node1 not connected to node3");
    expect(node2.getOutput(0)).to.be.equal(node4.getInput(0), "node2 not connected to node4");
    expect(node3.getOutput(0)).to.be.equal(node4.getInput(1), "node3 not connected to node4");

  });

  it('should process signals', () => {
    //    --> [ 0.8 ] --(0.1)-- [ BIN, bias: 0.2, out: 0.4 ] -->
    //               \        /
    //                \      /
    //                (0.2) /
    //                  \  /
    //                   \/
    //                   /\
    //                  /  \
    //                 /    \
    //              (0.3)    \
    //               /        \
    //    --> [ -0.6 ] --(0.4)-- [ LIN, -0.08 ] -->

    let brain: Brain = new Brain();
    brain.createLayers([2, 2]);
    brain.getNode(0, 0).getOutput(0).weight = 0.1;
    brain.getNode(0, 0).getOutput(1).weight = 0.2;
    brain.getNode(0, 1).getOutput(0).weight = 0.3;
    brain.getNode(0, 1).getOutput(1).weight = 0.4;
    brain.getNode(1, 0).bias = 0.2;
    brain.getNode(1, 0).activationType = ActivationType.BinaryStep;

    let output: number[] = brain.process([0.8, -0.6]);

    expect(brain.getNode(0, 0).getInput(0).process()).to.be.equal(0.8);
    expect(brain.getNode(0, 1).getInput(0).process()).to.be.equal(-0.6);

    expect(brain.getNode(1, 0).getInput(0).process()).to.be.equal(0.8*0.1);
    expect(brain.getNode(1, 0).getInput(1).process()).to.be.equal(-0.6*0.3);

    expect(brain.getNode(1, 1).getInput(0).process()).to.be.equal(0.8*0.2);
    expect(brain.getNode(1, 1).getInput(1).process()).to.be.equal(-0.6*0.4);

    expect(output).to.have.length(2);
    expect(output[0]).to.be.closeTo(1, 0.001);
    expect(output[1]).to.be.closeTo(0.8*0.2 - 0.6*0.4, 0.001);

  });

});
