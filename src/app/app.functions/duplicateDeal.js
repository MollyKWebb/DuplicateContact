// src/app/app.functions/duplicateDeal.js
const hubspot = require('@hubspot/api-client');

exports.main = async (context = {}, sendResponse) => {
  const { dealId } = context.parameters;
  const hubspotClient = new hubspot.Client({ accessToken: context.secrets.privateappkey });

  try {
    // Fetch the original deal
    const originalDeal = await hubspotClient.crm.deals.basicApi.getById(dealId, ['properties', 'associations']);

    // Create a new deal with the same properties
    const newDealProperties = { ...originalDeal.properties };
    delete newDealProperties.hs_object_id;
    delete newDealProperties.createdate;
    delete newDealProperties.hs_lastmodifieddate;

    const newDeal = await hubspotClient.crm.deals.basicApi.create({ properties: newDealProperties });

    // Copy associations
    const associationTypes = ['company', 'contact'];
    for (const type of associationTypes) {
      const associations = await hubspotClient.crm.deals.associationsApi.getAll(dealId, type);
      for (const association of associations.results) {
        await hubspotClient.crm.deals.associationsApi.create(newDeal.id, type, association.id);
      }
    }

    // Copy line items
    const lineItems = await hubspotClient.crm.deals.associationsApi.getAll(dealId, 'line_item');
    for (const lineItem of lineItems.results) {
      const originalLineItem = await hubspotClient.crm.lineItems.basicApi.getById(lineItem.id);
      const newLineItemProperties = { ...originalLineItem.properties };
      delete newLineItemProperties.hs_object_id;
      delete newLineItemProperties.createdate;
      delete newLineItemProperties.hs_lastmodifieddate;

      const newLineItem = await hubspotClient.crm.lineItems.basicApi.create({ properties: newLineItemProperties });
      await hubspotClient.crm.deals.associationsApi.create(newDeal.id, 'line_item', newLineItem.id);
    }

    sendResponse({ status: 'SUCCESS', data: newDeal });
  } catch (error) {
    sendResponse({ status: 'ERROR', message: error.message });
  }
};
