import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HiOutlineShieldCheck, HiOutlineSearch } from "react-icons/hi";
import Sidebar from "../components/Sidebar";
import api from "../api/axios";
import "./VotingPage.css"; // Reuse some styles

export default function VoteVerification() {
  const [hash, setHash] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!hash) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      // We need a backend endpoint for this. Let's assume we'll create it.
      const res = await api.get(`/votes/verify/${hash}`);
      setResult(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Invalid vote hash or integrity broken.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="layout">
      <Sidebar />
      <main className="layout-main">
        <div className="page-header">
          <h1 className="page-title">Vote Integrity Verification</h1>
          <p className="page-subtitle">Verify the mathematical integrity of a vote in the election chain.</p>
        </div>

        <div className="glass-card max-w-2xl mx-auto mt-xl">
          <form onSubmit={handleVerify}>
            <div className="form-group">
              <label className="form-label">Vote Token / Hash</label>
              <div className="flex gap-sm">
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Enter the unique vote hash..."
                  value={hash}
                  onChange={e => setHash(e.target.value)}
                />
                <button className="btn btn-primary" type="submit" disabled={loading}>
                  {loading ? "Verifying..." : <HiOutlineSearch />}
                </button>
              </div>
            </div>
          </form>

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="mt-lg p-md bg-error-bg text-error rounded-md border border-error-border"
              >
                {error}
              </motion.div>
            )}

            {result && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }} 
                className="mt-xl p-lg bg-success-bg border border-success-border rounded-xl"
              >
                <div className="flex items-center gap-md mb-lg">
                  <div className="text-3xl text-success"><HiOutlineShieldCheck /></div>
                  <div>
                    <h3 className="text-success font-bold text-lg">Integrity Verified</h3>
                    <p className="text-sm text-success">This vote is part of the cryptographically secured chain.</p>
                  </div>
                </div>

                <div className="space-y-md">
                  <div className="flex justify-between border-b border-success-border pb-sm">
                    <span className="text-sm font-medium">Election</span>
                    <span className="text-sm">{result.election_title}</span>
                  </div>
                  <div className="flex justify-between border-b border-success-border pb-sm">
                    <span className="text-sm font-medium">Timestamp</span>
                    <span className="text-sm">{new Date(result.voted_at).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-b border-success-border pb-sm">
                     <span className="text-sm font-medium">Prev Hash</span>
                     <span className="text-sm font-mono truncate max-w-xs">{result.previous_vote_hash || "Root Vote"}</span>
                  </div>
                  <div className="flex justify-between pt-sm">
                    <span className="text-sm font-medium">Candidate Reference</span>
                    <span className="text-sm font-mono">{result.candidate_hash_ref}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-2xl text-center text-muted text-sm max-w-lg mx-auto">
          <p>Our system uses a blockchain-inspired linked list. Each vote hash is calculated as <code>SHA256(user + candidate + previous_hash)</code>, making it impossible to alter a vote without breaking the entire subsequent chain.</p>
        </div>
      </main>
    </div>
  );
}
