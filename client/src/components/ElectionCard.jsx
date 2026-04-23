import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { HiOutlineClock, HiOutlineUserGroup } from "react-icons/hi";
import { computeElectionStatus, getCountdown } from "../utils/electionStatus";

export default function ElectionCard({ election }) {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState("");
  // Derive status from dates for live accuracy
  const [derivedStatus, setDerivedStatus] = useState(() => computeElectionStatus(election));

  useEffect(() => {
    // Update derived status and countdown every second
    const timer = setInterval(() => {
      const status = computeElectionStatus(election);
      setDerivedStatus(status);

      if (status === "upcoming") {
        const cd = getCountdown(election.start_time);
        setTimeLeft(cd || "Starting now!");
      } else if (status === "active") {
        const cd = getCountdown(election.end_time);
        setTimeLeft(cd || "Ending now!");
      } else {
        setTimeLeft("");
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [election]);

  const getStatusBadge = (status) => {
    switch (status) {
      case "active":
        return (
          <span className="badge badge-active">
            🟢 Active
          </span>
        );
      case "upcoming":
        return <span className="badge badge-upcoming">🔵 Upcoming</span>;
      case "completed":
        return <span className="badge badge-completed">⚫ Ended</span>;
      case "cancelled":
        return <span className="badge badge-cancelled">🔴 Cancelled</span>;
      default:
        return null;
    }
  };

  const isCompleted = derivedStatus === "completed";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className={`glass-card election-card ${isCompleted ? "election-card-ended" : ""}`}
      onClick={() => navigate(`/elections/${election.id}`)}
      style={{ cursor: "pointer" }}
    >
      <div className="election-card-header">
        {getStatusBadge(derivedStatus)}
        <span className="election-card-votes">{election.total_votes} votes</span>
      </div>

      <h3 className="election-card-title">{election.title}</h3>

      <p className="election-card-desc">
        {election.description?.substring(0, 100) || "No description provided."}
        {election.description?.length > 100 && "..."}
      </p>

      {timeLeft && (
        <div className={`election-card-timer ${derivedStatus === "active" ? "timer-active" : ""}`}>
          <HiOutlineClock />
          <span>
            {derivedStatus === "upcoming" ? "Starts in: " : "Ends in: "}
            <strong>{timeLeft}</strong>
          </span>
        </div>
      )}

      {isCompleted && (
        <div className="election-card-ended-note">
          🏆 Results available — click to view winner
        </div>
      )}

      <div className="election-card-footer">
        <div className="flex items-center gap-sm">
          <HiOutlineUserGroup />
          <span>{election.candidate_count} candidates</span>
        </div>
        <div className="election-level-badge">{election.election_level || "Local"}</div>
      </div>
    </motion.div>
  );
}
