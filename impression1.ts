// //version1 trails

// import { campaigns } from "./dummy";

// // // Define the Impression interface
// // interface Impression {
// //     id: string; 
// //     placementID: string;
// //     zoneID: string;
// //     campaignID: string;
// //     adItemID: string;
// //     date: string;
// // }

// // // Define the trackImpression function to log impression
// // const trackImpression = (impression: Impression): void => {
// //     console.log(`An impression has been recorded for Ad Item ID ${impression.adItemID}`);
// // };

// // // Define an example ad
// // const myAd = { id: "123", itemName: "Banner" };
// // const yourAd = { id: "456", itemName: "Button" };

// // // Test if myAd and yourAd reference the same object
// // console.log(myAd === yourAd); // Output: false (since they are separate objects)

// // // Modify yourAd, myAd should remain unchanged
// // yourAd.itemName += " Click Here";
// // console.log("After appending 'Click Here' to yourAd.itemName");
// // console.log("Your Ad:\n", yourAd);
// // console.log("\nMy Ad:\n", myAd);

// // /*Value Types vs Reference Types (comments are explanatory and don't affect code execution)*/

// // // Function to modify a value type argument (pass by value)
// // function modifyValueTypeArgument(arg: number) {
// //     arg++; // This change will NOT affect the original arg outside this function
// // }

// // let numArg = 7;
// // modifyValueTypeArgument(numArg);
// // console.log("Outside Function: " + numArg); // Output: 7

// // // Function to modify a reference type argument (pass by reference)
// // function modifyReferenceTypeArgument(arg: any[]) {
// //     arg[0]++; // This change WILL affect the original arg outside this function
// // }

// // let arrArg = [9];
// // modifyReferenceTypeArgument(arrArg);
// // console.log("Modified Array Argument:", arrArg); // Output: [10]

// // // Export Impression interface and trackImpression function
// // export { Impression, trackImpression };


// //version 2 
// //adjusted to the schema
// //we support banner adverts just for hips so far
// // Define the Impression interface

// // interface Impression {
// //     ad_id: string; 
// //     placement_id: string; 
// //     user_id: string; 
// //     timestamp: string; 
// //     ip_address: string; 
// //     device_type: string; 
// //     browser: string; 
// // }

// // // Define the trackImpression function to log impression
// // const trackImpression = (impression: Impression): void => {
// //     console.log(`An impression has been recorded for Ad ID ${impression.ad_id}`);
// // };

// // // Export Impression interface and trackImpression function
// // export { Impression, trackImpression };
// // // Calling the trackImpression function with an object that matches the Impression interface

// //version 3....not working for now
// // import { trackImpression } from './impressionModule'; // Adjust the path to match your file structure

// // // Assuming this is your existing code
// // app.get('/your-route', async (req, res, next) => {
// //   try {
// //     // Your existing code here...

// //     // Loop through reports to calculate total impressions for each campaign
// //     for (let i = 0; i < reports.length; i++) {
// //       let totalImpressions = 0;
// //       for (let t = 0; t < reports[i].length; t++) {
// //         totalImpressions += reports[i][t].impressions;
// //         // Track each impression
// //         trackImpression({
// //           ad_id: reports[i][t].ad_id,
// //           placement_id: reports[i][t].placement_id,
// //           user_id: reports[i][t].user_id,
// //           timestamp: reports[i][t].timestamp,
// //           ip_address: reports[i][t].ip_address,
// //           device_type: reports[i][t].device_type,
// //           browser: reports[i][t].browser
// //         });
// //       }
// //       campaigns[i].total_impressions = totalImpressions;
// //     }

// //     // Render your view with updated data
// //     return res.render("zone/view", {
// //       publishers: publishersAndZones,
// //       advertisers: advertisersAndZones,
// //       zone: zone,
// //       assigned_campaigns: campaigns
// //     });
// //   } catch (error) {
// //     return next(error);
// //   }
// // });


// //version 2 
// //adjusted to the schema
// //we support banner adverts just for hips so far
// // Define the Impression interface

// interface Impression {
//     ad_id: string; 
//     placement_id: string; 
//     user_id: string; 
//     timestamp: string; 
//     ip_address: string; 
//     device_type: string; 
//     browser: string; 
// }

// // Define the trackImpression function to log impression
// const trackImpression = (impression: Impression): void => {
//     console.log(`An impression has been recorded for Ad ID ${impression.ad_id}`);
// };

// //zone I guess
// //retrieve  all impressions for a specific zone and add up
// //this acts as a filter
// // const reports = await Report.list({
// //     placement = placement.id,
// //     "campaign.id" = campaign.id
// // });


