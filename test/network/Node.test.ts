import { expect } from 'chai';
import Node from '../../src/network/Node';
import Connection from '../../src/network/Connection';
import { ActivationType } from '../../src/network/Activation';

describe('test Node', () => {

  it('should create inputs', () => {
    let node:Node = new Node();
    let input1:Connection = node.getInput(3);
    let input2:Connection = node.getInput(5);

    input1.weight = 0.44;
    input2.weight = 0.75;

    input1 = node.getInput(3);
    input2 = node.getInput(5);

    expect(input1).to.have.property('weight', 0.44);
    expect(input2).to.have.property('weight', 0.75);
    expect(node).to.have.property('inputCount', 6);
  });

  it('should create outputs', () => {
    let node:Node = new Node();
    let output1:Connection = node.getOutput(100);
    let output2:Connection = node.getOutput(32);

    output1.weight = 0.12;
    output2.weight = 0.82;

    output1 = node.getOutput(100);
    output2 = node.getOutput(32);

    expect(output1).to.have.property('weight', 0.12);
    expect(output2).to.have.property('weight', 0.82);
    expect(node).to.have.property('outputCount', 101);
  });

  it('should assign input', () => {
    let node: Node = new Node();
    let connection = new Connection();
    connection.weight = 0.323;
    node.setInput(4, connection);
    let input: Connection = node.getInput(4);

    expect(input).to.have.property('weight', 0.323);
  });

  it('should override input', () => {
    let node: Node = new Node();
    let connection = new Connection();
    connection.weight = 0.83;
    let input: Connection = node.getInput(4);
    input.weight = 939;
    node.setInput(4, connection);
    input = node.getInput(4);

    expect(input).to.have.property('weight', 0.83);
  });

  it('should process inputs', () => {
    let node: Node = new Node();
    node.bias = 0.212;
    let inputs: Connection[] = [];
    inputs.push(node.getInput(0));
    inputs.push(node.getInput(1));
    inputs[0].weight = 0.5;
    inputs[1].weight = 0.2;
    inputs[0].input = 0.8;
    inputs[1].input = 0.1;

    node.process();

    let output: number = node.getOutput(0).process();

    expect(output).to.be.equal(0.5 * 0.8 + 0.2 * 0.1 + 0.212);
  });

  it('should set activation function', () => {
    let node: Node = new Node();
    node.bias = 0.212;
    let inputs: Connection[] = [];
    inputs.push(node.getInput(0));
    inputs.push(node.getInput(1));
    inputs[0].weight = 0.5;
    inputs[1].weight = 0.2;
    inputs[0].input = 0.8;
    inputs[1].input = 0.1;

    node.activationType = ActivationType.SoftPlus;
    node.process();

    let output: number = node.getOutput(0).process();

    expect(output).to.be.equal(Math.log(1+Math.exp(0.5 * 0.8 + 0.2 * 0.1 + 0.212)));
    expect(node.activationType).to.be.equal(ActivationType.SoftPlus);
  });

  it('should configure node', () => {
    let node: Node = new Node();
    node.configure([0.3, -0.2], [2, 0.7, -3.2], 0.02, ActivationType.Sigmoid);

    expect(node.getInput(0)).to.have.property('weight', 0.3);
    expect(node.getInput(1)).to.have.property('weight', -0.2);
    expect(node.getOutput(0)).to.have.property('weight', 2);
    expect(node.getOutput(1)).to.have.property('weight', 0.7);
    expect(node.getOutput(2)).to.have.property('weight', -3.2);
    expect(node).to.have.property('bias', 0.02);
    expect(node).to.have.property('activationType', ActivationType.Sigmoid);
  });

  it('should chain nodes', () => {
    //                              /--(0.5)--> [ LIN: 0.15 ] --(-1)--\
    //                             /                                    \
    //                            /                                      \
    //                           /                                         \
    // 0.3 --(1)--> [ LIN: 0.3 ]                                            [ LIN: -0.21] --(-2)--> 0.42
    //                          \                                         /
    //                           \                                       /
    //                            \              (bias -0.03)           /
    //                             \--(-0.9)--> [ LIN: -0.3 ] --(0.2)--/

    let inputNode: Node = new Node();
    let middleNode1: Node = new Node();
    let middleNode2: Node = new Node();
    let outputNode: Node = new Node();

    inputNode.configure([1], [0.5, -0.9], 0, ActivationType.Linear);
    middleNode1.configure([], [-1], 0, ActivationType.Linear);
    middleNode2.configure([], [0.2], -0.03, ActivationType.Linear);
    outputNode.configure([], [-2], 0, ActivationType.Linear);

    middleNode1.setInput(0, inputNode.getOutput(0));
    middleNode2.setInput(0, inputNode.getOutput(1));
    outputNode.setInput(0, middleNode1.getOutput(0));
    outputNode.setInput(1, middleNode2.getOutput(0));

    inputNode.getInput(0).input = 0.3;
    inputNode.process();
    middleNode1.process();
    middleNode2.process();
    outputNode.process();

    expect(inputNode.getOutput(0).input).to.be.closeTo(0.3, 0.001);
    expect(middleNode1.getOutput(0).input).to.be.closeTo(0.15, 0.001);
    expect(middleNode2.getOutput(0).input).to.be.closeTo(-0.3, 0.001);
    expect(outputNode.getOutput(0).input).to.be.closeTo(-0.21, 0.001);

    expect(outputNode.getOutput(0).process()).to.be.closeTo(0.42, 0.001);
  });

  it('should randomize node', () => {
    let nodes: Node[] = [];
    let i: number;

    for(i=0; i< 100; i++) {
      nodes[i] = new Node();
      nodes[i].configure([1,1,1], [1,1], 0, ActivationType.Linear);
      nodes[i].randomize();
    }

    let theSameInput1: boolean = true;
    let theSameInput2: boolean = true;
    let theSameInput3: boolean = true;
    let theSameOutput1: boolean = true;
    let theSameOutput2: boolean = true;
    let theSameBias: boolean = true;
    let theSameActivation: boolean = true;

    for(i=1; i< 100; i++) {
      theSameInput1 = theSameInput1 && nodes[0].getInput(0).weight == nodes[i].getInput(0).weight;
      theSameInput2 = theSameInput2 && nodes[0].getInput(1).weight == nodes[i].getInput(1).weight;
      theSameInput3 = theSameInput3 && nodes[0].getInput(2).weight == nodes[i].getInput(2).weight;
      theSameOutput1 = theSameOutput1 && nodes[0].getOutput(0).weight == nodes[i].getOutput(0).weight;
      theSameOutput2 = theSameOutput2 && nodes[0].getOutput(1).weight == nodes[i].getOutput(1).weight;
      theSameBias = theSameBias && nodes[0].bias == nodes[i].bias;
      theSameActivation = theSameActivation && nodes[0].activationType == nodes[i].activationType;
    }

    expect(theSameInput1).to.be.false;
    expect(theSameInput2).to.be.false;
    expect(theSameInput3).to.be.false;
    expect(theSameOutput1).to.be.false;
    expect(theSameOutput2).to.be.false;
    expect(theSameBias).to.be.false;
    expect(theSameActivation).to.be.false;


  });



});
