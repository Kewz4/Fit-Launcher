import { createRoot, createSignal } from "solid-js";
import { DM } from "../api/manager/api";

export type ManagerState = "connected" | "reconnecting" | "disconnected";

interface ErrorEntry {
  id: number;
  message: string;
  ts: number;
  isDiskSpace: boolean;
}

const DISK_SPACE_PATTERNS = [
  /no space left/i,
  /disk full/i,
  /not enough (disk )?space/i,
  /insufficient (disk )?space/i,
  /ENOSPC/,
  /storage.*full/i,
  /out of.*space/i,
];

export function isDiskSpaceError(msg: string): boolean {
  return DISK_SPACE_PATTERNS.some((re) => re.test(msg));
}

let _idCounter = 0;

export const createManagerStatusStore = () => {
  const [state, setState] = createSignal<ManagerState>("connected");
  const [errors, setErrors] = createSignal<ErrorEntry[]>([]);

  DM.onError((msg) => {
    const entry: ErrorEntry = {
      id: ++_idCounter,
      message: msg,
      ts: Date.now(),
      isDiskSpace: isDiskSpaceError(msg),
    };
    setErrors((prev) => [entry, ...prev].slice(0, 5));

    // auto-expire after 12s
    setTimeout(() => {
      setErrors((prev) => prev.filter((e) => e.id !== entry.id));
    }, 12_000);
  });

  DM.onReady(() => setState("connected"));

  function dismissError(id: number) {
    setErrors((prev) => prev.filter((e) => e.id !== id));
  }

  return { state, errors, dismissError };
};

export const ManagerStatusStore = createRoot(createManagerStatusStore);
