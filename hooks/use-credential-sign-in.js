"use client";

import { signIn } from "next-auth/react";

/**
 * Signs in with credentials and performs a full page navigation so the session
 * cookie is applied before protected routes load (fixes production redirect loops).
 */
export async function credentialSignIn(providerId, { email, password, callbackUrl }) {
  const res = await signIn(providerId, {
    email,
    password,
    redirect: false,
    callbackUrl,
  });

  if (res?.error) {
    return { ok: false, error: res.error };
  }

  if (res?.ok) {
    window.location.assign(callbackUrl);
    return { ok: true };
  }

  return { ok: false, error: "Sign in failed" };
}
