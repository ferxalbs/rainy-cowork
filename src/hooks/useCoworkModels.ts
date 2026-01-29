import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";

export interface CoworkModelsResponse {
  plan: string;
  plan_name: string;
  model_access_level: string;
  models: string[];
  total_models: number;
}

export function useCoworkModels() {
  const [models, setModels] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [planInfo, setPlanInfo] = useState<{
    name: string;
    tier: string;
  } | null>(null);

  const fetchModels = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await invoke<CoworkModelsResponse>("get_cowork_models");
      setModels(response.models);
      setPlanInfo({
        name: response.plan_name,
        tier: response.model_access_level,
      });
    } catch (err) {
      console.error("Failed to fetch Cowork models:", err);
      setError(err instanceof Error ? err.message : String(err));
      // Fallback to minimal set if API fails, or keep empty
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  return { models, loading, error, planInfo, refresh: fetchModels };
}
