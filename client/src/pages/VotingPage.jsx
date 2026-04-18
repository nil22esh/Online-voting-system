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
} from "recharts";
import { HiOutlineCheck, HiOutlineBan, HiOutlineShieldCheck, HiOutlineKey, HiOutlineInformationCircle, HiOutlineExternalLink, HiOutlineUsers, HiOutlineAcademicCap, HiOutlineBriefcase, HiOutlineGlobeAlt, HiOutlineX } from "react-icons/hi";
import "./VotingPage.css";
import defaultAvatar from "../assets/default-avatar.png";

const CHART_COLORS = [
  "#6366f1", "#8b5cf6", "#a855f7", "#ec4899",
  "#f43f5e", "#f59e0b", "#10b981", "#3b82f6",
];

export default function VotingPage() {
  const { id } = useParams();
  const { user, showToast } = useAuth();
  const socket = useSocket();

  const [election, setElection] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [results, setResults] = useState([]);
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
  const [voteStatus, setVoteStatus] = useState("none"); // none, pending, confirmed
  const [viewingCandidate, setViewingCandidate] = useState(null);



  useEffect(() => {
    fetchData();
  }, [id]);

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
      showToast("info", "Check console for your mock OTP code");
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
      
      // Since it's queued, we don't know the winner immediately if we're not using sockets for feedback
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to cast vote";
      showToast("error", msg);
    } finally {
      setVoting(false);
    }
  };

  if (loading) return <div className="loading-container"><div className="spinner"></div></div>;
  if (!election) return <div className="text-center">Election not found</div>;

  const isActive = election.status === "active";
  const canVote = isActive && user?.role === "voter" && !hasVoted;
  const resultsVisible = election.results_published || user.role === "admin" || user.role === "officer";

  return (
    <div className="layout">
      <Sidebar />
      <main className="layout-main">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="page-header">
           <div className="flex items-center gap-md mb-sm">
             <h1 className="page-title">{election.title}</h1>
             <span className={`badge badge-${election.status}`}>{election.status}</span>
             <span className="badge-level">{election.election_level}</span>
           </div>
           <p className="page-subtitle">{election.description}</p>
        </motion.div>

        {hasVoted && (
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="vote-status-banner glass-card">
            {voteStatus === "pending" ? (
              <div className="spinner-sm mr-md" style={{ width: '24px', height: '24px' }}></div>
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


        <div className={`voting-grid ${!resultsVisible ? "full-width" : ""}`}>
          <div className="voting-candidates">
            <h2>{canVote ? "Candidates" : "Election Details"}</h2>
            <div className="candidates-grid">
              {candidates.map((candidate) => (
                <motion.div
                  key={candidate.id}
                  whileHover={canVote ? { scale: 1.01, x: 3 } : {}}
                  className={`candidate-card-v2 glass-card ${selectedCandidate === candidate.id ? "selected" : ""}`}
                  onClick={() => canVote && setSelectedCandidate(candidate.id)}
                >
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
                    <span className="candidate-party-v2">{candidate.party_name || candidate.party || "Independent"}</span>
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
              ))}
            </div>

            {canVote && (
              <button 
                className="btn btn-primary btn-lg btn-block mt-lg"
                disabled={!selectedCandidate}
                onClick={() => setShowConfirm(true)}
              >
                Secure Vote with OTP
              </button>
            )}
          </div>

          {resultsVisible && (
            <div className="voting-results glass-card">
              <div className="flex justify-between items-center mb-lg">
                <h2 style={{ marginBottom: 0 }}>📊 Results {isActive && <span className="live-badge">LIVE</span>}</h2>
                <div className="text-sm text-secondary">Total: {totalVotes} votes</div>
              </div>
              
              <div className="results-chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={results}
                    margin={{ top: 10, right: 10, left: -10, bottom: 64 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                      dataKey="candidate_name"
                      type="category"
                      tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      interval={0}
                      angle={-35}
                      textAnchor="end"
                    />
                    <YAxis
                      type="number"
                      tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                      width={28}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                      contentStyle={{
                        background: 'rgba(15, 23, 42, 0.9)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        backdropFilter: 'blur(8px)'
                      }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Bar
                      dataKey="vote_count"
                      name="Votes"
                      radius={[6, 6, 0, 0]}
                      barSize={36}
                    >
                      {results.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        <AnimatePresence>
          {showConfirm && (
            <div className="modal-overlay" onClick={() => setShowConfirm(false)}>
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="modal-content" 
                onClick={e => e.stopPropagation()}
              >
                <div className="shield-icon"><HiOutlineShieldCheck /></div>
                <h2 className="modal-title">Secure Verification</h2>
                <p>Verify your identity to cast your vote securely.</p>
                
                {!otpRequested ? (
                  <div className="form-group mt-lg">
                    <label className="form-label">Registered Phone Number</label>
                    {/* <p className="form-hint mb-xs">Hint: {user.phone_number.slice(-2).padStart(user.phone_number.length, "*")}</p> */}
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Enter full phone number"
                      value={phoneNumber}
                      onChange={e => setPhoneNumber(e.target.value)}
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
                        onChange={e => setOtpCode(e.target.value)}
                      />
                    </div>
                    <div className="modal-actions mt-lg">
                      <button className="btn btn-secondary" onClick={() => {
                        setOtpRequested(false);
                        setOtpCode("");
                      }}>Back</button>
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
                    <button className="btn btn-secondary border-none" onClick={() => setShowConfirm(false)}>Cancel</button>
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
                onClick={e => e.stopPropagation()}
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
                    <h3 className="section-title"><HiOutlineInformationCircle className="mr-xs" /> Biography</h3>
                    <p className="section-text">{viewingCandidate.bio || "No biography available."}</p>
                  </div>

                  <div className="candidate-modal-info-grid">
                    <div className="info-item">
                      <div className="info-icon-wrap"><HiOutlineAcademicCap /></div>
                      <div>
                        <label>Education</label>
                        <span>{viewingCandidate.education || "N/A"}</span>
                      </div>
                    </div>
                    <div className="info-item">
                      <div className="info-icon-wrap"><HiOutlineBriefcase /></div>
                      <div>
                        <label>Profession</label>
                        <span>{viewingCandidate.profession || "N/A"}</span>
                      </div>
                    </div>
                    <div className="info-item">
                      <div className="info-icon-wrap"><HiOutlineGlobeAlt /></div>
                      <div>
                        <label>Experience</label>
                        <span>{viewingCandidate.experience_years ? `${viewingCandidate.experience_years} Years` : "N/A"}</span>
                      </div>
                    </div>
                  </div>

                  {viewingCandidate.manifesto && viewingCandidate.manifesto.length > 0 && (
                    <div className="candidate-modal-section">
                      <h3 className="section-title">📜 Manifesto Points</h3>
                      <ul className="manifesto-list">
                        {(Array.isArray(viewingCandidate.manifesto) ? viewingCandidate.manifesto : JSON.parse(viewingCandidate.manifesto || "[]")).map((point, idx) => (
                          <li key={idx}>{point}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {viewingCandidate.social_links && Object.keys(viewingCandidate.social_links).length > 0 && (
                    <div className="candidate-modal-section">
                      <h3 className="section-title">Connect</h3>
                      <div className="social-links-grid">
                        {Object.entries(viewingCandidate.social_links).map(([platform, url]) => (
                          <a key={platform} href={url} target="_blank" rel="noopener noreferrer" className="social-link-item">
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
