"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = require("@apollo/server");
const schema_1 = __importDefault(require("./schema")); // Import your schema definition
const resolvers_1 = __importDefault(require("./resolvers")); // Import your resolver functions
const get_env_variables_1 = require("./utils/get_env_variables");
const init_db_1 = require("./utils/init_db");
const express4_1 = require("@apollo/server/express4");
const drainHttpServer_1 = require("@apollo/server/plugin/drainHttpServer");
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express")); //use this library for
const http_1 = __importDefault(require("http"));
const body_parser_1 = require("body-parser");
const morgan_1 = __importDefault(require("morgan"));
const click_capture_1 = require("./api_schema/click_capture");
const impressions_1 = require("./api_schema/impressions");
const fast_geoip_1 = __importDefault(require("fast-geoip"));
const app = (0, express_1.default)();
app.use((0, body_parser_1.json)());
app.use((0, morgan_1.default)("dev"));
const httpServer = http_1.default.createServer(app);
const server = new server_1.ApolloServer({
    typeDefs: schema_1.default,
    resolvers: resolvers_1.default,
    // introspection: NODE_ENV !== "production", //Disabled for production builds
    plugins: [(0, drainHttpServer_1.ApolloServerPluginDrainHttpServer)({ httpServer })],
});
function startServer() {
    return __awaiter(this, void 0, void 0, function* () {
        yield server.start();
        app.get("/redirect", (req, res) => __awaiter(this, void 0, void 0, function* () {
            const { error: validationError, value } = click_capture_1.click_capture_schema.validate(req.query);
            if (validationError) {
                return res.status(405).send({
                    success: false,
                    error: "VALIDATION_ERROR",
                    message: validationError.details[0].message,
                });
            }
            const { ad_item_id, publisher_id } = value;
            const { data: adItemData, error } = yield init_db_1.supabase
                .from("adverts")
                .select()
                .eq("id", ad_item_id)
                .maybeSingle();
            if (!adItemData) {
                return res.send("No Ad Item Found");
            }
            //Check if ip has already been recorded to have clicked this advert today
            //if so don't record the click, DoS
            //Record this as a click event
            yield init_db_1.supabase.from("clicks").insert({
                advert_id: ad_item_id,
                publisher_id,
                ip_address: get_ip(req),
            });
            //We can choose to transfer funds to publisher that brought the here
            console.log("Click captured");
            return res.redirect(adItemData.target_url);
        }));
        app.get("/ip", (req, res) => __awaiter(this, void 0, void 0, function* () {
            const ip_address = get_ip(req);
            const geo = yield fast_geoip_1.default.lookup(ip_address);
            res.send(Object.assign({ ip_address }, geo));
        }));
        app.get("/adserve", (req, res) => __awaiter(this, void 0, void 0, function* () {
            //TODO: query parameter should include the advertiser id to know who sent client
            const { error: validationError, value } = impressions_1.impression_schema.validate(req.query);
            if (validationError) {
                return res.status(405).send({
                    success: false,
                    error: "VALIDATION_ERROR",
                    message: validationError.details[0].message,
                });
            }
            const { type, zone_id, publisher_id } = value;
            const { data: zoneItemData, error } = yield init_db_1.supabase
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
            const { data: campaignItemData, error: campaignError } = yield init_db_1.supabase
                .from("campaigns")
                .select("*, adverts(*, zones(*))")
                .eq("adverts.zones.width", zoneItemData.width)
                .eq("adverts.zones.height", zoneItemData.height)
                .lte("start_date", currentTimestamp)
                .gte("end_date", currentTimestamp);
            if (campaignItemData === null || campaignItemData === void 0 ? void 0 : campaignItemData.length) {
                console.log(campaignItemData, " campaing data....");
            }
            if (campaignError) {
                console.log(campaignError);
                // Handle any potential errors
                return res.status(200).send("Error fetching campaign");
            }
            if (!campaignItemData.length) {
                return res.send("No Campaign Found");
            }
            //TODO: check if any of the campaigns have regions defined if check again caller region
            const validCampaigns = campaignItemData.filter((camp) => camp.adverts.length);
            if (!validCampaigns.length) {
                return res.send("No Campaign Found");
            }
            // Here choose now a specific campaign that will be selected
            const selectedCampaign = validCampaigns[Math.floor(Math.random() * validCampaigns.length)];
            const campaignID = selectedCampaign.id;
            const { data: advertItemData, error: advertError } = yield init_db_1.supabase
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
            const selectedAdvert = advertItemData[Math.floor(Math.random() * advertItemData.length)];
            const advertID = selectedAdvert.id;
            // EoF TODO: After the ad selection criteria has been set we store the impression
            //           And generate the ad
            const { error: impressionCaptureError } = yield init_db_1.supabase
                .from("impressions")
                .insert({
                // placement_id: placement_id,
                // zone_id: zone_id,
                // campaign_id: campaignID,
                advert_id: advertID,
                publisher_id: publisher_id,
                ip_address: get_ip(req),
            });
            console.log(impressionCaptureError);
            // Creates redirect url, like below
            //Need revisit the query parameters what's needed is the
            //zone_id, idvertiser_id,
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
        })
        //placement
        //test run
        // res.send("Hello, Help, will it change!")
        );
        app.use("/", (0, cors_1.default)({
            origin: true,
            credentials: true,
        }), 
        // json(),
        // cookieParser(),
        (0, express4_1.expressMiddleware)(server, {
            context: (_a) => __awaiter(this, [_a], void 0, function* ({ req, res }) {
                return ({
                    // user: await get_user(req,res, JWT_SECRET,tokenRepository),
                    // authScope: getScope(req.headers.authorization) ,
                    res,
                    req,
                });
            }),
        }));
        yield new Promise((resolve) => httpServer.listen({ port: get_env_variables_1.PORT }, resolve));
        console.log(`🚀 Server ready at http://localhost:${get_env_variables_1.PORT}/graphql`);
    });
}
const get_ip = (req) => {
    const ip = req.headers["do-connecting-ip"] ||
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
 * Placements can be kept if we choose to group adverts and publishers
 * based on matching budget but this already going to be done on the backend
 *
 */
