type TimestampObject = {
  seconds?: unknown;
  nanoseconds?: unknown;
  _seconds?: unknown;
  _nanoseconds?: unknown;
  toDate?: () => Date;
};

function buildDateFromParts(seconds: number, nanoseconds: number): Date | null {
  if (!Number.isFinite(seconds) || !Number.isFinite(nanoseconds)) {
    return null;
  }

  const value = new Date(seconds * 1000 + nanoseconds / 1_000_000);
  return Number.isNaN(value.getTime()) ? null : value;
}

export function normalizePilotTimestamp(input: unknown): Date | null {
  if (!input) {
    return null;
  }

  if (input instanceof Date) {
    return Number.isNaN(input.getTime()) ? null : input;
  }

  if (typeof input === 'string' || typeof input === 'number') {
    const value = new Date(input);
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof input === 'object') {
    const timestamp = input as TimestampObject;

    if (typeof timestamp.toDate === 'function') {
      const value = timestamp.toDate();
      return Number.isNaN(value.getTime()) ? null : value;
    }

    const seconds =
      typeof timestamp.seconds === 'number'
        ? timestamp.seconds
        : typeof timestamp._seconds === 'number'
          ? timestamp._seconds
          : null;
    const nanoseconds =
      typeof timestamp.nanoseconds === 'number'
        ? timestamp.nanoseconds
        : typeof timestamp._nanoseconds === 'number'
          ? timestamp._nanoseconds
          : 0;

    if (seconds !== null) {
      return buildDateFromParts(seconds, nanoseconds);
    }
  }

  return null;
}
