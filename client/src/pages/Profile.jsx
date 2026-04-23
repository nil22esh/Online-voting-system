import { useAuth } from "../context/AuthContext";
import { useTranslation } from "../context/TranslationContext";
import Sidebar from "../components/Sidebar";
import { HiOutlineUserCircle, HiOutlineMail, HiOutlinePhone, HiOutlineIdentification, HiOutlineShieldCheck } from "react-icons/hi";

export default function Profile() {
  const { user } = useAuth();
  const { t } = useTranslation();

  if (!user) return null;

  return (
    <div className="layout">
      <Sidebar />
      <main className="layout-main">
        <div className="page-header">
          <h1 className="page-title">{t("ProfileTitle")}</h1>
          <p className="page-subtitle">{t("ProfileSubtitle")}</p>
        </div>

        <div className="grid grid-2">
          {/* Main User Card */}
          <div className="glass-card animate-slideUp">
            <div className="flex flex-col items-center text-center">
              <div 
                className="mb-md flex items-center justify-center" 
                style={{
                  width: "100px", height: "100px", borderRadius: "50%", 
                  background: "var(--accent-gradient)", color: "white", fontSize: "3rem"
                }}
              >
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <h2 style={{ marginBottom: "0.25rem" }}>{user.name}</h2>
              <span className={`badge badge-${user.role} mb-lg`}>
                {user.role}
              </span>
              
              <div className="w-full mt-md" style={{ borderTop: "1px solid var(--border-glass)", paddingTop: "var(--space-md)", textAlign: "left" }}>
                <h3 className="mb-md text-secondary" style={{ fontSize: "1rem" }}>{t("UserOverview")}</h3>
                
                <div className="flex items-center gap-md mb-sm">
                  <div style={{ color: "var(--text-muted)", fontSize: "1.25rem" }}><HiOutlineMail /></div>
                  <div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{t("Email")}</div>
                    <div style={{ fontWeight: "500" }}>{user.email}</div>
                  </div>
                </div>

                <div className="flex items-center gap-md mb-sm mt-md">
                  <div style={{ color: "var(--text-muted)", fontSize: "1.25rem" }}><HiOutlinePhone /></div>
                  <div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{t("PhoneNumber")}</div>
                    <div style={{ fontWeight: "500" }}>{user.phone_number || "Not provided"}</div>
                  </div>
                </div>

                <div className="flex items-center gap-md mb-sm mt-md">
                  <div style={{ color: "var(--text-muted)", fontSize: "1.25rem" }}><HiOutlineIdentification /></div>
                  <div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{t("AadhaarInfo")}</div>
                    <div style={{ fontWeight: "500", fontFamily: "monospace", letterSpacing: "0.1em" }}>
                      {user.aadhar_number ? `XXXX-XXXX-${user.aadhar_number.slice(-4)}` : "Not linked"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Account Settings / Info Card */}
          <div className="glass-card animate-slideUp" style={{ animationDelay: "0.1s" }}>
            <h2 className="mb-md flex items-center gap-sm">
              <HiOutlineShieldCheck style={{ color: "var(--success)" }} /> {t("AccountStatus")}
            </h2>
            <div 
              style={{
                padding: "1rem", borderRadius: "var(--radius-md)", 
                background: "var(--success-bg)", border: "1px solid rgba(16, 185, 129, 0.2)",
                color: "var(--success)", display: "flex", alignItems: "center", gap: "0.75rem",
                fontWeight: "600"
              }}
            >
               <span className="live-dot" style={{ margin: 0 }}></span> {user.is_active ? "Active" : "Inactive"} -{" "}
  {user.is_verified ? "Fully Verified" : "Not Verified"}
            </div>
            
            <p className="mt-md" style={{ color: "var(--text-secondary)", fontSize: "0.875rem", lineHeight: "1.6" }}>
              Your account is authenticated and eligible to participate in election processes. Make sure you don't share your OTP or credentials with anyone.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
