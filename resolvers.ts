
//version8

import { adverts, zones, campaigns, clicks, conversions, users } from './dummy'; //this is coming from the dummy data

const resolvers = {
  Query: {
    advert: async (_: any, { id }: { id: string }, context: any) => {
      const advert = adverts.find((ad: any) => ad.id === id);
      return advert;
    },
    allAdverts: async (_: any, __: any, context: any) => {
      return adverts;
    },
    zone: async (_: any, { id }: { id: string }, context: any) => {
      const zone = zones.find((z: any) => z.id === id);
      return zone;
    },
    allZones: async (_: any, __: any, context: any) => {
      return zones;
    },
    campaign: async (_: any, { id }: { id: string }, context: any) => {
      const campaign = campaigns.find((c: any) => c.id === id);
      return campaign;
    },
    allCampaigns: async (_: any, __: any, context: any) => {
      return campaigns;
    },
    click: async (_: any, { id }: { id: string }, context: any) => {
      const click = clicks.find((c: any) => c.id === id);
      return click;
    },
    allClicks: async (_: any, __: any, context: any) => {
      return clicks;
    },
    conversion: async (_: any, { id }: { id: string }, context: any) => {
      const conversion = conversions.find((c: any) => c.id === id);
      return conversion;
    },
    allConversions: async (_: any, __: any, context: any) => {
      return conversions;
    },
    user: async (_: any, { id }: { id: string }, context: any) => {
      const user = users.find((u: any) => u.id === id);
      return user;
    },
    // Add resolver for user login here...
  },
  Mutation: {
    createAdvert: async (_: any, args: { title: string, description: string, imageUrl: string }, context: any) => {
      const newAdvert = { id: Math.random().toString(), ...args };
      adverts.push(newAdvert);
      return newAdvert;
    },
    createZone: async (_: any, args: { name: string, description: string }, context: any) => {
      const newZone = { id: Math.random().toString(), ...args };
      zones.push(newZone);
      return newZone;
    },
    createCampaign: async (_: any, args: { name: string, description: string }, context: any) => {
      const newCampaign = { id: Math.random().toString(), ...args };
      campaigns.push(newCampaign);
      return newCampaign;
    },
    // Add resolvers for click capture and conversion capture here...
  },
};

export default resolvers;
