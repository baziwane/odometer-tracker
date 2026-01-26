'use client';

import { Paper, Title, Text, Stack, SegmentedControl, Group } from '@mantine/core';
import { LineChart } from '@mantine/charts';
import { useState } from 'react';
import type { MonthlyMileage } from '@/types';
import { fillMonthlyMileageGaps } from '@/lib/calculations';

interface MileageChartProps {
  data: MonthlyMileage[];
  carColor?: string;
}

export function MileageChart({ data, carColor = 'blue.6' }: MileageChartProps) {
  const [view, setView] = useState<'6' | '12'>('6');

  const filledData = fillMonthlyMileageGaps(data, parseInt(view) as 6 | 12);
  const displayData = filledData.map((item) => ({
    month: item.monthLabel.split(' ')[0],
    mileage: item.mileage,
  }));

  if (data.length === 0) {
    return (
      <Paper p="md" radius="md" withBorder>
        <Stack gap="md" align="center" py="xl">
          <Text c="dimmed" size="sm">
            No mileage data yet
          </Text>
          <Text c="dimmed" size="xs">
            Add your first reading to see the chart
          </Text>
        </Stack>
      </Paper>
    );
  }

  return (
    <Paper p="md" radius="md" withBorder>
      <Stack gap="md">
        <Group justify="space-between">
          <Title order={4}>Monthly Mileage</Title>
          <SegmentedControl
            size="xs"
            value={view}
            onChange={(v) => setView(v as '6' | '12')}
            data={[
              { label: '6 mo', value: '6' },
              { label: '12 mo', value: '12' },
            ]}
          />
        </Group>

        <LineChart
          h={200}
          data={displayData}
          dataKey="month"
          series={[{ name: 'mileage', color: carColor }]}
          curveType="linear"
          gridAxis="y"
          tickLine="none"
          dotProps={{ r: 4 }}
          activeDotProps={{ r: 6 }}
        />
      </Stack>
    </Paper>
  );
}
