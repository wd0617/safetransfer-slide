export type EmailLanguage = 'es' | 'en' | 'it';

const emailTranslations = {
  es: {
    verifyEmail: 'Verifica tu Email',
    welcomeTo: 'Bienvenido a',
    hello: 'Hola',
    thanksForRegistering: 'Gracias por registrarte. Para completar tu registro, ingresa el siguiente codigo de verificacion:',
    important: 'Importante',
    codeExpiresIn: 'Este codigo expira en',
    minutes: 'minutos',
    ifNotCreatedAccount: 'Si no creaste esta cuenta, ignora este mensaje.',
    automaticMessage: 'Este es un mensaje automatico del sistema MoneyTransfer Display.',
    dontShareCode: 'No compartas este codigo con nadie.',
    verificationCode: 'Codigo de Verificacion',
    passwordRecoveryApproved: 'Solicitud de Contrasena Aprobada',
    yourPasswordRecoveryApproved: 'Tu solicitud de recuperacion de contrasena ha sido',
    approved: 'aprobada',
    yourNewPassword: 'Tu nueva contrasena es:',
    recommendChangePassword: 'Por seguridad, te recomendamos cambiar esta contrasena despues de iniciar sesion.',
    passwordRecoveryRejected: 'Solicitud de Contrasena Rechazada',
    yourPasswordRecoveryRejected: 'Tu solicitud de recuperacion de contrasena ha sido',
    rejected: 'rechazada',
    reason: 'Motivo',
    ifYouThinkError: 'Si crees que esto es un error, por favor contacta al soporte.',
    newMessageFromSuperAdmin: 'Nuevo Mensaje del SuperAdmin',
    youReceivedNewMessage: 'Has recibido un nuevo mensaje:',
    replyFromAdminPanel: 'Puedes responder desde tu panel de administracion.',
    accountStatusUpdate: 'Actualizacion de Estado de Cuenta',
    yourAccountStatusUpdated: 'El estado de tu cuenta ha sido actualizado a:',
    ifQuestionsContactSupport: 'Si tienes alguna pregunta, por favor contacta al soporte.',
    newSupportMessage: 'Nuevo Mensaje de Soporte',
    business: 'Negocio',
    email: 'Email',
    replyFromSuperAdminPanel: 'Responde desde el panel de SuperAdmin.',
    supportMessageFrom: 'Mensaje de soporte del sistema MoneyTransfer Display.',
    youRequestedPasswordReset: 'Has solicitado restablecer tu contrasena. Usa el siguiente codigo de verificacion:',
    stepsToComplete: 'Pasos para completar el cambio:',
    step1: 'Ve a la pagina de recuperacion de contrasena',
    step2: 'Ingresa tu email',
    step3: 'Ingresa el codigo de arriba',
    step4: 'Crea tu nueva contrasena',
    ifNotRequestedIgnore: 'Si no solicitaste este cambio, ignora este mensaje.',
    newPasswordRecoveryRequest: 'Nueva Solicitud de Recuperacion de Contrasena',
    passwordRecoveryRequestReceived: 'Se ha recibido una nueva solicitud de recuperacion de contrasena:',
    administrator: 'Administrador',
    reviewFromSuperAdminPanel: 'Revisa y aprueba o rechaza esta solicitud desde el panel de SuperAdmin.',
    requestFromSystem: 'Solicitud del sistema MoneyTransfer Display.',
    newNotification: 'Nueva Notificacion',
  },
  en: {
    verifyEmail: 'Verify your Email',
    welcomeTo: 'Welcome to',
    hello: 'Hello',
    thanksForRegistering: 'Thank you for registering. To complete your registration, enter the following verification code:',
    important: 'Important',
    codeExpiresIn: 'This code expires in',
    minutes: 'minutes',
    ifNotCreatedAccount: 'If you did not create this account, ignore this message.',
    automaticMessage: 'This is an automatic message from MoneyTransfer Display system.',
    dontShareCode: 'Do not share this code with anyone.',
    verificationCode: 'Verification Code',
    passwordRecoveryApproved: 'Password Request Approved',
    yourPasswordRecoveryApproved: 'Your password recovery request has been',
    approved: 'approved',
    yourNewPassword: 'Your new password is:',
    recommendChangePassword: 'For security, we recommend changing this password after logging in.',
    passwordRecoveryRejected: 'Password Request Rejected',
    yourPasswordRecoveryRejected: 'Your password recovery request has been',
    rejected: 'rejected',
    reason: 'Reason',
    ifYouThinkError: 'If you think this is an error, please contact support.',
    newMessageFromSuperAdmin: 'New Message from SuperAdmin',
    youReceivedNewMessage: 'You have received a new message:',
    replyFromAdminPanel: 'You can reply from your admin panel.',
    accountStatusUpdate: 'Account Status Update',
    yourAccountStatusUpdated: 'Your account status has been updated to:',
    ifQuestionsContactSupport: 'If you have any questions, please contact support.',
    newSupportMessage: 'New Support Message',
    business: 'Business',
    email: 'Email',
    replyFromSuperAdminPanel: 'Reply from the SuperAdmin panel.',
    supportMessageFrom: 'Support message from MoneyTransfer Display system.',
    youRequestedPasswordReset: 'You have requested to reset your password. Use the following verification code:',
    stepsToComplete: 'Steps to complete the change:',
    step1: 'Go to the password recovery page',
    step2: 'Enter your email',
    step3: 'Enter the code above',
    step4: 'Create your new password',
    ifNotRequestedIgnore: 'If you did not request this change, ignore this message.',
    newPasswordRecoveryRequest: 'New Password Recovery Request',
    passwordRecoveryRequestReceived: 'A new password recovery request has been received:',
    administrator: 'Administrator',
    reviewFromSuperAdminPanel: 'Review and approve or reject this request from the SuperAdmin panel.',
    requestFromSystem: 'Request from MoneyTransfer Display system.',
    newNotification: 'New Notification',
  },
  it: {
    verifyEmail: 'Verifica la tua Email',
    welcomeTo: 'Benvenuto a',
    hello: 'Ciao',
    thanksForRegistering: 'Grazie per la registrazione. Per completare la registrazione, inserisci il seguente codice di verifica:',
    important: 'Importante',
    codeExpiresIn: 'Questo codice scade tra',
    minutes: 'minuti',
    ifNotCreatedAccount: 'Se non hai creato questo account, ignora questo messaggio.',
    automaticMessage: 'Questo e un messaggio automatico del sistema MoneyTransfer Display.',
    dontShareCode: 'Non condividere questo codice con nessuno.',
    verificationCode: 'Codice di Verifica',
    passwordRecoveryApproved: 'Richiesta Password Approvata',
    yourPasswordRecoveryApproved: 'La tua richiesta di recupero password e stata',
    approved: 'approvata',
    yourNewPassword: 'La tua nuova password e:',
    recommendChangePassword: 'Per sicurezza, ti consigliamo di cambiare questa password dopo aver effettuato l\'accesso.',
    passwordRecoveryRejected: 'Richiesta Password Rifiutata',
    yourPasswordRecoveryRejected: 'La tua richiesta di recupero password e stata',
    rejected: 'rifiutata',
    reason: 'Motivo',
    ifYouThinkError: 'Se pensi che sia un errore, contatta il supporto.',
    newMessageFromSuperAdmin: 'Nuovo Messaggio dal SuperAdmin',
    youReceivedNewMessage: 'Hai ricevuto un nuovo messaggio:',
    replyFromAdminPanel: 'Puoi rispondere dal tuo pannello di amministrazione.',
    accountStatusUpdate: 'Aggiornamento Stato Account',
    yourAccountStatusUpdated: 'Lo stato del tuo account e stato aggiornato a:',
    ifQuestionsContactSupport: 'Se hai domande, contatta il supporto.',
    newSupportMessage: 'Nuovo Messaggio di Supporto',
    business: 'Attivita',
    email: 'Email',
    replyFromSuperAdminPanel: 'Rispondi dal pannello SuperAdmin.',
    supportMessageFrom: 'Messaggio di supporto dal sistema MoneyTransfer Display.',
    youRequestedPasswordReset: 'Hai richiesto di reimpostare la password. Usa il seguente codice di verifica:',
    stepsToComplete: 'Passaggi per completare il cambio:',
    step1: 'Vai alla pagina di recupero password',
    step2: 'Inserisci la tua email',
    step3: 'Inserisci il codice sopra',
    step4: 'Crea la tua nuova password',
    ifNotRequestedIgnore: 'Se non hai richiesto questa modifica, ignora questo messaggio.',
    newPasswordRecoveryRequest: 'Nuova Richiesta di Recupero Password',
    passwordRecoveryRequestReceived: 'E stata ricevuta una nuova richiesta di recupero password:',
    administrator: 'Amministratore',
    reviewFromSuperAdminPanel: 'Esamina e approva o rifiuta questa richiesta dal pannello SuperAdmin.',
    requestFromSystem: 'Richiesta dal sistema MoneyTransfer Display.',
    newNotification: 'Nuova Notifica',
  },
};

