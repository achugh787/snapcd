import fs from 'fs';
import path from 'path';
import os from 'os';

function getSnapshotDir(projectName) {
  return path.join(os.homedir(), '.snapback', projectName);
}

function getSnapshotFile(projectName) {
  return path.join(getSnapshotDir(projectName), 'snapshots.json');
}

function ensureDir(projectName) {
  fs.mkdirSync(getSnapshotDir(projectName), { recursive: true });
}

export function readSnapshots(projectName) {
  const file = getSnapshotFile(projectName);
  if (!fs.existsSync(file)) return [];
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return [];
  }
}

export function writeSnapshot(snapshot) {
  ensureDir(snapshot.projectName);
  const file = getSnapshotFile(snapshot.projectName);
  const existing = readSnapshots(snapshot.projectName);
  existing.push(snapshot);
  fs.writeFileSync(file, JSON.stringify(existing, null, 2), 'utf8');
}

export function getLastTwo(projectName) {
  const snapshots = readSnapshots(projectName);
  if (snapshots.length < 2) return null;
  return [snapshots[snapshots.length - 2], snapshots[snapshots.length - 1]];
}

export function findByLabel(projectName, label) {
  const snapshots = readSnapshots(projectName);
  return snapshots.findLast(s => s.label === label) ?? null;
}

export function cleanSnapshots(projectName, keepLast) {
  const snapshots = readSnapshots(projectName);
  if (snapshots.length <= keepLast) return 0;
  const removed = snapshots.length - keepLast;
  const trimmed = snapshots.slice(-keepLast);
  ensureDir(projectName);
  fs.writeFileSync(getSnapshotFile(projectName), JSON.stringify(trimmed, null, 2), 'utf8');
  return removed;
}
