import {ApolloServer} from "@apollo/server";
import {startStandaloneServer} from "@apollo/server/standalone";
import {schema} from "./schema";

export const server = new ApolloServer({
    schema,
});

const port = 3000;
startStandaloneServer(server, {
    listen: {port: port},
}).then(({url}) => {
    console.log(`🚀  Server ready at: ${url}`);
});
