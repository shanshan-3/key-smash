import { useEffect, useState } from "react";
import { handleError, loadPublicProfile } from "./profiles.js";

export default function useProfileDashboard(handle, userId, freshRun) {
  const [state, setState] = useState({ loading: true });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    setState({ loading: true });
    const request =
      handle !== null && handleError(handle, true)
        ? Promise.resolve(null)
        : loadPublicProfile(handle, controller.signal);
    request
      .then(
        (profile) => {
          if (active) setState({ profile: profile || null });
        },
        () => {
          if (active) setState({ error: true });
        },
      )
      .finally(() => clearTimeout(timeout));
    return () => {
      active = false;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [handle, userId, freshRun, attempt]);

  return { state, retry: () => setAttempt((value) => value + 1) };
}
