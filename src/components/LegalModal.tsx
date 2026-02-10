import { X, Shield, FileText } from 'lucide-react';
import { getTranslation, Language } from '../lib/translations';

interface LegalModalProps {
  type: 'privacy' | 'terms';
  language: Language;
  onClose: () => void;
}

export default function LegalModal({ type, language, onClose }: LegalModalProps) {
  const isPrivacy = type === 'privacy';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isPrivacy ? (
              <Shield className="w-6 h-6 text-cyan-400" />
            ) : (
              <FileText className="w-6 h-6 text-cyan-400" />
            )}
            <h2 className="text-xl font-bold text-white">
              {isPrivacy
                ? getTranslation(language, 'privacyPolicyTitle')
                : getTranslation(language, 'termsTitle')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {isPrivacy ? (
            <div className="space-y-6">
              <p className="text-gray-600 leading-relaxed">
                {getTranslation(language, 'privacyPolicyIntro')}
              </p>

              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  1. {getTranslation(language, 'privacyPolicyDataCollection')}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {getTranslation(language, 'privacyPolicyDataCollectionText')}
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  2. {getTranslation(language, 'privacyPolicyDataUse')}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {getTranslation(language, 'privacyPolicyDataUseText')}
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  3. {getTranslation(language, 'privacyPolicyDataProtection')}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {getTranslation(language, 'privacyPolicyDataProtectionText')}
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  4. {getTranslation(language, 'privacyPolicyDataSharing')}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {getTranslation(language, 'privacyPolicyDataSharingText')}
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  5. {getTranslation(language, 'privacyPolicyContact')}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {getTranslation(language, 'privacyPolicyContactText')}
                </p>
              </section>
            </div>
          ) : (
            <div className="space-y-6">
              <p className="text-gray-600 leading-relaxed">
                {getTranslation(language, 'termsIntro')}
              </p>

              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  1. {getTranslation(language, 'termsAcceptance')}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {getTranslation(language, 'termsAcceptanceText')}
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  2. {getTranslation(language, 'termsServiceDescription')}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {getTranslation(language, 'termsServiceDescriptionText')}
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  3. {getTranslation(language, 'termsUserObligations')}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {getTranslation(language, 'termsUserObligationsText')}
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  4. {getTranslation(language, 'termsLimitations')}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {getTranslation(language, 'termsLimitationsText')}
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  5. {getTranslation(language, 'termsModifications')}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {getTranslation(language, 'termsModificationsText')}
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  6. {getTranslation(language, 'termsTermination')}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {getTranslation(language, 'termsTerminationText')}
                </p>
              </section>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full bg-slate-800 hover:bg-slate-700 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            {getTranslation(language, 'close')}
          </button>
        </div>
      </div>
    </div>
  );
}
