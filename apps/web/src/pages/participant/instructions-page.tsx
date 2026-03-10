import { Link, useParams } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const instructions = [
  'Read each item carefully before choosing your response.',
  'For DISC, choose the statement that is most and least like you.',
  'Complete the assessment in one sitting if possible.',
  'Your answers are stored securely for reporting and review.',
];

export function ParticipantInstructionsPage() {
  const { token = 'disc-batch-a' } = useParams();

  return (
    <Card className="mx-auto w-full max-w-3xl bg-white/82">
      <CardHeader>
        <CardTitle>Instructions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-5 text-sm leading-7 text-slate-600">
          {instructions.map((instruction) => (
            <p key={instruction}>{instruction}</p>
          ))}
        </div>
        <div className="flex justify-end">
          <Button asChild>
            <Link to={`/t/${token}/test`}>Start test</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
