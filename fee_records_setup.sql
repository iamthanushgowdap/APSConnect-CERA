-- Create Fee Records Table
CREATE TABLE IF NOT EXISTS public.fee_records (
  id text NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id text REFERENCES public.user_profiles(id),
  semester text NOT NULL,
  year integer NOT NULL,
  total_amount numeric NOT NULL,
  paid_amount numeric DEFAULT 0,
  due_date date NOT NULL,
  payment_status text DEFAULT 'pending'::text CHECK (payment_status = ANY (ARRAY['pending'::text, 'partial'::text, 'paid'::text, 'overdue'::text])),
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Add sample fee records for Thanush (user ID: 7bb12ed2-e7a1-434a-b815-a86d74656f42)
INSERT INTO public.fee_records (id, student_id, semester, year, total_amount, paid_amount, due_date, payment_status, notes) VALUES
('FEE_4', '7bb12ed2-e7a1-434a-b815-a86d74656f42', 'S5', 2025, 52000.00, 52000.00, '2025-08-01', 'paid', 'Full semester payment'),
('FEE_5', '7bb12ed2-e7a1-434a-b815-a86d74656f42', 'S4', 2025, 50000.00, 25000.00, '2025-03-01', 'partial', 'First installment paid')
ON CONFLICT (id) DO NOTHING;
