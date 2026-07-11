import {
  Button as RadixButton,
  type ButtonProps as RadixButtonProps
} from "@radix-ui/themes";

type ButtonProps = RadixButtonProps;

export function Button({ asChild = false, type, ...props }: ButtonProps) {
  return (
    <RadixButton
      {...props}
      asChild={asChild}
      data-slot="button"
      type={asChild ? undefined : (type ?? "button")}
    />
  );
}

export type { ButtonProps };