function t(lang: EmailLanguage, key: keyof typeof emailTranslations.es): string {
  return emailTranslations[lang]?.[key] || emailTranslations.es[key];
}

const logoHeader = `
  <div style="text-align: center; padding: 20px 0; margin-bottom: 10px;">
    <div style="display: inline-block;">
      <span style="font-size: 28px; font-weight: bold; color: #1e3a5f;">SAFE</span>
      <span style="font-size: 28px; font-weight: bold; color: #3b82f6;">TRANSFER</span>
    </div>
    <div style="font-size: 14px; letter-spacing: 8px; color: #60a5fa; margin-top: 2px;">S L I D E</div>
  </div>
`;

const baseStyles = `
  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
  .header { color: white; padding: 20px; border-radius: 8px 8px 0 0; }
  .header-green { background: linear-gradient(135deg, #059669 0%, #10b981 100%); }
  .header-blue { background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); }
  .header-red { background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); }
  .header-orange { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); }
  .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
  .code-box { background: #1f2937; padding: 20px 30px; border-radius: 12px; font-family: 'Courier New', monospace; font-size: 36px; text-align: center; margin: 25px 0; letter-spacing: 10px; font-weight: bold; }
  .code-green { color: #34d399; }
  .code-blue { color: #60a5fa; }
  .welcome { background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: center; }
  .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 15px 0; font-size: 14px; }
  .footer { background: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px; }
  .timer { color: #dc2626; font-weight: bold; }
  .password-box { background: #1f2937; color: #10b981; padding: 15px 20px; border-radius: 8px; font-family: monospace; font-size: 18px; text-align: center; margin: 20px 0; letter-spacing: 2px; }
  .info-box { background: #e0f2fe; padding: 12px; border-radius: 8px; margin: 15px 0; }
  .message-box { background: white; border-left: 4px solid #2563eb; padding: 15px; margin: 15px 0; }
  .steps { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 15px; margin: 20px 0; }
  .steps ol { margin: 0; padding-left: 20px; }
  .steps li { margin: 8px 0; }
  .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
  .badge-alert { background: #fef2f2; color: #dc2626; }
  .badge-payment { background: #fef3c7; color: #d97706; }
  .badge-status { background: #dbeafe; color: #2563eb; }
  .badge-general { background: #e5e7eb; color: #374151; }
  .status-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: 600; }
  .status-active { background: #d1fae5; color: #059669; }
  .status-inactive { background: #fee2e2; color: #dc2626; }
  .status-blocked { background: #fef3c7; color: #d97706; }
  .logo-header { text-align: center; padding: 20px 0; margin-bottom: 10px; }
  .logo-safe { font-size: 28px; font-weight: bold; color: #1e3a5f; }
  .logo-transfer { font-size: 28px; font-weight: bold; color: #3b82f6; }
  .logo-slide { font-size: 14px; letter-spacing: 8px; color: #60a5fa; margin-top: 2px; }
`;

