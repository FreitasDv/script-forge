import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const MESSAGES = [
  "Analisando roteiro...",
  "Montando estrutura de cenas...",
  "Aplicando neurociência da atenção...",
  "Gerando prompts cinematográficos...",
  "Calculando timing de retenção...",
  "Finalizando direção...",
];

const DirectorSkeleton = () => {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((i) => (i + 1) % MESSAGES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-3 mb-2">
        <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
        <span className="text-sm text-muted-foreground font-medium transition-all duration-500">
          {MESSAGES[msgIndex]}
        </span>
      </div>

      <Card className="border-primary/10">
        <CardContent className="p-5 space-y-3">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
        </CardContent>
      </Card>

      {[1, 2, 3].map((i) => (
        <Card key={i} className="border-border/30" style={{ opacity: 1 - i * 0.2 }}>
          <CardContent className="p-5 space-y-3">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-20 w-full rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-12 w-full rounded-lg" />
              <Skeleton className="h-12 w-full rounded-lg" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default DirectorSkeleton;
