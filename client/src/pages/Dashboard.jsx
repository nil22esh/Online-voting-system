import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { useTranslation } from "../context/TranslationContext";
import { getAllElections } from "../api/election.api";
import Sidebar from "../components/Sidebar";
import ElectionCard from "../components/ElectionCard";
import {
  HiOutlineClipboardList,
  HiOutlineUserGroup,
  HiOutlineChartBar,
  HiOutlineCheck,
} from "react-icons/hi";
import { computeElectionStatus } from "../utils/electionStatus";
import "./Dashboard.css";

export default function Dashboard() {
  const { user } = useAuth();
  const socket = useSocket();
  const { t } = useTranslation();
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [livePulse, setLivePulse] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchElections();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on("vote:global_update", (data) => {
        setElections((prev) =>
          prev.map((e) => {
            if (e.id === data.electionId) {
              return { ...e, total_votes: data.totalVotes };
            }
            return e;
          })
        );
        // Trigger pulse animation
        setLivePulse(true);
        setTimeout(() => setLivePulse(false), 1000);
      });

      return () => {
        socket.off("vote:global_update");
      };
    }
  }, [socket]);

  const fetchElections = async () => {
    try {
      const res = await getAllElections();
      setElections(res.data.data);
    } catch (err) {
      console.error("Failed to fetch elections:", err);
    } finally {
      setLoading(false);
    }
  };

  // Derive status from dates (client-side) for live accuracy
  const withDerivedStatus = elections.map((e) => ({
    ...e,
    _derivedStatus: computeElectionStatus(e),
  }));

  const activeElections = withDerivedStatus.filter((e) => e._derivedStatus === "active");
  const upcomingElections = withDerivedStatus.filter((e) => e._derivedStatus === "upcoming");
  const completedElections = withDerivedStatus.filter((e) => e._derivedStatus === "completed");
  const cancelledElections = withDerivedStatus.filter((e) => e._derivedStatus === "cancelled");

  const totalVotes = elections.reduce((sum, e) => sum + parseInt(e.total_votes || 0), 0);

  const getStatusBadge = (status) => {
    switch (status) {
      case "active":
        return <span className="badge badge-active">🟢 Active</span>;
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

  return (
    <div className="layout">
      <Sidebar />
      <main className="layout-main">
        <div className="page-header">
          <h1 className="page-title">
            {t("WelcomeBack", { name: user?.name?.split(" ")[0] })}
          </h1>
          <p className="page-subtitle">{t("DashboardSubtitle")}</p>
        </div>

        {/* ── Stats Cards ── */}
        <div className="grid grid-4 mb-lg">
          <div className="glass-card stat-card animate-slideUp">
            <div className="stat-card-icon">
              <HiOutlineClipboardList />
            </div>
            <div className="stat-card-value">{elections.length}</div>
            <div className="stat-card-label">{t("TotalElections")}</div>
          </div>
          <div
            className="glass-card stat-card animate-slideUp"
            style={{ animationDelay: "0.1s" }}
          >
            <div
              className="stat-card-icon"
              style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}
            >
              <HiOutlineCheck />
            </div>
            <div className="stat-card-value">{activeElections.length}</div>
            <div className="stat-card-label">{t("ActiveElections")}</div>
          </div>
          <div
            className="glass-card stat-card animate-slideUp"
            style={{ animationDelay: "0.2s" }}
          >
            <div
              className="stat-card-icon"
              style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}
            >
              <HiOutlineUserGroup />
            </div>
            <div className="stat-card-value">{upcomingElections.length}</div>
            <div className="stat-card-label">{t("Upcoming")}</div>
          </div>
          <div
            className={`glass-card stat-card animate-slideUp ${livePulse ? "live-pulse" : ""}`}
            style={{ animationDelay: "0.3s", transition: "transform 0.3s" }}
          >
            <div
              className="stat-card-icon"
              style={{ background: "linear-gradient(135deg, #3b82f6, #2563eb)" }}
            >
              <HiOutlineChartBar />
            </div>
            <div className="stat-card-value">{totalVotes.toLocaleString()}</div>
            <div className="stat-card-label flex items-center justify-between">
              {t("TotalVotesCast")}
              {socket && <span className="live-dot" title="Live Updates Active" />}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="spinner" />
            <p>Loading elections...</p>
          </div>
        ) : (
          <>
            {/* ── Active Elections ── */}
            {activeElections.length > 0 && (
              <section className="dashboard-section">
                <h2 className="section-heading">
                  🗳️ {t("ActiveElections")}
                  <span className="live-badge ml-md">LIVE</span>
                </h2>
                <div className="grid grid-3">
                  {activeElections.map((election) => (
                    <ElectionCard key={election.id} election={election} />
                  ))}
                </div>
              </section>
            )}

            {/* ── Upcoming Elections ── */}
            {upcomingElections.length > 0 && (
              <section className="dashboard-section">
                <h2 className="section-heading">🗓️ {t("Upcoming")}</h2>
                <div className="grid grid-3">
                  {upcomingElections.map((election) => (
                    <ElectionCard key={election.id} election={election} />
                  ))}
                </div>
              </section>
            )}

            {/* ── Completed Elections ── */}
            {completedElections.length > 0 && (
              <section className="dashboard-section completed-elections-section">
                <h2 className="section-heading" style={{ color: "var(--text-secondary)" }}>
                  🏆 Ended Elections
                  <span
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: 500,
                      color: "var(--text-muted)",
                      marginLeft: "var(--space-sm)",
                    }}
                  >
                    — Click to see results & winner
                  </span>
                </h2>
                <div className="grid grid-3">
                  {completedElections.map((election) => (
                    <ElectionCard key={election.id} election={election} />
                  ))}
                </div>
              </section>
            )}

            {/* ── All Elections Table ── */}
            <section className="dashboard-section">
              <h2 className="section-heading">📋 {t("AllElections")}</h2>
              {elections.length === 0 ? (
                <div className="glass-card text-center" style={{ padding: "3rem" }}>
                  <p style={{ color: "var(--text-secondary)", fontSize: "1.125rem" }}>
                    No elections yet.{" "}
                    {user?.role === "admin" || user?.role === "officer"
                      ? "Create your first election!"
                      : "Check back soon!"}
                  </p>
                </div>
              ) : (
                <div className="table-container glass-card" style={{ padding: 0 }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>{t("Elections")}</th>
                        <th>{t("Status")}</th>
                        <th>{t("Candidates")}</th>
                        <th>{t("Votes")}</th>
                        <th>Start</th>
                        <th>{t("EndDate")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {withDerivedStatus.map((election) => (
                        <tr
                          key={election.id}
                          style={{ cursor: "pointer" }}
                          onClick={() => navigate(`/elections/${election.id}`)}
                        >
                          <td>
                            <strong>{election.title}</strong>
                          </td>
                          <td>{getStatusBadge(election._derivedStatus)}</td>
                          <td>{election.candidate_count}</td>
                          <td>{parseInt(election.total_votes || 0).toLocaleString()}</td>
                          <td>{new Date(election.start_time).toLocaleDateString()}</td>
                          <td>{new Date(election.end_time).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
