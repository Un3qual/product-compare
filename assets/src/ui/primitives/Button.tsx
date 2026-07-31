import { Button as RadixButton, type ButtonProps as RadixButtonProps } from "@radix-ui/themes";

export type ButtonVariant = "ghost" | "soft" | "solid";
export type ButtonTone = "accent" | "danger";

export type ButtonProps = Omit<RadixButtonProps, "color" | "size" | "variant"> & {
  size?: "1" | "2" | "3";
  tone?: ButtonTone;
  variant?: ButtonVariant;
};

export function Button({
  asChild = false,
  size = "2",
  tone = "accent",
  type,
  variant = "solid",
  ...buttonProps
}: ButtonProps) {
  return (
    <RadixButton
      {...buttonProps}
      asChild={asChild}
      color={tone === "danger" ? "red" : undefined}
      data-size={size}
      data-slot="button"
      data-tone={tone}
      data-variant={variant}
      size={size}
      type={asChild ? undefined : (type ?? "button")}
      variant={variant}
    />
  );
}
