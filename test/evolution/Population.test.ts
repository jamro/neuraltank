import { expect } from 'chai';
import Population from '../../src/evolution/Population';
import Unit from '../../src/evolution/Unit';

describe('test Population', () => {

  it('should create population', () => {
    let population:Population = new Population();
    population.create(100);
    expect(population.size).to.be.equal(100);
    expect(population.units[0].name).to.not.be.equal(population.units[1].name)
  });

  it('should pick free unit', () => {
    let population:Population = new Population();
    population.create(100);
    population.units[0].setScore(4);
    population.units[1].startProcessing();
    let unit: Unit = population.pickFree();
    expect(unit.name).to.be.equal('tank-3');
  });

  it('should not pick free unit when not available', () => {
    let population:Population = new Population();
    population.create(2);
    population.units[0].setScore(4);
    population.units[1].startProcessing();
    let unit: Unit = population.pickFree();
    expect(unit).to.be.null;
  });

  it('should mark population as completed', () => {
    let population:Population = new Population();
    population.create(2);
    expect(population.completed).to.be.false;
    population.units[0].setScore(4);
    expect(population.completed).to.be.false;
    population.units[1].setScore(3);
    expect(population.completed).to.be.true;
  });
});
