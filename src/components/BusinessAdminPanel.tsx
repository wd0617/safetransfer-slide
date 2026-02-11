import { useState } from 'react';
import { LogOut, Store, AlertCircle, Shield, Monitor, FileText, CreditCard } from 'lucide-react';
import { useBusiness } from '../contexts/BusinessContext';
import { getTranslation } from '../lib/translations';
import { getTheme } from '../lib/themes';
import ExchangeRatesManager from './admin/ExchangeRatesManager';
import MediaManager from './admin/MediaManager';
import AnnouncementsManager from './admin/AnnouncementsManager';
import BusinessSettingsManager from './admin/BusinessSettingsManager';
import ServiceLogosManager from './admin/ServiceLogosManager';
import SuperAdminPanel from './admin/SuperAdminPanel';
import SupportPanel from './business/SupportPanel';
import NotificationsPanel from './business/NotificationsPanel';
import PaymentsPanel from './business/PaymentsPanel';
import LegalModal from './LegalModal';

const APP_VERSION = '1.0.0';

interface BusinessAdminPanelProps {
  onViewDisplay?: () => void;
}

export default function BusinessAdminPanel({ onViewDisplay }: BusinessAdminPanelProps) {
  const { business, admin, language, isSuperAdmin, signOut, loading } = useBusiness();
  const [activeTab, setActiveTab] = useState<'rates' | 'media' | 'announcements' | 'logos' | 'settings' | 'support' | 'notifications' | 'payments' | 'superadmin'>('rates');
  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | null>(null);

  if (loading || !business || !admin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{getTranslation(language, 'loadingBusinessData')}</p>
        </div>
      </div>
    );
  }

  if (business.status === 'blocked') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="bg-red-100 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <AlertCircle className="w-12 h-12 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{getTranslation(language, 'businessBlocked')}</h2>
          <p className="text-gray-600 mb-6">
            {getTranslation(language, 'businessBlockedMessage')}
          </p>
          <button
            onClick={signOut}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all"
          >
            {getTranslation(language, 'signOut')}
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'rates' as const, label: getTranslation(language, 'exchangeRates') },
    { id: 'media' as const, label: getTranslation(language, 'media') },
    { id: 'announcements' as const, label: getTranslation(language, 'announcements') },
    { id: 'logos' as const, label: getTranslation(language, 'serviceLogos') },
    { id: 'settings' as const, label: getTranslation(language, 'businessSettings') },
    { id: 'payments' as const, label: getTranslation(language, 'payments'), icon: CreditCard },
    { id: 'notifications' as const, label: getTranslation(language, 'notifications') },
    { id: 'support' as const, label: getTranslation(language, 'support') },
    ...(isSuperAdmin ? [{ id: 'superadmin' as const, label: 'SuperAdmin' }] : []),
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <div
                className="p-2 rounded-lg"
                style={{ backgroundColor: business.primary_color || '#1e40af' }}
              >
                <Store className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{business.name}</h1>
                <p className="text-sm text-gray-600">{admin.full_name} - {admin.role === 'owner' ? getTranslation(language, 'owner') : getTranslation(language, 'administrator')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {onViewDisplay && (
                <button
                  onClick={onViewDisplay}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Monitor className="w-4 h-4" />
                  <span className="hidden sm:inline">Ver Pantalla</span>
                </button>
              )}
              <button
                onClick={signOut}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">{getTranslation(language, 'signOut')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'border-b-2 text-gray-900'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                  style={
                    activeTab === tab.id
                      ? {
                          borderColor: tab.id === 'superadmin' ? '#dc2626' : (business.primary_color || '#1e40af'),
                        }
                      : {}
                  }
                >
                  {tab.id === 'superadmin' && <Shield className="w-4 h-4 inline mr-2" />}
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'rates' && <ExchangeRatesManager businessId={business.id} />}
            {activeTab === 'media' && <MediaManager businessId={business.id} />}
            {activeTab === 'announcements' && <AnnouncementsManager businessId={business.id} />}
            {activeTab === 'logos' && <ServiceLogosManager businessId={business.id} />}
            {activeTab === 'settings' && <BusinessSettingsManager businessId={business.id} />}
            {activeTab === 'payments' && (
              <PaymentsPanel
                businessId={business.id}
                theme={getTheme('ocean-blue')}
                translations={{
                  payments: getTranslation(language, 'payments'),
                  paymentHistory: getTranslation(language, 'paymentHistory'),
                  invoice: getTranslation(language, 'invoice'),
                  amount: getTranslation(language, 'amount'),
                  status: getTranslation(language, 'status'),
                  dueDate: getTranslation(language, 'dueDate'),
                  downloadInvoice: getTranslation(language, 'downloadInvoice'),
                  paid: getTranslation(language, 'paid'),
                  pending: getTranslation(language, 'pending'),
                  overdue: getTranslation(language, 'overdue'),
                  cancelled: getTranslation(language, 'cancelled'),
                  noPayments: getTranslation(language, 'noPayments'),
                  concept: getTranslation(language, 'concept'),
                  date: getTranslation(language, 'date'),
                }}
              />
            )}
            {activeTab === 'notifications' && <NotificationsPanel />}
            {activeTab === 'support' && <SupportPanel />}
            {activeTab === 'superadmin' && isSuperAdmin && <SuperAdminPanel />}
          </div>
        </div>

        <footer className="mt-8 pb-6">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setLegalModal('privacy')}
                className="flex items-center gap-1.5 hover:text-gray-700 transition-colors"
              >
                <Shield className="w-4 h-4" />
                {getTranslation(language, 'privacyPolicy')}
              </button>
              <span className="text-gray-300">|</span>
              <button
                onClick={() => setLegalModal('terms')}
                className="flex items-center gap-1.5 hover:text-gray-700 transition-colors"
              >
                <FileText className="w-4 h-4" />
                {getTranslation(language, 'termsAndConditions')}
              </button>
            </div>
            <span className="text-gray-300 hidden sm:inline">|</span>
            <div className="text-gray-400">
              {getTranslation(language, 'version')} {APP_VERSION} - {new Date().getFullYear()} SafeTransfer Slide. {getTranslation(language, 'allRightsReserved')}.
            </div>
          </div>
        </footer>
      </div>

      {legalModal && (
        <LegalModal
          type={legalModal}
          language={language}
          onClose={() => setLegalModal(null)}
        />
      )}
    </div>
  );
}
