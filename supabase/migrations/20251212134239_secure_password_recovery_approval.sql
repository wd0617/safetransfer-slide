/*
  # Secure Password Recovery Approval
  
  1. Changes
    - Create a SECURITY DEFINER function for superadmins to approve password recovery
    - This function validates superadmin session and handles the entire approval flow
    
  2. Security
    - Only callable by authenticated superadmins with valid session
    - Handles password hashing, request update, and notification in a single transaction
*/

CREATE OR REPLACE FUNCTION public.approve_password_recovery(
  p_request_id UUID,
  p_new_password TEXT,
  p_superadmin_session_token TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  v_request RECORD;
  v_superadmin RECORD;
  v_password_hash TEXT;
BEGIN
  -- Validate superadmin session
  SELECT ba.* INTO v_superadmin
  FROM business_admins ba
  JOIN business_sessions bs ON bs.admin_email = ba.email
  WHERE bs.session_token = p_superadmin_session_token
  AND bs.expires_at > NOW()
  AND ba.is_superadmin = TRUE;
  
  IF v_superadmin IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'unauthorized');
  END IF;
  
  -- Get the recovery request
  SELECT * INTO v_request
  FROM password_recovery_requests
  WHERE id = p_request_id
  AND status = 'pending';
  
  IF v_request IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'request_not_found');
  END IF;
  
  -- Hash the new password
  v_password_hash := extensions.crypt(p_new_password, extensions.gen_salt('bf', 10));
  
  -- Update the admin password
  UPDATE business_admins
  SET password_hash = v_password_hash,
      updated_at = NOW()
  WHERE email = v_request.admin_email;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'admin_not_found');
  END IF;
  
  -- Update the recovery request
  UPDATE password_recovery_requests
  SET status = 'approved',
      resolved_at = NOW(),
      resolved_by_name = v_superadmin.full_name,
      new_password_set = TRUE
  WHERE id = p_request_id;
  
  -- Delete old pending notifications for this request
  DELETE FROM notifications
  WHERE business_id = v_request.business_id
  AND type = 'password_recovery'
  AND read = FALSE;
  
  -- Create success notification (password will be shown in notification)
  INSERT INTO notifications (
    business_id,
    type,
    title,
    message,
    from_superadmin,
    priority,
    read
  ) VALUES (
    v_request.business_id,
    'password_recovery',
    'Contrasena actualizada exitosamente',
    'Tu solicitud ha sido aprobada. Tu nueva contrasena es: ' || p_new_password || E'\n\nIMPORTANTE: Esta contrasena se genero automaticamente. Por favor cambiala despues de iniciar sesion.',
    TRUE,
    'high',
    FALSE
  );
  
  RETURN json_build_object(
    'success', true,
    'admin_email', v_request.admin_email,
    'admin_name', v_request.admin_name
  );
END;
$$;

-- Function to reject password recovery
CREATE OR REPLACE FUNCTION public.reject_password_recovery(
  p_request_id UUID,
  p_superadmin_session_token TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  v_request RECORD;
  v_superadmin RECORD;
BEGIN
  -- Validate superadmin session
  SELECT ba.* INTO v_superadmin
  FROM business_admins ba
  JOIN business_sessions bs ON bs.admin_email = ba.email
  WHERE bs.session_token = p_superadmin_session_token
  AND bs.expires_at > NOW()
  AND ba.is_superadmin = TRUE;
  
  IF v_superadmin IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'unauthorized');
  END IF;
  
  -- Get the recovery request
  SELECT * INTO v_request
  FROM password_recovery_requests
  WHERE id = p_request_id
  AND status = 'pending';
  
  IF v_request IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'request_not_found');
  END IF;
  
  -- Update the recovery request
  UPDATE password_recovery_requests
  SET status = 'rejected',
      resolved_at = NOW(),
      resolved_by_name = v_superadmin.full_name
  WHERE id = p_request_id;
  
  -- Delete old notifications
  DELETE FROM notifications
  WHERE business_id = v_request.business_id
  AND type = 'password_recovery'
  AND read = FALSE;
  
  -- Create rejection notification
  INSERT INTO notifications (
    business_id,
    type,
    title,
    message,
    from_superadmin,
    priority,
    read
  ) VALUES (
    v_request.business_id,
    'password_recovery',
    'Solicitud de recuperacion rechazada',
    'Tu solicitud de recuperacion de contrasena ha sido rechazada. Por favor contacta al administrador para mas informacion.',
    TRUE,
    'normal',
    FALSE
  );
  
  RETURN json_build_object('success', true);
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.approve_password_recovery(UUID, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reject_password_recovery(UUID, TEXT) TO anon, authenticated;