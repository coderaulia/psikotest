import { type FormEvent, useDeferredValue, useEffect, useState } from 'react';

import { SectionHeading } from '@/components/common/section-heading';
import { StateCard } from '@/components/common/state-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import {
  createQuestionBankQuestion,
  downloadQuestionBankCsv,
  downloadQuestionBankImportTemplate,
  fetchQuestionBank,
  fetchQuestionBankQuestion,
  importQuestionBankCsv,
  updateQuestionBankQuestion,
} from '@/services/admin-data';
import { AdminApiError } from '@/services/admin-api';
import type {
  QuestionBankQuestionDetail,
  QuestionBankQuestionPayload,
  QuestionStatus,
  QuestionType,
  TestTypeCode,
} from '@/types/assessment';
import { formatTestTypeLabel, formatTokenLabel } from '@/lib/formatters';

const textAreaClassName = 'min-h-[110px] w-full rounded-2xl border border-border bg-white/80 px-4 py-3 text-sm text-foreground shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-300 focus:ring-2 focus:ring-slate-200';

function getDefaultQuestionType(testType: TestTypeCode): QuestionType {
  if (testType === 'workload' || testType === 'custom') {
    return 'likert';
  }

  if (testType === 'disc') {
    return 'forced_choice';
  }

  return 'single_choice';
}

function createDefaultOptions(testType: TestTypeCode): QuestionBankQuestionPayload['options'] {
  if (testType === 'custom') {
    return [
      { optionKey: '1', optionText: 'Strongly disagree', optionOrder: 1, valueNumber: 1, isCorrect: false },
      { optionKey: '2', optionText: 'Disagree', optionOrder: 2, valueNumber: 2, isCorrect: false },
      { optionKey: '3', optionText: 'Neutral', optionOrder: 3, valueNumber: 3, isCorrect: false },
      { optionKey: '4', optionText: 'Agree', optionOrder: 4, valueNumber: 4, isCorrect: false },
      { optionKey: '5', optionText: 'Strongly agree', optionOrder: 5, valueNumber: 5, isCorrect: false },
    ];
  }

  return [
    { optionKey: 'A', optionText: '', optionOrder: 1, isCorrect: false },
    { optionKey: 'B', optionText: '', optionOrder: 2, isCorrect: false },
    { optionKey: 'C', optionText: '', optionOrder: 3, isCorrect: false },
    { optionKey: 'D', optionText: '', optionOrder: 4, isCorrect: false },
  ];
}

function createEmptyForm(testType: TestTypeCode = 'disc'): QuestionBankQuestionPayload {
  return {
    testType,
    questionCode: '',
    instructionText: '',
    prompt: '',
    questionGroupKey: '',
    dimensionKey: '',
    questionType: getDefaultQuestionType(testType),
    questionOrder: 1,
    isRequired: true,
    status: 'draft',
    questionMeta: {},
    options: createDefaultOptions(testType),
  };
}

function formatMetaJson(value: Record<string, unknown> | null | undefined) {
  return JSON.stringify(value ?? {}, null, 2);
}

function parseMetaJson(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return {};
  }

  return JSON.parse(trimmed) as Record<string, unknown>;
}

