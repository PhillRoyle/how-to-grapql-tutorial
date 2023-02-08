import { objectType } from "nexus";

// *********************
// Define the Object Schema itself
// *********************
export const User = objectType({
  name: "User",
  definition(objDefinitionBlock) {
    objDefinitionBlock.nonNull.int("id");
    objDefinitionBlock.nonNull.string("name");
    objDefinitionBlock.nonNull.string("email");
    objDefinitionBlock.nonNull.list.nonNull.field("links", {
      type: "Link",
      // note, `links` is complex, so graphQL can't work it out. We need to provide a resolver explicitly.
      resolve(parent, args, context) {
        //no `info` field here?!?!
        // using the `id` from `parent`, fetch all the `links` for that user from the DB, and return a list of them.
        return context.prisma.user
          .findUnique({ where: { id: parent.id } })
          .links();
      },
    });
    objDefinitionBlock.nonNull.list.nonNull.field("votes", {
      type: "Link",
      resolve(parent, args, context) {
        return context.prisma.user
          .findUnique({ where: { id: parent.id } })
          .votes();
      },
    });
  },
});
