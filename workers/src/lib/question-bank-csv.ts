import { z } from 'zod';

export const FLAT_QUESTION_BANK_CSV_HEADERS = [
  'id',
  'question_text',
  'question_type',
  'category',
  'test_type',
  'dimension',
  'difficulty',
  'is_active',
  'order_index',
  'option_1_text',
  'option_1_value',
  'option_1_is_correct',
  'option_2_text',
  'option_2_value',
  'option_2_is_correct',
  'option_3_text',
  'option_3_value',
  'option_3_is_correct',
  'option_4_text',
  'option_4_value',
  'option_4_is_correct',
  'option_5_text',
  'option_5_value',
  'option_5_is_correct',
] as const;

export type FlatQuestionBankCsvHeader = (typeof FLAT_QUESTION_BANK_CSV_HEADERS)[number];

export interface CsvRowIssue {
  row: number;
  field: string;
  message: string;
}

const importRowSchema = z.object({
  id: z.string().optional(),
  question_text: z.string().min(5, 'Question text must be at least 5 characters'),
  question_type: z.enum(['single_choice', 'forced_choice', 'likert']),
  category: z.enum(['iq', 'disc', 'workload', 'custom']).optional(),
  test_type: z.enum(['iq', 'disc', 'workload', 'custom']).optional(),
  dimension: z.string().optional(),
  difficulty: z.coerce.number().int().min(1).max(3).optional(),
  is_active: z.coerce.number().int().min(0).max(1).optional(),
  order_index: z.coerce.number().int().min(0).optional(),
  option_1_text: z.string().optional(),
  option_1_value: z.string().optional(),
  option_1_is_correct: z.coerce.number().int().min(0).max(1).optional(),
  option_2_text: z.string().optional(),
  option_2_value: z.string().optional(),
  option_2_is_correct: z.coerce.number().int().min(0).max(1).optional(),
  option_3_text: z.string().optional(),
  option_3_value: z.string().optional(),
  option_3_is_correct: z.coerce.number().int().min(0).max(1).optional(),
  option_4_text: z.string().optional(),
  option_4_value: z.string().optional(),
  option_4_is_correct: z.coerce.number().int().min(0).max(1).optional(),
  option_5_text: z.string().optional(),
  option_5_value: z.string().optional(),
  option_5_is_correct: z.coerce.number().int().min(0).max(1).optional(),
});

export type ParsedQuestionImportRow = z.infer<typeof importRowSchema>;

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

function hasAtLeastTwoOptions(row: ParsedQuestionImportRow) {
  const optionTexts = [row.option_1_text, row.option_2_text, row.option_3_text, row.option_4_text, row.option_5_text]
    .map((value) => value?.trim() ?? '')
    .filter((value) => value.length > 0);
  return optionTexts.length >= 2;
}

function isCategoryMismatch(row: ParsedQuestionImportRow) {
  if (!row.category || !row.test_type) return false;
  return row.category !== row.test_type;
}

export function validateQuestionImportRows(rows: Array<Record<string, string>>) {
  const issues: CsvRowIssue[] = [];
  const validRows: ParsedQuestionImportRow[] = [];

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
    const normalizedTestType = parsedRow.test_type ?? parsedRow.category;
    if (!normalizedTestType) {
      issues.push({
        row: csvRowNumber,
        field: 'test_type',
        message: 'Either test_type or category must be provided',
      });
      return;
    }

    if (isCategoryMismatch(parsedRow)) {
      issues.push({
        row: csvRowNumber,
        field: 'category',
        message: 'category must match test_type when both are provided',
      });
      return;
    }

    if (!hasAtLeastTwoOptions(parsedRow)) {
      issues.push({
        row: csvRowNumber,
        field: 'option_1_text',
        message: 'At least two option text columns are required',
      });
      return;
    }

    validRows.push({
      ...parsedRow,
      test_type: normalizedTestType,
      category: normalizedTestType,
    });
  });

  return { validRows, issues };
}
