-- ============================================================
-- Wandr — Notification triggers for likes & comments
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Extend the type constraint to include post events
alter table public.notifications
  drop constraint if exists notifications_type_check;

alter table public.notifications
  add constraint notifications_type_check
  check (type in (
    'match', 'buddy_request', 'buddy_accepted', 'message',
    'trip_request', 'trip_accepted', 'trip_declined',
    'post_like', 'post_comment'
  ));

-- 2. Fix INSERT policy so any authenticated user can notify others
--    (required because Alice can't insert a notification for Bob
--     under the original "auth.uid() = user_id" check)
drop policy if exists "System can insert notifications" on public.notifications;

create policy "Authenticated users can insert notifications"
  on public.notifications for insert
  to authenticated
  with check (true);

-- 3. Trigger function: post liked
create or replace function public.handle_post_like_notification()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_owner uuid;
  v_name  text;
begin
  select user_id into v_owner from posts where id = NEW.post_id;
  -- Don't notify yourself
  if v_owner is null or v_owner = NEW.user_id then return NEW; end if;
  select coalesce(full_name, username, 'Someone') into v_name
    from profiles where id = NEW.user_id;
  insert into notifications (user_id, type, title, ref_id, ref_type)
  values (v_owner, 'post_like', v_name || ' liked your post', NEW.post_id, 'post');
  return NEW;
end;
$$;

drop trigger if exists on_post_like_notification on post_likes;
create trigger on_post_like_notification
  after insert on post_likes
  for each row execute procedure handle_post_like_notification();

-- 4. Trigger function: post commented
create or replace function public.handle_post_comment_notification()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_owner uuid;
  v_name  text;
begin
  select user_id into v_owner from posts where id = NEW.post_id;
  if v_owner is null or v_owner = NEW.user_id then return NEW; end if;
  select coalesce(full_name, username, 'Someone') into v_name
    from profiles where id = NEW.user_id;
  insert into notifications (user_id, type, title, body, ref_id, ref_type)
  values (
    v_owner, 'post_comment',
    v_name || ' commented on your post',
    left(NEW.content, 80),
    NEW.post_id, 'post'
  );
  return NEW;
end;
$$;

drop trigger if exists on_post_comment_notification on post_comments;
create trigger on_post_comment_notification
  after insert on post_comments
  for each row execute procedure handle_post_comment_notification();
