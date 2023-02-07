// plain JS object to pass infor btw resolvers.
//here used to initialise prisma on startup

import {PrismaClient} from "@prisma/client";

export const prisma = new PrismaClient();

//specify which objects should be attached to `context`
export interface Context {
    prisma: PrismaClient;
}

export const context: Context = {
    prisma,
};