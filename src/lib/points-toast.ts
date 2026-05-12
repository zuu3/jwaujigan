export type PointsToastDetail = {
  points: number;
  label: string;
  bonus?: number;
};

export function showPointsToast(detail: PointsToastDetail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("points-toast", { detail }));
}
