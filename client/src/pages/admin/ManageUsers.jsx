import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiOutlineUser,
  HiOutlineShieldCheck,
  HiOutlineSearch,
  HiOutlineUserGroup,
  HiOutlineBadgeCheck,
  HiOutlineCheck,
  HiOutlineBan,
  HiOutlineRefresh,
} from "react-icons/hi";
import { getAllUsers, updateUserRole, updateUserStatus } from "../../api/user.api";
import Sidebar from "../../components/Sidebar";
import ConfirmModal from "../../components/ConfirmModal";
import CustomDropdown from "../../components/CustomDropdown";
import "./Admin.css";
import "./ManageUsers.css";

const ROLE_CONFIG = {
  admin: {
    label: "Admin",
    className: "role-admin",
    icon: HiOutlineShieldCheck,
    gradient: "linear-gradient(135deg, #f59e0b, #ef4444)",
  },
  officer: {
    label: "Election Officer",
    className: "role-officer",
    icon: HiOutlineBadgeCheck,
    gradient: "linear-gradient(135deg, #3b82f6, #6366f1)",
  },
  voter: {
    label: "Voter",
    className: "role-voter",
    icon: HiOutlineUser,
    gradient: "linear-gradient(135deg, #8b5cf6, #a855f7)",
  },
};

