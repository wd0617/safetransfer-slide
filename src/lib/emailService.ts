import { supabase } from './supabase';

export type EmailType = 'notification' | 'password_recovery' | 'message' | 'status_change' | 'support' | 'verification';

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  businessId?: string;
  emailType: EmailType;
  fromName?: string;
}

interface EmailResult {
  success: boolean;
  error?: string;
}

export async function sendEmail(params: SendEmailParams): Promise<EmailResult> {
  const { to, subject, html, businessId, emailType, fromName } = params;

  try {
    // Use dedicated email service URL if available, otherwise fall back to main Supabase URL
    const emailBaseUrl = import.meta.env.VITE_EMAIL_FUNCTION_URL || `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`;
    const emailAnonKey = import.meta.env.VITE_EMAIL_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

    const response = await fetch(
      emailBaseUrl,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${emailAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to,
          subject,
          html,
          from_name: fromName,
        }),
      }
    );

    const data = await response.json();

    const errorMsg = data.error || data.message || (data.details ? JSON.stringify(data.details) : null);

    await supabase.from('email_logs').insert({
      business_id: businessId || null,
      recipient_email: to,
      subject,
      email_type: emailType,
      status: response.ok ? 'sent' : 'failed',
      error_message: response.ok ? null : errorMsg,
    });

    if (!response.ok) {
      console.error('Email send error:', data);
      return { success: false, error: errorMsg || 'Error al enviar email' };
    }

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';

    await supabase.from('email_logs').insert({
      business_id: businessId || null,
      recipient_email: to,
      subject,
      email_type: emailType,
      status: 'failed',
      error_message: errorMessage,
    });

    return { success: false, error: errorMessage };
  }
}

