import { Link, useParams } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export function ParticipantIdentityPage() {
  const { token = 'disc-batch-a' } = useParams();

  return (
    <Card className="mx-auto w-full max-w-3xl bg-white/82">
      <CardHeader>
        <CardTitle>Participant identity</CardTitle>
        <CardDescription>
          Fill in your basic information before starting the assessment session.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600">Full name</label>
            <Input placeholder="Full name" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600">Email</label>
            <Input type="email" placeholder="name@company.com" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600">Employee ID</label>
            <Input placeholder="Optional code" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600">Department</label>
            <Input placeholder="Department" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-slate-600">Position</label>
            <Input placeholder="Current position" />
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary">Save draft</Button>
          <Button asChild>
            <Link to={`/t/${token}/instructions`}>Continue</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
