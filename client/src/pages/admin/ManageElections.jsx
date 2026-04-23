import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  getAllElections,
  createElection,
  updateElection,
  deleteElection,
} from "../../api/election.api";
import Sidebar from "../../components/Sidebar";
import ConfirmModal from "../../components/ConfirmModal";
import CustomDropdown from "../../components/CustomDropdown";
import { computeElectionStatus } from "../../utils/electionStatus";
import "./Admin.css";

export default function ManageElections() {
  const { showToast } = useAuth();
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [electionToDelete, setElectionToDelete] = useState(null);
  const [formData, setFormData] = useState({
    title: "", description: "", start_time: "", end_time: "", status: "upcoming",
  });

  useEffect(() => { fetchElections(); }, []);

  const fetchElections = async () => {
    try {
      const res = await getAllElections();
      setElections(res.data.data);
    } catch { showToast("error", "Failed to fetch elections"); }
    finally { setLoading(false); }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const resetForm = () => {
    setFormData({ title: "", description: "", start_time: "", end_time: "", status: "upcoming" });
    setEditingId(null);
    setShowModal(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateElection(editingId, formData);
        showToast("success", "Election updated");
      } else {
        await createElection(formData);
        showToast("success", "Election created");
      }
      resetForm();
      fetchElections();
    } catch (err) {
      showToast("error", err.response?.data?.message || "Operation failed");
    }
  };

  const handleEdit = (election) => {
    setFormData({
      title: election.title,
      description: election.description || "",
      start_time: election.start_time?.slice(0, 16),
      end_time: election.end_time?.slice(0, 16),
      status: election.status,
    });
    setEditingId(election.id);
    setShowModal(true);
  };

  const handleDelete = (id) => {
    setElectionToDelete(id);
    setShowConfirmDelete(true);
  };

  const confirmDelete = async () => {
    if (!electionToDelete) return;
    try {
      await deleteElection(electionToDelete);
      showToast("success", "Election deleted");
      fetchElections();
    } catch (err) {
      showToast("error", err.response?.data?.message || "Delete failed");
    } finally {
      setElectionToDelete(null);
    }
  };

  const getStatusBadge = (election) => {
    const status = computeElectionStatus(election);
    const labels = {
      active: "🟢 Active",
      upcoming: "🔵 Upcoming",
      completed: "⚫ Ended",
      cancelled: "🔴 Cancelled",
    };
    return <span className={`badge badge-${status}`}>{labels[status] || status}</span>;
  };

  return (
    <div className="layout">
      <Sidebar />
      <main className="layout-main">
        <div className="page-header flex justify-between items-center">
          <div>
            <h1 className="page-title">Manage Elections</h1>
            <p className="page-subtitle">Create and manage elections</p>
          </div>
          <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
            + New Election
          </button>
        </div>

        {loading ? (
          <div className="loading-container"><div className="spinner"></div></div>
        ) : elections.length === 0 ? (
          <div className="glass-card text-center" style={{ padding: "3rem" }}>
            <p style={{ color: "var(--text-secondary)" }}>No elections yet. Create your first one!</p>
          </div>
        ) : (
          <div className="table-container glass-card" style={{ padding: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Start</th>
                  <th>End</th>
                  <th>Candidates</th>
                  <th>Votes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {elections.map((el) => (
                  <tr key={el.id}>
                    <td><strong>{el.title}</strong></td>
                    <td>{getStatusBadge(el)}</td>
                    <td>{new Date(el.start_time).toLocaleString()}</td>
                    <td>{new Date(el.end_time).toLocaleString()}</td>
                    <td>{el.candidate_count}</td>
                    <td>{el.total_votes}</td>
                    <td>
                      <div className="flex gap-sm">
                        <button className="btn btn-sm btn-secondary" onClick={() => handleEdit(el)}>Edit</button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(el.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "560px" }}>
              <h2 className="modal-title">{editingId ? "Edit Election" : "Create Election"}</h2>
              
              {/* Auto-status note */}
              <div style={{
                background: "rgba(99,102,241,0.06)",
                border: "1px solid rgba(99,102,241,0.2)",
                borderRadius: "var(--radius-md)",
                padding: "0.75rem 1rem",
                marginBottom: "var(--space-lg)",
                fontSize: "0.8125rem",
                color: "var(--text-secondary)",
              }}>
                ⚙️ <strong style={{ color: "var(--accent-primary)" }}>Status is auto-managed</strong> — 
                the system automatically transitions elections between <em>Upcoming → Active → Ended</em> based on start &amp; end dates.
              </div>

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Title</label>
                  <input name="title" className="form-input" value={formData.title} onChange={handleChange} required placeholder="Election title" />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea name="description" className="form-input" value={formData.description} onChange={handleChange} placeholder="Optional description" />
                </div>
                <div className="grid grid-2">
                  <div className="form-group">
                    <label className="form-label">Start Time</label>
                    <input name="start_time" type="datetime-local" className="form-input" value={formData.start_time} onChange={handleChange} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">End Time</label>
                    <input name="end_time" type="datetime-local" className="form-input" value={formData.end_time} onChange={handleChange} required />
                  </div>
                </div>
                {editingId && (
                  <div className="form-group">
                    <label className="form-label">Override Status <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(admin only)</span></label>
                    <CustomDropdown
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      options={[
                        { value: "upcoming", label: "🔵 Upcoming (auto)" },
                        { value: "active", label: "🟢 Active (auto)" },
                        { value: "completed", label: "⚫ Ended (auto)" },
                        { value: "cancelled", label: "🔴 Cancelled" },
                      ]}
                    />
                  </div>
                )}
                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">{editingId ? "Update" : "Create"}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={showConfirmDelete}
          onClose={() => setShowConfirmDelete(false)}
          onConfirm={confirmDelete}
          title="Delete Election"
          message="Are you sure you want to delete this election? This will remove all associated candidates and votes. This action cannot be undone."
          confirmText="Delete Election"
          type="danger"
        />
      </main>
    </div>
  );
}
