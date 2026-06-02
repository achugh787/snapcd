import chalk from 'chalk';
import Table from 'cli-table3';

const STATUS_ICON = {
  unchanged: chalk.green('✅'),
  changed:   chalk.yellow('⚠️ '),
  removed:   chalk.red('✗ '),
  added:     chalk.green('✚ '),
};

function header(title) {
  console.log('\n' + chalk.bold.underline(title));
}

function scalarRow(label, result) {
  if (result.status === 'unchanged') {
    console.log(`  ${STATUS_ICON.unchanged} ${chalk.dim(label + ':')} ${result.value}`);
  } else {
    console.log(`  ${STATUS_ICON.changed} ${chalk.yellow(label + ':')} ${chalk.red(result.from)} ${chalk.dim('→')} ${chalk.green(result.to)}`);
  }
}

function mapSection(title, mapDiff, { showUnchanged = false } = {}) {
  const entries = Object.entries(mapDiff);
  const changed = entries.filter(([, v]) => v.status !== 'unchanged');
  const unchanged = entries.filter(([, v]) => v.status === 'unchanged');

  header(title);

  if (changed.length === 0 && !showUnchanged) {
    console.log(chalk.dim(`  (no changes — ${unchanged.length} packages unchanged)`));
    return;
  }

  const table = new Table({
    head: [chalk.bold('Package'), chalk.bold('Status'), chalk.bold('Detail')],
    style: { head: [], border: [] },
    colWidths: [30, 12, 50],
    wordWrap: true,
  });

  for (const [name, info] of changed) {
    if (info.status === 'added') {
      table.push([name, chalk.green('✚ added'), chalk.green(info.value)]);
    } else if (info.status === 'removed') {
      table.push([name, chalk.red('✗ removed'), chalk.red(info.value)]);
    } else {
      table.push([name, chalk.yellow('⚠️  changed'), `${chalk.red(info.from)} → ${chalk.green(info.to)}`]);
    }
  }

  if (showUnchanged) {
    for (const [name, info] of unchanged) {
      table.push([chalk.dim(name), chalk.green('✅ ok'), chalk.dim(info.value)]);
    }
  }

  console.log(table.toString());
  if (!showUnchanged && unchanged.length > 0) {
    console.log(chalk.dim(`  (+${unchanged.length} unchanged)`));
  }
}

function listSection(title, listDiff) {
  const changed = listDiff.filter(v => v.status !== 'unchanged');
  const unchanged = listDiff.filter(v => v.status === 'unchanged');

  header(title);

  if (changed.length === 0) {
    console.log(chalk.dim(`  (no changes — ${unchanged.length} entries unchanged)`));
    return;
  }

  for (const item of changed) {
    if (item.status === 'added') {
      console.log(`  ${STATUS_ICON.added} ${chalk.green(item.value)}`);
    } else {
      console.log(`  ${STATUS_ICON.removed} ${chalk.red(item.value)}`);
    }
  }
  if (unchanged.length > 0) {
    console.log(chalk.dim(`  (+${unchanged.length} unchanged)`));
  }
}

export function renderDiff(snapshotA, snapshotB, diff) {
  const labelA = snapshotA.label ? `"${snapshotA.label}"` : snapshotA.timestamp;
  const labelB = snapshotB.label ? `"${snapshotB.label}"` : snapshotB.timestamp;

  console.log(chalk.bold(`\nSnapback diff: ${chalk.cyan(labelA)} → ${chalk.cyan(labelB)}`));
  console.log(chalk.dim(`Project: ${snapshotA.projectName}`));

  header('Core');
  scalarRow('Node.js', diff.nodeVersion);
  scalarRow('npm', diff.npmVersion);
  scalarRow('CWD', diff.cwd);
  scalarRow('Platform', diff.platform);
  scalarRow('Hostname', diff.hostname);

  mapSection('Global npm Packages', diff.globalPackages);
  mapSection('Environment Variables', diff.envVars);
  listSection('PATH Entries', diff.pathEntries);
  listSection('Open Ports', diff.openPorts);

  console.log('');
}

export function renderSnapshot(snapshot) {
  const label = snapshot.label ? ` [${snapshot.label}]` : '';
  console.log(chalk.bold(`\nSnapshot${label} — ${snapshot.timestamp}`));
  console.log(chalk.dim(`Project: ${snapshot.projectName}  CWD: ${snapshot.cwd}`));

  header('Core');
  console.log(`  Node.js : ${snapshot.nodeVersion}`);
  console.log(`  npm     : ${snapshot.npmVersion}`);
  console.log(`  Platform: ${snapshot.platform}`);
  console.log(`  Host    : ${snapshot.hostname}`);

  header('Global npm Packages');
  const pkgs = Object.entries(snapshot.globalPackages ?? {});
  if (pkgs.length === 0) {
    console.log(chalk.dim('  (none)'));
  } else {
    const table = new Table({
      head: [chalk.bold('Package'), chalk.bold('Version')],
      style: { head: [], border: [] },
    });
    for (const [name, ver] of pkgs) table.push([name, ver]);
    console.log(table.toString());
  }

  header('Open Ports');
  const ports = snapshot.openPorts ?? [];
  console.log(ports.length ? `  ${ports.join(', ')}` : chalk.dim('  (none)'));

  header('PATH Entries');
  for (const p of snapshot.pathEntries ?? []) {
    console.log(`  ${chalk.dim(p)}`);
  }

  console.log('');
}

export function renderList(snapshots) {
  if (snapshots.length === 0) {
    console.log(chalk.dim('No snapshots found for this project.'));
    return;
  }
  const table = new Table({
    head: [chalk.bold('#'), chalk.bold('Label'), chalk.bold('Timestamp'), chalk.bold('Node'), chalk.bold('npm')],
    style: { head: [], border: [] },
  });
  snapshots.forEach((s, i) => {
    table.push([
      String(i + 1),
      s.label ?? chalk.dim('(auto)'),
      s.timestamp,
      s.nodeVersion,
      s.npmVersion,
    ]);
  });
  console.log(table.toString());
}
