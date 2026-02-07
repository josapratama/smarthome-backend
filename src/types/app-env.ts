export type HonoVars = {
  auth: {
    user: { id: number; role: "USER" | "ADMIN" };
  };
  device?: {
    id: number;
    homeId: number | null;
    userId: number;
  };
};

export type AppEnv = {
  Variables: HonoVars;
};
