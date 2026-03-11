export function formatTokenLabel(value: string | null | undefined) {
  if (!value) {
    return '-';
  }

  return value
    .replace(/[-_]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return '-';
  }

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function formatDate(value: string | null | undefined) {
  if (!value) {
    return '-';
  }

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
  }).format(new Date(value));
}

export function formatTestTypeLabel(value: string | null | undefined) {
  if (!value) {
    return '-';
  }

  return value.toUpperCase();
}

export function formatStatusLabel(value: string | null | undefined) {
  return formatTokenLabel(value);
}

export function formatResultHeadline(input: {
  testType: string;
  profileCode: string | null;
  primaryType: string | null;
  secondaryType: string | null;
  scoreBand: string | null;
  scoreTotal: number | null;
}) {
  if (input.testType === 'disc') {
    if (input.profileCode) {
      return input.profileCode;
    }

    if (input.primaryType && input.secondaryType) {
      return `${input.primaryType}/${input.secondaryType}`;
    }
  }

  if (input.testType === 'iq' && input.scoreTotal != null) {
    return String(input.scoreTotal);
  }

  if (input.testType === 'workload' && input.scoreTotal != null) {
    return String(input.scoreTotal);
  }

  return formatTokenLabel(input.scoreBand);
}

export function formatResultSummary(input: {
  testType: string;
  primaryType: string | null;
  secondaryType: string | null;
  scoreBand: string | null;
}) {
  if (input.testType === 'disc') {
    if (input.primaryType && input.secondaryType) {
      return `Primary ${input.primaryType}, Secondary ${input.secondaryType}`;
    }

    return 'DISC result available';
  }

  if (input.scoreBand) {
    return formatTokenLabel(input.scoreBand);
  }

  return 'Result available';
}
