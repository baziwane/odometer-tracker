'use client';

import { Box } from '@mantine/core';
import { Header } from './Header';
import { BottomNav } from './BottomNav';

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
}

export function AppShell({ children, title }: AppShellProps) {
  return (
    <Box
      style={{
        minHeight: '100vh',
        paddingTop: 60,
        paddingBottom: 90,
      }}
    >
      <Header title={title} />
      <Box p="md">{children}</Box>
      <BottomNav />
    </Box>
  );
}
