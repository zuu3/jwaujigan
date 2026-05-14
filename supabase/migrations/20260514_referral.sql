-- users 테이블에 referral_code 추가
alter table public.users
  add column if not exists referral_code text unique;

-- referrals 테이블 (pending 없이 completed만 사용)
create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references public.users(id) on delete cascade,
  referred_id uuid not null references public.users(id) on delete cascade,
  completed_at timestamptz default now(),
  unique (referred_id)
);
