const LOCAL_STORAGE_KEY = 'grafana.featureToggles';

export function getLocalOverrides(): Record<string, boolean> {
  const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!stored) {
    return {};
  }
  return stored.split(',').reduce(
    (acc, item) => {
      const [name, value] = item.split('=');
      if (name) {
        acc[name] = value === 'true' || value === '1';
      }
      return acc;
    },
    {} as Record<string, boolean>
  );
}

export function setLocalOverride(name: string, enabled: boolean): void {
  const overrides = getLocalOverrides();
  overrides[name] = enabled;
  const serialized = Object.entries(overrides)
    .map(([k, v]) => `${k}=${v ? '1' : '0'}`)
    .join(',');
  localStorage.setItem(LOCAL_STORAGE_KEY, serialized);
}

export function removeLocalOverride(name: string): void {
  const overrides = getLocalOverrides();
  delete overrides[name];
  if (Object.keys(overrides).length === 0) {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  } else {
    const serialized = Object.entries(overrides)
      .map(([k, v]) => `${k}=${v ? '1' : '0'}`)
      .join(',');
    localStorage.setItem(LOCAL_STORAGE_KEY, serialized);
  }
}
