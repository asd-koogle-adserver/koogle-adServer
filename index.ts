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
import { impression_capture_schema } from "./api_schema/impressions";
import { zones } from "./dummy";

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
      .from("ad")
      .select()
      .eq("id", adItemID)
      .maybeSingle();

    if (!adItemData) {
      return res.send("No Ad Item Found");
    }

    console.log(adItemData, " ------------- ", error);

    const query = {
      placement_id: placementID,
      zone_id: zoneID,
      campaign_id: campaignID,
      ad_id: adItemID,
      date: moment().format("YYYY-MM-DD"),
    };

    const { data, error: incrementError } = await supabase.rpc(
      "increment",
      query
    );

    if (incrementError) {
      const { error } = await supabase.from("report").insert({
        clicks: 1,
        ...query,
      });
    }

    console.log("Click captured");

    // res.redirect("http://localhost:8000");
    return res.redirect(adItemData.data.location);

  });

  app.get("/adserve", async (req, res) => {
    //logic goes here
    try {
      const type = req.query.type; //request a query
      const zoneID = parseInt(req.query.zoneID?.toString() ?? '0'); //retrieves the zone.id and parses the value into Int. query parameters are typically treated as strings, so parsing to an integer ensures proper type handling

      //if there is a Zone object or not
      const { data: zoneItemData, error } = await supabase
        .from("Zones") //supabase table name
        .select()
        .eq("id", zoneID)
        .maybeSingle();

      if (!zoneItemData) {
        return res.send("No Zone Item Found");
      }
      // } catch (e) { }
      // Query the 'Placements' table in Supabase
      const { data: placementsData, error: placementError } = await supabase
        .from("Placements") //supabase table name
        .select()
        .eq("zone_id", zoneID);


      if (!placementsData || placementsData.length === 0) {
        return res.send("No Placements Found");//can add as we go
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
        .from("Placement") //supabase table name
        .select()
        .eq("id", placement_id)
        .maybeSingle();

      if (!placementItemData) {
        return res.send("No Placements Found");
      }
      //const placementID = placement_id;

      //campaign
      //const type = req.query.type; //request a query
      const campaign = parseInt(req.query.campaignID?.toString() ?? '0');

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

      const { data: conversionsData } = await supabase
        .from("Conversions")
        .select()
        .eq("campaign_id", campaignID);

      // Retrieve ad items associated with conversions
      const adItems = [];

      if (conversionsData) {
        for (const conversion of conversionsData) {
          const { data: adItemsData, error: adItemsError } = await supabase
            .from("AdItem")
            .select()
            .eq("conversion_id", conversion.id); // Assuming ad items have a foreign key reference to conversions

          if (adItemsData) {
            adItems.push(...adItemsData);
          }
        }
      } else {
        // Handle the case when no conversions are found
        return res.send("No Conversions Found");
      }


    } catch (e) { }
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

startServer();
