import { ApolloClient, InMemoryCache } from "@apollo/client";
import UploadHttpLink from "apollo-upload-client/UploadHttpLink.mjs";
const client = new ApolloClient({
  link: new UploadHttpLink({
    uri: import.meta.env.VITE_BACKEND_GRAPHQL_URL, // Use environment variable or default to localhost
  }),
  cache: new InMemoryCache(),
});

export default client;
