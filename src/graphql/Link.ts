// objectType is used to define a new `type` in graqpQL schema
import { extendType, objectType } from "nexus";
import { NexusGenObjects } from "../../nexus-typegen";

export const Link = objectType({
    name: "Link",
    definition(t) {
        t.nonNull.int("id");
        t.nonNull.string("description");
        t.nonNull.string("url");
    },
});

// not using a DB, just in-memory, so this is our data source!
let links: NexusGenObjects["Link"][]= [
    {
        id: 1,
        url: "www.howtographql.com",
        description: "Fullstack tutorial for GraphQL",
    },
    {
        id: 2,
        url: "graphql.org",
        description: "GraphQL official website",
    },
];

/*
* extends the `Query` type, adding a new root field 'feed'*/
export const LinkQuery = extendType({
    type: "Query",
    definition(t) {
        // return type is 'not nullable array of link type objects' ~ [Link!]!
        t.nonNull.list.nonNull.field("feed", {
            type: "Link",
            // 'resolve' is the name of the resolver function
            resolve(parent, args, context, info) {
                return links;
            },
        });
    },
});