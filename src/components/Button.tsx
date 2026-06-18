import React from "react";
import clsx from "clsx";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "success" | "outline" | "danger";
    size?: "sm" | "md" | "lg";
    icon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
    children,
    variant = "primary",
    size = "md",
    icon,
    className,
    ...props
}) => {
    const baseStyles =
        "inline-flex items-center gap-2 rounded-[10px] font-normal transition-all focus:outline-none cursor-pointer";

    const variantStyles = {
        primary: "bg-[#155DFC] text-white hover:bg-[#155DFC]/80",
        success: "bg-[#00A63E] text-white hover:bg-[#00A63E]/80",
        outline: "border border-[#D1D5DC] bg-white text-[#364153] hover:bg-gray-50",
        danger: "bg-[#E7000B] text-white hover:bg-[#E7000B]/80",
    };

    const sizeStyles = {
        sm: "px-3 py-1.5 text-sm",
        md: "px-3 py-1.5 text-sm",
        lg: "px-4 py-1.5 text-base",
    };

    return (
        <button
            className={clsx(
                baseStyles,
                variantStyles[variant],
                sizeStyles[size],
                className
            )}
            {...props}
        >
            {icon && <span className="text-base">{icon}</span>}
            {children}
        </button>
    );
};

export default Button;
