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
const standalone_1 = require("@apollo/server/standalone");
const schema_1 = __importDefault(require("./schema")); // Import your schema definition
const resolvers_1 = __importDefault(require("./resolvers")); // Import your resolver functions
const get_env_variables_1 = require("./utils/get_env_variables");
const init_db_1 = require("./utils/init_db");
const server = new server_1.ApolloServer({ typeDefs: schema_1.default, resolvers: resolvers_1.default });
(() => __awaiter(void 0, void 0, void 0, function* () {
    const { url } = yield (0, standalone_1.startStandaloneServer)(server, {
        listen: { port: get_env_variables_1.PORT },
        context: () => __awaiter(void 0, void 0, void 0, function* () {
            return ({
                supabase: init_db_1.supabase,
            });
        }),
    });
    console.log(`🚀  Server ready at: ${url}`);
}))();
