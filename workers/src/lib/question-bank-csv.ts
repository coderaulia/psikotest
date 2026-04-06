import { z } from 'zod';

export const FLAT_QUESTION_BANK_CSV_HEADERS = [
  'test_type',
  'question_code',
  'question_type',
  'question_order',
  'prompt',
  'dimension_key',
  'category_key',
  'scoring_key',
  'is_reverse_scored',
  'weight',
  'status',
  'option_1_label',
  'option_1_score',
  'option_1_is_correct',
  'option_1_dimension_key',
  'option_2_label',
  'option_2_score',
  'option_2_is_correct',
  'option_2_dimension_key',
  'option_3_label',
  'option_3_score',
  'option_3_is_correct',
  'option_3_dimension_key',
  'option_4_label',
  'option_4_score',
  'option_4_is_correct',
  'option_4_dimension_key',
  'option_5_label',
  'option_5_score',
  'option_5_is_correct',
  'option_5_dimension_key',
] as const;

export type FlatQuestionBankCsvHeader = (typeof FLAT_QUESTION_BANK_CSV_HEADERS)[number];

export interface CsvRowIssue {
  row: number;
  field: string;
  message: string;
}

const BOOLEANISH_TRUE_VALUES = new Set(['1', 'true', 'yes', 'y']);
const BOOLEANISH_FALSE_VALUES = new Set(['0', 'false', 'no', 'n', '']);
const TEST_TYPES = ['iq', 'disc', 'workload', 'custom'] as const;
const QUESTION_TYPES = ['single_choice', 'forced_choice', 'likert'] as const;
const QUESTION_STATUSES = ['draft', 'active', 'archived'] as const;
const DIMENSION_REQUIRED_TEST_TYPES = new Set(['iq', 'disc', 'workload']);
const OPTION_SLOT_COUNT = 5;

const importRowSchema = z.object({
  question_type: z.enum(['single_choice', 'forced_choice', 'likert']),
  test_type: z.enum(TEST_TYPES),
  question_code: z.string().min(1, 'question_code is required'),
  question_order: z.coerce.number().int().min(1, 'question_order must be >= 1'),
  prompt: z.string().min(5, 'prompt must be at least 5 characters'),
  dimension_key: z.string().optional(),
  category_key: z.string().optional(),
  scoring_key: z.string().optional(),
  is_reverse_scored: z.string().optional(),
  weight: z.coerce.number().positive('weight must be a positive number').optional(),
  status: z.enum(QUESTION_STATUSES).optional(),
  option_1_label: z.string().optional(),
  option_1_score: z.string().optional(),
  option_1_is_correct: z.string().optional(),
  option_1_dimension_key: z.string().optional(),
  option_2_label: z.string().optional(),
  option_2_score: z.string().optional(),
  option_2_is_correct: z.string().optional(),
  option_2_dimension_key: z.string().optional(),
  option_3_label: z.string().optional(),
  option_3_score: z.string().optional(),
  option_3_is_correct: z.string().optional(),
  option_3_dimension_key: z.string().optional(),
  option_4_label: z.string().optional(),
  option_4_score: z.string().optional(),
  option_4_is_correct: z.string().optional(),
  option_4_dimension_key: z.string().optional(),
  option_5_label: z.string().optional(),
  option_5_score: z.string().optional(),
  option_5_is_correct: z.string().optional(),
  option_5_dimension_key: z.string().optional(),
});

interface ParsedImportOption {
  optionKey: string;
  optionOrder: number;
  optionLabel: string;
  scoreValue: number;
  isCorrect: number;
  dimensionKey: string | null;
}

export interface ParsedQuestionImportRow {
  testType: 'iq' | 'disc' | 'workload' | 'custom';
  questionCode: string;
  questionType: 'single_choice' | 'forced_choice' | 'likert';
  questionOrder: number;
  prompt: string;
  dimensionKey: string | null;
  categoryKey: string | null;
  scoringKey: string | null;
  isReverseScored: boolean;
  weight: number;
  status: 'draft' | 'active' | 'archived';
  options: ParsedImportOption[];
}

