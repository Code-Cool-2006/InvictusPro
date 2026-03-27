import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api";
import "./App.css";

const ROLE_ROUTES = {
  Admin:     "/admin",
  Volunteer: "/volun",
  Donors:    "/donor",
};

function Login({ setUser }) {
  const [selectedModule, setSelectedModule] = useState(null);
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleModuleSelect = (module, login = true) => {
    setSelectedModule(module);
    setIsLogin(login);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post("/auth/login", {
        email: formData.email,
        password: formData.password,
      });

      localStorage.setItem("user", JSON.stringify(data));
      setUser(data);
      navigate(ROLE_ROUTES[data.role] || "/");
    } catch (error) {
      console.error("Login error:", error);
      alert(
        `Login failed: ${error.response?.data?.message || error.message}`
      );
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    // Basic validation
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    if (formData.password.length < 6) {
      alert("Password must be at least 6 characters long!");
      return;
    }

    try {
      await api.post("/auth/register", {
        email: formData.email,
        username: formData.username,
        password: formData.password,
        role: selectedModule,
      });

      alert(
        `Successfully registered as ${selectedModule}! Please login with your credentials.`
      );
      setIsLogin(true);
      setFormData({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
      });
    } catch (error) {
      console.error("Registration error:", error);
      alert(
        `Registration failed: ${error.response?.data?.message || error.message}`
      );
    }
  };

  const handleBack = () => {
    setSelectedModule(null);
    setIsLogin(true);
    setFormData({
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    });
  };

  return (
    <div className="auth-page">
      <div className="bg-blobs">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>
      
      <div className="auth-left">
        <div className="brand-hero">
          <h1 className="brand-title">InvictusPro</h1>
          <p className="brand-subtitle">Empowering community heroes through seamless coordination and transparent impact.</p>
        </div>
        
        <div className="feature-pills">
          <div className="feature-pill">
            <div className="pill-icon">🤝</div>
            <div className="pill-text">
              <h4>For Volunteers</h4>
              <p>Discover local opportunities that match your skills and schedule.</p>
            </div>
          </div>
          
          <div className="feature-pill">
            <div className="pill-icon">💰</div>
            <div className="pill-text">
              <h4>For Donors</h4>
              <p>Directly fund verified community projects with real-time tracking.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="login-card">
          <div className="card-header">
            <h2>Welcome Back</h2>
            <p>Login to manage your community activity</p>
          </div>

          <div className="auth-toggle">
            <button 
              className={`toggle-btn ${isLogin ? 'active' : ''}`} 
              onClick={() => setIsLogin(true)}
            >
              Login
            </button>
            <button 
              className={`toggle-btn ${!isLogin ? 'active' : ''}`} 
              onClick={() => setIsLogin(false)}
            >
              Register
            </button>
          </div>

          <div className="role-selection">
            <label>SELECT YOUR ROLE</label>
            <div className="role-grid three-cols">
              <button 
                className={`role-btn ${selectedModule === 'Admin' ? 'active' : ''}`}
                onClick={() => handleModuleSelect('Admin', isLogin)}
              >
                <span className="role-icon">🛡️</span>
                Admin
                {selectedModule === 'Admin' && <span className="check">✓</span>}
              </button>
              <button 
                className={`role-btn ${selectedModule === 'Volunteer' ? 'active' : ''}`}
                onClick={() => handleModuleSelect('Volunteer', isLogin)}
              >
                <span className="role-icon">👤</span>
                Volunteer
                {selectedModule === 'Volunteer' && <span className="check">✓</span>}
              </button>
              <button 
                className={`role-btn ${selectedModule === 'Donors' ? 'active' : ''}`}
                onClick={() => handleModuleSelect('Donors', isLogin)}
              >
                <span className="role-icon">🤝</span>
                Donor
                {selectedModule === 'Donors' && <span className="check">✓</span>}
              </button>
            </div>
          </div>

          <form onSubmit={isLogin ? handleLogin : handleRegister} className="login-form-content">
            {!isLogin && (
              <div className="input-group">
                <label>USERNAME</label>
                <div className="input-with-icon">
                  <span className="icon">👤</span>
                  <input
                    type="text"
                    name="username"
                    placeholder="Enter your username"
                    value={formData.username}
                    onChange={handleInputChange}
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            <div className="input-group">
              <label>USERNAME OR EMAIL</label>
              <div className="input-with-icon">
                <span className="icon">@</span>
                <input
                  type="email"
                  name="email"
                  placeholder="Enter your identifier"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label>PASSWORD</label>
              <div className="input-with-icon">
                <span className="icon">🔒</span>
                <input
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  minLength={isLogin ? undefined : 6}
                />
                <span className="eye-icon">👁️</span>
              </div>
            </div>

            {!isLogin && (
              <div className="input-group">
                <label>CONFIRM PASSWORD</label>
                <div className="input-with-icon">
                  <span className="icon">🔒</span>
                  <input
                    type="password"
                    name="confirmPassword"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            <div className="form-utils">
              <label className="remember-me">
                <input type="checkbox" /> Remember me
              </label>
              <a href="#" className="forgot-password">Forgot Password?</a>
            </div>

            <button type="submit" className="submit-btn">
              {isLogin ? "Login to Dashboard" : "Create Account"}
            </button>
          </form>

          <div className="divider">
            <span>OR CONTINUE WITH</span>
          </div>

          <div className="social-login">
            <button className="social-btn">
              <span className="social-icon">G</span> Google
            </button>
            <button className="social-btn">
              <span className="social-icon">🐱</span> GitHub
            </button>
          </div>

          <p className="card-footer">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button onClick={() => setIsLogin(!isLogin)} className="signup-link">
              {isLogin ? "Sign up for free" : "Login here"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
