//version 1

// Import the Impression interface
import { Impression } from './impression';

// Define the trackImpression function to log impression
//still thinking the logic

const trackImpression = (impression: Impression): void => {
    console.log(`An impression has been recorded for Ad ID ${impression.ad_id}`);
};

// Export the trackImpression function
export { trackImpression };
