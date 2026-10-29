import test from 'node:test';
import assert from 'node:assert/strict';
import {energyUntilMinute, simulationClock} from './operation-simulation.ts';

test('partial playback integrates only elapsed time across changing power blocks', () => {
  assert.equal(energyUntilMinute([120, 240], 0), 0);
  assert.equal(energyUntilMinute([120, 240], 7.5), 15);
  assert.equal(energyUntilMinute([120, 240], 20), 50);
  assert.equal(energyUntilMinute([120, 240], 30), 90);
  assert.equal(energyUntilMinute([120, 240], 100), 90);
});

test('day endpoint closes the same energy ledger without wrapping to midnight', () => {
  const profile = Array.from({length:96}, (_,i) => 100+i);
  assert.equal(energyUntilMinute(profile,1440),profile.reduce((a,b)=>a+b,0)*.25);
  assert.equal(simulationClock(1440),'24:00');
  assert.equal(simulationClock(360.9),'06:00');
});
