import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { Wand2, Video, Megaphone, Sparkles } from "lucide-react";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

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
    background: "rgba(255,255,255,0.04)",
    border: "1.5px solid rgba(255,255,255,0.1)",
    borderRadius: 12,
    color: "#e2e8f0",
    padding: "14px 16px",
    fontSize: 15,
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s, box-shadow 0.2s",
    minHeight: 48,
  };

  const focusHandler = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = "rgba(124,58,237,0.5)";
    e.target.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.12)";
  };
  const blurHandler = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = "rgba(255,255,255,0.1)";
    e.target.style.boxShadow = "none";
  };

  const featureItems = [
    { icon: <Video size={22} aria-hidden="true" />, label: "Vídeos" },
    { icon: <Megaphone size={22} aria-hidden="true" />, label: "Comerciais" },
    { icon: <Sparkles size={22} aria-hidden="true" />, label: "Prompts IA" },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0a0a14", flexDirection: isMobile ? "column" : "row" }}>
      {/* Left panel — desktop only */}
      {!isMobile && (
        <aside
          aria-hidden="true"
          style={{
            width: "50%",
            background: "linear-gradient(145deg, #1a0a2e 0%, #0f0a1a 40%, #0a0a14 100%)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            padding: 48,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={{ position: "absolute", top: "20%", left: "20%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)", filter: "blur(60px)" }} />
          <div style={{ position: "absolute", bottom: "20%", right: "10%", width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(244,63,94,0.1) 0%, transparent 70%)", filter: "blur(40px)" }} />

          <div style={{ textAlign: "center", position: "relative", zIndex: 1, animation: "fade-in 0.6s ease-out" }}>
            <Wand2 size={44} style={{ color: "#a78bfa", marginBottom: 16 }} />
            <h1 style={{ fontSize: 42, fontWeight: 800, color: "#e2e8f0", margin: "0 0 12px", fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-1px" }}>ScriptAI</h1>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 16, maxWidth: 320, lineHeight: 1.7, margin: "0 auto" }}>
              Roteiros profissionais e prompts otimizados com inteligência artificial
            </p>
            <div style={{ display: "flex", gap: 40, justifyContent: "center", marginTop: 48 }}>
              {featureItems.map((item) => (
                <div key={item.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 52, height: 52, borderRadius: 14, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", color: "#a78bfa" }}>
                    {item.icon}
                  </div>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", fontWeight: 500 }}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      )}

      {/* Right panel */}
      <main
        role="main"
        aria-label={isLogin ? "Entrar na conta" : "Criar conta"}
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: isMobile ? "40px 20px" : 48,
          position: "relative",
        }}
      >
        {isMobile && (
          <div style={{
            textAlign: "center",
            marginBottom: 32,
            animation: "slide-up 0.4s ease-out",
          }}>
            <Wand2 size={32} style={{ color: "#a78bfa", marginBottom: 8 }} aria-hidden="true" />
            <h1 style={{ fontSize: 28, fontWeight: 800, color: "#e2e8f0", margin: "0 0 6px", fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-0.5px" }}>ScriptAI</h1>
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, margin: 0 }}>Crie roteiros com IA</p>
          </div>
        )}

        <div
          style={{
            width: "100%",
            maxWidth: 400,
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 20,
            padding: isMobile ? 24 : 36,
            animation: "slide-up 0.5s ease-out",
          }}
        >
          <div style={{ marginBottom: 28 }}>
            {!isMobile && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                <Wand2 size={18} style={{ color: "#a78bfa" }} aria-hidden="true" />
                <span style={{ fontSize: 16, fontWeight: 800, color: "#e2e8f0", fontFamily: "'Space Grotesk', sans-serif" }}>ScriptAI</span>
              </div>
            )}
            <h2 style={{ fontSize: isMobile ? 24 : 26, fontWeight: 800, color: "#e2e8f0", margin: "0 0 6px", fontFamily: "'Space Grotesk', sans-serif" }}>
              {isLogin ? "Bem-vindo de volta" : "Criar conta"}
            </h2>
            <p style={{ color: "#475569", fontSize: 14, margin: 0 }}>
              {isLogin ? "Entre para continuar criando" : "Comece a criar roteiros incríveis"}
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }} aria-label={isLogin ? "Formulário de login" : "Formulário de cadastro"}>
            {!isLogin && (
              <div>
                <label htmlFor="auth-name" style={{ color: "#64748b", fontSize: 13, fontWeight: 600, display: "block", marginBottom: 8 }}>Nome</label>
                <input
                  id="auth-name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Seu nome"
                  required={!isLogin}
                  autoComplete="name"
                  style={inputStyle}
                  onFocus={focusHandler}
                  onBlur={blurHandler}
                />
              </div>
            )}
            <div>
              <label htmlFor="auth-email" style={{ color: "#64748b", fontSize: 13, fontWeight: 600, display: "block", marginBottom: 8 }}>Email</label>
              <input
                id="auth-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                autoComplete="email"
                style={inputStyle}
                onFocus={focusHandler}
                onBlur={blurHandler}
              />
            </div>
            <div>
              <label htmlFor="auth-password" style={{ color: "#64748b", fontSize: 13, fontWeight: 600, display: "block", marginBottom: 8 }}>Senha</label>
              <input
                id="auth-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                autoComplete={isLogin ? "current-password" : "new-password"}
                style={inputStyle}
                onFocus={focusHandler}
                onBlur={blurHandler}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "14px",
                marginTop: 8,
                background: loading ? "rgba(255,255,255,0.04)" : "linear-gradient(135deg,#7c3aed,#6d28d9)",
                color: loading ? "#475569" : "#fff",
                border: "none",
                borderRadius: 12,
                fontSize: 15,
                fontWeight: 700,
                cursor: loading ? "default" : "pointer",
                transition: "all 0.3s",
                minHeight: 48,
              }}
            >
              {loading ? "Carregando..." : isLogin ? "Entrar" : "Criar conta"}
            </button>
          </form>

          <div style={{ textAlign: "center", marginTop: 20 }}>
            <span style={{ color: "#475569", fontSize: 14 }}>
              {isLogin ? "Não tem conta?" : "Já tem conta?"}{" "}
            </span>
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              style={{ color: "#a78bfa", fontSize: 14, fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}
            >
              {isLogin ? "Criar conta" : "Entrar"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Auth;
