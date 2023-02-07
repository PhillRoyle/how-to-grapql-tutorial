// plain JS object to pass infor btw resolvers.
//here used to initialise prisma on startup

import { PrismaClient } from "@prisma/client";
import { decodeAuthHeader, AuthTokenPayload } from "./utils/auth";

export const prisma = new PrismaClient();

//specify which objects should be attached to `context`
export interface Context {
  prisma: PrismaClient;
  // optional, as this won't be added if req sent without auth header.
  userId?: number;
}

// context no longer an object, but a fn
export const context = async ({ req }): Promise<Context> => {
  const token = req?.headers?.authorization
    ? decodeAuthHeader(req.headers.authorization)
    : null;

//   console.log(`****** in cintext: ${req?.headers?.authorization}, 
//         token = ${token} token?.userId = ${token?.userId}`);

  return {
    prisma,
    userId: token?.userId,
  };
};
