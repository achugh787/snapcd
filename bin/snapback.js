#!/usr/bin/env node

import { program } from 'commander';
import path from 'path';
import { collectSnapshot } from '../src/collect.js';
import { writeSnapshot, readSnapshots, getLastTwo, findByLabel, cleanSnapshots } from '../src/store.js';
import { diffSnapshots } from '../src/diff.js';
import { renderDiff, renderSnapshot, renderList } from '../src/display.js';
import { generateHook } from '../src/hook.js';

const projectName = path.basename(process.cwd());

program
  .name('snapback')
  .description('Snapshot your dev environment and diff between snapshots.')
  .version('1.0.0');

program
  .command('save [label]')
  .description('Save a snapshot of the current environment with an optional label')
  .action((label) => {
    const snapshot = collectSnapshot(label ?? null);
    writeSnapshot(snapshot);
    const tag = label ? ` [${label}]` : '';
    console.log(`Snapshot saved${tag} — ${snapshot.timestamp}`);
  });

program
  .command('diff [label1] [label2]')
  .description('Diff the last two snapshots, or diff two named snapshots')
  .action((label1, label2) => {
    let a, b;

    if (label1 && label2) {
      a = findByLabel(projectName, label1);
      b = findByLabel(projectName, label2);
      if (!a) { console.error(`Snapshot not found: "${label1}"`); process.exit(1); }
      if (!b) { console.error(`Snapshot not found: "${label2}"`); process.exit(1); }
    } else {
      const pair = getLastTwo(projectName);
      if (!pair) {
        console.error('Need at least 2 snapshots to diff. Run `snapback save` first.');
        process.exit(1);
      }
      [a, b] = pair;
    }

    const diff = diffSnapshots(a, b);
    renderDiff(a, b, diff);
  });

program
  .command('list')
  .description('List all snapshots for the current project')
  .action(() => {
    const snapshots = readSnapshots(projectName);
    renderList(snapshots);
  });

program
  .command('show <label>')
  .description('Show full details of a specific snapshot by label')
  .action((label) => {
    const snapshot = findByLabel(projectName, label);
    if (!snapshot) {
      console.error(`Snapshot not found: "${label}"`);
      process.exit(1);
    }
    renderSnapshot(snapshot);
  });

program
  .command('hook')
  .description('Output a shell hook to add to .zshrc/.bashrc for auto-snapshotting on cd')
  .action(() => {
    process.stdout.write(generateHook());
  });

program
  .command('clean')
  .description('Delete old snapshots, keeping the last N (default: 10)')
  .option('-n, --keep <number>', 'Number of snapshots to keep', '10')
  .action((opts) => {
    const keepLast = parseInt(opts.keep, 10);
    if (isNaN(keepLast) || keepLast < 1) {
      console.error('--keep must be a positive integer');
      process.exit(1);
    }
    const removed = cleanSnapshots(projectName, keepLast);
    if (removed === 0) {
      console.log(`Nothing to clean (fewer than ${keepLast} snapshots).`);
    } else {
      console.log(`Removed ${removed} old snapshot(s). Kept last ${keepLast}.`);
    }
  });

program
  .command('_auto-save')
  .description('Silent auto-save triggered by shell hook (no output)')
  .action(() => {
    try {
      const snapshot = collectSnapshot(null);
      writeSnapshot(snapshot);
    } catch {
      // completely silent — never interrupt the user's shell
    }
    process.exit(0);
  });

program.parse();
