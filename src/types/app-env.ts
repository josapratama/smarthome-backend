export type HonoVars = {
  auth: {
    user: { id: number; role: "USER" | "ADMIN" };
  };
};

export type AppEnv = {
  Variables: HonoVars;
};
