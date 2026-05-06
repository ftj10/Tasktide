// INPUT: backup CLI process arguments and stubbed backup helpers
// OUTPUT: behavior coverage for one-off backup, scheduler, restore, and unsupported modes
// EFFECT: Verifies the local backup CLI dispatches to the correct backup operation without running real backups
const test = require('node:test');
const assert = require('node:assert/strict');

const backup = require('../backup');

const originals = {
  argv: process.argv,
  on: process.on,
  log: console.log,
  backupDataset: backup.backupDataset,
  restoreDataset: backup.restoreDataset,
  startDailyBackupScheduler: backup.startDailyBackupScheduler,
};

function loadCli() {
  delete require.cache[require.resolve('../backup-cli')];
  return require('../backup-cli');
}

function restoreStubs() {
  process.argv = originals.argv;
  process.on = originals.on;
  console.log = originals.log;
  backup.backupDataset = originals.backupDataset;
  backup.restoreDataset = originals.restoreDataset;
  backup.startDailyBackupScheduler = originals.startDailyBackupScheduler;
  delete require.cache[require.resolve('../backup-cli')];
}

test.afterEach(() => {
  restoreStubs();
});

test('behavior: mode once calls backupDataset once', async () => {
  let backupCallCount = 0;
  backup.backupDataset = async () => {
    backupCallCount += 1;
  };
  process.argv = ['node', 'backup-cli.js', 'once'];

  const { main } = loadCli();
  await main();

  assert.equal(backupCallCount, 1);
});

test('behavior: mode auto starts the scheduler and registers termination handlers', async () => {
  let schedulerStarted = false;
  const registeredSignals = [];
  const scheduler = { stop() {} };

  backup.startDailyBackupScheduler = () => {
    schedulerStarted = true;
    return scheduler;
  };
  process.argv = ['node', 'backup-cli.js', 'auto'];
  process.on = (signal, handler) => {
    registeredSignals.push([signal, handler]);
    return process;
  };
  console.log = () => {};

  const { main } = loadCli();
  await main();

  assert.equal(schedulerStarted, true);
  assert.deepEqual(registeredSignals.map(([signal]) => signal), ['SIGINT', 'SIGTERM']);
  assert.equal(typeof registeredSignals[0][1], 'function');
  assert.equal(typeof registeredSignals[1][1], 'function');
});

test('behavior: mode restore calls restoreDataset with the provided file path', async () => {
  const restoreCalls = [];
  backup.restoreDataset = async (options) => {
    restoreCalls.push(options);
  };
  process.argv = ['node', 'backup-cli.js', 'restore', '/tmp/dataset-backup.json'];

  const { main } = loadCli();
  await main();

  assert.deepEqual(restoreCalls, [{ filePath: '/tmp/dataset-backup.json' }]);
});

test('behavior: unsupported mode throws an error', async () => {
  process.argv = ['node', 'backup-cli.js', 'invalid-mode'];

  const { main } = loadCli();

  await assert.rejects(main, /Unsupported backup mode: invalid-mode/);
});
