import { useState } from "react";

export function useCanDelete(): boolean {
  const [canDelete] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem("sf_user");
      const user = stored ? JSON.parse(stored) : null;
      return user?.role !== "section_head" && user?.role !== "reviewer";
    } catch {
      return true;
    }
  });
  return canDelete;
}
