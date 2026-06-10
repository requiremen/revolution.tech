import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    setUsername(localStorage.getItem("username") || "User");
    fetchProjects(token);
  }, [navigate]);

  const fetchProjects = async (token) => {
    try {
      const res = await fetch("http://localhost:3000/projects", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 403 || res.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("username");
        navigate("/login");
        return;
      }
      const data = await res.json();
      if (res.ok) {
        setProjects(data.projects || []);
      }
    } catch (err) {
      console.error("Failed to fetch projects", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    // Create a new project first
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:3000/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: "Untitled Project",
          description: prompt.substring(0, 50) + "...",
        }),
      });
      if (res.status === 403 || res.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("username");
        navigate("/login");
        return;
      }
      const data = await res.json();
      if (res.ok && data.project) {
        // Navigate to the editor with the new project ID, passing the prompt as state
        navigate(`/editor/${data.project._id}`, { state: { initialPrompt: prompt } });
      }
    } catch (err) {
      console.error("Failed to create project", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    navigate("/login");
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="brand-logo-small">
            <svg width="24" height="24" viewBox="0 0 40 40" fill="none">
              <rect width="40" height="40" rx="10" fill="#fff" />
              <path d="M12 28V12h6.5c1.8 0 3.2.5 4.2 1.4 1 1 1.5 2.2 1.5 3.8 0 1.1-.3 2-.8 2.8-.5.8-1.3 1.3-2.2 1.6l3.5 6.4h-3.2l-3.1-5.8H15V28h-3zm3-8.4h3.3c1 0 1.8-.3 2.3-.8.5-.5.8-1.2.8-2s-.3-1.5-.8-2c-.5-.5-1.3-.8-2.3-.8H15v5.6z" fill="#111" />
            </svg>
            <span>Revoult</span>
          </div>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>

        <nav className="sidebar-nav">
          <a href="#" className="nav-item active">Home</a>
          <a href="#" className="nav-item">Search</a>
          <a href="#" className="nav-item">Resources</a>
        </nav>

        <div className="sidebar-section">
          <h4>Projects</h4>
          <a href="#" className="nav-item">All projects</a>
          <a href="#" className="nav-item">Starred</a>
          <a href="#" className="nav-item">Created by me</a>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Hero Section */}
        <div className="hero-gradient">
          <h1 className="hero-title">Let’s build something, {username}</h1>

          <form className="prompt-bar-container" onSubmit={handleGenerate}>
            <input
              type="text"
              className="prompt-input"
              placeholder="Describe the app you want to build..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <button type="submit" className="generate-btn">
              Generate ✨
            </button>
          </form>
        </div>

        {/* Projects Section */}
        <div className="projects-container">
          <div className="projects-tabs">
            <span className="tab active">My projects</span>
            <span className="tab">Recently viewed</span>
            <span className="tab">Templates</span>
          </div>

          {loading ? (
            <div className="projects-loading">Loading projects...</div>
          ) : projects.length === 0 ? (
            <div className="empty-state">
              <p>No projects yet. Enter a prompt above to create your first app!</p>
            </div>
          ) : (
            <div className="projects-grid">
              {projects.map((project) => (
                <div
                  key={project._id}
                  className="project-card"
                  onClick={() => navigate(`/editor/${project._id}`)}
                >
                  <div className="project-thumbnail">
                    {/* Placeholder for actual thumbnail */}
                    <div className="thumbnail-placeholder"></div>
                  </div>
                  <div className="project-info">
                    <h3>{project.name}</h3>
                    <p>{project.description || "No description"}</p>
                    <span className="project-date">
                      {new Date(project.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
