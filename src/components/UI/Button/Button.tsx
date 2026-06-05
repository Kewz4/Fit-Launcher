import { ButtonProps } from "../../../types/components/types";

const Button = (props: ButtonProps) => {
  return (
    <button
      id={props.id}
      onClick={props.onClick}
      disabled={props.disabled}
      class={`
        relative flex items-center justify-center gap-2
        px-6 py-2.5 ${props.notRounded ? "rounded-none" : "rounded-xl"} font-medium
        transition-all duration-200 ease-out
        active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed
        border group
        ${props.size === "sm" ? "text-sm px-4 py-1.5" :
          props.size === "lg" ? "text-lg px-8 py-3" : "text-base"}
        ${props.variant === "glass"
          ? "bg-secondary-20/20 border-secondary-20 text-text hover:bg-secondary-20/40 hover:border-accent/40"
          : props.variant === "bordered"
            ? "bg-transparent border-accent/50 text-text hover:bg-accent/10 hover:border-accent"
            : "bg-accent border-accent/80 text-background hover:bg-accent/90"
        }
        ${props.class ?? ""}
      `}
    >
      {props.icon && (
        <span class="transition-transform duration-150 group-hover:translate-x-0.5">
          {props.icon}
        </span>
      )}
      {props.label && (
        <span class="transition-transform duration-150">
          {props.label}
        </span>
      )}
    </button>
  );
};

export default Button;
