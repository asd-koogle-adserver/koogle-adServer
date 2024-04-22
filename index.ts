import { ApolloServer } from "@apollo/server";
import typeDefs from "./schema"; // Import your schema definition
import resolvers from "./resolvers"; // Import your resolver functions
import { PORT } from "./utils/get_env_variables";
import { supabase } from "./utils/init_db";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import cors from "cors";
import express from "express"; //use this library for
import http from "http";
import { json } from "body-parser";
import morgan from "morgan";
import { click_capture_schema } from "./api_schema/click_capture";
import moment, { duration } from "moment";
import { impression_schema } from "./api_schema/impressions";
import { zones } from "./dummy";
import geoip from "fast-geoip";

const app = express();
app.use(json());
app.use(morgan("dev"));

const httpServer = http.createServer(app);
const server = new ApolloServer({
  typeDefs,
  resolvers,
  // introspection: NODE_ENV !== "production", //Disabled for production builds
  plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
});

async function startServer() {
  await server.start();

  app.get("/redirect", async (req, res) => {
    const { error: validationError, value } = click_capture_schema.validate(
      req.query
    );

    if (validationError) {
      return res.status(405).send({
        success: false,
        error: "VALIDATION_ERROR",
        message: validationError.details[0].message,
      });
    }

    const { ad_item_id, publisher_id } = value;

    const { data: adItemData, error } = await supabase
      .from("adverts")
      .select()
      .eq("id", ad_item_id)
      .maybeSingle();

    if (!adItemData) {
      return res.send("No Ad Item Found");
    }

    const { data: publisherData, error: pubError } = await supabase
      .from("zones_publishers")
      .select()
      .eq("publisher_id", publisher_id)
      .eq("zone_id", adItemData.zone_id)
      .maybeSingle();

    if (!publisherData) {
      return res.send("Invalid publisher provided");
    }

    //Check if ip has already been recorded to have clicked this advert today
    //if so don't record the click, DoS

    //Record this as a click event
    await supabase.from("clicks").insert({
      advert_id: ad_item_id,
      publisher_id,
      ip_address: get_ip(req),
      cost: publisherData.price,
    });

    //We can choose to transfer funds to publisher that brought the here

    console.log("Click captured");
    return res.redirect(adItemData.target_url);
  });

  app.get("/ip", async (req, res) => {
    const ip_address = get_ip(req);
    const geo = await geoip.lookup(ip_address);

    res.send({ ip_address, ...geo });
  });

  app.get(
    "/adserve",
    async (req, res) => {
      //TODO: query parameter should include the advertiser id to know who sent client
      const { error: validationError, value } = impression_schema.validate(
        req.query
      );

      if (validationError) {
        return res.status(405).send({
          success: false,
          error: "VALIDATION_ERROR",
          message: validationError.details[0].message,
        });
      }

      const { type, zone_id, publisher_id } = value;

      const { data: zoneItemData, error } = await supabase
        .from("zones") //supabase table name
        .select()
        .eq("id", zone_id)
        .maybeSingle();

      if (!zoneItemData) {
        return res.send("No Zone Item Found");
      }

      //TODO: From here on the logic needs to studied applied according to our ad server
      //      We need to pick appropriate according to the publisher and advertiser match
      //      A mixture of price, category and region

      //Step 1: Find campaigns with same dimensions as zone, still running and same region or no region defined
      // Also only get adverts that are within the publishers price range maybe 10% less and more
      var currentTimestamp = new Date().toISOString();
      const { data: campaignItemData, error: campaignError } = await supabase
        .from("campaigns")
        .select(
          "*, adverts(*, zones(*), impressions(*), clicks(*), conversions(*))"
        )
        .eq("adverts.zones.width", zoneItemData.width)
        .eq("adverts.zones.height", zoneItemData.height)
        .lte("start_date", currentTimestamp)
        .gte("end_date", currentTimestamp)
        .order("budget", { ascending: false });

      // console.log(campaignItemData, ' ******')

      if (campaignError) {
        console.log(campaignError);
        // Handle any potential errors
        return res.status(200).send("Error fetching campaign");
      }

      if (!campaignItemData.length) {
        return res.send("No Campaign Found");
      }

      //TODO: check if any of the campaigns have regions defined if check again caller region
      var validCampaigns = campaignItemData.filter((camp) => {
        var totalImpressions = 0;
        var totalClicks = 0;
        var totalConversions = 0;
        var predicted_cost_to_date = 0;
        var predicted_spent_today = 0;

        if (!camp.adverts.length) {
          return false;
        }

        // Check if target metrics reached
        camp.adverts.forEach((advert: any) => {
          totalImpressions += advert.impressions.length;
          totalClicks += advert.clicks.length;
          totalConversions += advert.conversions.length;

          advert.impressions.forEach((item: any) => {
            predicted_cost_to_date += item.cost;

            var iscurrentDate = moment(item.created_at).isSame(
              new Date(),
              "day"
            );
            if (iscurrentDate) {
              predicted_spent_today += item.cost;
            }
          });

          advert.clicks.forEach((item: any) => {
            predicted_cost_to_date += item.cost;

            var iscurrentDate = moment(item.created_at).isSame(
              new Date(),
              "day"
            );
            if (iscurrentDate) {
              predicted_spent_today += item.cost;
            }
          });

          advert.conversions.forEach((item: any) => {
            predicted_cost_to_date += item.cost;

            var iscurrentDate = moment(item.created_at).isSame(
              new Date(),
              "day"
            );

            if (iscurrentDate) {
              predicted_spent_today += item.cost;
            }
          });
        });

        if (
          camp.target_impressions > 0 &&
          totalImpressions >= camp.target_impressions
        ) {
          return false;
        }

        if (camp.target_clicks > 0 && totalClicks >= camp.target_clicks) {
          return false;
        }

        if (
          camp.target_conversions > 0 &&
          totalConversions >= camp.target_conversions
        ) {
          return false;
        }

        //How long the campaign has been running for
        const running_duration = moment
          .duration(moment(camp.end_date).diff(moment(camp.start_date)))
          .asDays();

        camp.remaining_budget =
          camp.budget * running_duration - predicted_cost_to_date;

        /**
         * Check if daily budget has been reached
         * Do not show advert if amount budgeted per day has been reached
         */
        if (camp.budget < predicted_spent_today) {
          return false;
        }

        return true;
      });

      validCampaigns = validCampaigns.sort((a, b) => a - b);

      // Fetch perfomance history of publisher, check their click through and conversion rates
      // Compare this with what the advertiser wants e.g. if the publisher
      // gets a lot clicks then give them adverts that require clicks
      // if they get a lot of conversions give them adverts that are looking for conversions
      const { data: publisherData, error: publisherError } = await supabase
        .from("publishers")
        .select("*, impressions(count), clicks(count), conversions(count)");
      // .eq("publisher_id", publisher_id)

      var position_on_impressions = -1;
      var position_on_conversions = -1;
      var position_on_clicks = -1;

      if (publisherData?.length) {
        // console.log(publisherData[0].impressions, " publisher data...");
        publisherData
          .sort((a, b) => a.impressions - b.impressions)
          .find((publisher, index) => {
            if (publisher.id === publisher_id) {
              position_on_impressions = index;
            }
          });

        publisherData
          .sort((a, b) => a.clicks / a.impressions - b.clicks / b.impressions)
          .find((publisher, index) => {
            if (publisher.id === publisher_id) {
              position_on_clicks = index;
            }
          });

        publisherData
          .sort((a, b) => a.conversions / a.clicks - b.conversions / b.clicks)
          .find((publisher, index) => {
            if (publisher.id === publisher_id) {
              position_on_conversions = index;
            }
          });
      }

      console.log("Position on clicks: ", position_on_clicks);
      console.log("Position on conversions: ", position_on_conversions);
      console.log("Position on impressions: ", position_on_impressions);

      if (!validCampaigns.length) {
        return res.send("No Campaign Found");
      }

      var campaignsForDraw: any[] = [];

      /**
       * We choose the top 10 appropriate campaigns with the following weighing
       * 5 Conversion
       * 3 Click
       * 2 Impression
       *
       * If however I don't relatively rank higher in the previos metric or there's
       * not enough campaigns with the metric I'm best in then
       * the next one should take more precedence e.g.
       * if there's not 5 conversion campaign then clicks should cover for the remaining
       * space that was reserved for conversions
       */

      if (position_on_conversions >= position_on_clicks) {
        const conversion_campaigns = validCampaigns.filter(
          (campaign) => campaign.target_metric === "CPI"
        );

        campaignsForDraw = campaignsForDraw.concat(
          conversion_campaigns.slice(
            0,
            conversion_campaigns.length >= 6 ? 6 : conversion_campaigns.length
          )
        );
      }

      if (position_on_clicks >= position_on_impressions) {
        const click_campaigns = validCampaigns.filter(
          (campaign) => campaign.target_metric === "CPC"
        );
        const amountToBeSelected = 4 + (5 - campaignsForDraw.length);
        campaignsForDraw = campaignsForDraw.concat(
          click_campaigns.slice(
            0,
            click_campaigns.length >= amountToBeSelected
              ? amountToBeSelected
              : click_campaigns.length
          )
        );
      }

      const impression_campaigns = validCampaigns.filter(
        (campaign) => campaign.target_metric === "CPM"
      );

      const amountToBeSelected = 3 + (8 - campaignsForDraw.length);
      //
      campaignsForDraw = campaignsForDraw.concat(
        impression_campaigns.slice(
          0,
          impression_campaigns.length >= amountToBeSelected
            ? amountToBeSelected
            : impression_campaigns.length
        )
      );

      if (!campaignsForDraw.length) {
        return res.send("No valid campaigns Found");
      }

      // Here choose now a specific campaign that will be selected
      const selectedCampaign =
        campaignsForDraw[Math.floor(Math.random() * campaignsForDraw.length)];

      const { data: advertItemData, error: advertError } = await supabase
        .from("adverts")
        .select("*, zones(*)")
        .eq("campaign_id", selectedCampaign.id);

      if (advertError) {
        // Handle any potential errors
        return res.status(200).send("Error fetching campaign");
      }

      if (!advertItemData.length) {
        return res.send("No Advert Found");
      }
      // Here choose an advert from the selected campaign
      // This can be based on the time remaining to the end and the relative weight to other
      // adverts in the campaign

      const selectedAdvert =
        advertItemData[Math.floor(Math.random() * advertItemData.length)];
      const advertID = selectedAdvert.id;

      // EoF TODO: After the ad selection criteria has been set we store the impression
      //           And generate the ad

      const { data: currentPublisherZone } = await supabase
        .from("zones_publishers")
        .select()
        .eq("publisher_id", publisher_id)
        .eq("zone_id", selectedAdvert.zone_id)
        .maybeSingle();

      if (!publisherData) {
        return res.send("Invalid publisher provided");
      }

      const { error: impressionCaptureError } = await supabase
        .from("impressions")
        .insert({
          advert_id: advertID,
          publisher_id: publisher_id,
          ip_address: get_ip(req),
          cost: currentPublisherZone.price,
        });

      const host = req.protocol + "://" + req.get("host");
      const redirectURL = `${host}/redirect?publisher_id=${publisher_id}&zone_id=${zone_id}&ad_item_id=${advertID}`;
      let response = null;

      switch (type) {
        case "js": {
          response = "";
          response +=
            "document.write('<div style=\"display:inline-block;margin:0;padding:0;\">');";
          response += "document.write('";
          response +=
            '<a href="' +
            redirectURL +
            '" target="' +
            selectedAdvert.target_url +
            '" rel="nofollow">';
          response +=
            '<img src="' +
            selectedAdvert.content_url +
            '" border="0" width="' +
            selectedAdvert.zones.width +
            '" height="' +
            selectedAdvert.zones.height +
            '">';
          response += "</a>";
          response += "');";
          response += "document.write('</div>');";

          res.setHeader("Content-Type", "text/plain");
          res.end(response);
          return;
        }
        case "iframe": {
          response = "";
          response +=
            '<a href="' +
            redirectURL +
            '" target="' +
            selectedAdvert.target_url +
            '" rel="nofollow">';
          response +=
            '<img src="' +
            selectedAdvert.content_url +
            '" border="0" width="' +
            selectedAdvert.zones.width +
            '" height="' +
            selectedAdvert.zones.height +
            '">';
          response += "</a>";

          res.send(response);
          return;
        }
        case "json": {
          response = {
            width: selectedAdvert.zones.width,
            height: selectedAdvert.zones.height,
            target: selectedAdvert.target_url,
            redirect_url: redirectURL,
            image_url: selectedAdvert.content_url,
          };

          res.send(response);
          return;
        }
      }

      return res.send("Unknown Ad type");
    }

    //placement

    //test run
    // res.send("Hello, Help, will it change!")
  );

  app.use(
    "/",
    cors<cors.CorsRequest>({
      origin: true,
      credentials: true,
    }),
    // json(),
    // cookieParser(),
    expressMiddleware(server, {
      context: async ({ req, res }) => ({
        // user: await get_user(req,res, JWT_SECRET,tokenRepository),
        // authScope: getScope(req.headers.authorization) ,
        res,
        req,
      }),
    })
  );

  await new Promise<void>((resolve) =>
    httpServer.listen({ port: PORT }, resolve)
  );

  console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`);
}

const get_ip = (req: any) => {
  const ip =
    req.headers["do-connecting-ip"] ||
    req.headers["x-real-ip"] ||
    req.headers["x-forwaded-for"] ||
    req.socket.remoteAddress ||
    "";
  return typeof ip === "string" ? ip : ip[0];
};
startServer();

/**
 * Thoughts
 *
 * We can check for valid publishers based on impressions the've gotten in the past
 * 30 days, helps filter against inactive ones and allowe new sign ups
 *
 * Also pick based metric choses by advertiser e.g. if they want clicks
 * choose advertisers that have had highest click rates
 *
 *
 */
