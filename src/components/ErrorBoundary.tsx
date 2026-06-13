import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

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
 errorInfo: null
 };

 public static getDerivedStateFromError(error: Error): State {
 return { hasError: true, error, errorInfo: null };
 }

 public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
 console.error('Uncaught error:', error, errorInfo);
 this.setState({ errorInfo });
 }

 private handleReset = () => {
 this.setState({ hasError: false, error: null, errorInfo: null });
 window.location.reload();
 };

 public render() {
 if (this.state.hasError) {
 let isQuotaError = false;
 let errorMessage = this.state.error?.message || 'An unexpected error occurred.';
 
 try {
 // Try to parse if it's our custom JSON error
 const parsedError = JSON.parse(errorMessage);
 if (parsedError.error) {
 errorMessage = parsedError.error;
 }
 } catch (e) {
 // Not JSON, keep original message
 }

 if (errorMessage.toLowerCase().includes('quota') || errorMessage.toLowerCase().includes('resource-exhausted')) {
 isQuotaError = true;
 }

 return (
 <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center p-4">
 <div className="glass-panel p-8 max-w-lg w-full text-center">
 <div className="mx-auto h-16 w-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
 <AlertCircle className="h-8 w-8 text-red-600" />
 </div>
 <h1 className="text-2xl font-bold text-white mb-4">
 {isQuotaError ? 'Database Quota Exceeded' : 'Something went wrong'}
 </h1>
 <p className="text-gray-300 mb-8 leading-relaxed">
 {isQuotaError 
 ? "You have reached your daily free tier limit for database operations. Your quota will reset tomorrow. For more details, check the Spark plan limits in the Firebase documentation."
 : errorMessage}
 </p>
 <button
 onClick={this.handleReset}
 className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors glass-button glass-button-primary justify-center"
 >
 <RefreshCw className="h-4 w-4" />
 Reload Application
 </button>
 </div>
 </div>
 );
 }

 return this.props.children;
 }
}