export const emailTemplates = {
  notification: (businessName: string, subject: string, message: string, type: string) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
        .footer { background: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px; }
        .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
        .badge-alert { background: #fef2f2; color: #dc2626; }
        .badge-payment { background: #fef3c7; color: #d97706; }
        .badge-status { background: #dbeafe; color: #2563eb; }
        .badge-general { background: #e5e7eb; color: #374151; }
      </style>
    </head>
    <body>
      <div class="header">
        <h2 style="margin:0;">Nueva Notificacion</h2>
      </div>
      <div class="content">
        <p>Hola <strong>${businessName}</strong>,</p>
        <p><span class="badge badge-${type}">${type.toUpperCase()}</span></p>
        <h3>${subject}</h3>
        <p>${message}</p>
      </div>
      <div class="footer">
        <p>Este es un mensaje automatico del sistema SafeTransfer Slide.</p>
      </div>
    </body>
    </html>
  `,

  passwordRecoveryApproved: (adminName: string, newPassword: string) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
        .password-box { background: #1f2937; color: #10b981; padding: 15px 20px; border-radius: 8px; font-family: monospace; font-size: 18px; text-align: center; margin: 20px 0; letter-spacing: 2px; }
        .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 15px 0; }
        .footer { background: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h2 style="margin:0;">Solicitud de Contrasena Aprobada</h2>
      </div>
      <div class="content">
        <p>Hola <strong>${adminName}</strong>,</p>
        <p>Tu solicitud de recuperacion de contrasena ha sido <strong>aprobada</strong>.</p>
        <p>Tu nueva contrasena es:</p>
        <div class="password-box">${newPassword}</div>
        <div class="warning">
          <strong>Importante:</strong> Por seguridad, te recomendamos cambiar esta contrasena despues de iniciar sesion.
        </div>
      </div>
      <div class="footer">
        <p>Este es un mensaje automatico del sistema SafeTransfer Slide.</p>
      </div>
    </body>
    </html>
  `,

  passwordRecoveryRejected: (adminName: string, reason?: string) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
        .footer { background: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h2 style="margin:0;">Solicitud de Contrasena Rechazada</h2>
      </div>
      <div class="content">
        <p>Hola <strong>${adminName}</strong>,</p>
        <p>Tu solicitud de recuperacion de contrasena ha sido <strong>rechazada</strong>.</p>
        ${reason ? `<p><strong>Motivo:</strong> ${reason}</p>` : ''}
        <p>Si crees que esto es un error, por favor contacta al soporte.</p>
      </div>
      <div class="footer">
        <p>Este es un mensaje automatico del sistema SafeTransfer Slide.</p>
      </div>
    </body>
    </html>
  `,

  messageFromSuperadmin: (businessName: string, subject: string, message: string) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
        .message-box { background: white; border-left: 4px solid #2563eb; padding: 15px; margin: 15px 0; }
        .footer { background: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h2 style="margin:0;">Nuevo Mensaje del SuperAdmin</h2>
      </div>
      <div class="content">
        <p>Hola <strong>${businessName}</strong>,</p>
        <p>Has recibido un nuevo mensaje:</p>
        <h3>${subject}</h3>
        <div class="message-box">${message}</div>
        <p>Puedes responder desde tu panel de administracion.</p>
      </div>
      <div class="footer">
        <p>Este es un mensaje automatico del sistema SafeTransfer Slide.</p>
      </div>
    </body>
    </html>
  `,

  statusChange: (businessName: string, newStatus: string, reason?: string) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, ${newStatus === 'active' ? '#059669, #10b981' : '#dc2626, #ef4444'}); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
        .status-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: 600; }
        .status-active { background: #d1fae5; color: #059669; }
        .status-inactive { background: #fee2e2; color: #dc2626; }
        .status-blocked { background: #fef3c7; color: #d97706; }
        .footer { background: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h2 style="margin:0;">Actualizacion de Estado de Cuenta</h2>
      </div>
      <div class="content">
        <p>Hola <strong>${businessName}</strong>,</p>
        <p>El estado de tu cuenta ha sido actualizado a:</p>
        <p><span class="status-badge status-${newStatus}">${newStatus.toUpperCase()}</span></p>
        ${reason ? `<p><strong>Motivo:</strong> ${reason}</p>` : ''}
        ${newStatus === 'blocked' ? '<p>Si tienes alguna pregunta, por favor contacta al soporte.</p>' : ''}
      </div>
      <div class="footer">
        <p>Este es un mensaje automatico del sistema SafeTransfer Slide.</p>
      </div>
    </body>
    </html>
  `,

  supportMessageToSuperadmin: (businessName: string, businessEmail: string, subject: string, message: string) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
        .info-box { background: #e0f2fe; padding: 12px; border-radius: 8px; margin: 15px 0; }
        .message-box { background: white; border-left: 4px solid #f59e0b; padding: 15px; margin: 15px 0; }
        .footer { background: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h2 style="margin:0;">Nuevo Mensaje de Soporte</h2>
      </div>
      <div class="content">
        <div class="info-box">
          <p><strong>Negocio:</strong> ${businessName}</p>
          <p><strong>Email:</strong> ${businessEmail}</p>
        </div>
        <h3>${subject}</h3>
        <div class="message-box">${message}</div>
        <p>Responde desde el panel de SuperAdmin.</p>
      </div>
      <div class="footer">
        <p>Mensaje de soporte del sistema SafeTransfer Slide.</p>
      </div>
    </body>
    </html>
  `,

  passwordResetCode: (adminName: string, code: string) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
        .code-box { background: #1f2937; color: #60a5fa; padding: 20px 30px; border-radius: 12px; font-family: 'Courier New', monospace; font-size: 32px; text-align: center; margin: 25px 0; letter-spacing: 8px; font-weight: bold; }
        .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 15px 0; font-size: 14px; }
        .steps { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 15px; margin: 20px 0; }
        .steps ol { margin: 0; padding-left: 20px; }
        .steps li { margin: 8px 0; }
        .footer { background: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px; }
        .timer { color: #dc2626; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="header">
        <h2 style="margin:0;">Codigo de Verificacion</h2>
      </div>
      <div class="content">
        <p>Hola <strong>${adminName}</strong>,</p>
        <p>Has solicitado restablecer tu contrasena. Usa el siguiente codigo de verificacion:</p>
        <div class="code-box">${code}</div>
        <div class="steps">
          <p><strong>Pasos para completar el cambio:</strong></p>
          <ol>
            <li>Ve a la pagina de recuperacion de contrasena</li>
            <li>Ingresa tu email</li>
            <li>Ingresa el codigo de arriba</li>
            <li>Crea tu nueva contrasena</li>
          </ol>
        </div>
        <div class="warning">
          <strong>Importante:</strong> Este codigo expira en <span class="timer">15 minutos</span>. Si no solicitaste este cambio, ignora este mensaje.
        </div>
      </div>
      <div class="footer">
        <p>Este es un mensaje automatico del sistema SafeTransfer Slide.</p>
        <p>No compartas este codigo con nadie.</p>
      </div>
    </body>
    </html>
  `,

  emailVerificationCode: (businessName: string, code: string) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
        .code-box { background: #1f2937; color: #34d399; padding: 20px 30px; border-radius: 12px; font-family: 'Courier New', monospace; font-size: 36px; text-align: center; margin: 25px 0; letter-spacing: 10px; font-weight: bold; }
        .welcome { background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: center; }
        .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 15px 0; font-size: 14px; }
        .footer { background: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px; }
        .timer { color: #dc2626; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="header">
        <h2 style="margin:0;">Verifica tu Email</h2>
      </div>
      <div class="content">
        <div class="welcome">
          <p style="margin:0;font-size:18px;">Bienvenido a <strong>SafeTransfer Slide</strong></p>
        </div>
        <p>Hola <strong>${businessName}</strong>,</p>
        <p>Gracias por registrarte. Para completar tu registro, ingresa el siguiente codigo de verificacion:</p>
        <div class="code-box">${code}</div>
        <div class="warning">
          <strong>Importante:</strong> Este codigo expira en <span class="timer">15 minutos</span>. Si no creaste esta cuenta, ignora este mensaje.
        </div>
      </div>
      <div class="footer">
        <p>Este es un mensaje automatico del sistema SafeTransfer Slide.</p>
        <p>No compartas este codigo con nadie.</p>
      </div>
    </body>
    </html>
  `,

  passwordRecoveryRequestToSuperadmin: (businessName: string, adminName: string, adminEmail: string, reason: string) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
        .info-box { background: #fef3c7; padding: 12px; border-radius: 8px; margin: 15px 0; }
        .footer { background: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h2 style="margin:0;">Nueva Solicitud de Recuperacion de Contrasena</h2>
      </div>
      <div class="content">
        <p>Se ha recibido una nueva solicitud de recuperacion de contrasena:</p>
        <div class="info-box">
          <p><strong>Negocio:</strong> ${businessName}</p>
          <p><strong>Administrador:</strong> ${adminName}</p>
          <p><strong>Email:</strong> ${adminEmail}</p>
          <p><strong>Motivo:</strong> ${reason}</p>
        </div>
        <p>Revisa y aprueba o rechaza esta solicitud desde el panel de SuperAdmin.</p>
      </div>
      <div class="footer">
        <p>Solicitud del sistema SafeTransfer Slide.</p>
      </div>
    </body>
    </html>
  `,
};

export async function getSuperadminEmail(): Promise<string | null> {
  const { data } = await supabase
    .from('superadmin_users')
    .select('notification_email, email')
    .limit(1)
    .maybeSingle();

  return data?.notification_email || data?.email || null;
}

export async function getBusinessEmail(businessId: string): Promise<{ email: string | null; name: string; enabled: boolean }> {
  const { data } = await supabase
    .from('businesses')
    .select('contact_email, name, email_notifications_enabled')
    .eq('id', businessId)
    .maybeSingle();

  return {
    email: data?.contact_email || null,
    name: data?.name || 'Negocio',
    enabled: data?.email_notifications_enabled !== false,
  };
}

export type BusinessLanguage = 'es' | 'en' | 'it';

export async function getBusinessLanguage(businessId: string): Promise<BusinessLanguage> {
  const { data } = await supabase
    .from('business_settings')
    .select('language')
    .eq('business_id', businessId)
    .maybeSingle();

  return (data?.language as BusinessLanguage) || 'es';
}

export async function getAdminLanguage(adminEmail: string): Promise<BusinessLanguage> {
  const { data: admin } = await supabase
    .from('business_admins')
    .select('business_id')
    .eq('email', adminEmail.toLowerCase())
    .maybeSingle();

  if (!admin?.business_id) return 'es';

  return getBusinessLanguage(admin.business_id);
}
