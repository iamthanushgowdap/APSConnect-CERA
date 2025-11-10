-- Groups functionality database schema
-- This file contains the table definitions for groups, group members, and group messages

-- Main groups table
create table public.groups (
  id text not null,
  name text not null,
  type text not null,
  branch text,
  semester text,
  description text,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint groups_pkey primary key (id),
  constraint groups_type_check check (
    (type = any (array['official'::text, 'student'::text]))
  )
) TABLESPACE pg_default;

-- Group members table
create table public.group_members (
  id uuid not null default gen_random_uuid (),
  group_id text not null,
  user_id text not null,
  role text not null,
  can_post boolean null default false,
  joined_at timestamp with time zone null default now(),
  constraint group_members_pkey primary key (id),
  constraint group_members_group_id_user_id_key unique (group_id, user_id),
  constraint group_members_group_id_fkey foreign KEY (group_id) references groups (id) on delete CASCADE,
  constraint group_members_role_check check (
    (
      role = any (
        array['admin'::text, 'faculty'::text, 'student'::text, 'alumni'::text]
      )
    )
  )
) TABLESPACE pg_default;

-- Group messages table
create table public.group_messages (
  id uuid not null default gen_random_uuid (),
  group_id text not null,
  author_uid text not null,
  author_name text not null,
  author_avatar_url text null,
  content text not null,
  timestamp timestamp with time zone null default now(),
  created_at timestamp with time zone null default now(),
  message_type text null default 'text'::text,
  file_name text null,
  file_size bigint null,
  file_type text null,
  file_url text null,
  attachments jsonb null default '[]'::jsonb,
  reactions jsonb null default '[]'::jsonb,
  constraint group_messages_pkey primary key (id),
  constraint group_messages_group_id_fkey foreign KEY (group_id) references groups (id) on delete CASCADE,
  constraint group_messages_message_type_check check (
    (
      message_type = any (
        array[
          'text'::text,
          'image'::text,
          'video'::text,
          'audio'::text,
          'document'::text,
          'file'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

-- Indexes for better performance
create index IF not exists idx_group_messages_reactions on public.group_messages using gin (reactions) TABLESPACE pg_default;
create index IF not exists idx_group_messages_timestamp_desc on public.group_messages using btree ("timestamp" desc) TABLESPACE pg_default;

-- Trigger to update updated_at column
create trigger update_groups_updated_at BEFORE
update on groups for EACH row
execute FUNCTION update_updated_at_column ();

create trigger update_group_messages_updated_at BEFORE
update on group_messages for EACH row
execute FUNCTION update_updated_at_column ();
