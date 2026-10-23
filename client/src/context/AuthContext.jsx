import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useState,
  useMemo,
  useCallback,
} from "react";
import {
  getMe,
  loginUser,
  registerUser,
  logoutUser,
  googleLogin as googleLoginRedirect,
} from "../api/auth.api";

const AuthContext = createContext(null);
const ToastContext = createContext(null);

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: true,
};

function authReducer(state, action) {
  switch (action.type) {
    case "SET_USER":
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        loading: false,
      };
    case "LOGOUT":
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        loading: false,
      };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const [toast, setToast] = useState(null);

  const checkAuth = useCallback(async () => {
    try {
      const res = await getMe();
      dispatch({ type: "SET_USER", payload: res.data.data });
    } catch {
      dispatch({ type: "LOGOUT" });
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const login = useCallback(async (email, password) => {
    try {
      const res = await loginUser({ email, password });
      dispatch({ type: "SET_USER", payload: res.data.data });
      setToast({ type: "success", message: "Logged in successfully!" });
      return { success: true };
    } catch (error) {
      const msg = error.response?.data?.message || "Login failed";
      setToast({ type: "error", message: msg });
      return { success: false, message: msg };
    }
  }, []);

  const register = useCallback(
    async (name, email, password, phone_number, aadhar_number) => {
      try {
        const res = await registerUser({
          name,
          email,
          password,
          phone_number,
          aadhar_number,
        });
        dispatch({ type: "SET_USER", payload: res.data.data });
        setToast({ type: "success", message: "Registered" });
        return { success: true };
      } catch (error) {
        const msg =
          error.response?.data?.message ||
          error.response?.data?.errors?.join(", ") ||
          "Registration failed due to multiple failed attempts. Please try again later.";
        setToast({ type: "error", message: msg });
        return { success: false, message: msg };
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } catch {
      // Continue with logout even if API call fails
    }
    dispatch({ type: "LOGOUT" });
    setToast({ type: "info", message: "Logged out successfully" });
  }, []);

  const showToast = useCallback((type, message) => {
    setToast({ type, message });
  }, []);

  const googleLogin = useCallback(() => {
    googleLoginRedirect();
  }, []);

  const authValue = useMemo(
    () => ({
      ...state,
      login,
      register,
      logout,
      googleLogin,
    }),
    [state, login, register, logout, googleLogin],
  );

  const toastValue = useMemo(
    () => ({ toast, setToast, showToast }),
    [toast, showToast],
  );

  return (
    <AuthContext.Provider value={authValue}>
      <ToastContext.Provider value={toastValue}>
        {children}
      </ToastContext.Provider>
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within an AuthProvider");
  }
  return context;
}

export default AuthContext;
