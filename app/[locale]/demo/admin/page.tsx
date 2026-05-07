import { loginAsDemoAdmin } from "@/app/actions/demo";

/**
 * Demo-admin entry-point. Server-component die direct loginAsDemoAdmin()
 * aanroept; die action set de sessie-cookie en redirect naar /admin.
 * De page-body wordt nooit gerenderd.
 */
export default async function DemoAdminEntry() {
  await loginAsDemoAdmin();
}
