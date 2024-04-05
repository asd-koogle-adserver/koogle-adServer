//version1
import Joi from "joi" //= require("joi");

// // Define the Impression variables i guess
// interface Impression {
//     ad_id: string; 
//     placement_id: string; 
//     user_id: string; 
//     timestamp: string; 
//     ip_address: string; 
//     device_type: string; 
//     browser: string; 
// }

// // Export the Impression
// export { Impression };
// Define the Impression Schema
export const impression_capture_schema = Joi.object({
    ad_id: Joi.string().required(),
    placement_id: Joi.string().required(),
    zone_id: Joi.string().required(),
    campaign_id: Joi.string().required(),
   //user_id: Joi.string().required(),
    timestamp: Joi.string().isoDate().required(),
    ip_address: Joi.string().optional(),
    device_type: Joi.string().optional(),
    browser: Joi.string().optional(),

    
  });

  // export const impression_capture_schema = Joi.object({});
