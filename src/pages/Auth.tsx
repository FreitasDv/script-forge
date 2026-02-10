import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast.success("Conta criada! Verifique seu email para confirmar.");
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "rgba(255,255,255,0.03)",
    border: "1.5px solid rgba(255,255,255,0.08)",
    borderRadius: 10,
    color: "#e2e8f0",
    padding: "12px 14px",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s",
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0a0a14" }}>
      {/* Left panel */}
      <div
        style={{
          display: "none",
          width: "50%",
          background: "linear-gradient(135deg, #7c3aed, #6d28d9, #f43f5e)",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: 48,
          position: "relative",
        }}
        className="hidden lg:flex"
      >
        <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 24 }}>
            <span style={{ fontSize: 36 }}>✨</span>
            <h1 style={{ fontSize: 36, fontWeight: 800, color: "#fff", margin: 0, fontFamily: "'Space Grotesk', sans-serif" }}>ScriptAI</h1>
          </div>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 16, maxWidth: 400, lineHeight: 1.6 }}>
            Crie roteiros profissionais e prompts otimizados com inteligência artificial
          </p>
          <div style={{ display: "flex", gap: 32, justifyContent: "center", marginTop: 40 }}>
            {[
              { icon: "🎬", label: "Vídeos" },
              { icon: "📢", label: "Comerciais" },
              { icon: "🤖", label: "Prompts IA" },
            ].map((item) => (
              <div key={item.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, color: "rgba(255,255,255,0.6)" }}>
                <span style={{ fontSize: 28 }}>{item.icon}</span>
                <span style={{ fontSize: 12 }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 32 }}>
        <div
          style={{
            width: "100%",
            maxWidth: 400,
            background: "rgba(255,255,255,0.02)",
            border: "1.5px solid rgba(255,255,255,0.06)",
            borderRadius: 20,
            padding: 32,
            backdropFilter: "blur(20px)",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 12 }} className="lg:hidden">
              <span style={{ fontSize: 22 }}>✨</span>
              <span style={{ fontSize: 18, fontWeight: 800, color: "#e2e8f0", fontFamily: "'Space Grotesk', sans-serif" }}>ScriptAI</span>
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "#e2e8f0", margin: "0 0 6px", fontFamily: "'Space Grotesk', sans-serif" }}>
              {isLogin ? "Entrar" : "Criar conta"}
            </h2>
            <p style={{ color: "#64748b", fontSize: 13, margin: 0 }}>
              {isLogin ? "Acesse sua conta para continuar" : "Comece a criar roteiros incríveis"}
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {!isLogin && (
              <div>
                <label style={{ color: "#94a3b8", fontSize: 11, fontWeight: 700, letterSpacing: "0.8px", display: "block", marginBottom: 6 }}>NOME</label>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Seu nome"
                  required={!isLogin}
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = "#7c3aed55")}
                  onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
                />
              </div>
            )}
            <div>
              <label style={{ color: "#94a3b8", fontSize: 11, fontWeight: 700, letterSpacing: "0.8px", display: "block", marginBottom: 6 }}>EMAIL</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = "#7c3aed55")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
              />
            </div>
            <div>
              <label style={{ color: "#94a3b8", fontSize: 11, fontWeight: 700, letterSpacing: "0.8px", display: "block", marginBottom: 6 }}>SENHA</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = "#7c3aed55")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "13px",
                marginTop: 4,
                background: loading ? "rgba(255,255,255,0.04)" : "linear-gradient(135deg,#7c3aed,#6d28d9)",
                color: loading ? "#334155" : "#fff",
                border: "none",
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 700,
                cursor: loading ? "default" : "pointer",
                transition: "all 0.3s",
              }}
            >
              {loading ? "Carregando..." : isLogin ? "Entrar" : "Criar conta"}
            </button>
          </form>

          <div style={{ textAlign: "center", marginTop: 16 }}>
            <span style={{ color: "#64748b", fontSize: 13 }}>
              {isLogin ? "Não tem conta?" : "Já tem conta?"}{" "}
            </span>
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              style={{ color: "#a78bfa", fontSize: 13, fontWeight: 600, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
            >
              {isLogin ? "Criar conta" : "Entrar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
