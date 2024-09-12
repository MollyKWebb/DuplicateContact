import React, { useState } from 'react';
import {
  Button,
  Box,
  Text,
  Alert,
  Flex,
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
        name: 'duplicateContact',
        parameters: { contactId: context.contact.id },
      });

      if (response.status === 'SUCCESS') {
        setSuccess(true);
      } else {
        throw new Error(response.message || 'Failed to duplicate contact');
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
        Click the button below to duplicate this contact, including some properties,
        company associations, and deal associations.
      </Text>
      <Box marginTop="md">
        <Button
          onClick={handleDuplicate}
          disabled={loading}
        >
          {loading ? 'Duplicating...' : 'Duplicate Contact'}
        </Button>
      </Box>
      {error && (
        <Alert
          title="Error"
          variant="error"
          marginTop="md"
        >
          <Text>{error}</Text>
        </Alert>
      )}
      {success && (
        <Alert
          title="Success"
          variant="success"
          marginTop="md"
        >
          <Text>Contact duplicated successfully!</Text>
        </Alert>
      )}
    </Box>
  );
};

export default Extension;
