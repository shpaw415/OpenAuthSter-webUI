import { onRequest as __api_invites_accept_project_js_onRequest } from "/home/shpaw415/openauth-projects/openauth-webui/functions/api/invites/accept/project.js"
import { onRequest as __api_projects_manage_js_onRequest } from "/home/shpaw415/openauth-projects/openauth-webui/functions/api/projects/manage.js"
import { onRequest as __api_users_index_js_onRequest } from "/home/shpaw415/openauth-projects/openauth-webui/functions/api/users/index.js"
import { onRequest as __api__middleware_js_onRequest } from "/home/shpaw415/openauth-projects/openauth-webui/functions/api/_middleware.js"

export const routes = [
    {
      routePath: "/api/invites/accept/project",
      mountPath: "/api/invites/accept",
      method: "",
      middlewares: [],
      modules: [__api_invites_accept_project_js_onRequest],
    },
  {
      routePath: "/api/projects/manage",
      mountPath: "/api/projects",
      method: "",
      middlewares: [],
      modules: [__api_projects_manage_js_onRequest],
    },
  {
      routePath: "/api/users",
      mountPath: "/api/users",
      method: "",
      middlewares: [],
      modules: [__api_users_index_js_onRequest],
    },
  {
      routePath: "/api",
      mountPath: "/api",
      method: "",
      middlewares: [__api__middleware_js_onRequest],
      modules: [],
    },
  ]