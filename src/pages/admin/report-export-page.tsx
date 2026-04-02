import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Printer } from 'lucide-react';

import { StateCard } from '@/components/common/state-card';
import { fetchResultDetail } from '@/services/admin-data';
import type { StoredResultDetailRecord } from '@/types/assessment';
import { formatDateTime, formatResultHeadline, formatResultSummary, formatTestTypeLabel, formatTokenLabel } from '@/lib/formatters';

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
            // Optionally auto-print once loaded
            // setTimeout(() => window.print(), 500); 
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

  // Enforce state logic: only released results can be printed.
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
      <div className="fixed top-6 right-6 z-50 rounded-full bg-white shadow-lg ring-1 ring-slate-900/5 print:hidden">
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
              <h1 className="text-3xl font-light tracking-tight text-slate-950">
                Psychometric Report
              </h1>
              <p className="mt-2 text-sm text-slate-500 uppercase tracking-widest">
                Confidential Document
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-slate-950">Psychometric Analytics</p>
              <p className="text-sm text-slate-500">Ref: #{result.id.toString().padStart(5, '0')} - {result.session.title}</p>
            </div>
          </div>
        </div>

        {/* Identity & Session Info */}
        <div className="mt-8 grid grid-cols-2 gap-8">
          <div>
            <h2 className="text-xs uppercase tracking-widest text-slate-400">Participant Details</h2>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex"><span className="w-1/3 text-slate-500">Name</span><span className="font-medium text-slate-950">{result.participant.fullName}</span></div>
              <div className="flex"><span className="w-1/3 text-slate-500">Email</span><span className="font-medium text-slate-950">{result.participant.email}</span></div>
              <div className="flex"><span className="w-1/3 text-slate-500">Employee code</span><span className="font-medium text-slate-950">{result.participant.employeeCode || '-'}</span></div>
              <div className="flex"><span className="w-1/3 text-slate-500">Department</span><span className="font-medium text-slate-950">{result.participant.department || '-'}</span></div>
            </div>
          </div>
          <div>
            <h2 className="text-xs uppercase tracking-widest text-slate-400">Assessment Info</h2>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex"><span className="w-2/5 text-slate-500">Test Type</span><span className="font-medium text-slate-950">{formatTestTypeLabel(result.testType)}</span></div>
              <div className="flex"><span className="w-2/5 text-slate-500">Completed On</span><span className="font-medium text-slate-950">{formatDateTime(result.submittedAt)}</span></div>
              <div className="flex"><span className="w-2/5 text-slate-500">Released On</span><span className="font-medium text-slate-950">{result.releasedAt ? formatDateTime(result.releasedAt) : '-'}</span></div>
            </div>
          </div>
        </div>

        {/* Primary Result Headline */}
        <div className="mt-12 rounded-2xl bg-slate-50 p-8 sm:rounded-3xl">
          <h2 className="text-xs uppercase tracking-widest text-slate-400">Core Interpretation</h2>
          <div className="mt-6">
            <p className="text-sm text-slate-500">Primary Result Summary</p>
            <p className="mt-2 text-2xl font-medium text-slate-950">
              {formatResultHeadline({
                testType: result.testType,
                primaryType: result.primaryType,
                secondaryType: result.secondaryType,
                profileCode: result.profileCode,
                scoreBand: result.scoreBand,
                scoreTotal: result.scoreTotal,
              })}
            </p>
            <p className="mt-4 text-base leading-relaxed text-slate-700">
              {formatResultSummary({
                testType: result.testType,
                primaryType: result.primaryType,
                secondaryType: result.secondaryType,
                scoreBand: result.scoreBand,
              })}
            </p>
          </div>
        </div>

        {/* Dimensions/Metrics */}
        {result.summaries.length > 0 && (
          <div className="mt-12">
            <h2 className="border-b border-slate-200 pb-2 text-xs uppercase tracking-widest text-slate-400">Specific Dimensions & Scales</h2>
            <div className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-3">
              {result.summaries.map((summary) => (
                <div key={summary.metricKey} className="rounded-xl border border-slate-100 p-5">
                  <p className="text-sm text-slate-500">{summary.metricLabel}</p>
                  <p className="mt-2 text-2xl font-light text-slate-900">{summary.score}</p>
                  {summary.band && (
                    <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-700">
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
            <h2 className="border-b border-slate-200 pb-2 text-xs uppercase tracking-widest text-slate-400">Professional Review</h2>
            
            <div className="mt-6 space-y-8">
              {result.professionalSummary && (
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-900">Psychologist Summary</h3>
                  <p className="mt-3 whitespace-pre-wrap text-[15px] leading-7 text-slate-700">{result.professionalSummary}</p>
                </div>
              )}
              
              {result.recommendation && (
                <div className="rounded-xl bg-indigo-50/50 p-6">
                  <h3 className="text-sm font-semibold uppercase tracking-widest text-indigo-900">Recommendations</h3>
                  <p className="mt-3 whitespace-pre-wrap text-[15px] leading-7 text-indigo-950/80">{result.recommendation}</p>
                </div>
              )}

              {result.limitations && (
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-900">Limitations & Constraints</h3>
                  <p className="mt-3 whitespace-pre-wrap text-[15px] leading-7 text-slate-600 italic">
                    {result.limitations}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-24 border-t border-slate-200 pt-8 text-center print:mt-16 text-sm text-slate-400">
          <p>This report is confidentially prepared for the requesting organization.</p>
          <p className="mt-1">Generated by Psikotest Platform at {new Date().toISOString()}</p>
        </div>

      </div>
    </div>
  );
}
