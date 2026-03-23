-- WARNING: This will set up the SplitNest schema. 
-- Since your current 'expenses' table is empty and has a different schema, 
-- we will drop and recreate the necessary tables.

-- Drop existing incompatible tables if they are empty or not needed
drop table if exists expense_splits cascade;
drop table if exists expenses cascade;
drop table if exists group_members cascade;
drop table if exists groups cascade;

-- Profiles table (Ensure it has the SplitNest columns)
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  email text,
  avatar_url text,
  country text,
  currency text,
  updated_at timestamp with time zone default now()
);

-- Groups table
create table groups (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  type text check (type in ('trip', 'roommates', 'other')) default 'other',
  created_by uuid references auth.users on delete cascade not null,
  created_at timestamp with time zone default now()
);

-- Group Members table
create table group_members (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references groups on delete cascade not null,
  user_id uuid references auth.users on delete set null,
  name text not null,
  created_at timestamp with time zone default now()
);

-- Expenses table
create table expenses (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references groups on delete cascade not null,
  title text not null,
  amount decimal(12,2) not null,
  paid_by text not null, -- member name
  category text default 'Others', -- Food, Travel, Rent, Shopping, Others
  created_by uuid references auth.users on delete cascade not null,
  created_at timestamp with time zone default now()
);

-- Expense Splits table
create table expense_splits (
  id uuid default gen_random_uuid() primary key,
  expense_id uuid references expenses on delete cascade not null,
  member_name text not null,
  amount decimal(12,2) not null,
  settled boolean default false,
  created_at timestamp with time zone default now()
);

-- Activity Logs table
create table activity_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  action text not null,
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table profiles enable row level security;
alter table groups enable row level security;
alter table group_members enable row level security;
alter table expenses enable row level security;
alter table expense_splits enable row level security;
alter table activity_logs enable row level security;

-- RLS Policies
drop policy if exists "Users can manage their own profiles" on profiles;
create policy "Users can manage their own profiles" on profiles for all using (auth.uid() = id);

drop policy if exists "Users can manage their own groups" on groups;
create policy "Users can manage their own groups" on groups for all using (auth.uid() = created_by);

drop policy if exists "Users can manage their group members" on group_members;
create policy "Users can manage their group members" on group_members for all using (
  exists (select 1 from groups where id = group_id and created_by = auth.uid())
);

drop policy if exists "Users can manage their expenses" on expenses;
create policy "Users can manage their expenses" on expenses for all using (auth.uid() = created_by);

drop policy if exists "Users can manage their expense splits" on expense_splits;
create policy "Users can manage their expense splits" on expense_splits for all using (
  exists (select 1 from expenses where id = expense_id and created_by = auth.uid())
);

drop policy if exists "Users can manage their own activity logs" on activity_logs;
create policy "Users can manage their own activity logs" on activity_logs for all using (auth.uid() = user_id);
