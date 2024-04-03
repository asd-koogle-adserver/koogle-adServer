import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import typeDefs from './schema'; // Import your schema definition
import resolvers from './resolvers'; // Import your resolver functions

const server = new ApolloServer({ typeDefs, resolvers });

(async ()=>{
  const { url } = await startStandaloneServer(server, {
    listen: { port: 8080 }, //port
  });

  console.log(`🚀  Server ready at: ${url}`);
})()
