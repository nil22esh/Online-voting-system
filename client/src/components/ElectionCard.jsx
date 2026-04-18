import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { HiOutlineClock, HiOutlineUserGroup } from "react-icons/hi";

export default function ElectionCard({ election }) {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    if (election.status === "upcoming" || election.status === "active") {
      const targetDate = new Date(
        election.status === "upcoming" ? election.start_time : election.end_time
      );

      const timer = setInterval(() => {
        const now = new Date();
        const diff = targetDate - now;

        if (diff <= 0) {
          setTimeLeft(election.status === "upcoming" ? "Starts now!" : "Ended");
          clearInterval(timer);
          return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const mins = Math.floor((diff / (1000 * 60)) % 60);
        const secs = Math.floor((diff / 1000) % 60);

        let timeStr = "";
        if (days > 0) timeStr += `${days}d `;
        timeStr += `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        setTimeLeft(timeStr);
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [election]);

  const getStatusBadge = (status) => {
    switch (status) {
      case "active": return <span className="badge badge-active">Active</span>;
      case "upcoming": return <span className="badge badge-upcoming">Upcoming</span>;
      case "completed": return <span className="badge badge-completed">Completed</span>;
      case "cancelled": return <span className="badge badge-cancelled">Cancelled</span>;
      default: return null;
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className="glass-card election-card"
      onClick={() => navigate(`/elections/${election.id}`)}
      style={{ cursor: "pointer" }}
    >
      <div className="election-card-header">
        {getStatusBadge(election.status)}
        <span className="election-card-votes">
          {election.total_votes} votes
        </span>
      </div>
      
      <h3 className="election-card-title">{election.title}</h3>
      
      <p className="election-card-desc">
        {election.description?.substring(0, 100) || "No description provided."}
        {election.description?.length > 100 && "..."}
      </p>

      {timeLeft && (
        <div className="election-card-timer">
          <HiOutlineClock />
          <span>
            {election.status === "upcoming" ? "Starts in: " : "Ends in: "}
            <strong>{timeLeft}</strong>
          </span>
        </div>
      )}

      <div className="election-card-footer">
        <div className="flex items-center gap-sm">
          <HiOutlineUserGroup />
          <span>{election.candidate_count} candidates</span>
        </div>
        <div className="election-level-badge">
          {election.election_level || 'Local'}
        </div>
      </div>
    </motion.div>
  );
}
