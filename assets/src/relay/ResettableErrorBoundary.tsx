import { Component, type ReactNode } from "react";

type ResettableErrorBoundaryState = {
  hasError: boolean;
  resetToken: unknown;
};

type ResettableErrorBoundaryProps = {
  children: ReactNode;
  fallback: ReactNode;
  resetToken: unknown;
};

export class ResettableErrorBoundary extends Component<
  ResettableErrorBoundaryProps,
  ResettableErrorBoundaryState
> {
  constructor(props: ResettableErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      resetToken: props.resetToken,
    };
  }

  static getDerivedStateFromProps(
    props: ResettableErrorBoundaryProps,
    state: ResettableErrorBoundaryState,
  ): Partial<ResettableErrorBoundaryState> | null {
    if (props.resetToken === state.resetToken) {
      return null;
    }

    return {
      hasError: false,
      resetToken: props.resetToken,
    };
  }

  static getDerivedStateFromError(): Partial<ResettableErrorBoundaryState> {
    return { hasError: true };
  }

  override render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}