interface ParsedCsvLine {
  values: string[];
  line: number;
}

function normalizeCell(cell: string) {
  return cell.trim();
}

function parseCsvLines(text: string): ParsedCsvLine[] {
  const lines: ParsedCsvLine[] = [];
  let current = '';
  let inQuotes = false;
  let line = 1;
  let rowStartLine = 1;
  const pushValue = (values: string[]) => {
    lines.push({ values, line: rowStartLine });
  };

  const values: string[] = [];
  let index = 0;

  while (index < text.length) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        index += 2;
        continue;
      }
      inQuotes = !inQuotes;
      index += 1;
      continue;
    }

    if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
      index += 1;
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') {
        index += 1;
      }
      values.push(current);
      pushValue(values.splice(0, values.length));
      current = '';
      line += 1;
      rowStartLine = line;
      index += 1;
      continue;
    }

    if (char === '\n') {
      line += 1;
    }

    current += char;
    index += 1;
  }

  if (current.length > 0 || values.length > 0) {
    values.push(current);
    pushValue(values);
  }

  return lines.filter((entry) => entry.values.some((value) => value.trim().length > 0));
}

export function parseCsvText(text: string) {
  const normalized = text.replace(/^\uFEFF/, '');
  const parsedLines = parseCsvLines(normalized);
  if (parsedLines.length === 0) {
    return { headers: [] as string[], rows: [] as Array<Record<string, string>> };
  }

  const headers = parsedLines[0].values.map((header) => normalizeCell(header));
  const rows = parsedLines.slice(1).map((line) => {
    const record: Record<string, string> = {};
    headers.forEach((header, index) => {
      record[header] = normalizeCell(line.values[index] ?? '');
    });
    return record;
  });

  return { headers, rows };
}

export function validateCsvHeaders(headers: string[]) {
  const normalizedHeaders = headers.map((header) => header.trim());
  const missingHeaders = FLAT_QUESTION_BANK_CSV_HEADERS.filter((header) => !normalizedHeaders.includes(header));
  return {
    valid: missingHeaders.length === 0,
    missingHeaders,
  };
}

function parseBooleanishValue(value: string | undefined, field: string): { ok: true; value: boolean } | { ok: false; message: string } {
  const normalized = (value ?? '').trim().toLowerCase();
  if (BOOLEANISH_TRUE_VALUES.has(normalized)) {
    return { ok: true, value: true };
  }
  if (BOOLEANISH_FALSE_VALUES.has(normalized)) {
    return { ok: true, value: false };
  }
  return {
    ok: false,
    message: `${field} must be boolean-like (0/1, true/false, yes/no)`,
  };
}

function parseNumberValue(value: string | undefined, field: string): { ok: true; value: number } | { ok: false; message: string } {
  const normalized = (value ?? '').trim();
  if (normalized.length === 0) {
    return { ok: false, message: `${field} is required` };
  }
  const numeric = Number(normalized);
  if (!Number.isFinite(numeric)) {
    return { ok: false, message: `${field} must be numeric` };
  }
  return { ok: true, value: numeric };
}

function buildOptionSlot(index: number, row: z.infer<typeof importRowSchema>, csvRowNumber: number, issues: CsvRowIssue[]) {
  const slot = index + 1;
  const label = String(row[`option_${slot}_label` as keyof typeof row] ?? '').trim();
  const scoreRaw = String(row[`option_${slot}_score` as keyof typeof row] ?? '').trim();
  const correctRaw = String(row[`option_${slot}_is_correct` as keyof typeof row] ?? '').trim();
  const dimensionRaw = String(row[`option_${slot}_dimension_key` as keyof typeof row] ?? '').trim();

  const hasAnyValue = label.length > 0 || scoreRaw.length > 0 || correctRaw.length > 0 || dimensionRaw.length > 0;
  if (!hasAnyValue) {
    return null;
  }

  if (label.length === 0) {
    issues.push({
      row: csvRowNumber,
      field: `option_${slot}_label`,
      message: `option_${slot}_label is required when option_${slot} is provided`,
    });
    return null;
  }

  const parsedScore = parseNumberValue(scoreRaw, `option_${slot}_score`);
  if (!parsedScore.ok) {
    issues.push({
      row: csvRowNumber,
      field: `option_${slot}_score`,
      message: parsedScore.message,
    });
    return null;
  }

  const parsedCorrect = parseBooleanishValue(correctRaw, `option_${slot}_is_correct`);
  if (!parsedCorrect.ok) {
    issues.push({
      row: csvRowNumber,
      field: `option_${slot}_is_correct`,
      message: parsedCorrect.message,
    });
    return null;
  }

  return {
    optionKey: String.fromCharCode(65 + index),
    optionOrder: slot,
    optionLabel: label,
    scoreValue: parsedScore.value,
    isCorrect: parsedCorrect.value ? 1 : 0,
    dimensionKey: dimensionRaw.length > 0 ? dimensionRaw : null,
  } satisfies ParsedImportOption;
}

