const hubspot = require('@hubspot/api-client');

exports.main = async (context = {}, sendResponse) => {
  const { dealId } = context.parameters;
  const hubspotClient = new hubspot.Client({ accessToken: context.secrets.privateappkey });

  try {
    // Fetch deal data using GraphQL
    const dealData = await fetchDealData(hubspotClient, dealId);
    
    // Create a new deal with the fetched data
    const newDeal = await createDuplicateDeal(hubspotClient, dealData);
    
    // Associate the new deal with companies and contacts
    await associateDeal(hubspotClient, newDeal.id, dealData);

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

async function fetchDealData(hubspotClient, dealId) {
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
  const result = await hubspotClient.apiRequest({
    method: 'POST',
    path: '/graphql',
    body: { query, variables },
  });

  return result.data.data.deal;
}

async function createDuplicateDeal(hubspotClient, dealData) {
  const properties = {
    amount: dealData.amount,
    closedate: dealData.closedate,
    dealname: `${dealData.dealname} (Copy)`,
    dealstage: dealData.dealstage,
    pipeline: dealData.pipeline,
    hubspot_owner_id: dealData.hubspot_owner_id,
  };

  const apiResponse = await hubspotClient.crm.deals.basicApi.create({ properties });
  return apiResponse;
}

async function associateDeal(hubspotClient, newDealId, dealData) {
  const companyIds = dealData.associations.companies.items.map(item => item.id);
  const contactIds = dealData.associations.contacts.items.map(item => item.id);

  if (companyIds.length > 0) {
    await hubspotClient.crm.deals.associationsApi.createBatch(newDealId, 'company', companyIds);
  }

  if (contactIds.length > 0) {
    await hubspotClient.crm.deals.associationsApi.createBatch(newDealId, 'contact', contactIds);
  }
}
