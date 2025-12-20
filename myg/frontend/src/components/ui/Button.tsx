import { ButtonHTMLAttributes, ReactNode } from "react";
import { twMerge } from "tailwind-merge";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "danger" | "outline" | "upload";
  children: ReactNode;
}

export default function Button({ variant = "primary", className, children, ...props }: ButtonProps) {
  const baseStyles = "px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-text-main text-app-bg hover:bg-white font-bold",
    danger: "bg-transparent border border-text-accent text-text-main hover:bg-text-accent",
    outline: "bg-transparent border border-app-border text-text-main hover:bg-app-card",
    upload: "bg-text-accent text-text-main hover:bg-text-hover",
  };

  return (
    <button className={twMerge(baseStyles, variants[variant], className)} {...props}>
      {children}
    </button>
  );
}