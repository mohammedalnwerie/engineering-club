import { Component, type ErrorInfo, type ReactNode } from 'react';
import { ShieldAlert, RefreshCw, Download, Terminal } from 'lucide-react';
import { dataService } from '../services/dataService';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Caught unhandled runtime error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleEmergencyExport = () => {
    try {
      const dataStr = dataService.exportFullDatabaseJSON();
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `UP-Engineering-Club-Emergency-Backup-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('تعذر استخراج النسخة الاحتياطية تلقائياً: ' + String(err));
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#07090e] text-white flex items-center justify-center p-4 sm:p-6 font-sans text-right" dir="rtl">
          <div className="w-full max-w-xl rounded-3xl bg-[#0d121d] border-2 border-red-500/40 p-6 sm:p-8 shadow-[0_0_80px_rgba(239,68,68,0.25)] relative overflow-hidden">
            {/* Header Badge */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-red-950/80 border border-red-500/50 text-red-400">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-mono text-xs text-red-400 font-bold">SYSTEM RESILIENCE GATE // درع التعافي الذاتي</div>
                  <h3 className="text-xl font-black text-white">منظومة الحماية والاسترداد الآمن</h3>
                </div>
              </div>
              <div className="font-mono text-xs text-gray-400 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                FAIL-SAFE ACTIVE
              </div>
            </div>

            {/* Explanation Message */}
            <div className="space-y-3 mb-6 text-sm text-gray-300 leading-relaxed">
              <p>
                تم التقاط استثناء برمجي غير متوقع في واجهة العرض لمنع انهيار الصفحة.
                <strong className="text-emerald-400 block mt-1">
                  🛡️ جميع بياناتك، وطلبات الانضمام، والتذاكر محفوظة بأمان تام في الذاكرة التخزينية.
                </strong>
              </p>
              <p className="text-xs text-gray-400">
                يمكنك إعادة تشغيل المنظومة فوراً أو تحميل نسخة احتياطية طارئة من كامل بيانات النادي لضمان عدم ضياع أي بيانات.
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-3 mb-6">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full sm:flex-1 py-3 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(0,240,255,0.3)] transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                <span>إعادة تشغيل النظام بأمان 🔄</span>
              </button>

              <button
                type="button"
                onClick={this.handleEmergencyExport}
                className="w-full sm:flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer border border-white/10 transition-all"
                title="تصدير ملف JSON لبيانات النادي"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>حفظ نسخة احتياطية طارئة (JSON) 💾</span>
              </button>
            </div>

            {/* Technical Diagnostic Details */}
            {this.state.error && (
              <details className="text-xs font-mono bg-black/60 rounded-xl p-3 border border-white/10 text-gray-400">
                <summary className="cursor-pointer text-cyan-400 flex items-center gap-1.5 font-bold mb-1">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>عرض التفاصيل التقنية للخطأ (Debug Log)</span>
                </summary>
                <div className="mt-2 text-red-300 break-all">{this.state.error.toString()}</div>
                {this.state.errorInfo?.componentStack && (
                  <pre className="mt-2 text-[10px] text-gray-500 overflow-x-auto max-h-36">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
