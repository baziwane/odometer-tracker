export const CAR_COLORS = [
  { value: 'blue', label: 'Blue', hex: '#228be6' },
  { value: 'red', label: 'Red', hex: '#fa5252' },
  { value: 'green', label: 'Green', hex: '#40c057' },
  { value: 'orange', label: 'Orange', hex: '#fd7e14' },
  { value: 'violet', label: 'Violet', hex: '#7950f2' },
  { value: 'teal', label: 'Teal', hex: '#12b886' },
  { value: 'pink', label: 'Pink', hex: '#e64980' },
  { value: 'gray', label: 'Gray', hex: '#868e96' },
] as const;

export const STORAGE_KEY = 'odometer-tracker-data';
export const CURRENT_VERSION = 2;

export type CarColor = (typeof CAR_COLORS)[number]['value'];
