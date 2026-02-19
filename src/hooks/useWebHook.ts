import { useCallback, useState } from "react";
import type {
  WebHookConfig,
  WebHookEvents,
  ExtendedWebHookConfig,
} from "openauth-webui-shared-types/webhook/types";
import {
  POST as Register,
  GET as RetriveWebooks,
  DELETE as DeleteWebHook,
  PUT as UpdateWebHook,
} from "@api/webhooks";

export function useWebHook(projectID: string) {
  const [webhooks, setWebHooks] = useState<ExtendedWebHookConfig[]>([]);
  const registerWebHook = useCallback(
    async (event: WebHookEvents, config: WebHookConfig) => {
      const res = await Register({ clientID: projectID, event, config });
      if (!res.success) return res;
      setWebHooks((prev) => [...prev, res.data]);
      return res;
    },
    [projectID],
  );
  const getWebHooks = useCallback(async () => {
    const res = await RetriveWebooks({ clientID: projectID });
    if (!res.success) return res;
    setWebHooks(res.data);
    return res;
  }, [projectID]);

  const deleteWebHook = useCallback(
    async (webHookID: string) => {
      const res = await DeleteWebHook({ webHookID });
      if (!res.success) return res;
      setWebHooks((prev) => prev.filter((webhook) => webhook.id !== webHookID));
      return res;
    },
    [projectID],
  );

  const updateWebHook = useCallback(
    async (webHookID: string, config: Partial<WebHookConfig>) => {
      const res = await UpdateWebHook({
        webHookID,
        config,
      });
      if (!res.success) return res;
      setWebHooks((prev) =>
        prev.map((webhook) =>
          webhook.id === webHookID ? { ...webhook, ...res.data } : webhook,
        ),
      );
      return res;
    },
    [projectID],
  );

  return {
    webhooks,
    registerWebHook,
    getWebHooks,
    deleteWebHook,
    updateWebHook,
  };
}
