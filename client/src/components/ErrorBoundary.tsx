import { AlertTriangle, RotateCcw } from "lucide-react";
import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#f6f4ec] p-6 sm:p-10">
          <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center rounded-[30px] border border-[#092b2a]/10 bg-white p-8 text-center shadow-[0_16px_46px_rgba(9,43,42,.08)]">
            <div className="grid h-14 w-14 place-items-center rounded-full bg-[#f9d8ce]"><AlertTriangle size={26} className="text-[#9c3b24]" /></div>
            <p className="mt-6 text-xs font-bold uppercase tracking-[.16em] text-[#177e73]">PondBasket recovery</p>
            <h2 className="font-display mt-3 text-4xl font-bold tracking-[-.06em] text-[#092b2a]">We could not open this view.</h2>
            <p className="mt-4 max-w-md text-sm leading-6 text-[#52716c]">Your account and order data remain protected. Refresh to retry the page; Demo Mode payments and financial actions are never completed automatically.</p>
            <button onClick={() => window.location.reload()} className="mt-7 flex items-center gap-2 rounded-full bg-[#0b4f4a] px-5 py-3 text-sm font-bold text-white transition-transform active:scale-95"><RotateCcw size={16} />Reload securely</button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
