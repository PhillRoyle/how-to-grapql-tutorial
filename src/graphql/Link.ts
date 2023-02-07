// objectType is used to define a new `type` in graqhQL schema
import { extendType, intArg, nonNull, objectType, stringArg } from "nexus";

// *********************
// Define the Object Schema itself
// *********************
export const Link = objectType({
    name: "Link",
    definition(t) {
        t.nonNull.int("id");
        t.nonNull.string("description");
        t.nonNull.string("url");
        // add an OPTIONAL (not nonNull) link to the user who created this. Note it's 
        // a `field` here, not an easily resolvable scalar type, so the `resolver`
        // fn tells graphql how to get this from the DB and how to return it.
        t.field("postedBy", {
            type: "User",
            resolve(parent, args, context) {
                return context.prisma.link
                    .findUnique({ where: { id: parent.id } })
                    .postedBy();
            },
        });
    },
});

// *********************
// Below here, define the Queries & Mutations that make up my API
// *********************

// extends the `Query` type, adding a new root field 'feed'
export const LinkQuery = extendType({
    type: "Query",
    definition(t) {
        // return type is 'not nullable array of link type objects' ~ [Link!]!
        t.nonNull.list.nonNull.field("fetchAllLinks", {
            type: "Link",
            // 'resolve' is the name of the resolver function
            resolve(parent, args, context, info) {
                // return links;
                return context.prisma.link.findMany();
            },
        });
    },
});

// return a single Feed item
// extends the `Query` type, adding a new root field 'feed'
export const FeedQuery = extendType({
    type: "Query",
    definition(t) {
        t.nonNull.field("fetchSingleLink", {
            type: "Link",
            // basically the body of a post request
            args: {
                id: nonNull(intArg()),
            },
            // 'resolve' is the name of the resolver function
            resolve(parent, args, context, info) {
                const { id } = args;
                return context.prisma.link.findUnique({
                    where: {
                        id: id
                    }
                });
            },
        });
    },
});

// extends the `Mutation` type, adding a new root field 'feed'
export const LinkMutation = extendType({
    type: "Mutation",
    definition(t) {
        // I guess this could be 'put' or 'delete' too?
        t.nonNull.field("createLink", {
            type: "Link",
            // basically the body of a post request
            args: {
                description: nonNull(stringArg()),
                url: nonNull(stringArg()),
            },

            resolve(parent, args, context) {
                const { description, url } = args;
                const newLink = context.prisma.link.create({
                    data: {
                        description,
                        url,
                    },
                });
                return newLink;
            },
        });
    },
});

export const DeleteLinkMutation = extendType({
    type: "Mutation",
    definition(t) {
        // I guess this could be 'put' or 'delete' too?
        t.nonNull.field("deleteLink", {
            type: "Link",
            // basically the body of a post request
            args: {
                id: nonNull(intArg()),
            },

            resolve(parent, args, context) {
                const linkForDeletion = context.prisma.link.delete({
                    where: {
                        id: args.id
                    }
                });
                return linkForDeletion;
            },
        });
    },
});


export const ModifyLinkMutation = extendType({
    type: "Mutation",
    definition(t) {
        t.nonNull.field("updateLink", {
            type: "Link",
            // basically the body of a post request
            args: {
                id: nonNull(intArg()),
                // make these optional by not making them non-null
                description: stringArg(),
                url: stringArg(),
            },

            resolve(parent, args, context) {
                const { id, description, url } = args;

                const linkToModify = context.prisma.link.update({
                    where: {
                        id,
                    },
                    data: {
                        //when a field is assigned undefined it means ignore this and do nothing for this field.
                        description: description ? description : undefined,
                        url: url ? url : undefined,
                    }
                });

                return linkToModify;
            },
        });
    },
});
