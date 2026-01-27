'use client';

import { useState, useRef } from 'react';
import {
  Modal,
  Button,
  Stack,
  Text,
  FileInput,
  Alert,
  Progress,
  Group,
  List,
} from '@mantine/core';
import {
  IconAlertCircle,
  IconUpload,
  IconDownload,
  IconCheck,
} from '@tabler/icons-react';
import {
  downloadMigrationData,
  validateMigrationData,
  importMigrationData,
  type ImportStats,
} from '@/lib/migration';

interface MigrationModalProps {
  opened: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

export function MigrationModal({
  opened,
  onClose,
  onImportComplete,
}: MigrationModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState('');
  const [importStats, setImportStats] = useState<ImportStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLButtonElement>(null);

  const handleExport = () => {
    try {
      downloadMigrationData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to export data'
      );
    }
  };

  const handleImport = async () => {
    if (!file) {
      setError('Please select a file to import');
      return;
    }

    try {
      setIsImporting(true);
      setError(null);
      setImportStats(null);
      setImportProgress('Reading file...');

      // Read file contents
      const fileText = await file.text();
      const data = JSON.parse(fileText);

      // Validate data structure
      if (!validateMigrationData(data)) {
        throw new Error('Invalid migration file format');
      }

      // Import data
      const stats = await importMigrationData(data, (message) => {
        setImportProgress(message);
      });

      setImportStats(stats);
      setFile(null);

      // Reload data
      setTimeout(() => {
        onImportComplete();
      }, 2000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to import data'
      );
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    if (!isImporting) {
      setFile(null);
      setError(null);
      setImportStats(null);
      setImportProgress('');
      onClose();
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Data Migration"
      centered
      size="lg"
    >
      <Stack gap="md">
        <Alert
          icon={<IconAlertCircle size={16} />}
          title="Important"
          color="blue"
        >
          Use this tool to migrate your data from localStorage to the cloud
          database. This is a one-time operation.
        </Alert>

        {error && (
          <Alert icon={<IconAlertCircle size={16} />} color="red" title="Error">
            {error}
          </Alert>
        )}

        {importStats && (
          <Alert
            icon={<IconCheck size={16} />}
            color="green"
            title="Import Complete"
          >
            <List size="sm">
              <List.Item>Cars imported: {importStats.carsImported}</List.Item>
              <List.Item>Cars skipped: {importStats.carsSkipped}</List.Item>
              <List.Item>
                Readings imported: {importStats.readingsImported}
              </List.Item>
              <List.Item>
                Readings skipped: {importStats.readingsSkipped}
              </List.Item>
            </List>

            {importStats.errors.length > 0 && (
              <>
                <Text size="sm" fw={500} mt="sm">
                  Errors:
                </Text>
                <List size="sm">
                  {importStats.errors.map((err, idx) => (
                    <List.Item key={idx}>{err}</List.Item>
                  ))}
                </List>
              </>
            )}
          </Alert>
        )}

        {isImporting && (
          <Stack gap="xs">
            <Progress value={100} animated />
            <Text size="sm" c="dimmed">
              {importProgress}
            </Text>
          </Stack>
        )}

        <Stack gap="xs">
          <Text size="sm" fw={500}>
            Step 1: Export your localStorage data
          </Text>
          <Button
            leftSection={<IconDownload size={18} />}
            onClick={handleExport}
            disabled={isImporting}
            variant="light"
            fullWidth
          >
            Export Data (Download JSON)
          </Button>
        </Stack>

        <Stack gap="xs">
          <Text size="sm" fw={500}>
            Step 2: Import the exported file
          </Text>
          <FileInput
            ref={fileInputRef}
            placeholder="Select backup file"
            accept=".json"
            value={file}
            onChange={setFile}
            disabled={isImporting}
            leftSection={<IconUpload size={18} />}
          />
          <Button
            onClick={handleImport}
            disabled={!file || isImporting}
            loading={isImporting}
            fullWidth
          >
            Import Data
          </Button>
        </Stack>

        <Group justify="flex-end">
          <Button variant="subtle" onClick={handleClose} disabled={isImporting}>
            Close
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
