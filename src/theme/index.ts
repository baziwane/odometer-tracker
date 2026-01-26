'use client';

import { createTheme, MantineColorsTuple } from '@mantine/core';

const brand: MantineColorsTuple = [
  '#e8f4ff',
  '#d1e6ff',
  '#a3ccff',
  '#70afff',
  '#4795ff',
  '#2d84ff',
  '#1a7aff',
  '#0066e4',
  '#005acc',
  '#004db3',
];

export const theme = createTheme({
  primaryColor: 'brand',
  colors: {
    brand,
  },
  fontFamily:
    '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
  defaultRadius: 'md',
  components: {
    Button: {
      defaultProps: {
        size: 'md',
      },
      styles: {
        root: {
          fontWeight: 600,
        },
      },
    },
    TextInput: {
      defaultProps: {
        size: 'md',
      },
    },
    NumberInput: {
      defaultProps: {
        size: 'md',
      },
    },
    Select: {
      defaultProps: {
        size: 'md',
      },
    },
    Paper: {
      defaultProps: {
        shadow: 'sm',
      },
    },
  },
});
