import Joi from "joi" //= require("joi");

export const impression_schema = Joi.object({
    type: Joi.string().required(),
    zone_id: Joi.string().required(),    
    publisher_id: Joi.string().required(),
  });