function validateOptionsForQuestion(
  row: ParsedQuestionImportRow,
  csvRowNumber: number,
  issues: CsvRowIssue[],
) {
  if (row.options.length < 2) {
    issues.push({
      row: csvRowNumber,
      field: 'option_1_label',
      message: 'At least two options are required',
    });
    return;
  }

  if (row.questionType === 'single_choice') {
    const hasCorrectOption = row.options.some((option) => option.isCorrect === 1);
    if (!hasCorrectOption) {
      issues.push({
        row: csvRowNumber,
        field: 'option_1_is_correct',
        message: 'single_choice question must have at least one correct option',
      });
    }
  }

  if (row.questionType === 'forced_choice') {
    for (const option of row.options) {
      const resolvedDimension = option.dimensionKey ?? row.dimensionKey;
      if (!resolvedDimension) {
        issues.push({
          row: csvRowNumber,
          field: `option_${option.optionOrder}_dimension_key`,
          message: 'forced_choice option requires dimension_key on option or row',
        });
      }
    }
  }

  if (row.questionType === 'likert') {
    const minScore = Math.min(...row.options.map((option) => option.scoreValue));
    const maxScore = Math.max(...row.options.map((option) => option.scoreValue));
    if (!Number.isFinite(minScore) || !Number.isFinite(maxScore) || minScore === maxScore) {
      issues.push({
        row: csvRowNumber,
        field: 'option_1_score',
        message: 'likert options must contain a numeric score range',
      });
    }
  }
}

