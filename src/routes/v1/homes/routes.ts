import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { HomeId } from "../common/ids";
import { listHomes, createHome, getHomeById } from "./handlers";
import { HomeCreateBody, HomeDTO, HomesListQuery } from "./schemas";

export function registerHomesRoutes(app: OpenAPIHono) {
  app.openapi(
    createRoute({
      method: "get",
      path: "/api/v1/homes",
      request: { query: HomesListQuery },
      responses: {
        200: {
          content: {
            "application/json": {
              schema: z.object({ data: z.array(HomeDTO) }),
            },
          },
          description: "List homes (filter by ownerId or ownerEmail).",
        },
      },
    }),
    async (c) => {
      const { ownerId, ownerEmail } = c.req.valid("query");
      const homes = await listHomes({ ownerId, ownerEmail });

      return c.json({
        data: homes.map((h) => ({
          id: h.id,
          name: h.name,
          ownerId: h.ownerId,
          createdAt: h.createdAt.toISOString(),
          updatedAt: h.updatedAt.toISOString(),
        })),
      });
    },
  );

  app.openapi(
    createRoute({
      method: "post",
      path: "/api/v1/homes",
      request: {
        body: { content: { "application/json": { schema: HomeCreateBody } } },
      },
      responses: {
        201: {
          content: {
            "application/json": { schema: z.object({ data: HomeDTO }) },
          },
          description: "Create a home for an existing user.",
        },
        404: { description: "Owner not found" },
      },
    }),
    async (c) => {
      const body = c.req.valid("json");
      const res = await createHome(body);
      if ("error" in res) return c.json({ error: res.error }, 404);

      const home = res.home;
      return c.json(
        {
          data: {
            id: home.id,
            name: home.name,
            ownerId: home.ownerId,
            createdAt: home.createdAt.toISOString(),
            updatedAt: home.updatedAt.toISOString(),
          },
        },
        201,
      );
    },
  );

  app.openapi(
    createRoute({
      method: "get",
      path: "/api/v1/homes/{homeId}",
      request: { params: z.object({ homeId: HomeId }) },
      responses: {
        200: {
          content: {
            "application/json": { schema: z.object({ data: HomeDTO }) },
          },
          description: "Get a home by ID.",
        },
        404: { description: "Not found" },
      },
    }),
    async (c) => {
      const { homeId } = c.req.valid("param");
      const res = await getHomeById(homeId);
      if ("error" in res) return c.json({ error: res.error }, 404);

      const home = res.home;
      return c.json({
        data: {
          id: home.id,
          name: home.name,
          ownerId: home.ownerId,
          createdAt: home.createdAt.toISOString(),
          updatedAt: home.updatedAt.toISOString(),
        },
      });
    },
  );
}
