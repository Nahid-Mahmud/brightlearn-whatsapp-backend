import { Router } from 'express';
import { whatsappRoutes } from '../modules/whatsapp/whatsapp.route';
export const router: Router = Router();

interface IModuleRoute {
  path: string;
  route: Router;
}

const moduleRoutes: IModuleRoute[] = [
  { path: '/whatsapp', route: whatsappRoutes },
];

moduleRoutes.forEach((route) => {
  router.use(route.path, route.route);
});
