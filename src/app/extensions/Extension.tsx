import React, { useState } from 'react';
import {
  Button,
  Box,
  Text,
  Alert,
  hubspot,
} from '@hubspot/ui-extensions';

hubspot.extend(({ runServerlessFunction, context }) => (
  <Extension
    runServerless={runServerlessFunction}
    context={context}
  />
));

const Extension = ({ runServerless, context }) => {
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
      <Box marginTop="md">
        <Button
          onClick={handleDuplicate}
          disabled={loading}
        >
          {loading ? 'Duplicating...' : 'Duplicate Deal'}
        </Button>
      </Box>
      {error && (
        <Alert
          title="Error"
          variant="error"
          marginTop="md"
        >
          {error}
        </Alert>
      )}
      {success && (
        <Alert
          title="Success"
          variant="success"
          marginTop="md"
        >
          Deal duplicated successfully with all properties and associations!
        </Alert>
      )}
    </Box>
  );
};

export default Extension;
