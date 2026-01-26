'use client';

import { Stack, Title } from '@mantine/core';
import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { ReadingList } from '@/components/readings/ReadingList';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { LoadingState } from '@/components/ui/LoadingState';
import { useAppState } from '@/hooks/useAppState';

export default function HistoryPage() {
  const { cars, readings, deleteReading, isLoading } = useAppState();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const readingToDelete = deleteId
    ? readings.find((r) => r.id === deleteId)
    : null;

  if (isLoading) {
    return (
      <AppShell title="History">
        <LoadingState />
      </AppShell>
    );
  }

  return (
    <AppShell title="History">
      <Stack gap="lg">
        <Title order={3}>Reading History</Title>

        <ReadingList
          readings={readings}
          cars={cars}
          onDelete={(id) => setDeleteId(id)}
        />

        <ConfirmModal
          opened={!!deleteId}
          onClose={() => setDeleteId(null)}
          onConfirm={() => {
            if (deleteId) {
              deleteReading(deleteId);
              setDeleteId(null);
            }
          }}
          title="Delete Reading"
          message="Are you sure you want to delete this reading? This cannot be undone."
          confirmLabel="Delete"
          confirmColor="red"
        />
      </Stack>
    </AppShell>
  );
}
