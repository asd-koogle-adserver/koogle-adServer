import Joi from "joi";

export const click_capture_schema = Joi.object({
  zone_id: Joi.string().required(),
  ad_item_id: Joi.string().required(),
  publisher_id: Joi.string().required(),
});
