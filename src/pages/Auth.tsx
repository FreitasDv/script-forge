import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { Wand2, Video, Megaphone, Sparkles, Mail, Lock, User, Loader2 } from "lucide-react";
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
    { icon: <Video size={22} aria-hidden="true" />, label: "Vídeos", delay: "0.1s" },
    { icon: <Megaphone size={22} aria-hidden="true" />, label: "Comerciais", delay: "0.2s" },
    { icon: <Sparkles size={22} aria-hidden="true" />, label: "Prompts IA", delay: "0.3s" },
  ];

  return (
    <div className={`flex min-h-screen bg-background ${isMobile ? "flex-col" : "flex-row"}`}>
      {/* Left panel — desktop only */}
      {!isMobile && (
        <aside
          aria-hidden="true"
          className="w-1/2 relative overflow-hidden flex flex-col justify-center items-center p-12"
          style={{ background: "linear-gradient(145deg, hsl(270 40% 12%) 0%, hsl(230 25% 8%) 40%, hsl(var(--background)) 100%)" }}
        >
          {/* Dot grid background */}
          <div className="absolute inset-0 dot-grid opacity-40" />

          {/* Subtle glow orbs */}
          <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full animate-glow-pulse" style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.12) 0%, transparent 70%)", filter: "blur(60px)" }} />
          <div className="absolute bottom-1/4 right-1/6 w-48 h-48 rounded-full animate-glow-pulse" style={{ background: "radial-gradient(circle, hsl(var(--accent) / 0.08) 0%, transparent 70%)", filter: "blur(40px)", animationDelay: "1s" }} />

          <div className="text-center relative z-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl glass mb-6 animate-scale-in">
              <Wand2 size={28} className="text-primary" />
            </div>
            <h1 className="text-5xl font-extrabold text-foreground mb-3 tracking-tighter animate-slide-up">
              <GradientText>ScriptAI</GradientText>
            </h1>
            <p className="text-muted-foreground text-base max-w-xs mx-auto leading-relaxed animate-slide-up" style={{ animationDelay: "0.1s" }}>
              Roteiros profissionais e prompts otimizados com inteligência artificial
            </p>
            <div className="flex gap-10 justify-center mt-12">
              {featureItems.map((item) => (
                <div
                  key={item.label}
                  className="flex flex-col items-center gap-3 animate-slide-up"
                  style={{ animationDelay: item.delay }}
                >
                  <div className="w-14 h-14 rounded-2xl glass flex items-center justify-center text-primary transition-all duration-300 hover:scale-110 hover:shadow-lg" style={{ boxShadow: "0 0 20px hsl(var(--primary) / 0.1)" }}>
                    {item.icon}
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">{item.label}</span>
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
        className={`flex-1 flex flex-col items-center justify-center relative ${isMobile ? "px-5 py-10" : "p-12"}`}
      >
        {isMobile && (
          <div className="text-center mb-8 animate-slide-up">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl glass mb-3">
              <Wand2 size={24} className="text-primary" />
            </div>
            <h1 className="text-3xl font-extrabold text-foreground mb-1 tracking-tight">
              <GradientText>ScriptAI</GradientText>
            </h1>
            <p className="text-muted-foreground text-sm">Crie roteiros com IA</p>
          </div>
        )}

        <div className="w-full max-w-[400px] glass rounded-2xl animate-scale-in" style={{ padding: isMobile ? 24 : 36, boxShadow: "0 0 60px hsl(var(--primary) / 0.06)" }}>
          {/* Gradient top border accent */}
          <div className="absolute top-0 left-8 right-8 h-px" style={{ background: "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.4), transparent)" }} />

          <div className="mb-7">
            {!isMobile && (
              <div className="flex items-center gap-2 mb-5">
                <Wand2 size={18} className="text-primary" />
                <span className="text-base font-extrabold text-foreground">ScriptAI</span>
              </div>
            )}
            <h2 className={`font-extrabold text-foreground mb-1 ${isMobile ? "text-2xl" : "text-[26px]"}`}>
              {isLogin ? "Bem-vindo de volta" : "Criar conta"}
            </h2>
            <p className="text-muted-foreground text-sm">
              {isLogin ? "Entre para continuar criando" : "Comece a criar roteiros incríveis"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" aria-label={isLogin ? "Formulário de login" : "Formulário de cadastro"}>
            {!isLogin && (
              <div>
                <label htmlFor="auth-name" className="text-muted-foreground text-xs font-semibold block mb-2">Nome</label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
                  <input
                    id="auth-name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Seu nome"
                    required={!isLogin}
                    autoComplete="name"
                    className="input-glass pl-10"
                  />
                </div>
              </div>
            )}
            <div>
              <label htmlFor="auth-email" className="text-muted-foreground text-xs font-semibold block mb-2">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
                <input
                  id="auth-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  autoComplete="email"
                  className="input-glass pl-10"
                />
              </div>
            </div>
            <div>
              <label htmlFor="auth-password" className="text-muted-foreground text-xs font-semibold block mb-2">Senha</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
                <input
                  id="auth-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  className="input-glass pl-10"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3.5 mt-2 text-[15px] flex items-center justify-center gap-2 min-h-[48px]"
            >
              {loading ? (
                <><Loader2 size={16} className="animate-spin" /> Carregando...</>
              ) : (
                isLogin ? "Entrar" : "Criar conta"
              )}
            </button>
          </form>

          <div className="text-center mt-5">
            <span className="text-muted-foreground text-sm">
              {isLogin ? "Não tem conta?" : "Já tem conta?"}{" "}
            </span>
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary text-sm font-semibold bg-transparent border-none cursor-pointer hover:underline transition-all"
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
