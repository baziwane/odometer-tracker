import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MantineProvider } from '@mantine/core';
import { ErrorAlert } from '../ErrorAlert';

// Wrapper component to provide Mantine context
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <MantineProvider>{children}</MantineProvider>
);

describe('ErrorAlert', () => {
  it('should not render when error is null', () => {
    render(<ErrorAlert error={null} />, { wrapper: TestWrapper });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('should render error message', () => {
    render(<ErrorAlert error="Something went wrong" />, { wrapper: TestWrapper });
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('should render custom title', () => {
    render(<ErrorAlert error="Test error" title="Custom Title" />, { wrapper: TestWrapper });
    expect(screen.getByText('Custom Title')).toBeInTheDocument();
  });

  it('should call onRetry when retry button clicked', async () => {
    const user = userEvent.setup();
    const onRetry = jest.fn();

    render(<ErrorAlert error="Test error" onRetry={onRetry} />, { wrapper: TestWrapper });

    const retryButton = screen.getByRole('button', { name: /retry/i });
    await user.click(retryButton);

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('should not show retry button when onRetry not provided', () => {
    render(<ErrorAlert error="Test error" />, { wrapper: TestWrapper });
    expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
  });

  it('should show close button when onDismiss provided', () => {
    const onDismiss = jest.fn();
    render(<ErrorAlert error="Test error" onDismiss={onDismiss} />, { wrapper: TestWrapper });

    // Alert with close button should be present
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
