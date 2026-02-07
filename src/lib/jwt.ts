import { SignJWT, jwtVerify } from "jose";
import { envJwt } from "./env";

const secretKey = new TextEncoder().encode(envJwt.JWT_SECRET);

export type JwtPayload = {
  sub: string; // userId string
  role: "USER" | "ADMIN";
};

export async function signAccessToken(payload: JwtPayload, expiresIn = "7d") {
  return new SignJWT({ role: payload.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secretKey);
}

export async function verifyAccessToken(token: string) {
  const { payload } = await jwtVerify(token, secretKey);
  const sub = payload.sub;
  const role = payload.role;
  if (!sub || (role !== "USER" && role !== "ADMIN"))
    throw new Error("BAD_TOKEN");
  return { userId: Number(sub), role: role as "USER" | "ADMIN" };
}
