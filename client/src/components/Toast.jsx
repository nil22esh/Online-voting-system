import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import "./Toast.css";

export default function Toast() {
  const { toast, setToast } = useAuth();

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toast, setToast]);

  if (!toast) return null;

  return (
    <div className={`toast toast-${toast.type}`} onClick={() => setToast(null)}>
      <span className="toast-icon">
        {toast.type === "success" && "✓"}
        {toast.type === "error" && "✕"}
        {toast.type === "info" && "ℹ"}
      </span>
      <span>{toast.message}</span>
    </div>
  );
}
