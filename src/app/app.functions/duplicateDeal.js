const axios = require('axios');

exports.main = async (context = {}, sendResponse) => {
  const { dealId } = context.parameters;
  const accessToken = process.env.privateappkey;

  try {
    // Fetch deal data using GraphQL
    const dealData = await fetchDealData(accessToken, dealId);
    
    // Create a new deal with the fetched data
    const newDeal = await createDuplicateDeal(accessToken, dealData);
    
    // Associate the new deal with companies and contacts
    await associateDeal(accessToken, newDeal.id, dealData);

    sendResponse({
      status: 'SUCCESS',
      body: { id: newDeal.id },
    });
  } catch (error) {
    sendResponse({
      status: 'ERROR',
      body: { message: error.message },
    });
  }
};

async function fetchDealData(accessToken, dealId) {
  const query = `
    query DealQuery($dealId: String!) {
      deal(id: $dealId) {
        amount
        closedate
        dealname
        dealstage
        pipeline
        hubspot_owner_id
        associations {
          companies {
            items {
              id
            }
          }
          contacts {
            items {
              id
            }
          }
        }
      }
    }
  `;

  const variables = { dealId };
  const response = await axios.post('https://api.hubapi.com/graphql', 
    { query, variables },
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    }
  );

  return response.data.data.deal;
}

async function createDuplicateDeal(accessToken, dealData) {
  const properties = {
    amount: dealData.amount,
    closedate: dealData.closedate,
    dealname: `${dealData.dealname} (Copy)`,
    dealstage: dealData.dealstage,
    pipeline: dealData.pipeline,
    hubspot_owner_id: dealData.hubspot_owner_id,
  };

  const response = await axios.post('https://api.hubapi.com/crm/v3/objects/deals', 
    { properties },
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    }
  );

  return response.data;
}

async function associateDeal(accessToken, newDealId, dealData) {
  const companyIds = dealData.associations.companies.items.map(item => item.id);
  const contactIds = dealData.associations.contacts.items.map(item => item.id);

  if (companyIds.length > 0) {
    await axios.put(`https://api.hubapi.com/crm/v3/objects/deals/${newDealId}/associations/company/batch/create`,
      { inputs: companyIds.map(id => ({ id })) },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
  }

  if (contactIds.length > 0) {
    await axios.put(`https://api.hubapi.com/crm/v3/objects/deals/${newDealId}/associations/contact/batch/create`,
      { inputs: contactIds.map(id => ({ id })) },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
  }
}
