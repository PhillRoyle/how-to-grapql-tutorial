import * as jwt from "jsonwebtoken";

// obvs this should not be in code-base - Secrets Manager, etc
export const APP_SECRET = "GraphQL-is-aw3some";

// our JWT auth tokens only contain this. When they're decoded, this is the shape they should be in
export interface AuthTokenPayload {
  userId: number;
}

export function decodeAuthHeader(authHeader: String): AuthTokenPayload {
  const token = authHeader.replace("Bearer ", "");

  if (!token) {
    throw new Error("No token found");
  }
  const myToken: AuthTokenPayload = {
    userId: +jwt.verify(token, APP_SECRET),
  };
  return myToken;

  //tutorial says I should just be able to return this, but it's not resolving to the obj & returns the userId...
  // return jwt.verify(token, APP_SECRET) as AuthTokenPayload;
}