export function validateQuestionImportRows(rows: Array<Record<string, string>>) {
  const issues: CsvRowIssue[] = [];
  const validRows: ParsedQuestionImportRow[] = [];
  const questionCodeTracker = new Map<string, number>();
  const orderTracker = new Map<string, number>();

  rows.forEach((row, index) => {
    const result = importRowSchema.safeParse(row);
    const csvRowNumber = index + 2;

    if (!result.success) {
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] ? String(issue.path[0]) : 'row';
        issues.push({ row: csvRowNumber, field, message: issue.message });
      });
      return;
    }

    const parsedRow = result.data;
    const questionCode = parsedRow.question_code.trim();
    const questionPrompt = parsedRow.prompt.trim();
    const dimensionKey = parsedRow.dimension_key?.trim() || null;
    const categoryKey = parsedRow.category_key?.trim() || null;
    const scoringKey = parsedRow.scoring_key?.trim() || null;

    if (questionCode.length === 0) {
      issues.push({
        row: csvRowNumber,
        field: 'question_code',
        message: 'question_code is required',
      });
      return;
    }

    const duplicateCodeKey = `${parsedRow.test_type}::${questionCode.toLowerCase()}`;
    if (questionCodeTracker.has(duplicateCodeKey)) {
      issues.push({
        row: csvRowNumber,
        field: 'question_code',
        message: `Duplicate question_code for test_type (first seen on row ${questionCodeTracker.get(duplicateCodeKey)})`,
      });
      return;
    }
    questionCodeTracker.set(duplicateCodeKey, csvRowNumber);

    const duplicateOrderKey = `${parsedRow.test_type}::${parsedRow.question_order}`;
    if (orderTracker.has(duplicateOrderKey)) {
      issues.push({
        row: csvRowNumber,
        field: 'question_order',
        message: `Duplicate question_order for test_type (first seen on row ${orderTracker.get(duplicateOrderKey)})`,
      });
      return;
    }
    orderTracker.set(duplicateOrderKey, csvRowNumber);

    if (questionPrompt.length < 5) {
      issues.push({
        row: csvRowNumber,
        field: 'prompt',
        message: 'prompt must be at least 5 characters',
      });
      return;
    }

    if (DIMENSION_REQUIRED_TEST_TYPES.has(parsedRow.test_type) && !dimensionKey) {
      issues.push({
        row: csvRowNumber,
        field: 'dimension_key',
        message: `${parsedRow.test_type} questions require dimension_key`,
      });
      return;
    }

    const parsedReverse = parseBooleanishValue(parsedRow.is_reverse_scored, 'is_reverse_scored');
    if (!parsedReverse.ok) {
      issues.push({
        row: csvRowNumber,
        field: 'is_reverse_scored',
        message: parsedReverse.message,
      });
      return;
    }

    const weight = parsedRow.weight ?? 1;
    if (!Number.isFinite(weight) || weight <= 0) {
      issues.push({
        row: csvRowNumber,
        field: 'weight',
        message: 'weight must be a positive number',
      });
      return;
    }

    const options: ParsedImportOption[] = [];
    for (let optionIndex = 0; optionIndex < OPTION_SLOT_COUNT; optionIndex += 1) {
      const parsedOption = buildOptionSlot(optionIndex, parsedRow, csvRowNumber, issues);
      if (parsedOption) {
        options.push(parsedOption);
      }
    }

    const normalizedRow: ParsedQuestionImportRow = {
      testType: parsedRow.test_type,
      questionCode,
      questionType: parsedRow.question_type,
      questionOrder: parsedRow.question_order,
      prompt: questionPrompt,
      dimensionKey,
      categoryKey,
      scoringKey,
      isReverseScored: parsedReverse.value,
      weight,
      status: parsedRow.status ?? 'active',
      options,
    };

    validateOptionsForQuestion(normalizedRow, csvRowNumber, issues);
    if (issues.some((issue) => issue.row === csvRowNumber)) {
      return;
    }

    validRows.push(normalizedRow);
  });

  for (const testType of TEST_TYPES) {
    const rowsByType = validRows.filter((row) => row.testType === testType);
    if (rowsByType.length === 0) continue;

    const hasCodeGaps = rowsByType
      .map((row) => row.questionOrder)
      .sort((a, b) => a - b)
      .some((value, idx, arr) => idx > 0 && value === arr[idx - 1]);
    if (hasCodeGaps) {
      issues.push({
        row: 1,
        field: 'question_order',
        message: `Duplicate question_order detected in ${testType} rows`,
      });
    }
  }

  return { validRows, issues };
}

export function mapRawTestType(value: string): string | null {
  const normalized = value.trim().toLowerCase();
  if (TEST_TYPES.includes(normalized as (typeof TEST_TYPES)[number])) {
    return normalized;
  }
  return null;
}

export function mapRawQuestionType(value: string): string | null {
  const normalized = value.trim().toLowerCase();
  if (QUESTION_TYPES.includes(normalized as (typeof QUESTION_TYPES)[number])) {
    return normalized;
  }
  return null;
}

export function mapRawStatus(value: string): string | null {
  const normalized = value.trim().toLowerCase();
  if (QUESTION_STATUSES.includes(normalized as (typeof QUESTION_STATUSES)[number])) {
    return normalized;
  }
  return null;
}

