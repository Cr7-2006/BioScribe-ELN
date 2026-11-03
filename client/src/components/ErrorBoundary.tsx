import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('BioScribe ErrorBoundary caught error:', error, errorInfo);
  }

  private handleReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      // ignore
    }
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex items-center justify-center p-6 select-none">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white">Laboratory Session Recovered</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                A temporary browser state conflict was detected. Click below to refresh your laboratory terminal session with clean parameters.
              </p>
            </div>
            <button
              onClick={this.handleReset}
              className="w-full py-3 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-slate-950 font-bold text-xs transition flex items-center justify-center space-x-2 cursor-pointer shadow-lg shadow-brand-500/20"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reset & Reload BioScribe</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
