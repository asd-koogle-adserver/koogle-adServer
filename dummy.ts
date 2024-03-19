// dummy.ts

// Define dummy data for adverts and zones
export const adverts = [
    {
      id: '1',
      title: 'Advert 1',
      description: 'Description for Advert 1',
      imageUrl: 'https://example.com/image1.jpg',
    },
    {
      id: '2',
      title: 'Advert 2',
      description: 'Description for Advert 2',
      imageUrl: 'https://example.com/image2.jpg',
    },
    // Add more adverts as needed
  ];
  
  export const zones = [
    {
      id: '1',
      name: 'Zone 1',
      description: 'Description for Zone 1',
    },
    {
      id: '2',
      name: 'Zone 2',
      description: 'Description for Zone 2',
    },
    // Add more zones as needed
  ];
  
  // Define dummy data for users, campaigns, clicks, and conversions
export const users = [
    {
      id: '1',
      username: 'user1',
      email: 'user1@example.com',
      password: 'password1',
    },
    {
      id: '2',
      username: 'user2',
      email: 'user2@example.com',
      password: 'password2',
    },
    // Add more users as needed
  ];
  
  export const campaigns = [
    {
      id: '1',
      name: 'Campaign 1',
      description: 'Description for Campaign 1',
    },
    {
      id: '2',
      name: 'Campaign 2',
      description: 'Description for Campaign 2',
    },
    // Add more campaigns as needed
  ];
  
  export const clicks = [
    {
      id: '1',
      advertId: '1',
      zoneId: '1',
      timestamp: '2024-03-15T12:00:00Z',
    },
    {
      id: '2',
      advertId: '2',
      zoneId: '2',
      timestamp: '2024-03-15T13:00:00Z',
    },
    // Add more clicks as needed
  ];
  
  export const conversions = [
    {
      id: '1',
      clickId: '1',
      conversionData: 'Conversion data for click 1',
      timestamp: '2024-03-15T12:30:00Z',
    },
    {
      id: '2',
      clickId: '2',
      conversionData: 'Conversion data for click 2',
      timestamp: '2024-03-15T13:30:00Z',
    },
    // Add more conversions as needed
  ];
  