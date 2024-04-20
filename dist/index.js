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
            const { placementID, zoneID, campaignID, adItemID } = value;
            const { data: adItemData, error } = yield init_db_1.supabase
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
            const { error: clickCaptureError } = yield init_db_1.supabase.from("clicks").insert({
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
        }));
        app.get("/ip", (req, res) => __awaiter(this, void 0, void 0, function* () {
            const ip_address = get_ip(req);
            const geo = yield fast_geoip_1.default.lookup(ip_address);
            res.send(Object.assign({ ip_address }, geo));
        }));
        app.get("/adserve", (req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const { error: validationError, value } = impressions_1.impression_schema.validate(req.query);
            if (validationError) {
                return res.status(405).send({
                    success: false,
                    error: "VALIDATION_ERROR",
                    message: validationError.details[0].message,
                });
            }
            const { type, zone_id } = value;
            const { data: zoneItemData, error } = yield init_db_1.supabase
                .from("zones") //supabase table name
                .select()
                .eq("id", zone_id)
                .maybeSingle();
            if (!zoneItemData) {
                return res.send("No Zone Item Found");
            }
            const { data: placementsData, error: placementError } = yield init_db_1.supabase
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
            const { data: placementItemData } = yield init_db_1.supabase
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
            const campaign = parseInt((_b = (_a = req.query.campaignID) === null || _a === void 0 ? void 0 : _a.toString()) !== null && _b !== void 0 ? _b : "0");
            const { data: campaignItemData, error: campaignError } = yield init_db_1.supabase
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
            const adItem = {}; //TODO: this should be replace with actual advert that is select in the dnd
            const adItemID = "";
            // EoF TODO: After the ad selection criteria has been set we store the impression
            //           And generate the ad
            const { error: clickCaptureError } = yield init_db_1.supabase
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
            context: (_c) => __awaiter(this, [_c], void 0, function* ({ req, res }) {
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
