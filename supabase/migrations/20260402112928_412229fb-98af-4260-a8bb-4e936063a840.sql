-- Allow all authenticated users to read basic profile info for global ranking
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

CREATE POLICY "Users can view all profiles for ranking"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);