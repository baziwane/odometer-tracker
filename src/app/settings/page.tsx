'use client';

import { useState } from 'react';
import { Container, Paper, Title, Stack, Select, Button, Group } from '@mantine/core';
import { AppShell } from '@/components/layout/AppShell';
import { useAppState } from '@/hooks/useAppState';
import { useAuth } from '@/contexts/AuthContext';
import { notifications } from '@mantine/notifications';

export default function SettingsPage() {
  const { settings, cars, updateSettings, isLoading } = useAppState();
  const { signOut } = useAuth();
  const [isSaving, setIsSaving] = useState(false);

  const handleThemeChange = async (value: string | null) => {
    if (!value) return;

    try {
      setIsSaving(true);
      await updateSettings({ theme: value as 'light' | 'dark' | 'auto' });
      notifications.show({
        title: 'Success',
        message: 'Theme updated',
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to update theme',
        color: 'red',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDistanceUnitChange = async (value: string | null) => {
    if (!value) return;

    try {
      setIsSaving(true);
      await updateSettings({ distanceUnit: value as 'miles' | 'kilometers' });
      notifications.show({
        title: 'Success',
        message: 'Distance unit updated',
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to update distance unit',
        color: 'red',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDefaultCarChange = async (value: string | null) => {
    try {
      setIsSaving(true);
      await updateSettings({ defaultCarId: value });
      notifications.show({
        title: 'Success',
        message: 'Default car updated',
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to update default car',
        color: 'red',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const carOptions = [
    { value: '', label: 'None' },
    ...cars.map((car) => ({
      value: car.id,
      label: car.name,
    })),
  ];

  return (
    <AppShell>
      <Container size="sm" py="xl">
        <Title order={2} mb="xl">
          Settings
        </Title>

        <Stack gap="md">
          <Paper p="md" withBorder>
            <Stack gap="md">
              <Select
                label="Theme"
                description="Choose your preferred color scheme"
                value={settings.theme}
                onChange={handleThemeChange}
                disabled={isLoading || isSaving}
                data={[
                  { value: 'auto', label: 'Auto (System)' },
                  { value: 'light', label: 'Light' },
                  { value: 'dark', label: 'Dark' },
                ]}
              />

              <Select
                label="Distance Unit"
                description="Choose your preferred unit of measurement"
                value={settings.distanceUnit}
                onChange={handleDistanceUnitChange}
                disabled={isLoading || isSaving}
                data={[
                  { value: 'miles', label: 'Miles' },
                  { value: 'kilometers', label: 'Kilometers' },
                ]}
              />

              <Select
                label="Default Car"
                description="Car to select by default when adding readings"
                value={settings.defaultCarId || ''}
                onChange={handleDefaultCarChange}
                disabled={isLoading || isSaving}
                data={carOptions}
              />
            </Stack>
          </Paper>

          <Paper p="md" withBorder>
            <Stack gap="md">
              <Title order={4}>Account</Title>
              <Group>
                <Button color="red" onClick={handleSignOut}>
                  Sign Out
                </Button>
              </Group>
            </Stack>
          </Paper>
        </Stack>
      </Container>
    </AppShell>
  );
}