export function formatQuestionImportTemplateRows() {
  const rows: string[][] = [
    [
      'iq',
      'IQ_VAL_001',
      'single_choice',
      '1',
      'Deret angka berikutnya adalah: 2, 4, 8, 16, ...',
      'pattern',
      '',
      'iq_core',
      '0',
      '1',
      'active',
      '32',
      '1',
      '1',
      '',
      '24',
      '0',
      '0',
      '',
      '20',
      '0',
      '0',
      '',
      '18',
      '0',
      '0',
      '',
      '',
      '',
      '',
      '',
    ],
    [
      'workload',
      'WL_VAL_001',
      'likert',
      '1',
      'Seberapa tinggi beban mental yang Anda rasakan saat tugas berlangsung?',
      'mental_demand',
      '',
      'nasa_tlx',
      '0',
      '1',
      'active',
      'Sangat rendah',
      '1',
      '0',
      '',
      'Rendah',
      '2',
      '0',
      '',
      'Sedang',
      '3',
      '0',
      '',
      'Tinggi',
      '4',
      '0',
      '',
      'Sangat tinggi',
      '5',
      '0',
      '',
    ],
  ];

  return rows;
}

export function csvEscape(value: unknown): string {
  const serialized = value == null ? '' : String(value);
  const escaped = serialized.replace(/"/g, '""');
  return `"${escaped}"`;
}

export function booleanToCsvFlag(value: boolean | number | null | undefined): string {
  if (typeof value === 'number') {
    return value > 0 ? '1' : '0';
  }
  return value ? '1' : '0';
}

export function normalizeNullableString(value: unknown): string {
  return value == null ? '' : String(value).trim();
}

export function ensureNumericOrEmpty(value: unknown): string {
  if (value == null) return '';
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return '';
  return String(numeric);
}

export function createLegacyCompatibilityIssue() {
  return {
    row: 1,
    field: 'csv',
    message:
      'Legacy CSV format is no longer supported for write imports. Download the latest validated template.',
  } satisfies CsvRowIssue;
}

export function containsLegacyHeaders(headers: string[]) {
  const legacyHeaders = ['question_text', 'category', 'option_1_text', 'option_1_value'];
  const normalized = headers.map((header) => header.trim().toLowerCase());
  return legacyHeaders.some((header) => normalized.includes(header));
}

export function hasCanonicalHeaders(headers: string[]) {
  const normalizedHeaders = headers.map((header) => header.trim());
  return FLAT_QUESTION_BANK_CSV_HEADERS.every((header) => normalizedHeaders.includes(header));
}

export function validateHeaderContract(headers: string[]) {
  if (hasCanonicalHeaders(headers)) {
    return {
      valid: true,
      missingHeaders: [] as string[],
      legacyDetected: false,
    };
  }

  const normalizedHeaders = headers.map((header) => header.trim());
  const missingHeaders = FLAT_QUESTION_BANK_CSV_HEADERS.filter((header) => !normalizedHeaders.includes(header));

  return {
    valid: false,
    missingHeaders,
    legacyDetected: containsLegacyHeaders(headers),
  };
}

export function supportsScoringMetadata(row: ParsedQuestionImportRow) {
  return Boolean(
    row.questionCode &&
    row.prompt &&
    row.questionType &&
    row.options.length >= 2 &&
    Number.isFinite(row.weight) &&
    row.weight > 0,
  );
}

export function normalizeCsvRecordKeys(record: Record<string, string>) {
  const normalized: Record<string, string> = {};
  Object.entries(record).forEach(([key, value]) => {
    normalized[key.trim()] = value;
  });
  return normalized;
}

export function normalizeCsvRows(rows: Array<Record<string, string>>) {
  return rows.map((row) => normalizeCsvRecordKeys(row));
}

export function validateImportRowsWithNormalization(rows: Array<Record<string, string>>) {
  return validateQuestionImportRows(normalizeCsvRows(rows));
}

export function toQuestionStatus(value: string): 'draft' | 'active' | 'archived' {
  const mapped = mapRawStatus(value);
  if (mapped === 'draft' || mapped === 'archived') {
    return mapped;
  }
  return 'active';
}

export function createRowKey(testType: string, questionCode: string) {
  return `${testType.toLowerCase()}::${questionCode.toLowerCase()}`;
}

export function createOrderKey(testType: string, questionOrder: number) {
  return `${testType.toLowerCase()}::${questionOrder}`;
}

export function isSupportedQuestionType(value: string): value is 'single_choice' | 'forced_choice' | 'likert' {
  return QUESTION_TYPES.includes(value as (typeof QUESTION_TYPES)[number]);
}

export function isSupportedTestType(value: string): value is 'iq' | 'disc' | 'workload' | 'custom' {
  return TEST_TYPES.includes(value as (typeof TEST_TYPES)[number]);
}

export function isSupportedStatus(value: string): value is 'draft' | 'active' | 'archived' {
  return QUESTION_STATUSES.includes(value as (typeof QUESTION_STATUSES)[number]);
}

export function createOptionFieldName(slot: number, field: 'label' | 'score' | 'is_correct' | 'dimension_key') {
  return `option_${slot}_${field}`;
}

export function normalizeOptionDimension(optionDimension: string | null, rowDimension: string | null) {
  return optionDimension ?? rowDimension;
}

export function createImportSummary(rows: ParsedQuestionImportRow[]) {
  const categories = Array.from(new Set(rows.map((row) => row.testType)));
  return {
    preview: rows.length,
    categories,
  };
}

export function ensureOptionSetCompleteness(row: ParsedQuestionImportRow) {
  if (row.options.length < 2) return false;
  if (row.questionType === 'single_choice') {
    return row.options.some((option) => option.isCorrect === 1);
  }
  return true;
}

export function normalizeStatusForExport(status: string | null | undefined): string {
  const mapped = mapRawStatus(status ?? 'active');
  if (!mapped) return 'active';
  return mapped;
}

export function normalizeReverseForExport(value: unknown): string {
  if (typeof value === 'number') {
    return value > 0 ? '1' : '0';
  }
  if (typeof value === 'boolean') {
    return value ? '1' : '0';
  }
  const parsed = parseBooleanishValue(String(value ?? ''), 'is_reverse_scored');
  if (!parsed.ok) return '0';
  return parsed.value ? '1' : '0';
}

export function buildCsvRowFromValidatedRecord(record: {
  testType: string;
  questionCode: string;
  questionType: string;
  questionOrder: number;
  prompt: string;
  dimensionKey: string;
  categoryKey: string;
  scoringKey: string;
  isReverseScored: string;
  weight: string;
  status: string;
  options: Array<{
    label: string;
    score: string;
    isCorrect: string;
    dimensionKey: string;
  }>;
}) {
  const row: string[] = [
    record.testType,
    record.questionCode,
    record.questionType,
    String(record.questionOrder),
    record.prompt,
    record.dimensionKey,
    record.categoryKey,
    record.scoringKey,
    record.isReverseScored,
    record.weight,
    record.status,
  ];

  for (let index = 0; index < OPTION_SLOT_COUNT; index += 1) {
    const option = record.options[index];
    row.push(option?.label ?? '');
    row.push(option?.score ?? '');
    row.push(option?.isCorrect ?? '');
    row.push(option?.dimensionKey ?? '');
  }

  return row;
}

export function detectTestTypeFromCode(questionCode: string): 'iq' | 'disc' | 'workload' | 'custom' | null {
  const upper = questionCode.toUpperCase();
  if (upper.startsWith('IQ_')) return 'iq';
  if (upper.startsWith('DISC_')) return 'disc';
  if (upper.startsWith('WL_') || upper.startsWith('WORKLOAD_')) return 'workload';
  if (upper.startsWith('CUS_') || upper.startsWith('CUSTOM_')) return 'custom';
  return null;
}

export function mergeCategoryAndDimension(categoryKey: string | null, dimensionKey: string | null) {
  if (categoryKey) return categoryKey;
  return dimensionKey;
}

export function normalizeQuestionPrompt(prompt: string) {
  return prompt.trim();
}

export function normalizeQuestionCode(code: string) {
  return code.trim().toUpperCase();
}

export function createQuestionMetaPayload(input: {
  source: string;
  categoryKey: string | null;
  scoringKey: string | null;
  isReverseScored: boolean;
  weight: number;
}) {
  return {
    source: input.source,
    categoryKey: input.categoryKey,
    scoringKey: input.scoringKey,
    isReverseScored: input.isReverseScored,
    weight: input.weight,
  };
}

export function createOptionPayload(input: {
  source: string;
  scoreValue: number;
}) {
  return {
    source: input.source,
    scoreValue: input.scoreValue,
  };
}

export function pickStatusOrDefault(value: string | undefined) {
  if (!value) return 'active' as const;
  const mapped = mapRawStatus(value);
  if (!mapped) return 'active' as const;
  return mapped;
}

export function pickWeightOrDefault(value: number | undefined) {
  if (!Number.isFinite(value ?? NaN) || (value ?? 0) <= 0) {
    return 1;
  }
  return Number(value);
}

export function pickReverseOrDefault(value: boolean | undefined) {
  return Boolean(value);
}

export function hasAnyOptionOverride(row: ParsedQuestionImportRow) {
  return row.options.some((option) => option.dimensionKey != null);
}

export function normalizeOptionScoreForStorage(value: number) {
  return Number.isFinite(value) ? value : 0;
}

export function normalizeQuestionOrderForStorage(value: number) {
  return Number.isFinite(value) && value > 0 ? Math.trunc(value) : 1;
}

export function normalizeQuestionStatusForStorage(value: string | undefined) {
  if (value === 'draft' || value === 'archived') return value;
  return 'active';
}

export function normalizeBooleanForStorage(value: boolean) {
  return value ? 1 : 0;
}

export function normalizeWeightForStorage(value: number) {
  if (!Number.isFinite(value) || value <= 0) return 1;
  return value;
}

export function normalizeScorePayloadForStorage(scoreValue: number) {
  return {
    scoreValue,
  };
}

export function normalizeOptionIsCorrect(value: number) {
  return value > 0 ? 1 : 0;
}

export function normalizeDimensionForStorage(value: string | null) {
  if (!value) return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

export function normalizePromptForStorage(value: string) {
  return value.trim();
}

export function normalizeQuestionCodeForStorage(value: string) {
  return value.trim();
}

export function normalizeScoringKeyForStorage(value: string | null) {
  if (!value) return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

export function normalizeCategoryKeyForStorage(value: string | null) {
  if (!value) return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

export function normalizeQuestionTypeForStorage(value: string) {
  if (value === 'forced_choice' || value === 'likert') {
    return value;
  }
  return 'single_choice';
}

export function normalizeTestTypeForStorage(value: string): 'iq' | 'disc' | 'workload' | 'custom' {
  const mapped = mapRawTestType(value);
  if (!mapped) return 'custom';
  return mapped as 'iq' | 'disc' | 'workload' | 'custom';
}

export function hasRowValidationErrorsForRow(issues: CsvRowIssue[], csvRowNumber: number) {
  return issues.some((issue) => issue.row === csvRowNumber);
}

export function createImportValidationError(row: number, field: string, message: string): CsvRowIssue {
  return { row, field, message };
}

export function normalizeQuestionTextLegacyFallback(value: string) {
  return value.trim();
}

export function validateQuestionTypeAgainstTestType(
  row: ParsedQuestionImportRow,
  csvRowNumber: number,
  issues: CsvRowIssue[],
) {
  if (row.testType === 'iq' && row.questionType === 'forced_choice') {
    issues.push({
      row: csvRowNumber,
      field: 'question_type',
      message: 'iq test_type should use single_choice or likert question_type',
    });
  }
}

export function validateRowsForScoringContracts(rows: ParsedQuestionImportRow[]) {
  const issues: CsvRowIssue[] = [];
  rows.forEach((row, index) => {
    const csvRowNumber = index + 2;
    validateQuestionTypeAgainstTestType(row, csvRowNumber, issues);
  });
  return issues;
}

export function buildImportResult(rows: ParsedQuestionImportRow[], issues: CsvRowIssue[]) {
  const scoringIssues = validateRowsForScoringContracts(rows);
  return {
    validRows: rows,
    issues: [...issues, ...scoringIssues],
  };
}

export function validateCanonicalCsvRows(rows: Array<Record<string, string>>) {
  const base = validateImportRowsWithNormalization(rows);
  return buildImportResult(base.validRows, base.issues);
}
