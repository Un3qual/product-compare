export function upsertMapValue<K, V>(
  values: ReadonlyMap<K, V>,
  key: K,
  value: V,
): ReadonlyMap<K, V> {
  const nextValues = new Map(values);
  nextValues.set(key, value);
  return nextValues;
}

export function removeMapValue<K, V>(values: ReadonlyMap<K, V>, key: K): ReadonlyMap<K, V> {
  if (!values.has(key)) {
    return values;
  }

  const nextValues = new Map(values);
  nextValues.delete(key);
  return nextValues;
}

export function addSetValue<T>(currentValues: ReadonlySet<T>, nextValue: T): ReadonlySet<T> {
  if (currentValues.has(nextValue)) {
    return currentValues;
  }

  return new Set(currentValues).add(nextValue);
}

export function removeSetValue<T>(currentValues: ReadonlySet<T>, removedValue: T): ReadonlySet<T> {
  if (!currentValues.has(removedValue)) {
    return currentValues;
  }

  const nextValues = new Set(currentValues);
  nextValues.delete(removedValue);
  return nextValues;
}
