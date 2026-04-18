import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useTranslation } from "../context/TranslationContext";
import {
  HiOutlineHome,
  HiOutlineClipboardList,
  HiOutlineUserGroup,
  HiOutlineChartBar,
  HiOutlineDocumentText,
  HiOutlineLogout,
  HiOutlineShieldCheck,
  HiOutlineMoon,
  HiOutlineSun,
  HiOutlineUser,
  HiOutlineGlobeAlt,
} from "react-icons/hi";
import CustomDropdown from "./CustomDropdown";
import "./Sidebar.css";

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t, language, setLanguage } = useTranslation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const isAdminOrOfficer = user?.role === "admin" || user?.role === "officer";

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <HiOutlineShieldCheck />
        </div>
        <span className="sidebar-logo-text">VoteSecure</span>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="sidebar-nav-section">
          <span className="sidebar-nav-label">{t("Main")}</span>
          <NavLink to="/dashboard" className="sidebar-link">
            <HiOutlineHome />
            <span>{t("Dashboard")}</span>
          </NavLink>
          <NavLink to="/elections" className="sidebar-link">
            <HiOutlineClipboardList />
            <span>{t("Elections")}</span>
          </NavLink>
          <NavLink to="/profile" className="sidebar-link">
            <HiOutlineUser />
            <span>{t("Profile")}</span>
          </NavLink>
          <NavLink to="/verify-vote" className="sidebar-link">
            <HiOutlineShieldCheck />
            <span>{t("VerifyVote")}</span>
          </NavLink>
        </div>

        {isAdminOrOfficer && (
          <div className="sidebar-nav-section">
            <span className="sidebar-nav-label">{t("Management")}</span>
            <NavLink to="/admin/elections" className="sidebar-link">
              <HiOutlineClipboardList />
              <span>{t("ManageElections")}</span>
            </NavLink>
            <NavLink to="/admin/candidates" className="sidebar-link">
              <HiOutlineUserGroup />
              <span>{t("ManageCandidates")}</span>
            </NavLink>
          </div>
        )}

        {user?.role === "admin" && (
          <div className="sidebar-nav-section">
            <span className="sidebar-nav-label">{t("Admin")}</span>
            <NavLink to="/admin/audit" className="sidebar-link">
              <HiOutlineDocumentText />
              <span>{t("AuditLogs")}</span>
            </NavLink>
            <NavLink to="/admin/users" className="sidebar-link">
              <HiOutlineUserGroup />
              <span>{t("ManageUsers")}</span>
            </NavLink>
          </div>
        )}
      </nav>

      {/* User info & logout */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{user?.name}</span>
            <span className={`badge badge-${user?.role}`}>{user?.role}</span>
          </div>
        </div>
        
        <div className="sidebar-language-selector" style={{display: 'flex', alignItems: 'center', padding: '0.75rem', gap: '0.75rem'}}>
          <CustomDropdown 
            options={[
              { value: 'en', label: 'English' },
              { value: 'hi', label: 'हिंदी (Hindi)' },
              { value: 'mr', label: 'मराठी (Marathi)' }
            ]}
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            icon={<HiOutlineGlobeAlt style={{fontSize: '1.25rem', color: 'var(--text-secondary)'}} />}
          />
        </div>

        <button className="sidebar-action-btn" onClick={toggleTheme}>
          {theme === 'light' ? <HiOutlineMoon /> : <HiOutlineSun />}
          <span>{theme === 'light' ? t("DarkMode") : t("LightMode")}</span>
        </button>
        <button className="sidebar-action-btn logout-btn" onClick={handleLogout}>
          <HiOutlineLogout />
          <span>{t("Logout")}</span>
        </button>
      </div>
    </aside>
  );
}
