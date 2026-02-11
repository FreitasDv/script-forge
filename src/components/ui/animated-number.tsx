import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface AnimatedNumberProps extends React.HTMLAttributes<HTMLSpanElement> {
  value: number;
  duration?: number;
}

const AnimatedNumber = ({ value, duration = 600, className, ...props }: AnimatedNumberProps) => {
  const [display, setDisplay] = useState(0);
  const prevRef = useRef(0);

  useEffect(() => {
    const from = prevRef.current;
    const to = value;
    if (from === to) return;

    const start = performance.now();
    const step = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out expo
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    prevRef.current = to;
  }, [value, duration]);

  return (
    <span className={cn("tabular-nums", className)} {...props}>
      {display}
    </span>
  );
};

export { AnimatedNumber };
