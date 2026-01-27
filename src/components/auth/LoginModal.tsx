'use client';

import { Modal, TextInput, PasswordInput, Button, Stack, Text, Divider, Alert } from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { IconAlertCircle, IconBrandGoogle } from '@tabler/icons-react';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginModalProps {
  opened: boolean;
  onClose: () => void;
  onSwitchToSignUp: () => void;
}

export function LoginModal({ opened, onClose, onSwitchToSignUp }: LoginModalProps) {
  const { signIn, signInWithGoogle, error, clearError } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginFormData>({
    validate: zodResolver(loginSchema),
    initialValues: {
      email: '',
      password: '',
    },
  });

  const handleSubmit = async (values: LoginFormData) => {
    try {
      setIsLoading(true);
      clearError();
      await signIn(values.email, values.password);
      form.reset();
      onClose();
    } catch {
      // Error is handled by context
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      clearError();
      await signInWithGoogle();
    } catch {
      // Error is handled by context
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    form.reset();
    clearError();
    onClose();
  };

  return (
    <Modal opened={opened} onClose={handleClose} title="Sign In" centered>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          {error && (
            <Alert icon={<IconAlertCircle size={16} />} color="red" title="Error">
              {error}
            </Alert>
          )}

          <TextInput
            label="Email"
            placeholder="your@email.com"
            required
            {...form.getInputProps('email')}
          />

          <PasswordInput
            label="Password"
            placeholder="Your password"
            required
            {...form.getInputProps('password')}
          />

          <Button type="submit" fullWidth loading={isLoading}>
            Sign In
          </Button>

          <Divider label="OR" labelPosition="center" />

          <Button
            variant="outline"
            leftSection={<IconBrandGoogle size={18} />}
            onClick={handleGoogleSignIn}
            loading={isLoading}
            fullWidth
          >
            Continue with Google
          </Button>

          <Text size="sm" ta="center">
            Don&apos;t have an account?{' '}
            <Text
              component="span"
              c="blue"
              style={{ cursor: 'pointer' }}
              onClick={onSwitchToSignUp}
            >
              Sign up
            </Text>
          </Text>
        </Stack>
      </form>
    </Modal>
  );
}
