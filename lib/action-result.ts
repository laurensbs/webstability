// Shared shape that server actions return so the client can show a toast.
// Keeps server actions side-effect-y (revalidatePath, etc.) but adds a
// machine-readable result the form wrapper can react to.
export type ActionResult = { ok: true; messageKey?: string } | { ok: false; messageKey: string };
