import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { Wand2, Video, Megaphone, Sparkles, Mail, Lock, User, Loader2, Zap } from "lucide-react";
import { GradientText } from "@/components/ui/gradient-text";

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

  const featureItems = [
    { icon: <Video size={28} aria-hidden="true" />, label: "Roteiros de Vídeo", desc: "YouTube, Reels, TikTok", delay: "0.15s" },
    { icon: <Megaphone size={28} aria-hidden="true" />, label: "Comerciais", desc: "Anúncios que convertem", delay: "0.25s" },
    { icon: <Sparkles size={28} aria-hidden="true" />, label: "Prompts IA", desc: "Veo, Kling, Nano", delay: "0.35s" },
  ];

  return (
    <div className={`flex min-h-screen bg-background ${isMobile ? "flex-col" : "flex-row"}`}>
      {/* Left panel — desktop only */}
      {!isMobile && (
        <aside
          aria-hidden="true"
          className="w-1/2 relative overflow-hidden flex flex-col justify-center items-center p-16"
        >
          {/* Gradient mesh background */}
          <div className="absolute inset-0">
            <div className="absolute w-[500px] h-[500px] rounded-full animate-mesh opacity-60"
              style={{ top: "10%", left: "10%", background: "radial-gradient(circle, hsl(262 83% 58% / 0.15) 0%, transparent 70%)", filter: "blur(80px)" }}
            />
            <div className="absolute w-[400px] h-[400px] rounded-full animate-mesh opacity-50"
              style={{ bottom: "15%", right: "10%", background: "radial-gradient(circle, hsl(340 82% 60% / 0.1) 0%, transparent 70%)", filter: "blur(80px)", animationDelay: "2.5s" }}
            />
            <div className="absolute w-[350px] h-[350px] rounded-full animate-mesh opacity-40"
              style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)", background: "radial-gradient(circle, hsl(200 80% 50% / 0.08) 0%, transparent 70%)", filter: "blur(60px)", animationDelay: "5s" }}
            />
          </div>

          {/* Line grid */}
          <div className="absolute inset-0 line-grid" />

          <div className="text-center relative z-10 max-w-md">
            {/* Logo */}
            <div className="inline-flex items-center justify-center icon-container-lg rounded-2xl mb-8 animate-scale-in glow-md">
              <Wand2 size={28} className="text-primary" />
            </div>

            <h1 className="text-display text-foreground mb-4 animate-slide-up">
              <GradientText>ScriptAI</GradientText>
            </h1>

            <p className="text-muted-foreground text-lg max-w-sm mx-auto leading-relaxed animate-slide-up mb-4"
              style={{ animationDelay: "0.1s" }}>
              Roteiros profissionais e prompts<br/>otimizados com inteligência artificial
            </p>

            {/* Powered by AI badge */}
            <div className="inline-flex items-center gap-1.5 badge-primary animate-slide-up mb-14 animate-border-shimmer"
              style={{ animationDelay: "0.15s", background: "linear-gradient(90deg, hsl(var(--primary) / 0.12), hsl(var(--primary) / 0.2), hsl(var(--primary) / 0.12))", backgroundSize: "200% 100%" }}>
              <Zap size={10} /> Powered by AI
            </div>

            {/* Feature cards */}
            <div className="flex flex-col gap-5">
              {featureItems.map((item) => (
                <div
                  key={item.label}
                  className="glass rounded-2xl p-5 flex items-center gap-5 animate-slide-up group hover:border-primary/20 transition-all duration-300"
                  style={{ animationDelay: item.delay }}
                >
                  <div className="icon-container icon-container-md flex-shrink-0 text-primary group-hover:scale-110 transition-transform duration-300 glow-sm">
                    {item.icon}
                  </div>
                  <div className="text-left">
                    <span className="text-sm font-bold text-foreground block">{item.label}</span>
                    <span className="text-caption">{item.desc}</span>
                  </div>
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
        className={`flex-1 flex flex-col items-center justify-center relative ${isMobile ? "px-5 py-12" : "p-16"}`}
      >
        {isMobile && (
          <div className="text-center mb-10 animate-slide-up">
            <div className="inline-flex items-center justify-center icon-container icon-container-md rounded-xl mb-4 glow-sm">
              <Wand2 size={24} className="text-primary" />
            </div>
            <h1 className="text-3xl font-extrabold text-foreground mb-2 tracking-tight">
              <GradientText>ScriptAI</GradientText>
            </h1>
            <p className="text-muted-foreground text-sm">Crie roteiros profissionais com IA</p>
          </div>
        )}

        <div className="w-full max-w-[420px] glass rounded-2xl animate-scale-in glow-md relative overflow-hidden"
          style={{ padding: isMobile ? 28 : 40 }}>
          {/* Gradient top border accent */}
          <div className="absolute top-0 left-0 right-0 h-[2px] animate-border-shimmer"
            style={{ background: "linear-gradient(90deg, transparent, hsl(var(--primary)), hsl(var(--accent)), hsl(var(--primary)), transparent)", backgroundSize: "200% 100%" }}
          />

          <div className="mb-8">
            {!isMobile && (
              <div className="flex items-center gap-2.5 mb-6">
                <div className="icon-container icon-container-sm rounded-lg">
                  <Wand2 size={16} className="text-primary" />
                </div>
                <span className="text-base font-extrabold text-foreground tracking-tight">ScriptAI</span>
              </div>
            )}
            <h2 className="text-title text-foreground mb-2">
              {isLogin ? "Bem-vindo de volta" : "Criar conta"}
            </h2>
            <p className="text-caption text-sm">
              {isLogin ? "Entre para continuar criando" : "Comece a criar roteiros incríveis"}
            </p>
          </div>

          {/* Pill segmented control */}
          <div className="flex gap-1 p-1 rounded-xl mb-7 surface-muted">
            <button
              type="button"
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
                isLogin ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:text-foreground"
              }`}
              style={isLogin ? { boxShadow: "0 4px 16px hsl(var(--primary) / 0.3)" } : {}}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
                !isLogin ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:text-foreground"
              }`}
              style={!isLogin ? { boxShadow: "0 4px 16px hsl(var(--primary) / 0.3)" } : {}}
            >
              Criar conta
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5" aria-label={isLogin ? "Formulário de login" : "Formulário de cadastro"}>
            {!isLogin && (
              <div>
                <label htmlFor="auth-name" className="text-label block mb-2.5">Nome</label>
                <div className="relative">
                  <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
                  <input
                    id="auth-name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Seu nome"
                    required={!isLogin}
                    autoComplete="name"
                    className="input-glass pl-11 h-12"
                  />
                </div>
              </div>
            )}
            <div>
              <label htmlFor="auth-email" className="text-label block mb-2.5">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
                <input
                  id="auth-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  autoComplete="email"
                  className="input-glass pl-11 h-12"
                />
              </div>
            </div>
            <div>
              <label htmlFor="auth-password" className="text-label block mb-2.5">Senha</label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
                <input
                  id="auth-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  className="input-glass pl-11 h-12"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-4 mt-1 text-[15px] flex items-center justify-center gap-2 min-h-[52px] font-extrabold"
            >
              {loading ? (
                <><Loader2 size={18} className="animate-spin" /> Carregando...</>
              ) : (
                isLogin ? "Entrar" : "Criar conta"
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default Auth;
