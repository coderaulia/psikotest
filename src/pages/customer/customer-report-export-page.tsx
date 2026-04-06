import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StateCard } from '@/components/common/state-card';
import { formatDateTime, formatTestTypeLabel, formatTokenLabel } from '@/lib/formatters';
import { getCustomerWorkspaceResultDetail } from '@/services/customer-results';
import type { CustomerWorkspaceResultDetail } from '@/types/assessment';

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

function IQDimensionBars({ resultPayload }: { resultPayload: Record<string, unknown> | null }) {
  const iqResult = resultPayload?.iqResult as Record<string, unknown> | undefined;
  if (!iqResult) return null;
  
  const dimensions = iqResult.dimensions as Record<string, { correct: number; total: number; percentage: number }> | undefined;
  if (!dimensions) return null;

  const dimLabels: Record<string, string> = {
    pattern: 'Pattern Recognition',
    numerical: 'Numerical Reasoning',
    verbal: 'Verbal Reasoning',
    spatial: 'Spatial Reasoning',
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xs uppercase tracking-widest text-slate-400 print:text-black">Dimension Scores</h3>
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

function DISCDimensionBars({ resultPayload }: { resultPayload: Record<string, unknown> | null }) {
  const discResult = resultPayload?.discResult as Record<string, unknown> | undefined;
  if (!discResult) return null;
  
  const scores = discResult.scores as Record<string, number> | undefined;
  if (!scores) return null;

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
      <h3 className="text-xs uppercase tracking-widest text-slate-400 print:text-black">Profile Distribution</h3>
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

function WorkloadDimensionBars({ resultPayload }: { resultPayload: Record<string, unknown> | null }) {
  const workloadResult = resultPayload?.workloadResult as Record<string, unknown> | undefined;
  if (!workloadResult) return null;
  
  const dimensions = workloadResult.dimensions as Record<string, number> | undefined;
  if (!dimensions) return null;

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
      <h3 className="text-xs uppercase tracking-widest text-slate-400 print:text-black">Workload Dimensions</h3>
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
      {Array.isArray(workloadResult.elevatedDimensions) && workloadResult.elevatedDimensions.length > 0 && (
        <div className="mt-4 rounded-lg bg-amber-50 print:bg-slate-100 p-4 text-sm">
          <p className="font-medium text-amber-800 print:text-black">Elevated Dimensions</p>
          <p className="mt-1 text-amber-700 print:text-slate-600">{workloadResult.elevatedDimensions.join(', ')}</p>
        </div>
      )}
    </div>
  );
}

export function CustomerReportExportPage() {
  const { resultId } = useParams<{ resultId: string }>();
  const [data, setData] = useState<CustomerWorkspaceResultDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const numericId = Number(resultId ?? 0);
    if (!Number.isFinite(numericId) || numericId <= 0) {
      setError('Invalid result identifier');
      setIsLoading(false);
      return;
    }

    let mounted = true;
    getCustomerWorkspaceResultDetail(numericId)
      .then((payload) => {
        if (mounted) {
          if (payload.reviewStatus !== 'released') {
            setError('This result has not been released yet. Full report will be available after professional review.');
          } else {
            setData(payload);
          }
        }
      })
      .catch((err) => {
        if (mounted) setError(err instanceof Error ? err.message : 'Unable to load result');
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => { mounted = false; };
  }, [resultId]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <StateCard title="Preparing report" description="Loading your results..." />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8 print:hidden">
        <StateCard 
          title="Unable to view report" 
          description={error || 'Result not found or not available'} 
        />
        <Button variant="outline" asChild className="ml-4">
          <Link to="/workspace/results"><ArrowLeft className="mr-2 h-4 w-4" /> Back to results</Link>
        </Button>
      </div>
    );
  }

  const testType = data.testType.toLowerCase();

  return (
    <div className="min-h-screen bg-slate-50 print:bg-white p-4 sm:p-8">
      {/* Print action bar - hidden on print */}
      <div className="fixed top-6 right-6 z-50 flex items-center gap-3 rounded-full bg-white shadow-lg ring-1 ring-slate-900/5 print:hidden">
        <Button variant="ghost" asChild className="rounded-l-full rounded-r-none">
          <Link to={`/workspace/results/${resultId}`}><ArrowLeft className="h-4 w-4" /></Link>
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
                Assessment Report
              </h1>
              <p className="mt-2 text-sm text-slate-500 uppercase tracking-widest print:text-slate-600">
                Confidential — For Authorized Review Only
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-slate-950 print:text-black">{data.assessmentTitle}</p>
              <p className="text-sm text-slate-500 print:text-slate-600">Generated: {formatDateTime(new Date().toISOString())}</p>
            </div>
          </div>
        </div>

        {/* Participant & Assessment Info */}
        <div className="mt-8 grid grid-cols-2 gap-8">
          <div>
            <h2 className="text-xs uppercase tracking-widest text-slate-400 print:text-slate-600">Participant</h2>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex">
                <span className="w-1/3 text-slate-500 print:text-slate-600">Name</span>
                <span className="font-medium text-slate-950 print:text-black">{data.participantName}</span>
              </div>
              <div className="flex">
                <span className="w-1/3 text-slate-500 print:text-slate-600">Email</span>
                <span className="font-medium text-slate-950 print:text-black">{data.participantEmail}</span>
              </div>
            </div>
          </div>
          <div>
            <h2 className="text-xs uppercase tracking-widest text-slate-400 print:text-slate-600">Assessment</h2>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex">
                <span className="w-2/5 text-slate-500 print:text-slate-600">Type</span>
                <span className="font-medium text-slate-950 print:text-black">{formatTestTypeLabel(data.testType)}</span>
              </div>
              <div className="flex">
                <span className="w-2/5 text-slate-500 print:text-slate-600">Completed</span>
                <span className="font-medium text-slate-950 print:text-black">{formatDateTime(data.submittedAt)}</span>
              </div>
              <div className="flex">
                <span className="w-2/5 text-slate-500 print:text-slate-600">Release Status</span>
                <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">{formatTokenLabel(data.reviewStatus)}</Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Score Summary */}
        <div className="mt-12 rounded-2xl bg-slate-50 print:bg-slate-100 p-8 sm:rounded-3xl">
          <h2 className="text-xs uppercase tracking-widest text-slate-400 print:text-slate-600">Score Summary</h2>
          <div className="mt-6 flex items-center gap-6">
            <div className="flex-1">
              <p className="text-sm text-slate-500 print:text-slate-600">Primary Result</p>
              <p className="mt-2 text-2xl font-medium text-slate-950 print:text-black">
                {data.scoreBand ? formatTokenLabel(data.scoreBand) : data.profileCode || 'Completed'}
              </p>
              {data.scoreTotal !== null && data.scoreTotal !== undefined && (
                <p className="mt-1 text-sm text-slate-500 print:text-slate-600">Score: {data.scoreTotal}</p>
              )}
            </div>
          </div>
        </div>

        {/* Dimension Visualization */}
        <div className="mt-12">
          {testType === 'iq' && <IQDimensionBars resultPayload={data.metrics as unknown as Record<string, unknown>} />}
          {testType === 'disc' && <DISCDimensionBars resultPayload={data.metrics as unknown as Record<string, unknown>} />}
          {testType === 'workload' && <WorkloadDimensionBars resultPayload={data.metrics as unknown as Record<string, unknown>} />}
        </div>

        {/* Professional Summary (Customer-visible) */}
        {(data.releasedSummary || data.releasedRecommendation || data.releasedLimitations) && (
          <div className="mt-12 page-break-inside-avoid">
            <h2 className="border-b border-slate-200 pb-2 text-xs uppercase tracking-widest text-slate-400 print:text-slate-600">Professional Summary</h2>
            <div className="mt-6 space-y-8">
              {data.releasedSummary && (
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-900 print:text-black">Interpretation</h3>
                  <p className="mt-3 whitespace-pre-wrap text-[15px] leading-7 text-slate-700 print:text-slate-800">{data.releasedSummary}</p>
                </div>
              )}
              {data.releasedRecommendation && (
                <div className="rounded-xl bg-indigo-50/50 print:bg-slate-100 p-6">
                  <h3 className="text-sm font-semibold uppercase tracking-widest text-indigo-900 print:text-black">Recommendations</h3>
                  <p className="mt-3 whitespace-pre-wrap text-[15px] leading-7 text-indigo-950/80 print:text-slate-700">{data.releasedRecommendation}</p>
                </div>
              )}
              {data.releasedLimitations && (
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-900 print:text-black">Considerations</h3>
                  <p className="mt-3 whitespace-pre-wrap text-[15px] leading-7 text-slate-600 print:text-slate-700 italic">{data.releasedLimitations}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-24 border-t border-slate-200 pt-8 text-center print:mt-16 text-sm text-slate-400 print:text-slate-600">
          <p>Generated by Psikotest Platform</p>
          <p className="mt-1">This report is confidential and intended for the participant and authorized reviewers only.</p>
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