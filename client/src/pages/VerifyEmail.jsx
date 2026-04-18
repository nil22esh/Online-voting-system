import { useEffect, useState, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { verifyEmail } from "../api/auth.api";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("loading"); // "loading" | "success" | "error" | "already"
  const [message, setMessage] = useState("");
  const calledRef = useRef(false);

  useEffect(() => {
    if (calledRef.current) return;
    calledRef.current = true;

    const token = searchParams.get("token");

    if (!token) {
      setStatus("error");
      setMessage("No verification token found in the link. Please check your email again.");
      return;
    }

    verifyEmail(token)
      .then((res) => {
        const msg = res.data?.message || "Email verified successfully!";
        if (msg.toLowerCase().includes("already")) {
          setStatus("already");
        } else {
          setStatus("success");
        }
        setMessage(msg);
      })
      .catch((err) => {
        setStatus("error");
        setMessage(
          err.response?.data?.message ||
            "Invalid or expired verification link. Please register again."
        );
      });
  }, [searchParams]);

  const states = {
    loading: {
      icon: (
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div className="spinner" style={{ width: 56, height: 56, borderWidth: 4 }} />
        </div>
      ),
      title: "Verifying your email…",
      subtitle: "Please wait while we confirm your identity.",
      accent: "#6c63ff",
    },
    success: {
      icon: <span style={{ fontSize: 64 }}>✅</span>,
      title: "Email Verified!",
      subtitle: message,
      accent: "#4ade80",
    },
    already: {
      icon: <span style={{ fontSize: 64 }}>🔓</span>,
      title: "Already Verified",
      subtitle: message,
      accent: "#38bdf8",
    },
    error: {
      icon: <span style={{ fontSize: 64 }}>❌</span>,
      title: "Verification Failed",
      subtitle: message,
      accent: "#f87171",
    },
  };

  const current = states[status];

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0f0f1a 0%, #16213e 50%, #0f3460 100%)",
        fontFamily: "'Segoe UI', Arial, sans-serif",
        padding: "20px",
      }}
    >
      <div
        style={{
          background: "#1e1e2e",
          border: `1px solid ${current.accent}40`,
          borderTop: `4px solid ${current.accent}`,
          borderRadius: 20,
          padding: "48px 40px",
          maxWidth: 480,
          width: "100%",
          textAlign: "center",
          boxShadow: `0 0 60px ${current.accent}20`,
          animation: "fadeInUp 0.5s ease both",
        }}
      >
        {/* Logo */}
        <div
          style={{
            marginBottom: 24,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span style={{ fontSize: 22, fontWeight: 800, color: "#a78bfa", letterSpacing: -0.5 }}>
            🗳️ Online Voting System
          </span>
        </div>

        {/* Icon */}
        <div style={{ marginBottom: 20, lineHeight: 1 }}>{current.icon}</div>

        {/* Title */}
        <h1
          style={{
            margin: "0 0 12px",
            fontSize: 26,
            fontWeight: 800,
            color: "#f1f5f9",
            letterSpacing: -0.5,
          }}
        >
          {current.title}
        </h1>

        {/* Subtitle */}
        <p
          style={{
            margin: "0 0 32px",
            fontSize: 15,
            color: "#94a3b8",
            lineHeight: 1.7,
          }}
        >
          {current.subtitle}
        </p>

        {/* Actions */}
        {status !== "loading" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {(status === "success" || status === "already") && (
              <Link
                to="/login"
                style={{
                  display: "block",
                  padding: "14px 24px",
                  background: `linear-gradient(135deg, ${current.accent}, #a78bfa)`,
                  color: "#fff",
                  textDecoration: "none",
                  borderRadius: 50,
                  fontWeight: 700,
                  fontSize: 15,
                  boxShadow: `0 4px 20px ${current.accent}40`,
                  transition: "opacity 0.2s",
                }}
              >
                Continue to Login →
              </Link>
            )}

            {status === "error" && (
              <Link
                to="/register"
                style={{
                  display: "block",
                  padding: "14px 24px",
                  background: "linear-gradient(135deg, #f87171, #f59e0b)",
                  color: "#fff",
                  textDecoration: "none",
                  borderRadius: 50,
                  fontWeight: 700,
                  fontSize: 15,
                  boxShadow: "0 4px 20px rgba(248,113,113,0.3)",
                }}
              >
                Back to Register
              </Link>
            )}

            <Link
              to="/login"
              style={{
                fontSize: 13,
                color: "#64748b",
                textDecoration: "none",
                padding: "8px",
              }}
            >
              Go to homepage
            </Link>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
