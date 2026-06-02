export function diffSnapshots(a, b) {
  return {
    nodeVersion: diffScalar('nodeVersion', a, b),
    npmVersion: diffScalar('npmVersion', a, b),
    globalPackages: diffMap('globalPackages', a, b),
    envVars: diffMap('envVars', a, b),
    pathEntries: diffList('pathEntries', a, b),
    openPorts: diffList('openPorts', a, b),
    cwd: diffScalar('cwd', a, b),
    hostname: diffScalar('hostname', a, b),
    platform: diffScalar('platform', a, b),
  };
}

function diffScalar(key, a, b) {
  const va = a[key];
  const vb = b[key];
  if (va === vb) return { status: 'unchanged', value: va };
  return { status: 'changed', from: va, to: vb };
}

function diffMap(key, a, b) {
  const ma = a[key] ?? {};
  const mb = b[key] ?? {};
  const allKeys = new Set([...Object.keys(ma), ...Object.keys(mb)]);
  const result = {};
  for (const k of allKeys) {
    const va = ma[k];
    const vb = mb[k];
    if (va === undefined) {
      result[k] = { status: 'added', value: vb };
    } else if (vb === undefined) {
      result[k] = { status: 'removed', value: va };
    } else if (va !== vb) {
      result[k] = { status: 'changed', from: va, to: vb };
    } else {
      result[k] = { status: 'unchanged', value: va };
    }
  }
  return result;
}

function diffList(key, a, b) {
  const la = (a[key] ?? []).map(String);
  const lb = (b[key] ?? []).map(String);
  const setA = new Set(la);
  const setB = new Set(lb);
  const all = new Set([...la, ...lb]);
  const result = [];
  for (const v of all) {
    if (setA.has(v) && setB.has(v)) {
      result.push({ status: 'unchanged', value: v });
    } else if (!setA.has(v)) {
      result.push({ status: 'added', value: v });
    } else {
      result.push({ status: 'removed', value: v });
    }
  }
  return result;
}
