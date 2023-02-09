// objectType is used to define a new `type` in graqhQL schema
import { GraphQLError } from "graphql/error/GraphQLError";
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
    // createdAt is of type `dateTime`, defined in `graphql/scalars/Date`
    t.nonNull.dateTime("createdAt");
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
    t.nonNull.list.nonNull.field("voters", {
      type: "User",
      resolve(parent, args, context) {
        return context.prisma.link
          .findUnique({ where: { id: parent.id } })
          .voters();
      },
    });
  },
});

// *********************
// Below here, define the Queries & Mutations that make up my API
// *********************

// QUERIES **********

// extends the `Query` type, adding a new root field 'feed'
export const LinkQuery = extendType({
  type: "Query",
  definition(t) {
    // return type is 'not nullable array of link type objects' ~ [Link!]!
    t.nonNull.list.nonNull.field("fetchAllLinks", {
      type: "Link",
      args: {
        filter: stringArg(), // optional arg
        take: intArg(),
        skip: intArg(),
      },
      // 'resolve' is the name of the resolver function
      resolve(parent, args, context) {
        console.log(`******** args = ${JSON.stringify(args)}`);
        // defining the `where` clause up front to make it easier to read; note we check it exists
        const where = args.filter // 2
          ? {
              OR: [
                { description: { contains: args.filter } },
                { url: { contains: args.filter } },
              ],
            }
          : {};

        return context.prisma.link.findMany({
          where,
          take: args.take as number | undefined,
          skip: args.skip as number | undefined,
        });
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
            id: id,
          },
        });
      },
    });
  },
});

// MUTATIONS **********

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
        const { userId } = context; // added for auth

        // only auth users allowed
        if (!userId) {
          throw new GraphQLError("User is not authenticated", {
            extensions: {
              code: "UNAUTHENTICATED",
              http: { status: 401 },
            },
          });
        } else {
          const newLink = context.prisma.link.create({
            data: {
              description,
              url,
              // add userId - The connect operator is used by Prisma to specify which user the newly created link should be associated with.
              postedBy: { connect: { id: userId } },
            },
          });

          return newLink;
        }
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
        const { userId } = context; // added for auth

        // only auth users allowed
        if (!userId) {
          throw new GraphQLError("User is not authenticated", {
            extensions: {
              code: "UNAUTHENTICATED",
              http: { status: 401 },
            },
          });
        } else {
          const linkForDeletion = context.prisma.link.delete({
            where: {
              id: args.id,
            },
          });
          return linkForDeletion;
        }
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
        const { userId } = context; // added for auth

        // only auth users allowed
        if (!userId) {
          throw new GraphQLError("User is not authenticated", {
            extensions: {
              code: "UNAUTHENTICATED",
              http: { status: 401 },
            },
          });
        } else {
          const linkToModify = context.prisma.link.update({
            where: {
              id,
            },
            data: {
              //when a field is assigned undefined it means ignore this and do nothing for this field.
              description: description ? description : undefined,
              url: url ? url : undefined,
            },
          });

          return linkToModify;
        }
      },
    });
  },
});
