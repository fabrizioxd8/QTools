import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center">
      <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
      <h1 className="text-4xl font-bold mb-2">404 - Page Not Found</h1>
      <p className="text-muted-foreground mb-6">
        Sorry, the page you are looking for does not exist.
      </p>
      <Button asChild>
        <Link to="/dashboard">Go Back to Dashboard</Link>
      </Button>
    </div>
  );
}