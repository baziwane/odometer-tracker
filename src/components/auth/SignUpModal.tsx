'use client';

import { Modal, TextInput, PasswordInput, Button, Stack, Text, Divider, Alert } from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { IconAlertCircle, IconBrandGoogle } from '@tabler/icons-react';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';

const signUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type SignUpFormData = z.infer<typeof signUpSchema>;

interface SignUpModalProps {
  opened: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

export function SignUpModal({ opened, onClose, onSwitchToLogin }: SignUpModalProps) {
  const { signUp, signInWithGoogle, error, clearError } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<SignUpFormData>({
    validate: zodResolver(signUpSchema),
    initialValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const handleSubmit = async (values: SignUpFormData) => {
    try {
      setIsLoading(true);
      clearError();
      await signUp(values.email, values.password);
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
    <Modal opened={opened} onClose={handleClose} title="Create Account" centered>
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
            placeholder="At least 8 characters"
            required
            {...form.getInputProps('password')}
          />

          <PasswordInput
            label="Confirm Password"
            placeholder="Re-enter your password"
            required
            {...form.getInputProps('confirmPassword')}
          />

          <Button type="submit" fullWidth loading={isLoading}>
            Create Account
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
            Already have an account?{' '}
            <Text
              component="span"
              c="blue"
              style={{ cursor: 'pointer' }}
              onClick={onSwitchToLogin}
            >
              Sign in
            </Text>
          </Text>
        </Stack>
      </form>
    </Modal>
  );
}
