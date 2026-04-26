// INPUT: local terminal backup command arguments
// OUTPUT: one-off backup completion, a full dataset restore, or a running daily backup scheduler
// EFFECT: Restricts dataset backup and restore control to local CLI usage instead of website-triggered flows
const { backupDataset, restoreDataset, startDailyBackupScheduler } = require('./backup');

const mode = process.argv[2] || 'once';
const restoreFilePath = process.argv[3];

// INPUT: backup CLI mode
// OUTPUT: process exit after command handling
// EFFECT: Runs one immediate export or starts the persistent daily scheduler from the local terminal
async function main() {
  if (mode === 'once') {
    await backupDataset();
    return;
  }

  if (mode === 'auto') {
    const scheduler = startDailyBackupScheduler();

    console.log('Daily dataset backup scheduler started. Press Ctrl+C to stop.');

    const stopScheduler = () => {
      scheduler.stop();
      process.exit(0);
    };

    process.on('SIGINT', stopScheduler);
    process.on('SIGTERM', stopScheduler);
    return;
  }

  if (mode === 'restore') {
    await restoreDataset({ filePath: restoreFilePath });
    return;
  }

  throw new Error(`Unsupported backup mode: ${mode}`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
