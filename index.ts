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
import moment from "moment";
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

    const { placementID, zoneID, campaignID, adItemID } = value;

    const { data: adItemData, error } = await supabase
      .from("adverts")
      .select()
      .eq("id", adItemID)
      .maybeSingle();

    if (!adItemData) {
      return res.send("No Ad Item Found");
    }

    console.log(adItemData, " ------------- ", error);

    //Check if ip has already been recorded to have clicked this advert today
    //if so don't record the click, DoS

    //Record this as a click event
    const { error: clickCaptureError } = await supabase.from("clicks").insert({
      placement_id: placementID,
      zone_id: zoneID,
      campaign_id: campaignID,
      advert_id: adItemID,
      ip: get_ip(req),
    });

    //We can choose to transfer funds to publisher that brought the here

    console.log("Click captured");

    // res.redirect("http://localhost:8000");
    return res.redirect(adItemData.data.location);
  });

  app.get("/ip", async (req, res) => {
    const ip_address = get_ip(req);
    const geo = await geoip.lookup(ip_address);

    res.send({ ip_address, ...geo });
  });

  app.get(
    "/adserve",
    async (req, res) => {
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

      const { type, zone_id } = value;

      const { data: zoneItemData, error } = await supabase
        .from("zones") //supabase table name
        .select()
        .eq("id", zone_id)
        .maybeSingle();

      if (!zoneItemData) {
        return res.send("No Zone Item Found");
      }

      const { data: placementsData, error: placementError } = await supabase
        .from("placements") //supabase table name
        .select()
        .eq("zone_id", zone_id);

      if (!placementsData || placementsData.length === 0) {
        return res.send("No Placements Found"); //can add as we go
      }

      //placement
      // Select a random placement from the fetched placements data
      const randomIndex = Math.floor(Math.random() * placementsData.length);
      const randomPlacement = placementsData[randomIndex];
      const placement_id = randomPlacement.id;

      // const type = req.query.type; //request a query
      //const placement_id = parseInt(req.query.placement_id?.toString() ?? '0'); //retrieves the zone.id and parses the value into Int. query parameters are typically treated as strings, so parsing to an integer ensures proper type handling
      //still change ontop my logic
      const { data: placementItemData } = await supabase
        .from("campaigns") //supabase table name
        .select()
        .eq("id", placement_id)
        .maybeSingle();

      if (!placementItemData) {
        return res.send("No Placements Found");
      }
      //TODO: From here on the logic needs to studied applied according to our ad server
      //      We need to pick appropriate according to the publisher and advertiser match
      //      A mixture of price, category and region

      const campaign = parseInt(req.query.campaignID?.toString() ?? "0");

      const { data: campaignItemData, error: campaignError } = await supabase
        .from("Campaign")
        .select()
        .eq("id", placementItemData.advertisement_id)
        .maybeSingle();

      if (campaignError) {
        // Handle any potential errors
        return res.status(200).send("Error fetching campaign");
      }

      if (!campaignItemData) {
        return res.send("No Campaign Found");
      }
      const campaignID = campaignItemData.id;

      const adItem: any = {}; //TODO: this should be replace with actual advert that is select in the dnd
      const adItemID = "";
      // EoF TODO: After the ad selection criteria has been set we store the impression
      //           And generate the ad

      const { error: clickCaptureError } = await supabase
        .from("impressions")
        .insert({
          placement_id: placement_id,
          zone_id: zone_id,
          campaign_id: campaignID,
          advert_id: adItemID,
          ip: get_ip(req),
        });

      // Creates redirect url, like below
      const host = req.protocol + "://" + req.get("host");
      const redirectURL = `${host}/redirect?placement_id=${placement_id}&zone_id=${zone_id}&campaign_id=${campaignID}&ad_item_id=${adItemID}`;
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
            adItem.target_url +
            '" rel="nofollow">';
          response +=
            '<img src="' +
            adItem.content_url +
            '" border="0" width="' +
            adItem.width +
            '" height="' +
            adItem.height +
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
            adItem.target_url +
            '" rel="nofollow">';
          response +=
            '<img src="' +
            adItem.content_url +
            '" border="0" width="' +
            adItem.width +
            '" height="' +
            adItem.height +
            '">';
          response += "</a>";

          res.send(response);
          return;
        }
        case "json": {
          response = {
            width: adItem.width,
            height: adItem.height,
            target: adItem.target_url,
            redirect_url: redirectURL,
            image_url: adItem.content_url,
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
