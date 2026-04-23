import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { getElectionById } from "../api/election.api";
import { getCandidatesByElection } from "../api/candidate.api";
import { castVote, getElectionResults, checkUserVote, requestOTP } from "../api/vote.api";
import Sidebar from "../components/Sidebar";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";
import { HiOutlineCheck, HiOutlineBan, HiOutlineShieldCheck, HiOutlineKey, HiOutlineInformationCircle, HiOutlineExternalLink, HiOutlineUsers, HiOutlineAcademicCap, HiOutlineBriefcase, HiOutlineGlobeAlt, HiOutlineX, HiOutlineClock, HiOutlineCalendar } from "react-icons/hi";
import "./VotingPage.css";
import defaultAvatar from "../assets/default-avatar.png";
import { computeElectionStatus } from "../utils/electionStatus";

const CHART_COLORS = [
  "#6366f1", "#8b5cf6", "#a855f7", "#ec4899",
  "#f43f5e", "#f59e0b", "#10b981", "#3b82f6",
];

// ─── Winner Announcement Banner ──────────────────────────────────────────────
function WinnerBanner({ winners, totalVotes, results }) {
  if (!winners || winners.length === 0) return null;

  const isTie = winners.length > 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: -30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="winner-banner"
    >
      <div className="winner-banner-glow" />
      <div className="winner-banner-inner">
        <div className="winner-crown-area">
          <div className="winner-crown">👑</div>
          <h2 className="winner-title">
            {isTie ? "It's a Tie!" : "Election Winner"}
          </h2>
          <p className="winner-subtitle">
            {isTie
              ? `${winners.length} candidates are tied with the most votes`
              : "The people have spoken"}
          </p>
        </div>

        <div className={`winner-cards-row ${isTie ? "tie" : ""}`}>
          {winners.map((w, i) => (
            <motion.div
              key={w.candidate_id}
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="winner-card"
            >
              <div className="winner-avatar-wrap">
                <img
                  src={w.photo_url || defaultAvatar}
                  alt={w.candidate_name}
                  className="winner-avatar"
                />
                {!isTie && <div className="winner-badge-icon">🏆</div>}
              </div>
              <h3 className="winner-name">{w.candidate_name}</h3>
              {w.party_name && (
                <span className="winner-party">{w.party_name}</span>
              )}
              <div className="winner-vote-stats">
                <div className="winner-vote-count">
                  <span className="vote-num">{w.vote_count.toLocaleString()}</span>
                  <span className="vote-label">votes</span>
                </div>
                <div className="winner-vote-pct">
                  <div
                    className="pct-bar"
                    style={{ width: `${Math.min(w.vote_percentage || 0, 100)}%` }}
                  />
                  <span>{w.vote_percentage || 0}%</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <p className="winner-total-context">
          Total votes cast: <strong>{totalVotes?.toLocaleString()}</strong>
        </p>
      </div>
    </motion.div>
  );
}

// ─── Full Election Results Section ───────────────────────────────────────────
function ElectionResultsSection({ results, totalVotes, isCompleted, isActive }) {
  const [chartType, setChartType] = useState("bar");

  if (!results || results.length === 0) {
    return (
      <div className="voting-results glass-card">
        <h2>📊 Results</h2>
        <p style={{ color: "var(--text-secondary)", marginTop: "1rem" }}>
          No votes have been cast yet.
        </p>
      </div>
    );
  }

  return (
    <div className="voting-results glass-card">
      <div className="results-header">
        <div>
          <h2 style={{ marginBottom: 0 }}>
            📊 Results{" "}
            {isActive && <span className="live-badge">LIVE</span>}
            {isCompleted && <span className="ended-badge">FINAL</span>}
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginTop: "4px" }}>
            Total votes: <strong style={{ color: "var(--text-primary)" }}>{totalVotes?.toLocaleString()}</strong>
          </p>
        </div>
        <div className="chart-toggle">
          <button
            className={`chart-toggle-btn ${chartType === "bar" ? "active" : ""}`}
            onClick={() => setChartType("bar")}
            title="Bar Chart"
          >
            ▐▌▌
          </button>
          <button
            className={`chart-toggle-btn ${chartType === "pie" ? "active" : ""}`}
            onClick={() => setChartType("pie")}
            title="Pie Chart"
          >
            ◔
          </button>
        </div>
      </div>

      {/* Leaderboard list */}
      <div className="results-leaderboard">
        {results.map((r, idx) => {
          const pct = totalVotes > 0 ? Math.round((r.vote_count / totalVotes) * 1000) / 10 : 0;
          return (
            <div key={r.candidate_id} className={`leaderboard-row ${idx === 0 && isCompleted ? "leader" : ""}`}>
              <span className="leaderboard-rank">
                {idx === 0 && isCompleted ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}
              </span>
              <img
                src={r.photo_url || defaultAvatar}
                alt={r.candidate_name}
                className="leaderboard-avatar"
              />
              <div className="leaderboard-info">
                <span className="leaderboard-name">{r.candidate_name}</span>
                <span className="leaderboard-party">{r.party || r.party_name || "Independent"}</span>
              </div>
              <div className="leaderboard-bar-wrap">
                <motion.div
                  className="leaderboard-bar"
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, delay: idx * 0.1 }}
                  style={{ background: CHART_COLORS[idx % CHART_COLORS.length] }}
                />
              </div>
              <div className="leaderboard-stats">
                <span className="leaderboard-votes">{r.vote_count}</span>
                <span className="leaderboard-pct">{pct}%</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Chart */}
      <div className="results-chart-container" style={{ marginTop: "1.5rem" }}>
        <AnimatePresence mode="wait">
          {chartType === "bar" && (
            <motion.div
              key="bar"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ height: 300 }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={results} margin={{ top: 10, right: 10, left: -10, bottom: 64 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis
                    dataKey="candidate_name"
                    tick={{ fill: "var(--text-secondary)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                    angle={-35}
                    textAnchor="end"
                  />
                  <YAxis
                    tick={{ fill: "var(--text-secondary)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                    width={28}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(255,255,255,0.04)" }}
                    contentStyle={{
                      background: "rgba(15, 23, 42, 0.95)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "12px",
                    }}
                    itemStyle={{ color: "#fff" }}
                  />
                  <Bar dataKey="vote_count" name="Votes" radius={[8, 8, 0, 0]} barSize={40}>
                    {results.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          )}
          {chartType === "pie" && (
            <motion.div
              key="pie"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ height: 300 }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={results}
                    dataKey="vote_count"
                    nameKey="candidate_name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={110}
                    paddingAngle={3}
                    label={({ candidate_name, percent }) =>
                      `${candidate_name?.split(" ")[0]} ${(percent * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {results.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "rgba(15, 23, 42, 0.95)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "12px",
                    }}
                    itemStyle={{ color: "#fff" }}
                  />
                  <Legend wrapperStyle={{ color: "var(--text-secondary)", fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Main Voting Page ────────────────────────────────────────────────────────
export default function VotingPage() {
  const { id } = useParams();
  const { user, showToast } = useAuth();
  const socket = useSocket();

  const [election, setElection] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [results, setResults] = useState([]);
  const [winner, setWinner] = useState(null);
  const [totalVotes, setTotalVotes] = useState(0);
  const [hasVoted, setHasVoted] = useState(false);
  const [votedFor, setVotedFor] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpRequested, setOtpRequested] = useState(false);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [requestingOTP, setRequestingOTP] = useState(false);
  const [voteStatus, setVoteStatus] = useState("none");
  const [viewingCandidate, setViewingCandidate] = useState(null);
  // Derived status based on current time (re-evaluated every 30s)
  const [derivedStatus, setDerivedStatus] = useState(null);

  useEffect(() => {
    fetchData();
  }, [id]);

  // Re-derive status every 30 seconds so UI auto-updates when election goes active/ended
  useEffect(() => {
    if (!election) return;
    const update = () => setDerivedStatus(computeElectionStatus(election));
    update();
    const interval = setInterval(update, 30_000);
    return () => clearInterval(interval);
  }, [election]);

  useEffect(() => {
    if (socket && id) {
      socket.emit("join:election", id);
      socket.on("vote:update", (data) => {
        if (data.electionId === id) {
          setResults(data.results);
          setTotalVotes(data.totalVotes);
        }
      });
      return () => {
        socket.emit("leave:election", id);
        socket.off("vote:update");
      };
    }
  }, [socket, id]);

  const fetchData = async () => {
    try {
      const [electionRes, candidatesRes, voteCheckRes] = await Promise.all([
        getElectionById(id),
        getCandidatesByElection(id),
        checkUserVote(id),
      ]);

      const electionData = electionRes.data.data;
      setElection(electionData);
      setCandidates(candidatesRes.data.data);

      if (voteCheckRes.data.data.hasVoted) {
        setHasVoted(true);
        setVoteStatus(voteCheckRes.data.data.status || "confirmed");
        setVotedFor(voteCheckRes.data.data.vote?.candidate_name);
      }

      try {
        const resultsRes = await getElectionResults(id);
        setResults(resultsRes.data.data.results);
        setTotalVotes(resultsRes.data.data.totalVotes);
        if (resultsRes.data.data.winner) {
          setWinner(resultsRes.data.data.winner);
        }
      } catch (resultsErr) {
        setResults([]);
        setTotalVotes(electionData.total_votes || 0);
      }
    } catch (err) {
      console.error("Failed to fetch data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOTP = async () => {
    if (!phoneNumber) {
      showToast("error", "Please enter your registered phone number");
      return;
    }
    setRequestingOTP(true);
    try {
      await requestOTP(phoneNumber);
      setOtpRequested(true);
      showToast("info", "OTP sent to your registered email address");
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to send OTP";
      showToast("error", msg);
    } finally {
      setRequestingOTP(false);
    }
  };

  const handleVote = async () => {
    if (!selectedCandidate || !otpCode) return;
    setVoting(true);
    try {
      await castVote({
        election_id: id,
        candidate_id: selectedCandidate,
        otp_code: otpCode,
      });
      setHasVoted(true);
      setVoteStatus("pending");
      setShowConfirm(false);
      showToast("success", "Vote queued! It will be processed shortly.");
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to cast vote";
      showToast("error", msg);
    } finally {
      setVoting(false);
    }
  };

  if (loading)
    return (
      <div className="layout">
        <Sidebar />
        <main className="layout-main">
          <div className="loading-container">
            <div className="spinner" />
            <p>Loading election...</p>
          </div>
        </main>
      </div>
    );

  if (!election) return <div className="text-center">Election not found</div>;

  // Use client-derived status for live accuracy, fall back to DB value
  const currentStatus = derivedStatus || election.status;
  const isActive = currentStatus === "active";
  const isCompleted = currentStatus === "completed";
  const isUpcoming = currentStatus === "upcoming";
  const canVote = isActive && user?.role === "voter" && !hasVoted;
  const resultsVisible =
    election.results_published || isCompleted || user?.role === "admin" || user?.role === "officer";

  return (
    <div className="layout">
      <Sidebar />
      <main className="layout-main">
        {/* ── Page Header ── */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="page-header">
          <div className="flex items-center gap-md mb-sm" style={{ flexWrap: "wrap" }}>
            <h1 className="page-title">{election.title}</h1>
            <span className={`badge badge-${currentStatus}`} style={{ textTransform: "capitalize" }}>
              {currentStatus === "active" && "🟢 "}
              {currentStatus === "upcoming" && "🔵 "}
              {currentStatus === "completed" && "⚫ "}
              {currentStatus}
            </span>
            <span className="badge-level">{election.election_level}</span>
          </div>
          <p className="page-subtitle">{election.description}</p>
          <div className="election-meta">
            <span>
              <HiOutlineCalendar style={{ display: "inline", marginRight: 4 }} />
              Start: {new Date(election.start_time).toLocaleString()}
            </span>
            <span>
              <HiOutlineClock style={{ display: "inline", marginRight: 4 }} />
              End: {new Date(election.end_time).toLocaleString()}
            </span>
          </div>
        </motion.div>

        {/* ── Upcoming Banner ── */}
        {isUpcoming && (
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="upcoming-banner glass-card">
            <div className="upcoming-icon">🗓️</div>
            <div>
              <strong>This election hasn't started yet</strong>
              <p>Voting opens on {new Date(election.start_time).toLocaleString()}</p>
            </div>
          </motion.div>
        )}

        {/* ── Winner Banner (only for completed) ── */}
        {isCompleted && winner && winner.length > 0 && (
          <WinnerBanner winners={winner} totalVotes={totalVotes} results={results} />
        )}

        {/* ── Vote Confirmed Banner ── */}
        {hasVoted && !isCompleted && (
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="vote-status-banner glass-card">
            {voteStatus === "pending" ? (
              <div className="spinner-sm mr-md" style={{ width: "24px", height: "24px" }} />
            ) : (
              <HiOutlineCheck className="vote-status-icon" />
            )}
            <div>
              <strong>{voteStatus === "pending" ? "Vote Processing..." : "Vote Confirmed!"}</strong>
              <p>
                {voteStatus === "pending"
                  ? "Your vote is in the queue and will be recorded shortly."
                  : `Your vote for ${votedFor} has been securely recorded.`}
              </p>
            </div>
          </motion.div>
        )}

        {/* ── Main Grid ── */}
        <div className={`voting-grid ${!resultsVisible ? "full-width" : ""}`}>
          {/* Candidates Column */}
          <div className="voting-candidates">
            <h2>{canVote ? "Cast Your Vote" : isCompleted ? "All Candidates" : "Candidates"}</h2>
            <div className="candidates-grid">
              {candidates.map((candidate, idx) => {
                const candidateResult = results.find((r) => r.candidate_id === candidate.id);
                const isWinner =
                  isCompleted && winner && winner.some((w) => w.candidate_id === candidate.id);
                return (
                  <motion.div
                    key={candidate.id}
                    whileHover={canVote ? { scale: 1.01, x: 3 } : {}}
                    className={`candidate-card-v2 glass-card ${selectedCandidate === candidate.id ? "selected" : ""} ${isWinner ? "winner-highlight" : ""}`}
                    onClick={() => canVote && setSelectedCandidate(candidate.id)}
                  >
                    {isWinner && (
                      <div className="winner-candidate-crown">🏆</div>
                    )}
                    <div className="candidate-avatar-circle-wrap">
                      <img
                        src={candidate.photo_url || defaultAvatar}
                        alt={candidate.name}
                        className="candidate-avatar-circle"
                      />
                      {selectedCandidate === candidate.id && (
                        <div className="selection-badge">
                          <HiOutlineCheck />
                        </div>
                      )}
                    </div>
                    <div className="candidate-details-v2">
                      <h3 className="candidate-name-v2">{candidate.name}</h3>
                      <span className="candidate-party-v2">
                        {candidate.party_name || candidate.party || "Independent"}
                      </span>
                      {isCompleted && candidateResult && (
                        <div className="candidate-inline-result">
                          <span className="inline-votes">{candidateResult.vote_count} votes</span>
                          {totalVotes > 0 && (
                            <span className="inline-pct">
                              {Math.round((candidateResult.vote_count / totalVotes) * 1000) / 10}%
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    {canVote && (
                      <div className={`vote-radio ${selectedCandidate === candidate.id ? "active" : ""}`} />
                    )}
                    <button
                      className="view-details-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewingCandidate(candidate);
                      }}
                      title="View Candidate Details"
                    >
                      <HiOutlineInformationCircle />
                    </button>
                  </motion.div>
                );
              })}
            </div>

            {canVote && (
              <button
                className="btn btn-primary btn-lg btn-block mt-lg"
                disabled={!selectedCandidate}
                onClick={() => setShowConfirm(true)}
              >
                🔒 Secure Vote with OTP
              </button>
            )}

            {isActive && !canVote && user?.role === "voter" && hasVoted && (
              <div className="already-voted-note glass-card mt-lg">
                <HiOutlineCheck style={{ color: "var(--success)", fontSize: "1.25rem" }} />
                <span>You have already voted in this election.</span>
              </div>
            )}
          </div>

          {/* Results Column */}
          {resultsVisible && (
            <ElectionResultsSection
              results={results}
              totalVotes={totalVotes}
              isCompleted={isCompleted}
              isActive={isActive}
            />
          )}
        </div>

        {/* ── Modals ── */}
        <AnimatePresence>
          {showConfirm && (
            <div className="modal-overlay" onClick={() => setShowConfirm(false)}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="modal-content"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="shield-icon">
                  <HiOutlineShieldCheck />
                </div>
                <h2 className="modal-title">Secure Verification</h2>
                <p>Verify your identity to cast your vote securely.</p>

                {!otpRequested ? (
                  <div className="form-group mt-lg">
                    <label className="form-label">Registered Phone Number</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Enter full phone number"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                    />
                    <button
                      className="btn btn-primary btn-block mt-md"
                      onClick={handleRequestOTP}
                      disabled={requestingOTP || phoneNumber.length < 10}
                    >
                      {requestingOTP ? "Requesting..." : "Get OTP"}
                    </button>
                  </div>
                ) : (
                  <div className="form-group mt-lg">
                    <label className="form-label">Verification Code</label>
                    <div className="otp-input-wrapper">
                      <input
                        type="text"
                        className="form-input otp-field"
                        placeholder="Enter 6-digit code"
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                      />
                    </div>
                    <div className="modal-actions mt-lg">
                      <button
                        className="btn btn-secondary"
                        onClick={() => {
                          setOtpRequested(false);
                          setOtpCode("");
                        }}
                      >
                        Back
                      </button>
                      <button
                        className="btn btn-primary"
                        onClick={handleVote}
                        disabled={voting || otpCode.length < 6}
                      >
                        {voting ? "Processing..." : "Verify & Cast Vote"}
                      </button>
                    </div>
                  </div>
                )}

                {!otpRequested && (
                  <div className="modal-actions">
                    <button className="btn btn-secondary border-none" onClick={() => setShowConfirm(false)}>
                      Cancel
                    </button>
                  </div>
                )}
              </motion.div>
            </div>
          )}

          {viewingCandidate && (
            <div className="modal-overlay" onClick={() => setViewingCandidate(null)}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 30 }}
                className="modal-content candidate-details-modal"
                onClick={(e) => e.stopPropagation()}
              >
                <button className="modal-close-btn" onClick={() => setViewingCandidate(null)}>
                  <HiOutlineX />
                </button>

                <div className="candidate-modal-header">
                  <div className="candidate-modal-avatar-wrap">
                    <img
                      src={viewingCandidate.photo_url || defaultAvatar}
                      alt={viewingCandidate.name}
                      className="candidate-modal-avatar"
                    />
                    {viewingCandidate.party_symbol && (
                      <div className="candidate-modal-party-symbol">
                        <img src={viewingCandidate.party_symbol} alt="Party Symbol" />
                      </div>
                    )}
                  </div>
                  <div className="candidate-modal-title-info">
                    <h2 className="candidate-modal-name">{viewingCandidate.name}</h2>
                    <div className="candidate-modal-badges">
                      <span className="candidate-modal-party-badge">
                        <HiOutlineUsers className="mr-xs" /> {viewingCandidate.party_name}
                      </span>
                      <span className="candidate-modal-age-badge">
                        {viewingCandidate.age} Years • {viewingCandidate.gender}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="candidate-modal-body">
                  <div className="candidate-modal-section">
                    <h3 className="section-title">
                      <HiOutlineInformationCircle className="mr-xs" /> Biography
                    </h3>
                    <p className="section-text">{viewingCandidate.bio || "No biography available."}</p>
                  </div>

                  <div className="candidate-modal-info-grid">
                    <div className="info-item">
                      <div className="info-icon-wrap">
                        <HiOutlineAcademicCap />
                      </div>
                      <div>
                        <label>Education</label>
                        <span>{viewingCandidate.education || "N/A"}</span>
                      </div>
                    </div>
                    <div className="info-item">
                      <div className="info-icon-wrap">
                        <HiOutlineBriefcase />
                      </div>
                      <div>
                        <label>Profession</label>
                        <span>{viewingCandidate.profession || "N/A"}</span>
                      </div>
                    </div>
                    <div className="info-item">
                      <div className="info-icon-wrap">
                        <HiOutlineGlobeAlt />
                      </div>
                      <div>
                        <label>Experience</label>
                        <span>
                          {viewingCandidate.experience_years
                            ? `${viewingCandidate.experience_years} Years`
                            : "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {viewingCandidate.manifesto && viewingCandidate.manifesto.length > 0 && (
                    <div className="candidate-modal-section">
                      <h3 className="section-title">📜 Manifesto Points</h3>
                      <ul className="manifesto-list">
                        {(Array.isArray(viewingCandidate.manifesto)
                          ? viewingCandidate.manifesto
                          : JSON.parse(viewingCandidate.manifesto || "[]")
                        ).map((point, idx) => (
                          <li key={idx}>{point}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {viewingCandidate.social_links &&
                    Object.keys(viewingCandidate.social_links).length > 0 && (
                      <div className="candidate-modal-section">
                        <h3 className="section-title">Connect</h3>
                        <div className="social-links-grid">
                          {Object.entries(viewingCandidate.social_links).map(([platform, url]) => (
                            <a
                              key={platform}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="social-link-item"
                            >
                              <span className="capitalize">{platform}</span>
                              <HiOutlineExternalLink />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
