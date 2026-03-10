import { Link, useParams } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { discPreviewQuestions } from '@/data/mock';

export function ParticipantTestPage() {
  const { token = 'disc-batch-a' } = useParams();

  return (
    <div className="space-y-6">
      <Card className="bg-white/82">
        <CardHeader>
          <CardTitle>DISC Assessment</CardTitle>
          <CardDescription>Question 1 of 24 • Estimated duration 15 minutes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Progress value={12} />
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>12% complete</span>
            <span>14:32 remaining</span>
          </div>
        </CardContent>
      </Card>
      {discPreviewQuestions.map((question, index) => (
        <Card key={question.code} className="bg-white/82">
          <CardHeader>
            <CardTitle>Question {index + 1}</CardTitle>
            <CardDescription>{question.instruction}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {question.options.map((option, optionIndex) => (
              <button
                key={option}
                type="button"
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-4 text-left text-sm text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
              >
                <span>{option}</span>
                <span className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
                  {String.fromCharCode(65 + optionIndex)}
                </span>
              </button>
            ))}
          </CardContent>
        </Card>
      ))}
      <div className="sticky bottom-4 flex justify-end">
        <Button size="lg" className="shadow-panel" asChild>
          <Link to={`/t/${token}/completed`}>Submit responses</Link>
        </Button>
      </div>
    </div>
  );
}
