const typeDefs = `
  type User {
    id: ID!
    username: String!
    email: String!
    password: String!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type Advert {
    id: ID!
    title: String!
    description: String!
    imageUrl: String!
  }

  type Zone {
    id: ID!
    name: String!
    description: String!
  }

  type Campaign {
    id: ID!
    name: String!
    description: String!
  }

  type Click {
    id: ID!
    advertId: ID!
    zoneId: ID!
    timestamp: String!
  }

  type Conversion {
    id: ID!
    clickId: ID!
    conversionData: String!
    timestamp: String!
  }

  type Impressions{
    id: ID!
    advertId: ID!
    zoneId: ID!
    timestamp: String!
  }

  type Query {
    advert(id: ID!): Advert
    zone(id: ID!): Zone
    allAdverts: [Advert!]!
    allZones: [Zone!]!
    campaign(id: ID!): Campaign   # Add this line as we go
    allCampaigns: [Campaign!]!     # Add this line as we go
    click(id: ID!): Click          # Add this line as we go 
    allClicks: [Click!]!           # Add this line as we go
    conversion(id: ID!): Conversion    # Add this line as we go
    allConversions: [Conversion!]!     # Add this line as we go
    user(id: ID!): User            # Add this line as we go
    captureClick(placementID: ID!, zoneId: ID!, campaignId: ID!, adItemId: ID!): String
  }

  type Mutation {
    register(username: String!, email: String!, password: String!): AuthPayload!
    login(email: String!, password: String!): AuthPayload!
    createAdvert(title: String!, description: String!, imageUrl: String!): Advert!
    createZone(name: String!, description: String!): Zone!
    createCampaign(name: String!, description: String!): Campaign!
    captureConversion(clickId: ID!, conversionData: String!, timestamp: String!): Conversion!
  }
`;

export default typeDefs;
