import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";

export default function Editor() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationOutput, setGenerationOutput] = useState("");
  const [previewVersion, setPreviewVersion] = useState(Date.now()); // Used to force iframe refresh
  const endOfOutputRef = useRef(null);

  const [error, setError] = useState(null);

  // If we came from the dashboard with an initial prompt, start generating automatically
  useEffect(() => {
    if (location.state?.initialPrompt) {
      setPrompt(location.state.initialPrompt);
      handleGenerate(location.state.initialPrompt);
      // Clear the state so it doesn't trigger again on refresh
      window.history.replaceState({}, document.title);
    }
  }, [id]);

  useEffect(() => {
    // Auto-scroll to bottom of generation output
    if (endOfOutputRef.current) {
      endOfOutputRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [generationOutput, error, isGenerating]);

  const handleGenerate = async (currentPrompt) => {
    const textToSubmit = typeof currentPrompt === "string" ? currentPrompt : prompt;
    if (!textToSubmit.trim() || isGenerating) return;

    setIsGenerating(true);
    setGenerationOutput(""); // Clear previous output
    setError(null); // Clear previous errors
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`http://localhost:3000/projects/${id}/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ prompt: textToSubmit }),
      });

      if (response.status === 403 || response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("username");
        navigate("/login");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to connect to generation service. The server might be busy or offline.");
      }

      // Handle SSE Stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data:")) {
              const dataStr = line.replace("data:", "").trim();
              try {
                const data = JSON.parse(dataStr);
                if (data.text) {
                  setGenerationOutput((prev) => prev + data.text);
                } else if (data.msg) {
                  setError(data.msg);
                  break;
                } else if (data.generationId) {
                  // Done event
                  setPreviewVersion(Date.now()); // Refresh iframe
                  break;
                }
              } catch (e) {
                // If it's not valid JSON, it's just plain text chunks from gemini stream
                setGenerationOutput((prev) => prev + dataStr);
              }
            }
          }
        }
      }
    } catch (err) {
      console.error("Generation error:", err);
      setError(err.message || "An error occurred during app generation.");
    } finally {
      setIsGenerating(false);
      setPrompt(""); // Clear input
    }
  };

  return (
    <div className="editor-layout">
      {/* Sidebar (same as dashboard) */}
      <aside className="sidebar">
        <div className="sidebar-header cursor-pointer" onClick={() => navigate("/dashboard")}>
          <div className="brand-logo-small">
            <svg width="24" height="24" viewBox="0 0 40 40" fill="none">
              <rect width="40" height="40" rx="10" fill="#fff" />
              <path d="M12 28V12h6.5c1.8 0 3.2.5 4.2 1.4 1 1 1.5 2.2 1.5 3.8 0 1.1-.3 2-.8 2.8-.5.8-1.3 1.3-2.2 1.6l3.5 6.4h-3.2l-3.1-5.8H15V28h-3zm3-8.4h3.3c1 0 1.8-.3 2.3-.8.5-.5.8-1.2.8-2s-.3-1.5-.8-2c-.5-.5-1.3-.8-2.3-.8H15v5.6z" fill="#111" />
            </svg>
            <span>Revoult</span>
          </div>
        </div>
        <nav className="sidebar-nav">
          <a href="#" className="nav-item active" onClick={(e) => { e.preventDefault(); navigate("/dashboard"); }}>← Back to Dashboard</a>
        </nav>
      </aside>

      {/* Main Split Area */}
      <main className="editor-main">
        {/* Left Panel: Chat/Generation */}
        <div className="editor-left-panel">
          <div className="panel-header">
            <h2>Project Editor</h2>
          </div>

          <div className="chat-area">
            {(generationOutput || isGenerating || error) ? (
              <div className="ai-message">
                <div className="ai-avatar">AI</div>
                <div className="ai-content">
                  {error && (
                    <div className="error-display">
                      <span className="error-icon">⚠️</span>
                      <p className="error-text">{error}</p>
                    </div>
                  )}
                  {generationOutput && (
                    <pre className="code-output">{generationOutput}</pre>
                  )}
                  {isGenerating && !generationOutput && (
                    <div className="generation-loading-state">
                      <div className="loading-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                      <span className="loading-text">AI is thinking & generating code...</span>
                    </div>
                  )}
                  {isGenerating && generationOutput && <span className="typing-cursor">█</span>}
                </div>
                <div ref={endOfOutputRef} />
              </div>
            ) : (
              <div className="empty-chat">
                <p>Type a prompt below to start building your app.</p>
              </div>
            )}
          </div>

          <div className="prompt-input-area">
            <form onSubmit={(e) => { e.preventDefault(); handleGenerate(); }} className="editor-prompt-form">
              <input
                type="text"
                placeholder="Refine your app..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={isGenerating}
              />
              <button type="submit" disabled={isGenerating || !prompt.trim()} className="send-btn">
                Send
              </button>
            </form>
          </div>
        </div>

        {/* Right Panel: Live Preview */}
        <div className="editor-right-panel">
          <div className="browser-chrome">
            <div className="browser-dots">
              <span className="dot dot-red"></span>
              <span className="dot dot-yellow"></span>
              <span className="dot dot-green"></span>
            </div>
            <div className="browser-url">
              http://localhost:3000/preview/{id}
            </div>
            <button className="browser-refresh" onClick={() => setPreviewVersion(Date.now())}>
              ↻
            </button>
          </div>
          <div className="browser-viewport">
            <iframe
              key={previewVersion}
              src={`http://localhost:3000/preview/${id}`}
              title="App Preview"
              className="preview-iframe"
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        </div>
      </main>
    </div>
  );
}
