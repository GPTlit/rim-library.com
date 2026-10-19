import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, AlertTriangle, Trash2 } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class RootErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in application root:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetCache = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      // ignore
    }
    if ('caches' in window) {
      caches.keys().then((keys) => {
        Promise.all(keys.map((k) => caches.delete(k))).finally(() => {
          window.location.href = '/';
        });
      }).catch(() => {
        window.location.href = '/';
      });
    } else {
      globalThis.location.href = '/';
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#1c1917] text-white flex flex-col items-center justify-center p-6 text-center select-none" dir="rtl">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-6">
            <AlertTriangle className="w-8 h-8 text-amber-400" />
          </div>

          <h1 className="text-2xl font-bold mb-2">مكتبة القهوة | Qahwa Library</h1>
          <p className="text-stone-300 max-w-md text-sm mb-6 leading-relaxed">
            حدث خطأ أثناء تحميل الصفحة، يرجى إعادة المحاولة أو تحديث الذاكرة المؤقتة.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
            <button
              onClick={this.handleReload}
              className="flex-1 py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-medium flex items-center justify-center gap-2 transition"
            >
              <RefreshCw className="w-4 h-4" />
              <span>إعادة التحميل</span>
            </button>
            <button
              onClick={this.handleResetCache}
              className="flex-1 py-3 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 active:scale-95 text-stone-200 font-medium flex items-center justify-center gap-2 border border-stone-700 transition text-xs"
            >
              <Trash2 className="w-4 h-4" />
              <span>مسح الذاكرة المؤقتة</span>
            </button>
          </div>

          {import.meta.env.DEV && this.state.error && (
            <pre className="mt-8 p-4 bg-stone-900 border border-stone-800 rounded-lg text-xs text-stone-400 text-left max-w-lg overflow-auto" dir="ltr">
              {this.state.error.message}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
