-- Enable RLS on group_messages table
ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read messages in groups they have access to
CREATE POLICY "Users can read group messages" ON public.group_messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = group_messages.group_id
    AND gm.user_id::text = auth.uid()::text
  )
  OR
  EXISTS (
    SELECT 1 FROM public.groups g
    WHERE g.id = group_messages.group_id
    AND g.type = 'official'
  )
);

-- Allow authenticated users to insert messages in groups they have access to
CREATE POLICY "Users can insert group messages" ON public.group_messages
FOR INSERT WITH CHECK (
  auth.uid()::text = author_uid::text
  AND EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = group_messages.group_id
    AND gm.user_id::text = auth.uid()::text
  )
);

-- Allow users to update their own messages (for reactions, etc.)
CREATE POLICY "Users can update their own messages" ON public.group_messages
FOR UPDATE USING (auth.uid()::text = author_uid::text);

-- Allow users to delete their own messages
CREATE POLICY "Users can delete their own messages" ON public.group_messages
FOR DELETE USING (auth.uid()::text = author_uid::text);

-- Allow admins to manage all messages
CREATE POLICY "Admins can manage all messages" ON public.group_messages
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.id::text = auth.uid()::text
    AND up.role = 'admin'
  )
);
