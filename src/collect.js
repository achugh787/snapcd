import { execSync } from 'child_process';
import os from 'os';
import path from 'path';

const SENSITIVE_PATTERN = /KEY|TOKEN|SECRET|PASSWORD|PASSWD|CREDENTIAL|AUTH|APIKEY|API_KEY/i;

function run(cmd, fallback = null) {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch {
    return fallback;
  }
}

function collectGlobalPackages() {
  const raw = run('npm list -g --depth=0 --json');
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    const deps = parsed.dependencies ?? {};
    return Object.fromEntries(
      Object.entries(deps).map(([name, info]) => [name, info.version ?? 'unknown'])
    );
  } catch {
    return {};
  }
}

function collectEnvVars() {
  const result = {};
  for (const [key, value] of Object.entries(process.env)) {
    result[key] = SENSITIVE_PATTERN.test(key) ? '[redacted]' : value;
  }
  return result;
}

function collectPath() {
  const pathVar = process.env.PATH ?? process.env.Path ?? '';
  return pathVar.split(path.delimiter).filter(Boolean);
}

function collectOpenPorts() {
  if (process.platform === 'win32') {
    const raw = run('netstat -ano -p TCP');
    if (!raw) return [];
    const ports = new Set();
    for (const line of raw.split('\n')) {
      if (/LISTENING/i.test(line)) {
        const parts = line.trim().split(/\s+/);
        const addr = parts[1] ?? '';
        const port = addr.split(':').pop();
        if (port && !isNaN(Number(port))) ports.add(Number(port));
      }
    }
    return [...ports].sort((a, b) => a - b);
  }

  const raw = run("lsof -i -P -n | grep LISTEN");
  if (!raw) return [];
  const ports = new Set();
  for (const line of raw.split('\n')) {
    const match = line.match(/:(\d+)\s+\(LISTEN\)/);
    if (match) ports.add(Number(match[1]));
  }
  return [...ports].sort((a, b) => a - b);
}

export function collectSnapshot(label = null) {
  return {
    timestamp: new Date().toISOString(),
    label: label ?? null,
    cwd: process.cwd(),
    projectName: path.basename(process.cwd()),
    nodeVersion: process.version,
    npmVersion: run('npm --version') ?? 'unknown',
    globalPackages: collectGlobalPackages(),
    envVars: collectEnvVars(),
    pathEntries: collectPath(),
    openPorts: collectOpenPorts(),
    platform: process.platform,
    hostname: os.hostname(),
  };
}
