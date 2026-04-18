import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { getAuditLogs } from "../../api/audit.api";
import Sidebar from "../../components/Sidebar";
import CustomDropdown from "../../components/CustomDropdown";
import "./Admin.css";

export default function AuditLogs() {
  const { showToast } = useAuth();
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ action: "", entity: "" });

  useEffect(() => { fetchLogs(); }, [pagination.page, filters]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = { page: pagination.page, limit: 15 };
      if (filters.action) params.action = filters.action;
      if (filters.entity) params.entity = filters.entity;

      const res = await getAuditLogs(params);
      setLogs(res.data.data.logs);
      setPagination((p) => ({ ...p, ...res.data.data.pagination }));
    } catch { showToast("error", "Failed to load audit logs"); }
    finally { setLoading(false); }
  };

  const getActionColor = (action) => {
    if (action.includes("CREATE") || action.includes("ADD")) return "var(--success)";
    if (action.includes("DELETE")) return "var(--error)";
    if (action.includes("UPDATE")) return "var(--warning)";
    if (action.includes("VOTE")) return "var(--accent-primary)";
    return "var(--text-secondary)";
  };

  return (
    <div className="layout">
      <Sidebar />
      <main className="layout-main">
        <div className="page-header">
          <h1 className="page-title">Audit Logs</h1>
          <p className="page-subtitle">Track all system activity ({pagination.total} entries)</p>
        </div>

        {/* Filters */}
        <div className="glass-card mb-lg flex gap-md items-center" style={{ padding: "var(--space-md) var(--space-lg)", zIndex: 10 }}>
          <div style={{ maxWidth: "200px", width: "100%" }}>
            <CustomDropdown
              value={filters.action}
              onChange={(e) => { setFilters({ ...filters, action: e.target.value }); setPagination((p) => ({ ...p, page: 1 })); }}
              options={[
                { value: "", label: "All Actions" },
                { value: "CREATE_ELECTION", label: "Create Election" },
                { value: "UPDATE_ELECTION", label: "Update Election" },
                { value: "DELETE_ELECTION", label: "Delete Election" },
                { value: "ADD_CANDIDATE", label: "Add Candidate" },
                { value: "CAST_VOTE", label: "Cast Vote" }
              ]}
            />
          </div>
          <div style={{ maxWidth: "200px", width: "100%" }}>
            <CustomDropdown
              value={filters.entity}
              onChange={(e) => { setFilters({ ...filters, entity: e.target.value }); setPagination((p) => ({ ...p, page: 1 })); }}
              options={[
                { value: "", label: "All Entities" },
                { value: "election", label: "Election" },
                { value: "candidate", label: "Candidate" },
                { value: "vote", label: "Vote" }
              ]}
            />
          </div>
        </div>

        {loading ? (
          <div className="loading-container"><div className="spinner"></div></div>
        ) : logs.length === 0 ? (
          <div className="glass-card text-center" style={{ padding: "3rem" }}>
            <p style={{ color: "var(--text-secondary)" }}>No audit logs found</p>
          </div>
        ) : (
          <>
            <div className="table-container glass-card" style={{ padding: 0 }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>User</th>
                    <th>Action</th>
                    <th>Entity</th>
                    <th>Details</th>
                    <th>IP</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td style={{ fontSize: "0.8125rem", whiteSpace: "nowrap" }}>
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td>
                        <div>
                          <strong style={{ fontSize: "0.875rem" }}>{log.user_name || "System"}</strong>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{log.user_email}</div>
                        </div>
                      </td>
                      <td>
                        <span style={{ color: getActionColor(log.action), fontWeight: 600, fontSize: "0.8125rem" }}>
                          {log.action}
                        </span>
                      </td>
                      <td>{log.entity}</td>
                      <td style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {log.details ? JSON.stringify(log.details) : "—"}
                      </td>
                      <td style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>{log.ip_address}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-center gap-sm mt-lg">
              <button
                className="btn btn-sm btn-secondary"
                disabled={pagination.page <= 1}
                onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
              >
                Previous
              </button>
              <span className="flex items-center" style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                className="btn btn-sm btn-secondary"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
              >
                Next
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
