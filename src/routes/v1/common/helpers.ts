export const toISO = (d: Date | null | undefined) =>
  d ? d.toISOString() : null;

export const getClientIp = (c: any) => {
  const xf = c.req.header("x-forwarded-for");
  if (xf) return xf.split(",")[0]?.trim() ?? null;
  return c.req.header("x-real-ip") ?? null;
};
