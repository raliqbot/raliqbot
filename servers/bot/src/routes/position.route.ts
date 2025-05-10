import type { FastifyInstance, FastifyRequest } from "fastify";

import { db } from "../instances";
import { selectPositionSchema } from "../db/zod";
import { getPositionById } from "../controllers/positions.controller";

export const getPositionRoute = (
  request: FastifyRequest<{
    Params: Pick<Zod.infer<typeof selectPositionSchema>, "id">;
  }>
) => getPositionById(db, request.params!.id);

export const registerPositionRoutes = (fastify: FastifyInstance) => {
  fastify.route({
    method: "GET",
    url: "/positions/:id/",
    handler: getPositionRoute,
  });
};
