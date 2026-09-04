import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Spinner } from "@astryxdesign/core/Spinner";
import { Banner } from "@astryxdesign/core/Banner";
import { Center } from "@astryxdesign/core/Center";
import { handleCallback, resolveRole } from "../auth";
import { homeRouteFor } from "../session";

/** The platform's SSO redirects here once — never drawn as a screen
 * (thunder-authentication owns this route; no Login screen exists in
 * wireframes.dsl). Lands the caller on their resolved role's home screen. */
export function Callback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const user = await handleCallback();
        const groups = Array.isArray(user.profile?.groups) ? (user.profile.groups as string[]) : [];
        navigate(homeRouteFor(resolveRole(groups)), { replace: true });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Sign-in failed");
      }
    })();
  }, [navigate]);

  return (
    <Center axis="both" height="100vh">
      {error ? <Banner status="error" title="Sign-in failed" description={error} /> : <Spinner size="lg" label="Signing in" />}
    </Center>
  );
}