// //try
// // // Fetch reports from the database, still look into this
// // const reports = await Report.find({ placementId: placement.id, campaignId: campaign.id });

// // // Calculate total impressions for the campaign
// // let totalImpressions = 0;
// // for (const report of reports) {
// //   totalImpressions += report.impressions;
// // }

// // // Update the campaign object with total impressions, if this exits?
// // campaigns.totalImpressions = totalImpressions;

// // // Add the campaign to the list of assigned campaigns
// // //still figuring out this 
// // assignedCampaigns.push(campaign);

// // // Export Impression interface and trackImpression function
// // export { Impression, trackImpression };
// // // Calling the trackImpression function with an object that matches the Impression interface

// // import { Impression } from './impressionModule'; // Import the Impression interface
// // import { trackImpression } from './impressionModule'; // Import the trackImpression function

// // try {

// //version 3

// import { Impression } from './impression'; // Import the Impression interface
// import { trackImpression } from './trackImpression'; // Import the trackImpression function



// try {
//   // Fetch reports from the database...superbase
//   const reports = await Report.find({ placementId: placement.id, campaignId: campaign.id });

//   // Calculate total impressions for the campaign
//   let totalImpressions = 0;
//   for (const report of reports) {
//     totalImpressions += report.impressions;
//   }

//   // Update the campaign object with total impressions
//   campaign.totalImpressions = totalImpressions;

//   // Add the campaign to the list of assigned campaigns
//   assignedCampaigns.push(campaign);

//   // Render the view with updated data
//   return res.render("zone/view", {
//     publishers: publishersAndZones,
//     advertisers: advertisersAndZones,
//     zone: zone,
//     assigned_campaigns: assignedCampaigns
//   });
// } catch (error) {
//   // Handle errors
//   return next(error);
// }
// // Create a new impression and add it to the array of impressions on the ad

// //Renew
// import { ApolloServer } from "apollo-server";
// import typeDefs from "./schema"; // Import your schema definition
// import resolvers from "./resolvers"; // Import your resolver functions
// import { PORT } from "./utils/get_env_variables";
// import { supabase } from "./utils/init_db";
// import { expressMiddleware } from "apollo-server-express"; // Import express middleware
// import { ApolloServerPluginDrainHttpServer } from "apollo-server-plugin-drain-http-server";
// import cors from "cors";
// import express from "express";
// import http from "http";
// import { json } from "body-parser";
// import morgan from "morgan";
// import moment from "moment";
// import Joi, { Schema } from "joi"; // Import Joi for validation
// import { impression_capture_schema } from "./api_schema/impression_capture"; // Import impression schema

// interface Impression {
//   ad_id: string;
//   placement_id: string;
//   user_id?: string;
//   timestamp: string;
//   ip_address?: string;
//   device_type?: string;
//   browser?: string;
// }

// const app = express();
// app.use(json());
// app.use(morgan("dev"));

// const httpServer = http.createServer(app);
// const server = new ApolloServer({
//   typeDefs,
//   resolvers,
//   plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
// });

// async function startServer() {
//   await server.start();

//   // Click Capture Route
//   app.get("/redirect", async (req, res) => {
//     // Validate Click Capture Data
//     const { error: clickValidationError, clickValue } = click_capture_schema.validate(req.query);

//     if (clickValidationError) {
//       return res.status(405).send({
//         success: false,
//         error: "VALIDATION_ERROR",
//         message: clickValidationError.details[0].message,
//       });
//     }

//     // If click validation passes, try validating impression data
//     const { error: impressionValidationError, impressionValue } = impression_capture_schema.validate(req.query);

//     if (impressionValidationError) {
//       // If impression data is not present or not valid, handle accordingly
//       console.error("Impression validation error:", impressionValidationError);
//       // Handle the error response or fallback logic
//       return res.status(400).send("Impression data is missing or invalid");
//     }

//     // If both validations pass, proceed with further processing
//     const { placement_id, zone_id, campaign_id, ad_item_id, user_id, timestamp, ip_address, device_type, browser } = impressionValue as Impression;

//     // Perform actions with validated impression data as required
//     // ...

//     // Return response or perform further actions
//     res.send("Impression captured successfully");
//   });

//   // Middleware setup
//   app.use(
//     "/",
//     cors({
//       origin: true,
//       credentials: true,
//     }),
//     expressMiddleware(server, {
//       context: async ({ req, res }) => ({
//         res,
//         req,
//       }),
//     })
//   );

//   // Start server listening
//   await new Promise<void>((resolve) =>
//     httpServer.listen({ port: PORT }, resolve)
//   );

//   console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`);
// }

// startServer();


