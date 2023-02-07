import { objectType, extendType, nonNull, stringArg } from "nexus";
import * as bcrypt from "bcrypt";
import * as jwt from "jsonwebtoken";
import { APP_SECRET as SECRET_KEY } from "../utils/auth";
import { User } from "@prisma/client";

// DEFINE OBJECT
export const AuthPayload = objectType({
    name: "AuthPayload",
    definition(t) {
        t.nonNull.string("token");
        t.nonNull.field("user", {
            type: "User",
        });
    },
});

//DEFINE MUTATORS
export const AuthMutation = extendType({
    type: "Mutation",
    definition(t) {

        // CREATE THE SIGNUP MUTATUION
        t.nonNull.field("signup", {
            type: AuthPayload,
            args: {
                email: nonNull(stringArg()),
                password: nonNull(stringArg()),
                name: nonNull(stringArg()),
            },
            async resolve(parent, args, context) {
                const { email, name } = args;
                const encryptedPassword = await encryptPassword(args.password);

                // store new user, with encrypted password
                const user: User = await context.prisma.user.create({
                    data: { email, name, password: encryptedPassword },
                });

                const token = getToken(user.id);

                // return an obj in the shape of the AuthPayload
                return {
                    token,
                    user,
                };
            },
        });

        // CREATE THE LOGIN MUTATUION
        t.nonNull.field("login", {
            type: AuthPayload,
            args: {
                email: nonNull(stringArg()),
                password: nonNull(stringArg()),
            },
            async resolve(parent, args, context) {
                const user = await context.prisma.user.findUnique({
                    where: { email: args.email },
                });

                const valid = user ? await comparePasswords(args.password, user.password) : false;
                if (!user || !valid) {
                    throw new Error("Incorrect email or password. Do you even have an account?");
                }

                const token = getToken(user.id);

                return {
                    token,
                    user,
                };
            },
        });
    },
});

const encryptPassword = async (password: string) => {
    return await bcrypt.hash(password, 10);
}

const getToken = (userId: number) => {
    return jwt.sign(userId.toString(), SECRET_KEY);
}

const comparePasswords = async (password: string, storedPassword: string) => {
    return await bcrypt.compare(password, storedPassword);
}