function UserCard({ user, onRoleChange, onStatusChange }) {
  const [updatingRole, setUpdatingRole] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const config = ROLE_CONFIG[user.role] || ROLE_CONFIG.voter;
  const RoleIcon = config.icon;
  const initials = user.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  const handleRoleChange = async (newRole) => {
    if (newRole === user.role) return;
    setUpdatingRole(true);
    await onRoleChange(user.id, newRole);
    setUpdatingRole(false);
  };

  const handleStatusChange = async () => {
    setUpdatingStatus(true);
    await onStatusChange(user.id, user.is_active);
    setUpdatingStatus(false);
  };

  return (
    <motion.div
      className="user-card glass-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      layout
    >
      {/* Status glow bar */}
      <div
        className={`user-card-bar ${user.is_active ? "bar-active" : "bar-inactive"}`}
      />

      {/* Avatar + Identity */}
      <div className="user-card-top">
        <div className="user-avatar-wrap">
          <div className="user-avatar" style={{ background: config.gradient }}>
            {initials}
          </div>
          <div
            className={`user-status-dot ${user.is_active ? "dot-active" : "dot-inactive"}`}
            title={user.is_active ? "Active" : "Deactivated"}
          />
        </div>

        <div className="user-identity">
          <h3 className="user-name">{user.name}</h3>
          <p className="user-email">{user.email}</p>
          <div className={`user-role-badge ${config.className}`}>
            <RoleIcon />
            <span>{config.label}</span>
          </div>
        </div>

        <div className={`user-active-pill ${user.is_active ? "pill-active" : "pill-inactive"}`}>
          {user.is_active ? "Active" : "Deactivated"}
        </div>
      </div>

      {/* Divider */}
      <div className="user-card-divider" />

      {/* Controls */}
      <div className="user-card-controls">
        <div className="control-group">
          <label className="control-label">Role</label>
          <div className="select-wrap">
            <CustomDropdown
              className="user-role-custom-select"
              value={user.role}
              onChange={(e) => handleRoleChange(e.target.value)}
              options={[
                { value: "voter", label: "Voter" },
                { value: "officer", label: "Election Officer" },
                { value: "admin", label: "Admin" }
              ]}
            />
            {updatingRole && <div className="select-spinner spinner spinner-sm" />}
          </div>
        </div>

        <button
          className={`user-action-btn ${user.is_active ? "btn-deactivate" : "btn-activate"}`}
          onClick={handleStatusChange}
          disabled={updatingStatus}
        >
          {updatingStatus ? (
            <div className="spinner spinner-sm" />
          ) : user.is_active ? (
            <>
              <HiOutlineBan />
              <span>Deactivate</span>
            </>
          ) : (
            <>
              <HiOutlineCheck />
              <span>Activate</span>
            </>
          )}
        </button>
      </div>

      {/* Joined date */}
      {user.created_at && (
        <p className="user-joined">
          Joined {new Date(user.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
        </p>
      )}
    </motion.div>
  );
}

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [alertConfig, setAlertConfig] = useState({ isOpen: false, title: "", message: "", type: "info" });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await getAllUsers();
      setUsers(data.data);
      setError(null);
    } catch {
      setError("Failed to fetch users. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateUserRole(userId, newRole);
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: newRole } : u));
    } catch (err) {
      setAlertConfig({
        isOpen: true,
        title: "Update Failed",
        message: err.response?.data?.message || "Failed to update role",
        type: "danger"
      });
    }
  };

  const handleStatusChange = async (userId, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      await updateUserStatus(userId, newStatus);
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, is_active: newStatus } : u));
    } catch (err) {
      setAlertConfig({
        isOpen: true,
        title: "Update Failed",
        message: err.response?.data?.message || "Failed to update status",
        type: "danger"
      });
    }
  };

  // Stats
  const stats = {
    total: users.length,
    admins: users.filter((u) => u.role === "admin").length,
    officers: users.filter((u) => u.role === "officer").length,
    voters: users.filter((u) => u.role === "voter").length,
    active: users.filter((u) => u.is_active).length,
  };

  // Filtered users
  const filtered = users.filter((u) => {
    const matchSearch =
      !search ||
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === "all" || u.role === filterRole;
    const matchStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && u.is_active) ||
      (filterStatus === "inactive" && !u.is_active);
    return matchSearch && matchRole && matchStatus;
  });

  return (
    <div className="layout">
      <Sidebar />
      <main className="layout-main">
        {/* ── Page Header ── */}
        <div className="page-header" style={{ marginBottom: "var(--space-xl)" }}>
          <h1 className="page-title">Manage Users</h1>
          <p className="page-subtitle">Control access, roles, and status of all registered users</p>
        </div>

        {/* ── Stats Bar ── */}
        <div className="mu-stats-grid">
          {[
            { label: "Total Users", value: stats.total, icon: HiOutlineUserGroup, color: "#6366f1" },
            { label: "Admins", value: stats.admins, icon: HiOutlineShieldCheck, color: "#f59e0b" },
            { label: "Officers", value: stats.officers, icon: HiOutlineBadgeCheck, color: "#3b82f6" },
            { label: "Voters", value: stats.voters, icon: HiOutlineUser, color: "#8b5cf6" },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                className="mu-stat-card glass-card"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
              >
                <div className="mu-stat-icon" style={{ background: stat.color + "22", color: stat.color }}>
                  <Icon />
                </div>
                <div className="mu-stat-body">
                  <div className="mu-stat-value">{stat.value}</div>
                  <div className="mu-stat-label">{stat.label}</div>
                </div>
                {/* Decorative ring */}
                <div className="mu-stat-ring" style={{ borderColor: stat.color + "30" }} />
              </motion.div>
            );
          })}
        </div>

        {/* ── Search & Filter ── */}
        <motion.div
          className="mu-filter-bar glass-card"
          style={{ zIndex: 10 }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="mu-search-wrap">
            <HiOutlineSearch className="mu-search-icon" />
            <input
              type="text"
              className="mu-search-input"
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="mu-filter-group">
            <CustomDropdown
              className="mu-filter-custom"
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              options={[
                { value: "all", label: "All Roles" },
                { value: "admin", label: "Admin" },
                { value: "officer", label: "Officer" },
                { value: "voter", label: "Voter" }
              ]}
            />

            <CustomDropdown
              className="mu-filter-custom"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              options={[
                { value: "all", label: "All Status" },
                { value: "active", label: "Active" },
                { value: "inactive", label: "Deactivated" }
              ]}
            />

            <button className="mu-refresh-btn" onClick={fetchUsers} title="Refresh">
              <HiOutlineRefresh />
            </button>
          </div>
        </motion.div>

        {/* ── Error ── */}
        {error && (
          <motion.div
            className="mu-error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            ⚠️ {error}
          </motion.div>
        )}

        {/* ── Loading ── */}
        {loading ? (
          <div className="loading-container" style={{ minHeight: "300px" }}>
            <div className="spinner" />
            <p style={{ color: "var(--text-secondary)", marginTop: "1rem" }}>Loading users…</p>
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            className="mu-empty glass-card"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="mu-empty-icon">👥</div>
            <h3>No users found</h3>
            <p>Try adjusting your search or filters.</p>
          </motion.div>
        ) : (
          <>
            <div className="mu-results-meta">
              Showing <strong>{filtered.length}</strong> of <strong>{users.length}</strong> users
            </div>
            <motion.div className="mu-user-grid" layout>
              <AnimatePresence>
                {filtered.map((user) => (
                  <UserCard
                    key={user.id}
                    user={user}
                    onRoleChange={handleRoleChange}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          </>
        )}

        <ConfirmModal
          isOpen={alertConfig.isOpen}
          onClose={() => setAlertConfig({ ...alertConfig, isOpen: false })}
          title={alertConfig.title}
          message={alertConfig.message}
          type={alertConfig.type}
          singleButton={true}
          confirmText="OK"
        />
      </main>
    </div>
  );
}
