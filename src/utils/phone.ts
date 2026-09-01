export const getPrimaryPhoneNumber = (value: unknown): string | null => {
  if (!value) return null;

  if (typeof value === 'string' || typeof value === 'number') {
    const normalized = String(value).trim();
    return normalized || null;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const phone = getPrimaryPhoneNumber(item);
      if (phone) return phone;
    }
    return null;
  }

  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const directNumber = record.number;
    if (typeof directNumber === 'string' || typeof directNumber === 'number') {
      const normalized = String(directNumber).trim();
      if (normalized) return normalized;
    }

    const nestedPhone = record.phone;
    if (nestedPhone) {
      return getPrimaryPhoneNumber(nestedPhone);
    }
  }

  return null;
};

export const formatPhoneDisplay = (value: unknown, fallback = 'N/A') =>
  getPrimaryPhoneNumber(value) || fallback;
