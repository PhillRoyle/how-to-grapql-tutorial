import { objectType, extendType, nonNull, intArg } from "nexus";
import { User } from "@prisma/client";

export const Vote = objectType({
  name: "Vote",
  definition(t) {
    // a vote is *by* a User, *on* a Link
    t.nonNull.field("link", { type: "Link" });
    t.nonNull.field("user", { type: "User" });
  },
});

export const VoteMutation = extendType({
  type: "Mutation",
  definition(t) {
    t.field("vote", {
      // NB tutorial has this, but should use a real type for non-scalars
      // type: "Vote",
      type: Vote,
      args: {
        // link being upvoted must be passed, but the user can be derived from the auth token
        linkId: nonNull(intArg()),
      },
      async resolve(parent, args, context) {
        const { userId } = context; // this is from the JWT, see `index.ts` and `context.ts`
        const { linkId } = args;

        if (!userId) {
          throw new Error("Cannot vote without logging in.");
        }

        let link;
        try {
          link = await context.prisma.link.update({
            where: {
              id: linkId,
            },
            data: {
              voters: {
                // remember, this is *really* in a join table, so we're `connect`ing the two
                connect: {
                  id: userId,
                },
              },
            },
          });
        } catch (e) {
          console.log(`ERROR - unable to update Link ${linkId} for User ${userId}`);
        }
        if (!link) {
          throw new Error(`ERROR - unable to vote for Link ${linkId}. Does it exist?`);
        }

        const user = await context.prisma.user.findUnique({
          where: { id: userId },
        });

        return {
          link,
          user: user as User, // need cast as type returned by prisma.user.findUnique is User | null
        };
      },
    });
  },
});
