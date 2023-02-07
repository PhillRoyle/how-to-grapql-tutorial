import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { schema } from "./schema";
import { Context, context } from "./context";

export const server = new ApolloServer<Context>({
    schema,
});

const port = 3000;

async function startServer() {

    const { url } = await startStandaloneServer(server, {
        listen: { port },
        context: async ({ req }) => {
            return context({ req })
        },
    });
    console.log(`🚀  Server ready at ${url}`);
}

{
    console.log(`**** called the block`);
    startServer();
    console.log(`**** done called the block`);
};