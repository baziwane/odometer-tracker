'use client';

import { Group, Title, ActionIcon, useMantineColorScheme } from '@mantine/core';
import { IconSun, IconMoon } from '@tabler/icons-react';

interface HeaderProps {
  title?: string;
}

export function Header({ title = 'Odometer Tracker' }: HeaderProps) {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();

  return (
    <Group
      h={60}
      px="md"
      justify="space-between"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: 'var(--mantine-color-body)',
        borderBottom: '1px solid var(--mantine-color-default-border)',
        zIndex: 100,
      }}
    >
      <Title order={3} fw={700}>
        {title}
      </Title>
      <ActionIcon
        variant="subtle"
        size="lg"
        onClick={toggleColorScheme}
        aria-label="Toggle color scheme"
      >
        {colorScheme === 'dark' ? (
          <IconSun size={20} stroke={1.5} />
        ) : (
          <IconMoon size={20} stroke={1.5} />
        )}
      </ActionIcon>
    </Group>
  );
}
