import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MANAGEMENT_PLACEHOLDER_DISCLAIMER } from '@/lib/workflows/management/constants';
import type { ManagementShellPlaceholderContent } from '@/lib/workflows/management/types';

type ManagementShellPlaceholderProps = {
  content: ManagementShellPlaceholderContent;
};

export function ManagementShellPlaceholder({
  content,
}: ManagementShellPlaceholderProps) {
  return (
    <Card className="border-dashed bg-muted/20">
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">Shell oficial</Badge>
          <Badge variant="outline">Em construcao incremental</Badge>
        </div>
        <div className="space-y-1">
          <CardTitle className="font-headline text-xl">{content.title}</CardTitle>
          <CardDescription className="max-w-2xl font-body text-sm">
            {content.description}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">{content.nextStepLabel}</p>
        <p>{MANAGEMENT_PLACEHOLDER_DISCLAIMER}</p>
      </CardContent>
    </Card>
  );
}
