
ALTER TABLE public.transactions 
ADD COLUMN payment_status text NOT NULL DEFAULT 'paid',
ADD COLUMN due_date date NULL;