export const localizedEmailTemplates = {
  emailVerificationCode: (businessName: string, code: string, lang: EmailLanguage = 'es') => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>${baseStyles}</style>
    </head>
    <body>
      ${logoHeader}
      <div class="header header-green">
        <h2 style="margin:0;">${t(lang, 'verifyEmail')}</h2>
      </div>
      <div class="content">
        <div class="welcome">
          <p style="margin:0;font-size:18px;">${t(lang, 'welcomeTo')} <strong>MoneyTransfer Display</strong></p>
        </div>
        <p>${t(lang, 'hello')} <strong>${businessName}</strong>,</p>
        <p>${t(lang, 'thanksForRegistering')}</p>
        <div class="code-box code-green">${code}</div>
        <div class="warning">
          <strong>${t(lang, 'important')}:</strong> ${t(lang, 'codeExpiresIn')} <span class="timer">15 ${t(lang, 'minutes')}</span>. ${t(lang, 'ifNotCreatedAccount')}
        </div>
      </div>
      <div class="footer">
        <p>${t(lang, 'automaticMessage')}</p>
        <p>${t(lang, 'dontShareCode')}</p>
      </div>
    </body>
    </html>
  `,

  passwordResetCode: (adminName: string, code: string, lang: EmailLanguage = 'es') => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>${baseStyles}</style>
    </head>
    <body>
      ${logoHeader}
      <div class="header header-blue" style="background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);">
        <h2 style="margin:0;">${t(lang, 'verificationCode')}</h2>
      </div>
      <div class="content">
        <p>${t(lang, 'hello')} <strong>${adminName}</strong>,</p>
        <p>${t(lang, 'youRequestedPasswordReset')}</p>
        <div class="code-box code-blue">${code}</div>
        <div class="steps">
          <p><strong>${t(lang, 'stepsToComplete')}</strong></p>
          <ol>
            <li>${t(lang, 'step1')}</li>
            <li>${t(lang, 'step2')}</li>
            <li>${t(lang, 'step3')}</li>
            <li>${t(lang, 'step4')}</li>
          </ol>
        </div>
        <div class="warning">
          <strong>${t(lang, 'important')}:</strong> ${t(lang, 'codeExpiresIn')} <span class="timer">15 ${t(lang, 'minutes')}</span>. ${t(lang, 'ifNotRequestedIgnore')}
        </div>
      </div>
      <div class="footer">
        <p>${t(lang, 'automaticMessage')}</p>
        <p>${t(lang, 'dontShareCode')}</p>
      </div>
    </body>
    </html>
  `,

  passwordRecoveryApproved: (adminName: string, newPassword: string, lang: EmailLanguage = 'es') => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>${baseStyles}</style>
    </head>
    <body>
      ${logoHeader}
      <div class="header header-green">
        <h2 style="margin:0;">${t(lang, 'passwordRecoveryApproved')}</h2>
      </div>
      <div class="content">
        <p>${t(lang, 'hello')} <strong>${adminName}</strong>,</p>
        <p>${t(lang, 'yourPasswordRecoveryApproved')} <strong>${t(lang, 'approved')}</strong>.</p>
        <p>${t(lang, 'yourNewPassword')}</p>
        <div class="password-box">${newPassword}</div>
        <div class="warning">
          <strong>${t(lang, 'important')}:</strong> ${t(lang, 'recommendChangePassword')}
        </div>
      </div>
      <div class="footer">
        <p>${t(lang, 'automaticMessage')}</p>
      </div>
    </body>
    </html>
  `,

  passwordRecoveryRejected: (adminName: string, reason: string | undefined, lang: EmailLanguage = 'es') => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>${baseStyles}</style>
    </head>
    <body>
      ${logoHeader}
      <div class="header header-red">
        <h2 style="margin:0;">${t(lang, 'passwordRecoveryRejected')}</h2>
      </div>
      <div class="content">
        <p>${t(lang, 'hello')} <strong>${adminName}</strong>,</p>
        <p>${t(lang, 'yourPasswordRecoveryRejected')} <strong>${t(lang, 'rejected')}</strong>.</p>
        ${reason ? `<p><strong>${t(lang, 'reason')}:</strong> ${reason}</p>` : ''}
        <p>${t(lang, 'ifYouThinkError')}</p>
      </div>
      <div class="footer">
        <p>${t(lang, 'automaticMessage')}</p>
      </div>
    </body>
    </html>
  `,

  messageFromSuperadmin: (businessName: string, subject: string, message: string, lang: EmailLanguage = 'es') => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>${baseStyles}</style>
    </head>
    <body>
      ${logoHeader}
      <div class="header header-blue">
        <h2 style="margin:0;">${t(lang, 'newMessageFromSuperAdmin')}</h2>
      </div>
      <div class="content">
        <p>${t(lang, 'hello')} <strong>${businessName}</strong>,</p>
        <p>${t(lang, 'youReceivedNewMessage')}</p>
        <h3>${subject}</h3>
        <div class="message-box">${message}</div>
        <p>${t(lang, 'replyFromAdminPanel')}</p>
      </div>
      <div class="footer">
        <p>${t(lang, 'automaticMessage')}</p>
      </div>
    </body>
    </html>
  `,

  statusChange: (businessName: string, newStatus: string, reason: string | undefined, lang: EmailLanguage = 'es') => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>${baseStyles}</style>
    </head>
    <body>
      ${logoHeader}
      <div class="header" style="background: linear-gradient(135deg, ${newStatus === 'active' ? '#059669, #10b981' : '#dc2626, #ef4444'}); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h2 style="margin:0;">${t(lang, 'accountStatusUpdate')}</h2>
      </div>
      <div class="content">
        <p>${t(lang, 'hello')} <strong>${businessName}</strong>,</p>
        <p>${t(lang, 'yourAccountStatusUpdated')}</p>
        <p><span class="status-badge status-${newStatus}">${newStatus.toUpperCase()}</span></p>
        ${reason ? `<p><strong>${t(lang, 'reason')}:</strong> ${reason}</p>` : ''}
        ${newStatus === 'blocked' ? `<p>${t(lang, 'ifQuestionsContactSupport')}</p>` : ''}
      </div>
      <div class="footer">
        <p>${t(lang, 'automaticMessage')}</p>
      </div>
    </body>
    </html>
  `,

  notification: (businessName: string, subject: string, message: string, type: string, lang: EmailLanguage = 'es') => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>${baseStyles}</style>
    </head>
    <body>
      ${logoHeader}
      <div class="header header-blue">
        <h2 style="margin:0;">${t(lang, 'newNotification')}</h2>
      </div>
      <div class="content">
        <p>${t(lang, 'hello')} <strong>${businessName}</strong>,</p>
        <p><span class="badge badge-${type}">${type.toUpperCase()}</span></p>
        <h3>${subject}</h3>
        <p>${message}</p>
      </div>
      <div class="footer">
        <p>${t(lang, 'automaticMessage')}</p>
      </div>
    </body>
    </html>
  `,

  supportMessageToSuperadmin: (businessName: string, businessEmail: string, subject: string, message: string) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>${baseStyles}</style>
    </head>
    <body>
      ${logoHeader}
      <div class="header header-orange">
        <h2 style="margin:0;">${emailTranslations.es.newSupportMessage}</h2>
      </div>
      <div class="content">
        <div class="info-box">
          <p><strong>${emailTranslations.es.business}:</strong> ${businessName}</p>
          <p><strong>${emailTranslations.es.email}:</strong> ${businessEmail}</p>
        </div>
        <h3>${subject}</h3>
        <div class="message-box">${message}</div>
        <p>${emailTranslations.es.replyFromSuperAdminPanel}</p>
      </div>
      <div class="footer">
        <p>${emailTranslations.es.supportMessageFrom}</p>
      </div>
    </body>
    </html>
  `,

  passwordRecoveryRequestToSuperadmin: (businessName: string, adminName: string, adminEmail: string, reason: string) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>${baseStyles}</style>
    </head>
    <body>
      ${logoHeader}
      <div class="header header-red">
        <h2 style="margin:0;">${emailTranslations.es.newPasswordRecoveryRequest}</h2>
      </div>
      <div class="content">
        <p>${emailTranslations.es.passwordRecoveryRequestReceived}</p>
        <div class="info-box" style="background: #fef3c7;">
          <p><strong>${emailTranslations.es.business}:</strong> ${businessName}</p>
          <p><strong>${emailTranslations.es.administrator}:</strong> ${adminName}</p>
          <p><strong>${emailTranslations.es.email}:</strong> ${adminEmail}</p>
          <p><strong>${emailTranslations.es.reason}:</strong> ${reason}</p>
        </div>
        <p>${emailTranslations.es.reviewFromSuperAdminPanel}</p>
      </div>
      <div class="footer">
        <p>${emailTranslations.es.requestFromSystem}</p>
      </div>
    </body>
    </html>
  `,
};

export function getEmailSubject(type: string, lang: EmailLanguage = 'es'): string {
  const subjects: Record<string, Record<EmailLanguage, string>> = {
    verification: {
      es: 'Verifica tu Email - MoneyTransfer Display',
      en: 'Verify your Email - MoneyTransfer Display',
      it: 'Verifica la tua Email - MoneyTransfer Display',
    },
    passwordReset: {
      es: 'Codigo de Verificacion - MoneyTransfer Display',
      en: 'Verification Code - MoneyTransfer Display',
      it: 'Codice di Verifica - MoneyTransfer Display',
    },
    passwordApproved: {
      es: 'Solicitud de Contrasena Aprobada',
      en: 'Password Request Approved',
      it: 'Richiesta Password Approvata',
    },
    passwordRejected: {
      es: 'Solicitud de Contrasena Rechazada',
      en: 'Password Request Rejected',
      it: 'Richiesta Password Rifiutata',
    },
    statusChange: {
      es: 'Actualizacion de Estado de Cuenta',
      en: 'Account Status Update',
      it: 'Aggiornamento Stato Account',
    },
    newMessage: {
      es: 'Nuevo Mensaje',
      en: 'New Message',
      it: 'Nuovo Messaggio',
    },
  };

  return subjects[type]?.[lang] || subjects[type]?.es || 'MoneyTransfer Display';
}
