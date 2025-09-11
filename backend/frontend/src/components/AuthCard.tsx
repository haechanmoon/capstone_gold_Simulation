// src/components/AuthCard.tsx
import type { ReactNode } from "react";
import "../styles/auth.css";

type Props = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  variant?: "default" | "wide";
};

export default function AuthCard({ title, subtitle, children, footer, variant = "default" }: Props) {
  const cls = variant === "wide" ? "auth-card auth-card--wide" : "auth-card";
  return (
    <div className="auth-bg">
      <div className={cls} role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <h1 id="auth-title" className="auth-title">{title}</h1>
        {subtitle && <p className="auth-sub">{subtitle}</p>}
        {children}
        {footer && <div className="auth-footer">{footer}</div>}
      </div>
    </div>
  );
}
