import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import typeDefs from "./schema"; // Import your schema definition
import resolvers from "./resolvers"; // Import your resolver functions
import { PORT } from "./utils/get_env_variables";
import { supabase } from "./utils/init_db";

const server = new ApolloServer({ typeDefs, resolvers });

(async () => {
  const { url } = await startStandaloneServer(server, {
    listen: { port: PORT },
    context: async () => ({
      supabase,
    }),
  });

  console.log(`🚀  Server ready at: ${url}`);
})();
