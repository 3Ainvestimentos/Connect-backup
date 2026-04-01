'use client';

import * as React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

type ManagementPanelSkeletonProps = {
  rows?: number;
};

type ManagementErrorStateProps = {
  title?: string;
  message: string;
  onRetry?: () => void;
};

type ManagementEmptyStateProps = {
  title: string;
  description: string;
};

type ManagementAsyncStateProps = {
  isLoading: boolean;
  errorMessage?: string;
  errorTitle?: string;
  isEmpty: boolean;
  emptyTitle: string;
  emptyDescription: string;
  onRetry?: () => void;
  loadingContent?: React.ReactNode;
  children: React.ReactNode;
};

export function ManagementPanelSkeleton({
  rows = 3,
}: ManagementPanelSkeletonProps) {
  return (
    <div className="space-y-3" data-testid="management-panel-skeleton">
      {Array.from({ length: rows }).map((_, index) => (
        <Card key={index} className="border-border/60">
          <CardContent className="space-y-3 p-4">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function ManagementErrorState({
  title = 'Nao foi possivel carregar esta visao',
  message,
  onRetry,
}: ManagementErrorStateProps) {
  return (
    <Alert variant="destructive">
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="space-y-3">
        <p>{message}</p>
        {onRetry ? (
          <Button type="button" size="sm" variant="outline" onClick={onRetry}>
            Tentar novamente
          </Button>
        ) : null}
      </AlertDescription>
    </Alert>
  );
}

export function ManagementEmptyState({
  title,
  description,
}: ManagementEmptyStateProps) {
  return (
    <div className="rounded-lg border border-dashed bg-muted/20 p-6 text-sm">
      <p className="font-medium text-foreground">{title}</p>
      <p className="mt-1 text-muted-foreground">{description}</p>
    </div>
  );
}

export function ManagementAsyncState({
  isLoading,
  errorMessage,
  errorTitle,
  isEmpty,
  emptyTitle,
  emptyDescription,
  onRetry,
  loadingContent,
  children,
}: ManagementAsyncStateProps) {
  if (isLoading) {
    return <>{loadingContent ?? <ManagementPanelSkeleton />}</>;
  }

  if (errorMessage) {
    return (
      <ManagementErrorState
        title={errorTitle}
        message={errorMessage}
        onRetry={onRetry}
      />
    );
  }

  if (isEmpty) {
    return (
      <ManagementEmptyState
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  return <>{children}</>;
}
