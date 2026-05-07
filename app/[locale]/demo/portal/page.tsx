import { loginAsDemoPortal } from "@/app/actions/demo";

/**
 * Demo-portal entry-point. Server-component die direct
 * loginAsDemoPortal() aanroept; die action set de sessie-cookie en
 * redirect naar /portal/dashboard. De page-body wordt nooit gerenderd.
 *
 * Marketing-site linkt hier naar via DemoChooserModal.
 */
export default async function DemoPortalEntry() {
  await loginAsDemoPortal();
}
