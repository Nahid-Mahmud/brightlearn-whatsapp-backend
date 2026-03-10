import { Router } from 'express';

export const router: Router = Router();

interface IModuleRoute {
  path: string;
  route: Router;
}

const moduleRoutes: IModuleRoute[] = [];

moduleRoutes.forEach((route) => {
  router.use(route.path, route.route);
});