export function QuestionBankPage() {
  type CsvImportIssue = { row: number; field: string; message: string };

  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [testTypeFilter, setTestTypeFilter] = useState<'all' | TestTypeCode>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | QuestionStatus>('all');
  const [items, setItems] = useState<QuestionBankQuestionDetail[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<QuestionBankQuestionPayload>(createEmptyForm());
  const [metaText, setMetaText] = useState('{}');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isDryRunningImport, setIsDryRunningImport] = useState(false);
  const [isWritingImport, setIsWritingImport] = useState(false);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [importFileName, setImportFileName] = useState<string | null>(null);
  const [importCsvText, setImportCsvText] = useState('');
  const [replaceAll, setReplaceAll] = useState(false);
  const [importPreviewCount, setImportPreviewCount] = useState<number | null>(null);
  const [importPreviewCategories, setImportPreviewCategories] = useState<string[]>([]);
  const [importErrors, setImportErrors] = useState<CsvImportIssue[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function loadQuestions(preserveSelection = true) {
    setIsLoading(true);
    setError(null);

    try {
      const records = await fetchQuestionBank({
        search: deferredSearch.trim(),
        testType: testTypeFilter,
        status: statusFilter,
      });

      const detailed = await Promise.all(records.map((record) => fetchQuestionBankQuestion(record.id)));
      setItems(detailed);

      if (preserveSelection && selectedId) {
        const selected = detailed.find((item) => item.id === selectedId);
        if (selected) {
          setForm({
            testType: selected.testType,
            questionCode: selected.questionCode,
            instructionText: selected.instructionText ?? '',
            prompt: selected.prompt ?? '',
            questionGroupKey: selected.questionGroupKey ?? '',
            dimensionKey: selected.dimensionKey ?? '',
            questionType: selected.questionType,
            questionOrder: selected.questionOrder,
            isRequired: selected.isRequired,
            status: selected.status,
            questionMeta: selected.questionMeta,
            options: selected.options.map((option) => ({ ...option, id: undefined })),
          });
          setMetaText(formatMetaJson(selected.questionMeta));
          return;
        }
      }

      if (detailed[0]) {
        selectQuestion(detailed[0]);
      } else {
        setSelectedId(null);
        setIsCreating(true);
        const emptyForm = createEmptyForm(testTypeFilter === 'all' ? 'disc' : testTypeFilter);
        setForm(emptyForm);
        setMetaText(formatMetaJson(emptyForm.questionMeta));
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load question bank');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadQuestions(false);
  }, [deferredSearch, testTypeFilter, statusFilter]);

  function selectQuestion(question: QuestionBankQuestionDetail) {
    setIsCreating(false);
    setSelectedId(question.id);
    setSuccessMessage(null);
    setForm({
      testType: question.testType,
      questionCode: question.questionCode,
      instructionText: question.instructionText ?? '',
      prompt: question.prompt ?? '',
      questionGroupKey: question.questionGroupKey ?? '',
      dimensionKey: question.dimensionKey ?? '',
      questionType: question.questionType,
      questionOrder: question.questionOrder,
      isRequired: question.isRequired,
      status: question.status,
      questionMeta: question.questionMeta,
      options: question.options.map((option) => ({ ...option, id: undefined })),
    });
    setMetaText(formatMetaJson(question.questionMeta));
  }

  function handleCreateNew() {
    const nextType = testTypeFilter === 'all' ? 'disc' : testTypeFilter;
    const emptyForm = createEmptyForm(nextType);
    setSelectedId(null);
    setIsCreating(true);
    setSuccessMessage(null);
    setForm(emptyForm);
    setMetaText(formatMetaJson(emptyForm.questionMeta));
  }

  function updateOption(index: number, key: keyof QuestionBankQuestionPayload['options'][number], value: string | number | boolean | null) {
    setForm((current) => ({
      ...current,
      options: current.options.map((option, optionIndex) =>
        optionIndex === index
          ? {
              ...option,
              [key]: value,
            }
          : option,
      ),
    }));
  }

  function addOption() {
    setForm((current) => ({
      ...current,
      options: [
        ...current.options,
        {
          optionKey: current.testType === 'custom'
            ? String(current.options.length + 1)
            : String.fromCharCode(65 + current.options.length),
          optionText: '',
          optionOrder: current.options.length + 1,
          isCorrect: false,
        },
      ],
    }));
  }

  function removeOption(index: number) {
    setForm((current) => ({
      ...current,
      options: current.options
        .filter((_, optionIndex) => optionIndex !== index)
        .map((option, optionIndex) => ({ ...option, optionOrder: optionIndex + 1 })),
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const payload: QuestionBankQuestionPayload = {
        ...form,
        instructionText: form.instructionText?.trim() || null,
        prompt: form.prompt?.trim() || null,
        questionGroupKey: form.questionGroupKey?.trim() || null,
        dimensionKey: form.dimensionKey?.trim() || null,
        questionMeta: parseMetaJson(metaText),
        options: form.options.map((option, index) => ({
          optionKey: option.optionKey.trim(),
          optionText: option.optionText.trim(),
          dimensionKey: option.dimensionKey?.trim() || null,
          valueNumber: option.valueNumber == null || Number.isNaN(Number(option.valueNumber)) ? null : Number(option.valueNumber),
          isCorrect: Boolean(option.isCorrect),
          optionOrder: index + 1,
          scorePayload: option.scorePayload ?? null,
        })),
      };

      const saved = isCreating || !selectedId
        ? await createQuestionBankQuestion(payload)
        : await updateQuestionBankQuestion(selectedId, payload);

      setSuccessMessage(isCreating || !selectedId ? 'Question created.' : 'Question updated.');
      setSelectedId(saved.id);
      setIsCreating(false);
      await loadQuestions(false);
      const refreshed = await fetchQuestionBankQuestion(saved.id);
      selectQuestion(refreshed);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to save question');
    } finally {
      setIsSaving(false);
    }
  }

  function handleTestTypeChange(nextType: TestTypeCode) {
    setForm((current) => {
      const nextDefaultType = getDefaultQuestionType(nextType);
      const currentDefaultType = getDefaultQuestionType(current.testType);
      const shouldReplaceQuestionType = current.questionType === currentDefaultType;
      const shouldReplaceOptions = current.options.length === 0 || (current.testType !== nextType && isCreating);

      return {
        ...current,
        testType: nextType,
        questionType: shouldReplaceQuestionType ? nextDefaultType : current.questionType,
        options: shouldReplaceOptions ? createDefaultOptions(nextType) : current.options,
      };
    });
  }

  async function handleExportCsv() {
    setError(null);
    setSuccessMessage(null);
    setIsExporting(true);

    try {
      const blob = await downloadQuestionBankCsv();
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = 'questions-export.csv';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(downloadUrl);
      setSuccessMessage('Question bank CSV exported.');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to export CSV');
    } finally {
      setIsExporting(false);
    }
  }

  function resetImportState() {
    setImportFileName(null);
    setImportCsvText('');
    setReplaceAll(false);
    setImportPreviewCount(null);
    setImportPreviewCategories([]);
    setImportErrors([]);
    setIsDryRunningImport(false);
    setIsWritingImport(false);
  }

  function extractImportErrors(requestError: unknown) {
    if (requestError instanceof AdminApiError && requestError.details && typeof requestError.details === 'object') {
      const details = requestError.details as {
        errors?: Array<{ row?: number; field?: string; message?: string }>;
      };

      if (Array.isArray(details.errors)) {
        return details.errors.map((item) => ({
          row: Number(item.row ?? 0),
          field: item.field ?? 'row',
          message: item.message ?? 'Invalid value',
        }));
      }
    }

    return [] as CsvImportIssue[];
  }

  async function handleImportFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const csvText = await file.text();
      setImportCsvText(csvText);
      setImportFileName(file.name);
      setImportPreviewCount(null);
      setImportPreviewCategories([]);
      setImportErrors([]);
      setError(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to read selected CSV file');
    }
  }

  async function handleImportDryRun() {
    if (!importCsvText.trim()) {
      setImportErrors([{ row: 1, field: 'csv', message: 'Please select a CSV file first' }]);
      return;
    }

    setIsDryRunningImport(true);
    setImportErrors([]);
    setError(null);
    setSuccessMessage(null);

    try {
      const preview = await importQuestionBankCsv({
        csv: importCsvText,
        dryRun: true,
        replaceAll,
      });
      setImportPreviewCount(preview.preview);
      setImportPreviewCategories(preview.categories);
    } catch (requestError) {
      setImportPreviewCount(null);
      setImportPreviewCategories([]);
      const issues = extractImportErrors(requestError);
      setImportErrors(issues);
      if (issues.length === 0) {
        setError(requestError instanceof Error ? requestError.message : 'Dry run failed');
      }
    } finally {
      setIsDryRunningImport(false);
    }
  }

  async function handleImportWrite() {
    if (!importCsvText.trim()) {
      setImportErrors([{ row: 1, field: 'csv', message: 'Please select a CSV file first' }]);
      return;
    }

    if (importPreviewCount == null) {
      setImportErrors([{ row: 1, field: 'dryRun', message: 'Run dry run preview before importing' }]);
      return;
    }

    setIsWritingImport(true);
    setImportErrors([]);
    setError(null);
    setSuccessMessage(null);

    try {
      const result = await importQuestionBankCsv({
        csv: importCsvText,
        dryRun: false,
        replaceAll,
      });

      setSuccessMessage(`CSV import complete. Imported ${result.imported ?? 0}, skipped ${result.skipped ?? 0}.`);
      setIsImportOpen(false);
      await loadQuestions(false);
      resetImportState();
    } catch (requestError) {
      const issues = extractImportErrors(requestError);
      setImportErrors(issues);
      if (issues.length === 0) {
        setError(requestError instanceof Error ? requestError.message : 'Import failed');
      }
    } finally {
      setIsWritingImport(false);
    }
  }

  async function handleDownloadTemplate() {
    setError(null);
    setIsDownloadingTemplate(true);
    try {
      const blob = await downloadQuestionBankImportTemplate();
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = 'question-bank-import-template.csv';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(downloadUrl);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to download CSV template');
    } finally {
      setIsDownloadingTemplate(false);
    }
  }

  if (isLoading && items.length === 0 && !isCreating) {
    return <StateCard title="Loading question bank" description="Pulling secured question content and option structures." />;
  }

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Question Bank"
        title="Assessment item management"
        description="Create and maintain item content inside the protected admin workspace. Questions are never exposed through public admin-free endpoints."
        actions={(
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                resetImportState();
                setIsImportOpen(true);
              }}
            >
              Import CSV
            </Button>
            <Button type="button" variant="secondary" onClick={handleExportCsv} disabled={isExporting}>
              {isExporting ? 'Exporting...' : 'Export CSV'}
            </Button>
            <Button type="button" onClick={handleCreateNew}>New question</Button>
          </div>
        )}
      />

      {error ? <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">{error}</div> : null}
      {successMessage ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{successMessage}</div> : null}

      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <Card className="bg-white/80">
          <CardHeader>
            <CardTitle>Questions</CardTitle>
            <CardDescription>Filter by assessment module and status.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search code, prompt, or instruction" />
              <div className="grid gap-3 md:grid-cols-2">
                <Select value={testTypeFilter} onChange={(event) => setTestTypeFilter(event.target.value as 'all' | TestTypeCode)}>
                  <option value="all">All test types</option>
                  <option value="disc">DISC</option>
                  <option value="iq">IQ</option>
                  <option value="workload">Workload</option>
                  <option value="custom">Custom Research</option>
                </Select>
                <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as 'all' | QuestionStatus)}>
                  <option value="all">All statuses</option>
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              {items.length === 0 ? (
                <StateCard title="No questions found" description="Adjust the filters or create a new item." />
              ) : (
                items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => selectQuestion(item)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${selectedId === item.id && !isCreating ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">{item.questionCode}</p>
                        <p className={`mt-1 text-sm ${selectedId === item.id && !isCreating ? 'text-white/70' : 'text-slate-500'}`}>{item.prompt ?? item.instructionText ?? 'No prompt or instruction saved.'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge>{formatTestTypeLabel(item.testType)}</Badge>
                        <Badge>{formatTokenLabel(item.status)}</Badge>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80">
          <CardHeader>
            <CardTitle>{isCreating || !selectedId ? 'Create question' : 'Edit question'}</CardTitle>
            <CardDescription>Supports IQ, DISC, workload, and custom research item structures without changing the underlying schema.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600">Test type</label>
                  <Select value={form.testType} onChange={(event) => handleTestTypeChange(event.target.value as TestTypeCode)}>
                    <option value="disc">DISC</option>
                    <option value="iq">IQ</option>
                    <option value="workload">Workload</option>
                    <option value="custom">Custom Research</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600">Question type</label>
                  <Select value={form.questionType} onChange={(event) => setForm((current) => ({ ...current, questionType: event.target.value as QuestionType }))}>
                    <option value="forced_choice">Forced choice</option>
                    <option value="single_choice">Single choice</option>
                    <option value="likert">Likert scale</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600">Question code</label>
                  <Input value={form.questionCode} onChange={(event) => setForm((current) => ({ ...current, questionCode: event.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600">Question order</label>
                  <Input type="number" min={1} value={form.questionOrder} onChange={(event) => setForm((current) => ({ ...current, questionOrder: Number(event.target.value) || 1 }))} required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600">Dimension key</label>
                  <Input value={form.dimensionKey ?? ''} onChange={(event) => setForm((current) => ({ ...current, dimensionKey: event.target.value }))} placeholder="D, I, S, C or category" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600">Group key</label>
                  <Input value={form.questionGroupKey ?? ''} onChange={(event) => setForm((current) => ({ ...current, questionGroupKey: event.target.value }))} placeholder="Optional grouping key" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600">Status</label>
                  <Select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as QuestionStatus }))}>
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="archived">Archived</option>
                  </Select>
                </div>
                <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                  <input type="checkbox" checked={form.isRequired} onChange={(event) => setForm((current) => ({ ...current, isRequired: event.target.checked }))} />
                  Required response
                </label>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600">Instruction text</label>
                <textarea className={textAreaClassName} value={form.instructionText ?? ''} onChange={(event) => setForm((current) => ({ ...current, instructionText: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600">Prompt</label>
                <textarea className={textAreaClassName} value={form.prompt ?? ''} onChange={(event) => setForm((current) => ({ ...current, prompt: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600">Question meta JSON</label>
                <textarea className={textAreaClassName} value={metaText} onChange={(event) => setMetaText(event.target.value)} />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-950">Options</p>
                    <p className="text-sm text-slate-500">Protected answer choices stored only in the admin question bank.</p>
                  </div>
                  <Button type="button" variant="secondary" onClick={addOption}>Add option</Button>
                </div>
                {form.options.map((option, index) => (
                  <div key={`${option.optionKey}-${index}`} className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                      <Input value={option.optionKey} onChange={(event) => updateOption(index, 'optionKey', event.target.value)} placeholder="Key" />
                      <Input className="xl:col-span-2" value={option.optionText} onChange={(event) => updateOption(index, 'optionText', event.target.value)} placeholder="Option text" />
                      <Input value={option.dimensionKey ?? ''} onChange={(event) => updateOption(index, 'dimensionKey', event.target.value)} placeholder="Dimension" />
                      <Input type="number" value={option.valueNumber ?? ''} onChange={(event) => updateOption(index, 'valueNumber', event.target.value === '' ? null : Number(event.target.value))} placeholder="Value" />
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-600">
                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked={Boolean(option.isCorrect)} onChange={(event) => updateOption(index, 'isCorrect', event.target.checked)} />
                        Correct option
                      </label>
                      {form.options.length > 2 ? <Button type="button" variant="ghost" onClick={() => removeOption(index)}>Remove</Button> : null}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={isSaving}>{isSaving ? 'Saving question...' : isCreating || !selectedId ? 'Create question' : 'Save question'}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {isImportOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
          <div className="w-full max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Question Bank Import</p>
                <h3 className="text-xl font-semibold text-slate-950">Import Questions from CSV</h3>
                <p className="mt-1 text-sm text-slate-600">Run a dry run first to validate rows before writing data.</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setIsImportOpen(false);
                  resetImportState();
                }}
              >
                Close
              </Button>
            </div>

            <div className="mt-6 space-y-4">
              <div className="flex justify-end">
                <Button type="button" variant="secondary" onClick={handleDownloadTemplate} disabled={isDownloadingTemplate}>
                  {isDownloadingTemplate ? 'Preparing template...' : 'Download Template'}
                </Button>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600">CSV file</label>
                <Input type="file" accept=".csv,text/csv" onChange={handleImportFileChange} />
                <p className="text-xs text-slate-500">{importFileName ? `Selected: ${importFileName}` : 'Choose a CSV file that matches the question bank template.'}</p>
              </div>

              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                <input type="checkbox" checked={replaceAll} onChange={(event) => setReplaceAll(event.target.checked)} />
                Replace existing questions for categories present in this CSV
              </label>

              {importPreviewCount != null ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  Found {importPreviewCount} valid question rows in categories: {importPreviewCategories.join(', ') || 'n/a'}.
                </div>
              ) : null}

              {importErrors.length > 0 ? (
                <div className="max-h-44 overflow-auto rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  {importErrors.map((issue, index) => (
                    <p key={`${issue.row}-${issue.field}-${index}`}>
                      Row {issue.row}, {issue.field}: {issue.message}
                    </p>
                  ))}
                </div>
              ) : null}

              <div className="flex flex-wrap justify-end gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleImportDryRun}
                  disabled={!importCsvText.trim() || isDryRunningImport || isWritingImport}
                >
                  {isDryRunningImport ? 'Validating...' : 'Dry Run Preview'}
                </Button>
                <Button
                  type="button"
                  onClick={handleImportWrite}
                  disabled={importPreviewCount == null || isDryRunningImport || isWritingImport}
                >
                  {isWritingImport ? 'Importing...' : 'Import CSV'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
