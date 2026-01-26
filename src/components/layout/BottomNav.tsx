'use client';

import { Group, UnstyledButton, Stack, Text, Box } from '@mantine/core';
import {
  IconHome,
  IconPlus,
  IconCar,
  IconHistory,
} from '@tabler/icons-react';
import { usePathname, useRouter } from 'next/navigation';

const navItems = [
  { icon: IconHome, label: 'Home', href: '/' },
  { icon: IconCar, label: 'Cars', href: '/cars' },
  { icon: IconPlus, label: 'Add', href: '/add-reading', primary: true },
  { icon: IconHistory, label: 'History', href: '/history' },
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <Box
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 70,
        backgroundColor: 'var(--mantine-color-body)',
        borderTop: '1px solid var(--mantine-color-default-border)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        zIndex: 100,
      }}
    >
      <Group h={70} justify="space-around" px="md">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          if (item.primary) {
            return (
              <UnstyledButton
                key={item.href}
                onClick={() => router.push(item.href)}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  backgroundColor: 'var(--mantine-color-brand-6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: -20,
                  boxShadow: '0 4px 12px rgba(26, 122, 255, 0.4)',
                }}
              >
                <Icon size={28} color="white" stroke={2} />
              </UnstyledButton>
            );
          }

          return (
            <UnstyledButton
              key={item.href}
              onClick={() => router.push(item.href)}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
              }}
            >
              <Stack gap={4} align="center">
                <Icon
                  size={24}
                  stroke={1.5}
                  color={
                    isActive
                      ? 'var(--mantine-color-brand-6)'
                      : 'var(--mantine-color-dimmed)'
                  }
                />
                <Text
                  size="xs"
                  fw={isActive ? 600 : 400}
                  c={isActive ? 'brand.6' : 'dimmed'}
                >
                  {item.label}
                </Text>
              </Stack>
            </UnstyledButton>
          );
        })}
      </Group>
    </Box>
  );
}
