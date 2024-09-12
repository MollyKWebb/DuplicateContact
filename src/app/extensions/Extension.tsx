// src/app/extensions/Extension.tsx
import React, { useState } from 'react';
import {
  Button,
  Box,
  Text,
  Alert,
  AlertTitle,
  AlertDescription,
} from '@hubspot/ui-extensions';

export const DuplicateDeal = ({ runServerless, context }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleDuplicate = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await runServerless({
        name: 'duplicateDeal',
        parameters: { dealId: context.deal.id },
      });

      if (response.status === 'SUCCESS') {
        setSuccess(true);
      } else {
        throw new Error(response.message || 'Failed to duplicate deal');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Text>
        Click the button below to duplicate this deal, including all properties,
        company associations, contact associations, and line items.
      </Text>
      <Box mt={2}>
        <Button
          onClick={handleDuplicate}
          disabled={loading}
        >
          {loading ? 'Duplicating...' : 'Duplicate Deal'}
        </Button>
      </Box>
      {error && (
        <Alert title="Error" variant="error">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert title="Success" variant="success">
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>Deal duplicated successfully!</AlertDescription>
        </Alert>
      )}
    </Box>
  );
};
