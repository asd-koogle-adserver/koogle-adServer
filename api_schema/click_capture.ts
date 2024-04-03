import Joi from "joi";

export const click_capture_schema = Joi.object({
  placement_id: Joi.string().required(),
  zone_id: Joi.string().required(),
  campaign_id: Joi.string().required(),
  ad_item_id: Joi.string().required(),
});
