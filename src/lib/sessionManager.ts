const BUSINESS_PREFIX = 'business_';
const SUPERADMIN_PREFIX = 'superadmin_';

export type SessionType = 'business' | 'superadmin';

interface BusinessSession {
  sessionToken: string;
  businessId: string;
  businessName: string;
  adminEmail: string;
}

interface SuperAdminSession {
  userId: string;
  email: string;
  accessToken: string;
}

export const sessionManager = {
  setBusinessSession(session: BusinessSession) {
    localStorage.setItem(`${BUSINESS_PREFIX}session_token`, session.sessionToken);
    localStorage.setItem(`${BUSINESS_PREFIX}id`, session.businessId);
    localStorage.setItem(`${BUSINESS_PREFIX}name`, session.businessName);
    localStorage.setItem(`${BUSINESS_PREFIX}admin_email`, session.adminEmail);
    localStorage.setItem(`${BUSINESS_PREFIX}timestamp`, Date.now().toString());
  },

  getBusinessSession(): BusinessSession | null {
    const sessionToken = localStorage.getItem(`${BUSINESS_PREFIX}session_token`);
    const businessId = localStorage.getItem(`${BUSINESS_PREFIX}id`);
    const businessName = localStorage.getItem(`${BUSINESS_PREFIX}name`);
    const adminEmail = localStorage.getItem(`${BUSINESS_PREFIX}admin_email`);

    if (!sessionToken || !businessId) {
      return null;
    }

    return {
      sessionToken,
      businessId,
      businessName: businessName || '',
      adminEmail: adminEmail || '',
    };
  },

  clearBusinessSession() {
    localStorage.removeItem(`${BUSINESS_PREFIX}session_token`);
    localStorage.removeItem(`${BUSINESS_PREFIX}id`);
    localStorage.removeItem(`${BUSINESS_PREFIX}name`);
    localStorage.removeItem(`${BUSINESS_PREFIX}admin_email`);
    localStorage.removeItem(`${BUSINESS_PREFIX}timestamp`);
  },

  setSuperAdminSession(session: SuperAdminSession) {
    localStorage.setItem(`${SUPERADMIN_PREFIX}user_id`, session.userId);
    localStorage.setItem(`${SUPERADMIN_PREFIX}email`, session.email);
    localStorage.setItem(`${SUPERADMIN_PREFIX}access_token`, session.accessToken);
    localStorage.setItem(`${SUPERADMIN_PREFIX}timestamp`, Date.now().toString());
  },

  getSuperAdminSession(): SuperAdminSession | null {
    const userId = localStorage.getItem(`${SUPERADMIN_PREFIX}user_id`);
    const email = localStorage.getItem(`${SUPERADMIN_PREFIX}email`);
    const accessToken = localStorage.getItem(`${SUPERADMIN_PREFIX}access_token`);

    if (!userId || !accessToken) {
      return null;
    }

    return {
      userId,
      email: email || '',
      accessToken,
    };
  },

  clearSuperAdminSession() {
    localStorage.removeItem(`${SUPERADMIN_PREFIX}user_id`);
    localStorage.removeItem(`${SUPERADMIN_PREFIX}email`);
    localStorage.removeItem(`${SUPERADMIN_PREFIX}access_token`);
    localStorage.removeItem(`${SUPERADMIN_PREFIX}timestamp`);
  },

  clearAllSessions() {
    this.clearBusinessSession();
    this.clearSuperAdminSession();
  },

  getActiveSessionType(): SessionType | null {
    const businessSession = this.getBusinessSession();
    const superAdminSession = this.getSuperAdminSession();

    const businessTimestamp = parseInt(localStorage.getItem(`${BUSINESS_PREFIX}timestamp`) || '0');
    const superAdminTimestamp = parseInt(localStorage.getItem(`${SUPERADMIN_PREFIX}timestamp`) || '0');

    if (businessSession && superAdminSession) {
      return businessTimestamp > superAdminTimestamp ? 'business' : 'superadmin';
    }

    if (businessSession) return 'business';
    if (superAdminSession) return 'superadmin';
    return null;
  },
};
