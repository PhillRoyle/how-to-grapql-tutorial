import { Prisma } from "@prisma/client";
import { extendType, intArg, objectType, stringArg } from "nexus";
import { Link, retrieveManyLinks } from "./Link";

/*
Add a new type to wrap 'Links' - in the tutorial, this goes *inside* Links and it's refactored.
*/

export const LinkFeed = objectType({
  name: "LinkFeed",
  definition(t) {
    t.nonNull.list.nonNull.field("links", { type: Link });
    t.nonNull.int("count");
    t.id("id");
  },
});

// copied from branch 2, basic fetchAll.
// Could also add in filter, sort, etc, or could add into `Link` rather than here, or _probably_ could somehow wrap them
export const LinkFeedQuery = extendType({
  type: "Query",
  definition(t) {
    t.nonNull.field("LinkFeed", {
      type: LinkFeed,
      args: {
        filter: stringArg(), // optional arg
        take: intArg(),
        skip: intArg(),
      },
      // made this async
      async resolve(parent, args, context) {
        // TODO - try to import retrieveManyLinks

        console.log(`**** args = ${JSON.stringify(args)}`);

        const where = {}; // left empty here....

        // fetch all the links according to input params - awaited, as we need the result
        // const links = await context.prisma.link.findMany({
        //   where,
        //   //ignored filter, etc
        // });

        // I have no idea if this is good practice, but it works!!!
        const links = retrieveManyLinks(args, context);

        // count up the size of the list. Note, this is a prisma query, not looking at results from above, so `where`
        // is still needed. skip, take, and orderBy not used for count...
        const count = await context.prisma.link.count({ where });
        // generates a unique id for the feed query; every different set of args will give a different feed. Why though?  :shrug:
        const id = `main-feed:${JSON.stringify(args)}`;

        return {
          links,
          count,
          id,
        };
      },
    });
  },
});
