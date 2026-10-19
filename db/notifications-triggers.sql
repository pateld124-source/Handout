-- ════════════════════════════════════════════════════════════════════════
-- Auto-create notifications when a booking is made / accepted / declined
-- and when a message is sent.
-- Triggers run as SECURITY DEFINER so they can notify the OTHER user
-- (RLS would otherwise block a student from notifying a vendor).
-- Run once in Supabase → SQL Editor. Safe to re-run.
-- ════════════════════════════════════════════════════════════════════════

-- When a student books → notify the vendor.
CREATE OR REPLACE FUNCTION public.notify_on_booking()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE sname TEXT;
BEGIN
  SELECT full_name INTO sname FROM public.users WHERE id = NEW.student_id;
  IF NEW.provider_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, message)
    VALUES (NEW.provider_id, 'New request', COALESCE(sname, 'A student') || ' sent you a new request. Open Orders to accept.');
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_notify_booking ON public.bookings;
CREATE TRIGGER trg_notify_booking AFTER INSERT ON public.bookings
  FOR EACH ROW EXECUTE PROCEDURE public.notify_on_booking();

-- When a vendor changes a booking's status → notify the student.
CREATE OR REPLACE FUNCTION public.notify_on_booking_status()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'confirmed' THEN
      INSERT INTO public.notifications (user_id, title, message)
      VALUES (NEW.student_id, 'Request accepted ✅', 'Your request was accepted! The provider will be in touch.');
    ELSIF NEW.status = 'completed' THEN
      INSERT INTO public.notifications (user_id, title, message)
      VALUES (NEW.student_id, 'Service completed', 'Your booking was marked completed.');
    ELSIF NEW.status = 'cancelled' THEN
      INSERT INTO public.notifications (user_id, title, message)
      VALUES (NEW.student_id, 'Request declined', 'Your request was declined. You can try another provider.');
    END IF;
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_notify_booking_status ON public.bookings;
CREATE TRIGGER trg_notify_booking_status AFTER UPDATE ON public.bookings
  FOR EACH ROW EXECUTE PROCEDURE public.notify_on_booking_status();

-- When a message is sent → notify the receiver.
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'system';
CREATE OR REPLACE FUNCTION public.notify_on_message()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE sname TEXT;
BEGIN
  IF NEW.receiver_id IS NOT NULL THEN
    SELECT full_name INTO sname FROM public.users WHERE id = NEW.sender_id;
    INSERT INTO public.notifications (user_id, type, title, message)
    VALUES (NEW.receiver_id, 'message', '💬 New message from ' || COALESCE(sname, 'someone'), left(NEW.content, 80));
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_notify_message ON public.messages;
CREATE TRIGGER trg_notify_message AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE PROCEDURE public.notify_on_message();

-- Signed-in users may insert only their OWN notifications (ntf_own); notifications
-- for other users come from the triggers above.
DROP POLICY IF EXISTS ntf_insert_any ON public.notifications;

NOTIFY pgrst, 'reload schema';
SELECT '✅ Booking + message notification triggers installed.' AS status;
