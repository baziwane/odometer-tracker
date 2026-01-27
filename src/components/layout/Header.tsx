'use client';

import { Group, Title, ActionIcon, useMantineColorScheme, Button, Menu, Avatar } from '@mantine/core';
import { IconSun, IconMoon, IconLogout, IconSettings, IconDatabaseImport } from '@tabler/icons-react';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { LoginModal } from '@/components/auth/LoginModal';
import { SignUpModal } from '@/components/auth/SignUpModal';
import { MigrationModal } from '@/components/auth/MigrationModal';
import { useAppState } from '@/hooks/useAppState';

interface HeaderProps {
  title?: string;
}

export function Header({ title = 'Odometer Tracker' }: HeaderProps) {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const { user, signOut } = useAuth();
  const [loginOpened, setLoginOpened] = useState(false);
  const [signUpOpened, setSignUpOpened] = useState(false);
  const [migrationOpened, setMigrationOpened] = useState(false);

  const handleSignOut = async () => {
    await signOut();
  };

  const handleMigrationComplete = () => {
    // Reload the page to fetch fresh data
    window.location.reload();
  };

  return (
    <>
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

        <Group gap="xs">
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

          {user ? (
            <Menu position="bottom-end" shadow="md" width={200}>
              <Menu.Target>
                <ActionIcon variant="subtle" size="lg" radius="xl">
                  <Avatar size="sm" radius="xl" color="blue">
                    {user.email?.[0].toUpperCase()}
                  </Avatar>
                </ActionIcon>
              </Menu.Target>

              <Menu.Dropdown>
                <Menu.Label>{user.email}</Menu.Label>
                <Menu.Item
                  leftSection={<IconSettings size={16} />}
                  component="a"
                  href="/settings"
                >
                  Settings
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconDatabaseImport size={16} />}
                  onClick={() => setMigrationOpened(true)}
                >
                  Migrate Data
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item
                  leftSection={<IconLogout size={16} />}
                  onClick={handleSignOut}
                  color="red"
                >
                  Sign Out
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          ) : (
            <Button size="xs" onClick={() => setLoginOpened(true)}>
              Sign In
            </Button>
          )}
        </Group>
      </Group>

      <LoginModal
        opened={loginOpened}
        onClose={() => setLoginOpened(false)}
        onSwitchToSignUp={() => {
          setLoginOpened(false);
          setSignUpOpened(true);
        }}
      />

      <SignUpModal
        opened={signUpOpened}
        onClose={() => setSignUpOpened(false)}
        onSwitchToLogin={() => {
          setSignUpOpened(false);
          setLoginOpened(true);
        }}
      />

      <MigrationModal
        opened={migrationOpened}
        onClose={() => setMigrationOpened(false)}
        onImportComplete={handleMigrationComplete}
      />
    </>
  );
}
