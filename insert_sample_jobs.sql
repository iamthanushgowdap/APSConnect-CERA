-- Sample data for job_postings table
-- Note: This is adapted for the existing job_postings table structure
INSERT INTO public.job_postings (
  title,
  company,
  location,
  salary_range,
  job_type,
  description,
  required_skills,
  is_featured,
  posted_by,
  contact_email,
  application_deadline
) VALUES
(
  'Software Engineer',
  'Google',
  'Bangalore, Karnataka',
  '₹8,00,000 - ₹15,00,000',
  'Full-time',
  'We are looking for a passionate Software Engineer to join our team. You will be working on cutting-edge technologies and building scalable solutions that impact millions of users worldwide.',
  ARRAY['Java', 'Python', 'Algorithms', 'Data Structures'],
  true,
  'user123', -- Replace with actual alumni user ID
  'careers@google.com',
  '2024-12-31'::timestamp
),
(
  'Frontend Developer',
  'Microsoft',
  'Hyderabad, Telangana',
  '₹6,00,000 - ₹12,00,000',
  'Full-time',
  'Join our dynamic frontend team to build beautiful and responsive web applications. You will work with React, TypeScript, and modern web technologies.',
  ARRAY['React', 'JavaScript', 'TypeScript', 'CSS'],
  false,
  'user123', -- Replace with actual alumni user ID
  'jobs@microsoft.com',
  '2024-11-30'::timestamp
),
(
  'Data Scientist',
  'Amazon',
  'Mumbai, Maharashtra',
  '₹10,00,000 - ₹18,00,000',
  'Full-time',
  'We are seeking a talented Data Scientist to analyze large datasets and build machine learning models that drive business decisions.',
  ARRAY['Python', 'Machine Learning', 'SQL', 'Statistics'],
  true,
  'user123', -- Replace with actual alumni user ID
  'data@amazon.com',
  '2024-12-15'::timestamp
),
(
  'DevOps Engineer',
  'Netflix',
  'Remote',
  '₹12,00,000 - ₹20,00,000',
  'Full-time',
  'Looking for an experienced DevOps Engineer to manage our cloud infrastructure and deployment pipelines.',
  ARRAY['AWS', 'Docker', 'Kubernetes', 'CI/CD'],
  false,
  'user123', -- Replace with actual alumni user ID
  'devops@netflix.com',
  '2024-11-25'::timestamp
),
(
  'Mobile App Developer',
  'Meta',
  'Delhi, NCR',
  '₹7,00,000 - ₹14,00,000',
  'Full-time',
  'Build amazing mobile experiences for billions of users. Work on iOS and Android applications using React Native.',
  ARRAY['React Native', 'iOS', 'Android', 'JavaScript'],
  true,
  'user123', -- Replace with actual alumni user ID
  'mobile@meta.com',
  '2024-12-10'::timestamp
);
