import { useState, useEffect } from 'react';
import { flushSync } from 'react-dom';
import { Store } from 'lucide-react';
import { sessionManager } from './lib/sessionManager';
import { BusinessProvider, useBusiness } from './contexts/BusinessContext';
import DisplayScreen from './components/DisplayScreen';
import BusinessLogin from './components/BusinessLogin';
import BusinessRegistration from './components/BusinessRegistration';
import BusinessAdminPanel from './components/BusinessAdminPanel';
import PasswordRecoveryRequest from './components/PasswordRecoveryRequest';

type ViewMode = 'display' | 'business-login' | 'business-register' | 'business-admin' | 'password-recovery';

function AppContent() {
  const { refreshBusiness, business, admin, loading } = useBusiness();
  const [viewMode, setViewMode] = useState<ViewMode>('display');
  const [isBusinessAuthenticated, setIsBusinessAuthenticated] = useState(() => {
    return !!sessionManager.getBusinessSession();
  });
  const [, setShowingDeactivatedMessage] = useState(false);
  const [renderKey, setRenderKey] = useState(0);

  useEffect(() => {
    console.log('[APP] State changed:', { viewMode, isBusinessAuthenticated, renderKey, loading });
  }, [viewMode, isBusinessAuthenticated, renderKey, loading]);

  useEffect(() => {
    console.log('[APP] Checking session consistency:', { business, admin, viewMode, loading });

    const hasSession = !!sessionManager.getBusinessSession();

    if (!hasSession && !business && !admin && !loading && viewMode === 'business-admin') {
      console.log('[APP] Session cleared but still in admin view, redirecting to display');
      setIsBusinessAuthenticated(false);
      setViewMode('display');
      setRenderKey(prev => prev + 1);
    }
  }, [business, admin, viewMode, loading]);

  if (viewMode === 'business-register') {
    return (
      <>
        <BusinessRegistration
          onSuccess={async () => {
            console.log('[APP] Registration success, updating state...');
            flushSync(() => {
              setIsBusinessAuthenticated(true);
              setViewMode('business-admin');
              setRenderKey(prev => prev + 1);
            });
            await refreshBusiness();
            console.log('[APP] Business data refreshed after registration');
          }}
          onBack={() => setViewMode('business-login')}
        />
      </>
    );
  }

  if (viewMode === 'password-recovery') {
    return (
      <PasswordRecoveryRequest
        onBack={() => setViewMode('business-login')}
      />
    );
  }

  if (viewMode === 'business-login') {
    return (
      <BusinessLogin
        key={`login-${renderKey}`}
        onLoginSuccess={async () => {
          console.log('[APP] ============ onLoginSuccess ENTERED ============');
          try {
            console.log('[APP] About to update state and reload context...');
            flushSync(() => {
              console.log('[APP] Inside flushSync, setting states...');
              setIsBusinessAuthenticated(true);
              setViewMode('business-admin');
              setRenderKey(prev => prev + 1);
              console.log('[APP] States set, will refresh business data');
            });
            console.log('[APP] Calling refreshBusiness to load data...');
            await refreshBusiness();
            console.log('[APP] Business data refreshed, navigation complete');
          } catch (error) {
            console.error('[APP] ERROR in onLoginSuccess:', error);
          }
        }}
        onRegisterClick={() => setViewMode('business-register')}
        onBack={() => setViewMode('display')}
        onShowDeactivatedMessage={() => setShowingDeactivatedMessage(true)}
        onHideDeactivatedMessage={() => setShowingDeactivatedMessage(false)}
        onPasswordRecoveryClick={() => setViewMode('password-recovery')}
      />
    );
  }

  if (viewMode === 'business-admin') {
    if (!isBusinessAuthenticated) {
      setViewMode('business-login');
      return null;
    }

    return (
      <BusinessAdminPanel onViewDisplay={() => setViewMode('display')} />
    );
  }

  return (
    <>
      <DisplayScreen />

      <button
        onClick={() => setViewMode(isBusinessAuthenticated ? 'business-admin' : 'business-login')}
        className="fixed bottom-4 right-4 px-4 py-2 bg-white text-gray-800 rounded-lg hover:bg-gray-100 transition-all z-50 flex items-center gap-2 led-glow-button"
        title="Panel de Negocio"
      >
        <Store className="w-5 h-5" />
        <span className="font-medium">Admin Panel</span>
      </button>
    </>
  );
}

function App() {
  return (
    <BusinessProvider>
      <AppContent />
    </BusinessProvider>
  );
}

export default App;
