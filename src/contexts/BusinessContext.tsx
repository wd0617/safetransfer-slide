import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { logger } from '../lib/logger';
import { supabase } from '../lib/supabase';
import { sessionManager } from '../lib/sessionManager';
import { Language } from '../lib/translations';

interface Business {
  id: string;
  name: string;
  business_type: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  business_hours: string;
  subdomain: string | null;
  status: string;
}

interface BusinessAdmin {
  id: string;
  business_id: string;
  user_id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  is_superadmin?: boolean;
}

interface BusinessContextType {
  business: Business | null;
  admin: BusinessAdmin | null;
  loading: boolean;
  language: Language;
  isSuperAdmin: boolean;
  signOut: () => Promise<void>;
  refreshBusiness: () => Promise<void>;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export function BusinessProvider({ children }: { children: ReactNode }) {
  const [business, setBusiness] = useState<Business | null>(null);
  const [admin, setAdmin] = useState<BusinessAdmin | null>(null);
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState<Language>('es');
  const [loginTime, setLoginTime] = useState<number | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  const loadBusinessData = async () => {
    logger.log('[CONTEXT] ===== loadBusinessData STARTED =====');
    let timeoutId: NodeJS.Timeout | null = null;

    try {
      const businessSession = sessionManager.getBusinessSession();
      logger.log('[CONTEXT] Session from storage:', businessSession);

      if (!businessSession) {
        logger.log('[CONTEXT] No business session found, clearing state');
        setBusiness(null);
        setAdmin(null);
        setLoading(false);
        return;
      }

      logger.log('[CONTEXT] Setting loading to true, starting data fetch');
      setLoading(true);

      timeoutId = setTimeout(() => {
        console.error('[CONTEXT] Timeout after 10s - clearing session');
        sessionManager.clearBusinessSession();
        setBusiness(null);
        setAdmin(null);
        setLoading(false);
      }, 10000);

      logger.log('[CONTEXT] Validating session with RPC...');
      const { data: sessionValidation, error: sessionError } = await supabase.rpc('business_validate_session', {
        p_session_token: businessSession.sessionToken,
      });
      logger.log('[CONTEXT] RPC validation result:', { sessionValidation, sessionError });

      if (sessionError) {
        console.error('[CONTEXT] Session validation RPC error:', sessionError);
        if (timeoutId) clearTimeout(timeoutId);
        sessionManager.clearBusinessSession();
        setBusiness(null);
        setAdmin(null);
        setLoading(false);
        return;
      }

      if (sessionValidation?.error) {
        console.error('[CONTEXT] Session validation failed:', sessionValidation.error);
        if (timeoutId) clearTimeout(timeoutId);
        sessionManager.clearBusinessSession();
        setBusiness(null);
        setAdmin(null);
        setLoading(false);
        return;
      }

      logger.log('[CONTEXT] Session validated, loading admin data...');

      const { data: adminData, error: adminError } = await supabase
        .from('business_admins')
        .select('*')
        .eq('email', businessSession.adminEmail)
        .eq('business_id', businessSession.businessId)
        .eq('is_active', true)
        .maybeSingle();
      logger.log('[CONTEXT] Admin data result:', { adminData, adminError });

      if (adminError) {
        console.error('[CONTEXT] Admin data load error:', adminError);
        if (timeoutId) clearTimeout(timeoutId);
        sessionManager.clearBusinessSession();
        setBusiness(null);
        setAdmin(null);
        setLoading(false);
        return;
      }

      if (!adminData) {
        console.error('[CONTEXT] No admin data found for email:', businessSession.adminEmail);
        if (timeoutId) clearTimeout(timeoutId);
        sessionManager.clearBusinessSession();
        setBusiness(null);
        setAdmin(null);
        setLoading(false);
        return;
      }

      logger.log('[CONTEXT] Admin data loaded, loading business data...');
      setAdmin(adminData);
      setIsSuperAdmin(adminData.is_superadmin || false);

      const { data: businessData, error: businessError } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', businessSession.businessId)
        .maybeSingle();
      logger.log('[CONTEXT] Business data result:', { businessData, businessError });

      if (businessError) {
        console.error('[CONTEXT] Business data load error:', businessError);
        if (timeoutId) clearTimeout(timeoutId);
        sessionManager.clearBusinessSession();
        setBusiness(null);
        setAdmin(null);
        setLoading(false);
        return;
      }

      if (!businessData) {
        console.error('[CONTEXT] No business data found for id:', businessSession.businessId);
        if (timeoutId) clearTimeout(timeoutId);
        sessionManager.clearBusinessSession();
        setBusiness(null);
        setAdmin(null);
        setLoading(false);
        return;
      }

      if (businessData.status !== 'active') {
        console.error('[CONTEXT] Business is not active, status:', businessData.status);
        if (timeoutId) clearTimeout(timeoutId);
        sessionManager.clearBusinessSession();
        setBusiness(null);
        setAdmin(null);
        setLoading(false);
        return;
      }

      logger.log('[CONTEXT] Business data loaded successfully');
      setBusiness(businessData);

      const { data: settingsData } = await supabase
        .from('business_settings')
        .select('language')
        .eq('business_id', businessSession.businessId)
        .maybeSingle();
      logger.log('[CONTEXT] Settings data loaded:', settingsData);

      if (settingsData?.language) {
        setLanguage(settingsData.language as Language);
      }

      if (!loginTime) {
        setLoginTime(Date.now());
      }

      if (timeoutId) clearTimeout(timeoutId);
      setLoading(false);
      logger.log('[CONTEXT] ===== loadBusinessData COMPLETED SUCCESSFULLY =====');
    } catch (error) {
      console.error('[CONTEXT] Unexpected error loading business data:', error);
      if (timeoutId) clearTimeout(timeoutId);
      sessionManager.clearBusinessSession();
      setBusiness(null);
      setAdmin(null);
      setLoading(false);
    }
  };

  useEffect(() => {
    logger.log('[CONTEXT] Initial useEffect triggered, checking session...');
    const session = sessionManager.getBusinessSession();
    if (session) {
      logger.log('[CONTEXT] Session exists, loading data...');
      loadBusinessData();
    } else {
      logger.log('[CONTEXT] No session, skipping data load');
    }
  }, []);

  useEffect(() => {
    if (!business || !admin) return;

    const businessChannel = supabase
      .channel(`business-${business.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'businesses',
          filter: `id=eq.${business.id}`,
        },
        (payload) => {
          if (payload.new && payload.new.status !== 'active') {
            signOut();
          }
        }
      )
      .subscribe();

    const adminChannel = supabase
      .channel(`admin-${admin.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'business_admins',
          filter: `id=eq.${admin.id}`,
        },
        (payload) => {
          if (payload.new && !payload.new.is_active) {
            signOut();
          }
        }
      )
      .subscribe();

    return () => {
      businessChannel.unsubscribe();
      adminChannel.unsubscribe();
    };
  }, [business?.id, admin?.id]);

  useEffect(() => {
    if (!loginTime || !admin) return;

    const TWELVE_HOURS = 12 * 60 * 60 * 1000;

    const checkSessionTimeout = () => {
      const currentTime = Date.now();
      const elapsedTime = currentTime - loginTime;

      if (elapsedTime >= TWELVE_HOURS) {
        logger.log('Session expired after 12 hours');
        signOut();
      }
    };

    const interval = setInterval(checkSessionTimeout, 60000);

    return () => clearInterval(interval);
  }, [loginTime, admin]);

  const signOut = async () => {
    logger.log('[CONTEXT] Sign out initiated');
    sessionManager.clearBusinessSession();

    const superAdminSession = sessionManager.getSuperAdminSession();
    if (!superAdminSession) {
      await supabase.auth.signOut();
    }

    setBusiness(null);
    setAdmin(null);
    setLoginTime(null);
    setIsSuperAdmin(false);
    logger.log('[CONTEXT] Session cleared, state reset');
  };

  const refreshBusiness = async () => {
    await loadBusinessData();
  };

  return (
    <BusinessContext.Provider value={{ business, admin, loading, language, isSuperAdmin, signOut, refreshBusiness }}>
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusiness() {
  const context = useContext(BusinessContext);
  if (context === undefined) {
    throw new Error('useBusiness must be used within a BusinessProvider');
  }
  return context;
}
