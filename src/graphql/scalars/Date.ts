import { asNexusMethod } from "nexus";
import { GraphQLDateTime } from "graphql-scalars";

// asNexusMethod exposes a custom scalar as a Nexus (graphQL framework) type
export const GQLDate = asNexusMethod(GraphQLDateTime, "dateTime");