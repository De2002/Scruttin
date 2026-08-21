import { useState, useEffect, useCallback, useRef } from "react";
import { BusinessPlan } from "@/types/businessPlan";
import { savePlan, getPlan } from "@/lib/storage";
import { PHASES } from "@/constants/phases";

export type SaveStatus = "saved" | "saving" | "unsaved";

export function useBusinessPlan(planId: string) {
  const [plan, setPlan] = useState<BusinessPlan | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const saveTimer = useRef<NodeJS.Timeout | null>(null);
  const pendingSave = useRef(false);

  useEffect(() => {
    if (!planId) return;
    getPlan(planId).then((loaded) => {
      if (loaded) setPlan(loaded);
    });
  }, [planId]);

  const scheduleSave = useCallback((updated: BusinessPlan) => {
    setSaveStatus("unsaved");
    pendingSave.current = true;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaveStatus("saving");
      await savePlan(updated);
      setSaveStatus("saved");
      pendingSave.current = false;
    }, 1000);
  }, []);

  const updatePlan = useCallback(
    (changes: Partial<BusinessPlan>) => {
      setPlan((prev) => {
        if (!prev) return prev;
        const updated = {
          ...prev,
          ...changes,
          lastWorkedOn: new Date().toISOString(),
        };
        scheduleSave(updated);
        return updated;
      });
    },
    [scheduleSave]
  );

  const updateTopicStatus = useCallback(
    (
      topicId: string,
      status: "not_started" | "in_progress" | "completed" | "skipped"
    ) => {
      setPlan((prev) => {
        if (!prev) return prev;
        const topicStatus = { ...prev.topicStatus, [topicId]: status };

        let totalRequired = 0;
        let completedRequired = 0;
        PHASES.forEach((phase) => {
          phase.topics.forEach((topic) => {
            if (topic.required) {
              totalRequired++;
              if (topicStatus[topic.id] === "completed") completedRequired++;
            }
          });
        });

        const overallProgress =
          totalRequired > 0
            ? Math.round((completedRequired / totalRequired) * 100)
            : 0;

        const phaseProgress: Record<string, number> = {};
        PHASES.forEach((phase) => {
          const req = phase.topics.filter((t) => t.required);
          const done = req.filter((t) => topicStatus[t.id] === "completed");
          phaseProgress[phase.id] =
            req.length > 0 ? Math.round((done.length / req.length) * 100) : 0;
        });

        const updated = {
          ...prev,
          topicStatus,
          overallProgress,
          phaseProgress,
          lastWorkedOn: new Date().toISOString(),
        };
        scheduleSave(updated);
        return updated;
      });
    },
    [scheduleSave]
  );

  const navigateTo = useCallback(
    (phase: string, topic: string) => {
      updatePlan({ currentPhase: phase, currentTopic: topic });
    },
    [updatePlan]
  );

  return { plan, saveStatus, updatePlan, updateTopicStatus, navigateTo };
}
