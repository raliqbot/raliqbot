import { FastifyInstance } from "fastify";
import { registerPositionRoutes } from "./position.route";

export default function registerRoutes(server: FastifyInstance){
    registerPositionRoutes(server);
}