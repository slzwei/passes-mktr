import React, { useState, useEffect } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

const EditorHost = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const editorUrl = (import.meta.env.VITE_EDITOR_URL || 'http://localhost:3000/editor/').replace(/(?<!\/)$/, '/');
  
  // Check if we're in development and editor might not be running
  const isDevelopment = import.meta.env.DEV;

  const handleIframeLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    setIsLoading(true);
    setHasError(false);
  };


  useEffect(() => {
    // Reset loading state when URL changes
    setIsLoading(true);
    setHasError(false);
  }, [editorUrl]);

  return (
    <div className="h-full flex flex-col" style={{ height: 'calc(100vh - 80px)' }}>
      {/* Content */}
      <div className="flex-1 relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading Pass Editor...</p>
            </div>
          </div>
        )}

        {hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
            <div className="max-w-md mx-auto p-6">
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <div className="space-y-4">
                    <p className="font-medium">Failed to load Pass Editor</p>
                    <p className="text-sm">
                      The editor service at <code className="bg-red-100 px-1 rounded">{editorUrl}</code> is not responding.
                    </p>
                    <div className="text-xs text-red-600 space-y-1">
                      <p>• Make sure the editor is running: <code>cd apps/editor && npm start</code></p>
                      <p>• Or run the full project: <code>npm run dev</code> from root</p>
                      <p>• Check that VITE_EDITOR_URL is set correctly</p>
                      <p>• Verify there are no CORS issues</p>
                    </div>
                    <div className="flex justify-center pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRetry}
                        className="flex items-center space-x-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span>Retry</span>
                      </Button>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          </div>
        )}


        <iframe
          key={retryCount} // Force reload on retry
          src={editorUrl}
          className="w-full h-full border-0"
          title="Pass Editor"
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          // Allow all necessary permissions for editor functionality
          sandbox="allow-scripts allow-same-origin allow-forms allow-downloads allow-popups allow-modals"
          allow="clipboard-write"
          referrerPolicy="no-referrer"
          loading="eager"
        />
      </div>
    </div>
  );
};

export default EditorHost;
