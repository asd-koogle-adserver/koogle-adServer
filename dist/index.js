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
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const body_parser_1 = require("body-parser");
const morgan_1 = __importDefault(require("morgan"));
const click_capture_1 = require("./api_schema/click_capture");
const moment_1 = __importDefault(require("moment"));
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
                date: (0, moment_1.default)().format("YYYY-MM-DD"),
            };
            const { data, error: incrementError } = yield init_db_1.supabase.rpc("increment", query);
            if (incrementError) {
                const { error } = yield init_db_1.supabase.from("report").insert(Object.assign({ clicks: 1 }, query));
            }
            console.log("Click captured");
            // res.redirect("http://localhost:8000");
            return res.redirect(adItemData.data.location);
        }));
        app.get("/ip", (req, res) => __awaiter(this, void 0, void 0, function* () {
            const ip = req.headers["cf-connecting-ip"] ||
                req.headers["x-real-ip"] ||
                req.headers["x-forwaded-for"] ||
                req.socket.remoteAddress ||
                "";
            const ip_address = typeof ip === "string" ? ip : ip[0];
            const geo = yield fast_geoip_1.default.lookup(ip_address);
            res.send(Object.assign({ ip_address }, geo));
        }));
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
startServer();
