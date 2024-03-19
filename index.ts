
// //version 2
// import express from 'express';
// import { ApolloServer } from 'apollo-server-express';
// import typeDefs from './schema'; // Import your schema definition
// import resolvers from './resolvers'; // Import your resolver functions

// const app = express();

// const server = new ApolloServer({ typeDefs, resolvers });

// const PORT = process.env.PORT || 4000;

// app.listen(PORT, () => {
//   console.log(`Server running on port http://localhost:${PORT}${server.graphqlPath}`);
// });

//version3
import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import typeDefs from './schema'; // Import your schema definition
import resolvers from './resolvers'; // Import your resolver functions
import bodyParser from 'body-parser'; // Import body-parser middleware

const app = express();

// Middleware for parsing request bodies
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Middleware for serving static files
app.use(express.static('public')); // Assuming your static files are in the 'public' directory

const server = new ApolloServer({ typeDefs, resolvers });

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server running on port http://localhost:${PORT}${server.graphqlPath}`);
});
