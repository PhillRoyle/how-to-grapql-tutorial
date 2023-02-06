// objectType is used to define a new `type` in graqhQL schema
import {extendType, intArg, nonNull, objectType, stringArg} from "nexus";
// this was the fella before adding mutation
// import { extendType, objectType } from "nexus";
import {NexusGenObjects} from "../../nexus-typegen";

export const Link = objectType({
    name: "Link",
    definition(t) {
        t.nonNull.int("id");
        t.nonNull.string("description");
        t.nonNull.string("url");
    },
});

// not using a DB, just in-memory, so this is our data source!
let links: NexusGenObjects["Link"][] = [
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

// *********************
// Below here, define the Queries & Mutations that make up my API
// *********************

// extends the `Query` type, adding a new root field 'feed'
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

// return a single Feed item
// extends the `Query` type, adding a new root field 'feed'
export const FeedQuery = extendType({
    type: "Query",
    definition(t) {
        t.nonNull.field("single_link", {
            type: "Link",
            // basically the body of a post request
            args: {
                id: nonNull(intArg()),
            },
            // 'resolve' is the name of the resolver function
            resolve(parent, args, context, info) {
                const {id} = args;
                return links.find(Link => Link.id === id);
            },
        });
    },
});

// extends the `Mutation` type, adding a new root field 'feed'
export const LinkMutation = extendType({
    type: "Mutation",
    definition(t) {
        // I guess this could be 'put' or 'delete' too?
        t.nonNull.field("post", {
            type: "Link",
            // basically the body of a post request
            args: {
                description: nonNull(stringArg()),
                url: nonNull(stringArg()),
            },

            resolve(parent, args, context) {
                const {description, url} = args;

                // naive way to increment IDs...
                let idCount = links.length + 1;
                const link = {
                    id: idCount,
                    description: description,
                    url: url,
                };
                links.push(link);
                return link;
            },
        });
    },
});

export const DeleteLinkMutation = extendType({
    type: "Mutation",
    definition(t) {
        // I guess this could be 'put' or 'delete' too?
        t.nonNull.field("delete", {
            type: "Link",
            // basically the body of a post request
            args: {
                id: nonNull(intArg()),
            },

            resolve(parent, args, context) {
                const {id} = args;

                const linkForDeletion = links.find(link => link.id === id);
                const linkToDeleteIndex = links.indexOf(linkForDeletion);
                links.splice(linkToDeleteIndex, 1)
                return linkForDeletion;
            },
        });
    },
});


export const ModifyLinkMutation = extendType({
    type: "Mutation",
    definition(t) {
        t.nonNull.field("updateArgument", {
            type: "Link",
            // basically the body of a post request
            args: {
                id: nonNull(intArg()),
                // make these two optional... only modify what you want
                description: stringArg(),
                url: stringArg(),
            },

            resolve(parent, args, context) {
                const {id, description, url} = args;

                const linkToModify = links.find(Link => Link.id === id);
                const index = links.indexOf(linkToModify);

                linkToModify.description = description ? description : linkToModify.description;
                linkToModify.url = url ? url : linkToModify.url;
                return linkToModify;
            },
        });
    },
});
