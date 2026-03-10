import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function ParticipantCompletedPage() {
  return (
    <Card className="mx-auto w-full max-w-3xl bg-white/82 text-center">
      <CardHeader>
        <CardTitle>Assessment completed</CardTitle>
        <CardDescription>Your responses have been submitted successfully.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-6 text-sm leading-7 text-slate-500">
          Thank you for completing the assessment. The administrator can now review your responses and results inside the reporting dashboard.
        </div>
        <Button variant="secondary" asChild>
          <Link to="/">Return to home</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
