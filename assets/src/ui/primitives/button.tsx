import type { ButtonHTMLAttributes } from "react";
import { Slot } from "./slot";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
};

export function Button({ asChild = false, type, ...props }: ButtonProps) {
  const Component = asChild ? Slot : "button";

  if (asChild) {
    return <Component {...props} data-slot="button" />;
  }

  return <Component {...props} data-slot="button" type={type ?? "button"} />;
}

export type { ButtonProps };
