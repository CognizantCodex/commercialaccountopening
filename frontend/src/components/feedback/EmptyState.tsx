import { FileSearch } from 'lucide-react';
import { Card } from '@/components/ui/Card';

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Card className="flex min-h-[240px] flex-col items-center justify-center text-center">
      <FileSearch className="h-10 w-10 text-[var(--muted-foreground)]" />
      <h3 className="mt-4 text-lg font-semibold text-[var(--foreground)]">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-[var(--muted-foreground)]">
        {description}
      </p>
    </Card>
  );
}
