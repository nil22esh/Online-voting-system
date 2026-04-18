import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  HiOutlineShieldCheck,
  HiOutlineMail,
  HiOutlineLockClosed,
  HiOutlineUser,
  HiOutlinePhone,
  HiOutlineIdentification,
} from "react-icons/hi";
import "./Auth.css";

export default function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone_number: "",
    aadhar_number: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    const result = await register(
      formData.name,
      formData.email,
      formData.password,
      formData.phone_number,
      formData.aadhar_number
    );

    if (result.success) {
      navigate("/dashboard");
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-container animate-scaleIn">
        <div className="auth-header">
          <div className="auth-logo">
            <HiOutlineShieldCheck />
          </div>
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Join VoteSecure and start voting</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="auth-error">{error}</div>}

          <div className="form-group">
            <label className="form-label" htmlFor="reg-name">Full Name</label>
            <div className="input-with-icon">
              <HiOutlineUser className="input-icon" />
              <input
                id="reg-name"
                type="text"
                name="name"
                className="form-input"
                placeholder="John Doe"
                value={formData.name}
                onChange={handleChange}
                required
                minLength={3}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-email">Email Address</label>
            <div className="input-with-icon">
              <HiOutlineMail className="input-icon" />
              <input
                id="reg-email"
                type="email"
                name="email"
                className="form-input"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-password">Password</label>
            <div className="input-with-icon">
              <HiOutlineLockClosed className="input-icon" />
              <input
                id="reg-password"
                type="password"
                name="password"
                className="form-input"
                placeholder="Min 8 chars, 1 upper, 1 number, 1 special"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={8}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-confirm">Confirm Password</label>
            <div className="input-with-icon">
              <HiOutlineLockClosed className="input-icon" />
              <input
                id="reg-confirm"
                type="password"
                name="confirmPassword"
                className="form-input"
                placeholder="Re-enter your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-phone">Phone Number</label>
            <div className="input-with-icon">
              <HiOutlinePhone className="input-icon" />
              <input
                id="reg-phone"
                type="text"
                name="phone_number"
                className="form-input"
                placeholder="10-digit mobile number"
                value={formData.phone_number}
                onChange={handleChange}
                required
                pattern="\d{10}"
                maxLength={10}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-aadhar">Aadhar Number</label>
            <div className="input-with-icon">
              <HiOutlineIdentification className="input-icon" />
              <input
                id="reg-aadhar"
                type="text"
                name="aadhar_number"
                className="form-input"
                placeholder="12-digit Aadhar number"
                value={formData.aadhar_number}
                onChange={handleChange}
                required
                pattern="\d{12}"
                maxLength={12}
              />
            </div>
          </div>



          <button
            type="submit"
            className="btn btn-primary btn-block btn-lg"
            disabled={loading}
          >
            {loading ? <div className="spinner spinner-sm"></div> : "Create Account"}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account?{" "}
          <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
