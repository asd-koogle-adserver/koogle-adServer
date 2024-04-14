import { ApolloServer } from "@apollo/server";
import typeDefs from "./schema"; // Import your schema definition
import resolvers from "./resolvers"; // Import your resolver functions
import { PORT } from "./utils/get_env_variables";
import { supabase } from "./utils/init_db";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import cors from "cors";
import express from "express";
import http from "http";
import { json } from "body-parser";
import morgan from "morgan";
import { click_capture_schema } from "./api_schema/click_capture";
import moment from "moment";
import geoip from "fast-geoip";
import ip from "ip"

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

  app.get("/ip", async (req, res) => {

    const ip_address = ip.address() || "207.97.227.239";
    const geo = await geoip.lookup(ip_address);

    res.send(geo);
  });

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
