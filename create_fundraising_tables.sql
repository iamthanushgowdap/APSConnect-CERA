-- Enable RLS on student_fundraising_status if not already enabled
ALTER TABLE student_fundraising_status ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Students can view their own status" ON student_fundraising_status;
DROP POLICY IF EXISTS "Students can insert their own status" ON student_fundraising_status;
DROP POLICY IF EXISTS "Students can update their own status" ON student_fundraising_status;
DROP POLICY IF EXISTS "Faculty can view status for their campaigns" ON student_fundraising_status;
DROP POLICY IF EXISTS "Faculty can update status for their campaigns" ON student_fundraising_status;

-- Create policies for student_fundraising_status
CREATE POLICY "Students can view their own status" ON student_fundraising_status
  FOR SELECT USING (auth.uid()::text = student_uid);

CREATE POLICY "Students can insert their own status" ON student_fundraising_status
  FOR INSERT WITH CHECK (auth.uid()::text = student_uid);

CREATE POLICY "Students can update their own status" ON student_fundraising_status
  FOR UPDATE USING (auth.uid()::text = student_uid);

CREATE POLICY "Faculty can view status for their campaigns" ON student_fundraising_status
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM fundraising_campaigns
      WHERE id = campaign_id AND created_by_uid = auth.uid()::text
    )
  );

CREATE POLICY "Faculty can update status for their campaigns" ON student_fundraising_status
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM fundraising_campaigns
      WHERE id = campaign_id AND created_by_uid = auth.uid()::text
    )
  );
