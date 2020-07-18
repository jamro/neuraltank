import { expect } from 'chai';
import Brain from '../../src/network/Brain';
import Node from '../../src/network/Node';
import { ActivationType } from '../../src/network/Activation';
import { createMock } from 'ts-auto-mock';
import BinaryBrainSerializer from '../../src/network/BinaryBrainSerializer';
import sinon = require("sinon");
import { BrainFieldType } from '../../src/network/BrainSerializer';

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

  it('should use binary serializer by default snapshot', () => {
    let brain: Brain = new Brain();
    brain.createLayers([1, 2, 10, 10, 1]);
    let snapshot: ArrayBuffer = brain.createSnapshot() as ArrayBuffer;
    expect(snapshot.byteLength).to.be.above(100);
  });

  it('should create snapshot', () => {
    const NODE_1_BIAS: number = 0.234;
    const NODE_2A_BIAS: number = 0.543;
    const NODE_2B_BIAS: number = 0.193;
    const NODE_3_BIAS: number = 0.642;
    const NODE_1_ACTIVATION: ActivationType = ActivationType.Gaussian;
    const NODE_2A_ACTIVATION: ActivationType = ActivationType.LeakyReLU;
    const NODE_2B_ACTIVATION: ActivationType = ActivationType.Linear;
    const NODE_3_ACTIVATION: ActivationType = ActivationType.TanH;
    const CONNECTION__WEIGHT_1_2A: number = 0.459;
    const CONNECTION__WEIGHT_1_2B: number = 0.982;
    const CONNECTION__WEIGHT_2A_3: number = 0.107;
    const CONNECTION__WEIGHT_2B_3: number = 0.390;

    let brain: Brain = new Brain();
    let writeSpy: sinon.SinonSpy = sinon.spy();
    let allocateSpy: sinon.SinonSpy = sinon.spy();
    let serializerMock: BinaryBrainSerializer = createMock<BinaryBrainSerializer>({
      write: writeSpy,
      allocate: allocateSpy,
      serialize: sinon.fake.returns('serialized-data-9743620934')
    });

    brain.serializer = serializerMock;
    brain.createLayers([1, 2, 1]);
    brain.getNode(0, 0).getOutput(0).weight = CONNECTION__WEIGHT_1_2A;
    brain.getNode(0, 0).getOutput(1).weight = CONNECTION__WEIGHT_1_2B;
    brain.getNode(1, 0).getOutput(0).weight = CONNECTION__WEIGHT_2A_3;
    brain.getNode(1, 1).getOutput(0).weight = CONNECTION__WEIGHT_2B_3;
    brain.getNode(0, 0).bias = NODE_1_BIAS;
    brain.getNode(0, 0).activationType = NODE_1_ACTIVATION;
    brain.getNode(1, 0).bias = NODE_2A_BIAS;
    brain.getNode(1, 0).activationType = NODE_2A_ACTIVATION;
    brain.getNode(1, 1).bias = NODE_2B_BIAS;
    brain.getNode(1, 1).activationType = NODE_2B_ACTIVATION;
    brain.getNode(2, 0).bias = NODE_3_BIAS;
    brain.getNode(2, 0).activationType = NODE_3_ACTIVATION;

    let snapshot:string = brain.createSnapshot();

    expect(snapshot).to.be.equal('serialized-data-9743620934');
    expect(allocateSpy.calledWith(12)).to.be.true;

    let i:number = 0;
    expect(writeSpy.calledWith(NODE_1_BIAS, i++, BrainFieldType.Bias)).to.be.true;
    expect(writeSpy.calledWith(NODE_1_ACTIVATION, i++, BrainFieldType.ActivationType)).to.be.true;
    expect(writeSpy.calledWith(CONNECTION__WEIGHT_1_2A, i++, BrainFieldType.ConnectionWeight)).to.be.true;
    expect(writeSpy.calledWith(CONNECTION__WEIGHT_1_2B, i++, BrainFieldType.ConnectionWeight)).to.be.true;

    expect(writeSpy.calledWith(NODE_2A_BIAS, i++, BrainFieldType.Bias)).to.be.true;
    expect(writeSpy.calledWith(NODE_2A_ACTIVATION, i++, BrainFieldType.ActivationType)).to.be.true;
    expect(writeSpy.calledWith(CONNECTION__WEIGHT_2A_3, i++, BrainFieldType.ConnectionWeight)).to.be.true;

    expect(writeSpy.calledWith(NODE_2B_BIAS, i++, BrainFieldType.Bias)).to.be.true;
    expect(writeSpy.calledWith(NODE_2B_ACTIVATION, i++, BrainFieldType.ActivationType)).to.be.true;
    expect(writeSpy.calledWith(CONNECTION__WEIGHT_2B_3, i++, BrainFieldType.ConnectionWeight)).to.be.true;

    expect(writeSpy.calledWith(NODE_3_BIAS, i++, BrainFieldType.Bias)).to.be.true;
    expect(writeSpy.calledWith(NODE_3_ACTIVATION, i++, BrainFieldType.ActivationType)).to.be.true;
  });

  it('should restore snapshot', () => {
    const NODE_1_BIAS: number = 0.234;
    const NODE_2A_BIAS: number = 0.543;
    const NODE_2B_BIAS: number = 0.193;
    const NODE_3_BIAS: number = 0.642;
    const NODE_1_ACTIVATION: ActivationType = ActivationType.Gaussian;
    const NODE_2A_ACTIVATION: ActivationType = ActivationType.LeakyReLU;
    const NODE_2B_ACTIVATION: ActivationType = ActivationType.Linear;
    const NODE_3_ACTIVATION: ActivationType = ActivationType.TanH;
    const CONNECTION__WEIGHT_1_2A: number = 0.459;
    const CONNECTION__WEIGHT_1_2B: number = 0.982;
    const CONNECTION__WEIGHT_2A_3: number = 0.107;
    const CONNECTION__WEIGHT_2B_3: number = 0.390;
    let data: number[] = [
      NODE_1_BIAS,
      NODE_1_ACTIVATION,
      CONNECTION__WEIGHT_1_2A,
      CONNECTION__WEIGHT_1_2B,
      NODE_2A_BIAS,
      NODE_2A_ACTIVATION,
      CONNECTION__WEIGHT_2A_3,
      NODE_2B_BIAS,
      NODE_2B_ACTIVATION,
      CONNECTION__WEIGHT_2B_3,
      NODE_3_BIAS,
      NODE_3_ACTIVATION
    ];
    let brain: Brain = new Brain();
    let deserializeSpy: sinon.SinonSpy = sinon.spy();
    let serializerMock: BinaryBrainSerializer = createMock<BinaryBrainSerializer>({
      deserialize: deserializeSpy,
      read: sinon.fake((i: number) => data[i])
    });

    brain.serializer = serializerMock;
    brain.createLayers([1, 2, 1]);
    brain.restoreSnapshot('data-8324');

    expect(deserializeSpy.calledWith('data-8324')).to.be.true;

    expect(brain.getNode(0, 0).bias).to.be.closeTo(NODE_1_BIAS, 0.00001);
    expect(brain.getNode(1, 0).bias).to.be.closeTo(NODE_2A_BIAS, 0.00001);
    expect(brain.getNode(1, 1).bias).to.be.closeTo(NODE_2B_BIAS, 0.00001);
    expect(brain.getNode(2, 0).bias).to.be.closeTo(NODE_3_BIAS, 0.00001);

    expect(brain.getNode(0, 0).activationType).to.be.equal(NODE_1_ACTIVATION);
    expect(brain.getNode(1, 0).activationType).to.be.equal(NODE_2A_ACTIVATION);
    expect(brain.getNode(1, 1).activationType).to.be.equal(NODE_2B_ACTIVATION);
    expect(brain.getNode(2, 0).activationType).to.be.equal(NODE_3_ACTIVATION);

    expect(brain.getNode(0, 0).getOutput(0).weight).to.be.closeTo(CONNECTION__WEIGHT_1_2A, 0.00001);
    expect(brain.getNode(0, 0).getOutput(1).weight).to.be.closeTo(CONNECTION__WEIGHT_1_2B, 0.00001);
    expect(brain.getNode(1, 0).getOutput(0).weight).to.be.closeTo(CONNECTION__WEIGHT_2A_3, 0.00001);
    expect(brain.getNode(1, 1).getOutput(0).weight).to.be.closeTo(CONNECTION__WEIGHT_2B_3, 0.00001);

  });

});
