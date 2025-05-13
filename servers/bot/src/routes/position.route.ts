import type { FastifyInstance, FastifyRequest } from "fastify";

import { db } from "../instances";
import { selectPositionSchema } from "../db/zod";
import {
  getPositionById,
  getPositionsWhere,
} from "../controllers/positions.controller";

const getPositionsRoute = () => getPositionsWhere(db);

const getPositionRoute = (
  request: FastifyRequest<{
    Params: Pick<Zod.infer<typeof selectPositionSchema>, "id">;
  }>
) => getPositionById(db, request.params!.id);

export const registerPositionRoutes = (fastify: FastifyInstance) => {
  fastify.route({
    method: "GET",
    url: "/positions/",
    handler: getPositionsRoute,
  });
  fastify.route({
    method: "GET",
    url: "/positions/:id/",
    handler: getPositionRoute,
  });
};
