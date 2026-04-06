import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';

import { StateCard } from '@/components/common/state-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { fetchResultDetail } from '@/services/admin-data';
import type { StoredResultDetailRecord } from '@/types/assessment';
import { formatDateTime, formatResultHeadline, formatResultSummary, formatTestTypeLabel, formatTokenLabel } from '@/lib/formatters';

function ScoreBar({ 
  label, 
  value, 
  maxValue = 100, 
  colorClass = 'bg-indigo-500',
  showPercentage = true,
}: { 
  label: string; 
  value: number; 
  maxValue?: number;
  colorClass?: string;
  showPercentage?: boolean;
}) {
  const percentage = Math.min(100, Math.max(0, (value / maxValue) * 100));
  
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-slate-700 print:text-black">{label}</span>
        <span className="text-slate-900 print:text-black font-semibold">
          {showPercentage ? `${Math.round(value)}%` : value}
        </span>
      </div>
      <div className="h-2.5 w-full rounded-full bg-slate-200 print:bg-slate-300">
        <div 
          className={`h-full rounded-full ${colorClass} print:bg-slate-600`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function IQDimensionBars({ dimensions }: { dimensions: Record<string, { correct: number; total: number; percentage: number }> }) {
  const dimLabels: Record<string, string> = {
    pattern: 'Pattern Recognition',
    numerical: 'Numerical Reasoning',
    verbal: 'Verbal Reasoning',
    spatial: 'Spatial Reasoning',
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xs uppercase tracking-widest text-slate-400 print:text-black">IQ Dimension Scores</h3>
      <div className="space-y-3">
        {Object.entries(dimensions).map(([key, data]) => (
          <ScoreBar
            key={key}
            label={dimLabels[key] || key}
            value={data.percentage}
            colorClass="bg-indigo-500"
          />
        ))}
      </div>
    </div>
  );
}

function DISCDimensionBars({ scores }: { scores: Record<string, number> }) {
  const dimLabels: Record<string, string> = {
    D: 'Dominance',
    I: 'Influence',
    S: 'Steadiness',
    C: 'Conscientiousness',
  };

  const dimColors: Record<string, string> = {
    D: 'bg-red-500',
    I: 'bg-yellow-500',
    S: 'bg-green-500',
    C: 'bg-blue-500',
  };

  const maxValue = Math.max(...Object.values(scores), 1);

  return (
    <div className="space-y-4">
      <h3 className="text-xs uppercase tracking-widest text-slate-400 print:text-black">DISC Profile Distribution</h3>
      <div className="space-y-3">
        {Object.entries(scores).map(([key, value]) => (
          <ScoreBar
            key={key}
            label={`${key} - ${dimLabels[key] || key}`}
            value={value}
            maxValue={maxValue}
            showPercentage={false}
            colorClass={dimColors[key] || 'bg-slate-500'}
          />
        ))}
      </div>
    </div>
  );
}

function WorkloadDimensionBars({ dimensions, elevated }: { dimensions: Record<string, number>; elevated: string[] }) {
  const dimLabels: Record<string, string> = {
    mental_demand: 'Mental Demand',
    physical_demand: 'Physical Demand',
    temporal_demand: 'Temporal Demand',
    performance: 'Performance',
    effort: 'Effort',
    frustration: 'Frustration',
  };

  const getBarColor = (value: number): string => {
    if (value <= 3) return 'bg-green-500';
    if (value <= 5) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xs uppercase tracking-widest text-slate-400 print:text-black">NASA-TLX Workload Dimensions</h3>
      <div className="space-y-3">
        {Object.entries(dimensions).map(([key, value]) => (
          <div key={key} className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-slate-700 print:text-black">{dimLabels[key] || key}</span>
              <span className="text-slate-900 print:text-black font-semibold">{value.toFixed(1)}/7</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-slate-200 print:bg-slate-300">
              <div 
                className={`h-full rounded-full ${getBarColor(value)} print:bg-slate-600`}
                style={{ width: `${(value / 7) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      {elevated.length > 0 && (
        <div className="mt-4 rounded-lg bg-amber-50 print:bg-slate-100 p-4 text-sm">
          <p className="font-medium text-amber-800 print:text-black">Elevated Dimensions</p>
          <p className="mt-1 text-amber-700 print:text-slate-600">{elevated.join(', ')}</p>
        </div>
      )}
    </div>
  );
}

function DimensionVisualization({ testType, resultPayload }: { testType: string; resultPayload: Record<string, unknown> | null }) {
  if (!resultPayload) return null;
  
  const type = testType.toLowerCase();
  
  if (type === 'iq' && resultPayload.iqResult) {
    const iqResult = resultPayload.iqResult as Record<string, unknown>;
    const dimensions = iqResult.dimensions as Record<string, { correct: number; total: number; percentage: number }> | undefined;
    if (!dimensions) return null;
    return <IQDimensionBars dimensions={dimensions} />;
  }
  
  if (type === 'disc' && resultPayload.discResult) {
    const discResult = resultPayload.discResult as Record<string, unknown>;
    const scores = discResult.scores as Record<string, number> | undefined;
    if (!scores) return null;
    return <DISCDimensionBars scores={scores} />;
  }
  
  if (type === 'workload' && resultPayload.workloadResult) {
    const workloadResult = resultPayload.workloadResult as Record<string, unknown>;
    const dimensions = workloadResult.dimensions as Record<string, number> | undefined;
    const elevated = (workloadResult.elevatedDimensions as string[]) || [];
    if (!dimensions) return null;
    return <WorkloadDimensionBars dimensions={dimensions} elevated={elevated} />;
  }
  
  return null;
}

export function ReportExportPage() {
  const { id } = useParams();
  const resultId = Number(id);
  const [result, setResult] = useState<StoredResultDetailRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (Number.isFinite(resultId)) {
      setIsLoading(true);
      fetchResultDetail(resultId)
        .then((record) => {
          if (active) {
            setResult(record);
            setError(null);
          }
        })
        .catch((err) => {
          if (active) setError(err instanceof Error ? err.message : 'Unable to load result detail');
        })
        .finally(() => {
          if (active) setIsLoading(false);
        });
    } else {
      setIsLoading(false);
      setError('Invalid result ID.');
    }
    return () => {
      active = false;
    };
  }, [resultId]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <StateCard title="Preparing report" description="Loading formatting data..." />
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8 print:hidden">
        <StateCard title="Unable to render report" description={error || 'Result not found'} tone="danger" />
      </div>
    );
  }

  if (result.reviewStatus !== 'released') {
    return (
      <div className="flex min-h-screen items-center justify-center p-8 print:hidden">
        <StateCard 
          title="Not ready for export" 
          description="This report is not in a 'released' state and cannot be exported yet." 
          tone="danger" 
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 print:bg-white p-4 sm:p-8">
      {/* Floating action bar, hidden on print */}
      <div className="fixed top-6 right-6 z-50 flex items-center gap-3 rounded-full bg-white shadow-lg ring-1 ring-slate-900/5 print:hidden">
        <Button variant="ghost" asChild className="rounded-l-full rounded-r-none">
          <Link to={`/admin/results/${resultId}`}><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <button 
          className="flex h-12 items-center gap-2 rounded-full px-6 font-medium text-slate-900 transition hover:bg-slate-50 active:bg-slate-100"
          onClick={() => window.print()}
        >
          <Printer className="h-5 w-5" />
          <span>Print or Save PDF</span>
        </button>
      </div>

      {/* A4 Document Container */}
      <div className="mx-auto max-w-[21cm] bg-white p-[1.5cm] shadow-sm ring-1 ring-slate-900/5 print:m-0 print:max-w-none print:p-0 print:shadow-none print:ring-0">
        
        {/* Header */}
        <div className="border-b border-slate-200 pb-8">
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-3xl font-light tracking-tight text-slate-950 print:text-black">
                Psychometric Assessment Report
              </h1>
              <p className="mt-2 text-sm text-slate-500 uppercase tracking-widest print:text-slate-600">
                Confidential Document
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-slate-950 print:text-black">Vanaila Psikotest</p>
              <p className="text-sm text-slate-500 print:text-slate-600">Ref: #{result.id.toString().padStart(5, '0')}</p>
              <p className="text-xs text-slate-400 print:text-slate-500">{result.session.title}</p>
            </div>
          </div>
        </div>

        {/* Identity & Session Info */}
        <div className="mt-8 grid grid-cols-2 gap-8">
          <div>
            <h2 className="text-xs uppercase tracking-widest text-slate-400 print:text-slate-600">Participant Details</h2>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex"><span className="w-1/3 text-slate-500 print:text-slate-600">Name</span><span className="font-medium text-slate-950 print:text-black">{result.participant.fullName}</span></div>
              <div className="flex"><span className="w-1/3 text-slate-500 print:text-slate-600">Email</span><span className="font-medium text-slate-950 print:text-black">{result.participant.email}</span></div>
              <div className="flex"><span className="w-1/3 text-slate-500 print:text-slate-600">Employee ID</span><span className="font-medium text-slate-950 print:text-black">{result.participant.employeeCode || '-'}</span></div>
              <div className="flex"><span className="w-1/3 text-slate-500 print:text-slate-600">Department</span><span className="font-medium text-slate-950 print:text-black">{result.participant.department || '-'}</span></div>
              <div className="flex"><span className="w-1/3 text-slate-500 print:text-slate-600">Position</span><span className="font-medium text-slate-950 print:text-black">{result.participant.positionTitle || '-'}</span></div>
            </div>
          </div>
          <div>
            <h2 className="text-xs uppercase tracking-widest text-slate-400 print:text-slate-600">Assessment Details</h2>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex"><span className="w-2/5 text-slate-500 print:text-slate-600">Assessment</span><span className="font-medium text-slate-950 print:text-black">{result.session.title}</span></div>
              <div className="flex"><span className="w-2/5 text-slate-500 print:text-slate-600">Test Type</span><span className="font-medium text-slate-950 print:text-black">{formatTestTypeLabel(result.testType)}</span></div>
              <div className="flex"><span className="w-2/5 text-slate-500 print:text-slate-600">Completed</span><span className="font-medium text-slate-950 print:text-black">{formatDateTime(result.submittedAt)}</span></div>
              <div className="flex"><span className="w-2/5 text-slate-500 print:text-slate-600">Released</span><span className="font-medium text-slate-950 print:text-black">{result.releasedAt ? formatDateTime(result.releasedAt) : '-'}</span></div>
              <div className="flex items-center gap-2"><span className="w-2/5 text-slate-500 print:text-slate-600">Status</span><Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">Released</Badge></div>
            </div>
          </div>
        </div>

        {/* Primary Result Headline */}
        <div className="mt-12 rounded-2xl bg-slate-50 print:bg-slate-100 p-8 sm:rounded-3xl">
          <h2 className="text-xs uppercase tracking-widest text-slate-400 print:text-slate-600">Core Interpretation</h2>
          <div className="mt-6">
            <p className="text-sm text-slate-500 print:text-slate-600">Primary Result</p>
            <p className="mt-2 text-2xl font-medium text-slate-950 print:text-black">
              {formatResultHeadline({
                testType: result.testType,
                primaryType: result.primaryType,
                secondaryType: result.secondaryType,
                profileCode: result.profileCode,
                scoreBand: result.scoreBand,
                scoreTotal: result.scoreTotal,
              })}
            </p>
            <p className="mt-4 text-base leading-relaxed text-slate-700 print:text-slate-800">
              {formatResultSummary({
                testType: result.testType,
                primaryType: result.primaryType,
                secondaryType: result.secondaryType,
                scoreBand: result.scoreBand,
              })}
            </p>
          </div>
        </div>

        {/* Dimension Visualization */}
        <div className="mt-12">
          <DimensionVisualization testType={result.testType} resultPayload={result.resultPayload} />
        </div>

        {/* Summaries from result_summaries table */}
        {result.summaries.length > 0 && (
          <div className="mt-12">
            <h2 className="border-b border-slate-200 pb-2 text-xs uppercase tracking-widest text-slate-400 print:text-slate-600">Dimension Summary</h2>
            <div className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-3">
              {result.summaries.map((summary) => (
                <div key={summary.metricKey} className="rounded-xl border border-slate-100 p-5">
                  <p className="text-sm text-slate-500 print:text-slate-600">{summary.metricLabel}</p>
                  <p className="mt-2 text-2xl font-light text-slate-900 print:text-black">{summary.score}</p>
                  {summary.band && (
                    <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-700 print:text-slate-800">
                      {formatTokenLabel(summary.band)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Professional Summary */}
        {(result.professionalSummary || result.recommendation || result.limitations) && (
          <div className="mt-12 page-break-inside-avoid">
            <h2 className="border-b border-slate-200 pb-2 text-xs uppercase tracking-widest text-slate-400 print:text-slate-600">Professional Review</h2>
            
            <div className="mt-6 space-y-8">
              {result.professionalSummary && (
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-900 print:text-black">Psychologist Summary</h3>
                  <p className="mt-3 whitespace-pre-wrap text-[15px] leading-7 text-slate-700 print:text-slate-800">{result.professionalSummary}</p>
                </div>
              )}
              
              {result.recommendation && (
                <div className="rounded-xl bg-indigo-50/50 print:bg-slate-100 p-6">
                  <h3 className="text-sm font-semibold uppercase tracking-widest text-indigo-900 print:text-black">Recommendations</h3>
                  <p className="mt-3 whitespace-pre-wrap text-[15px] leading-7 text-indigo-950/80 print:text-slate-800">{result.recommendation}</p>
                </div>
              )}

              {result.limitations && (
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-900 print:text-black">Limitations & Constraints</h3>
                  <p className="mt-3 whitespace-pre-wrap text-[15px] leading-7 text-slate-600 print:text-slate-700 italic">{result.limitations}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Reviewer Attribution */}
        <div className="mt-12 rounded-lg bg-slate-100 print:bg-slate-50 p-4">
          <p className="text-sm text-slate-600 print:text-slate-700">
            This report was professionally reviewed and released on {result.releasedAt ? formatDateTime(result.releasedAt) : 'N/A'}.
            It is confidential and intended only for authorized recipients per the distribution policy.
          </p>
        </div>

        {/* Footer */}
        <div className="mt-24 border-t border-slate-200 pt-8 text-center print:mt-16 text-sm text-slate-400 print:text-slate-600">
          <p>Generated by Vanaila Psikotest</p>
          <p className="mt-1">For professional use only. This report is machine-generated and professionally reviewed.</p>
        </div>

      </div>

      {/* Print CSS */}
      <style>{`
        @media print {
          body { background: white !important; }
          nav, .no-print, button:not(.print-visible) { display: none !important; }
          .page-break-inside-avoid { page-break-inside: avoid; }
          .page-break-before { page-break-before: always; }
          @page { 
            size: A4; 
            margin: 20mm; 
          }
        }
      `}</style>
    </div>
  );
}