// Compute election status based on dates (upcoming/active/completed/cancelled)
export function computeElectionStatus(election) {
  if (!election) return "upcoming";
  if (election.status === "cancelled") return "cancelled";

  const now = new Date();
  const start = new Date(election.start_time);
  const end = new Date(election.end_time);

  if (now < start) return "upcoming";
  if (now >= start && now <= end) return "active";
  return "completed";
}

// Format countdown time in human-readable format
export function getCountdown(targetDate) {
  const diff = new Date(targetDate) - new Date();
  if (diff <= 0) return null;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const mins = Math.floor((diff / (1000 * 60)) % 60);
  const secs = Math.floor((diff / 1000) % 60);

  let parts = [];
  if (days > 0) parts.push(`${days}d`);
  parts.push(
    `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`,
  );
  return parts.join(" ");
}
