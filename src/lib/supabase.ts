import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  country?: string;
  currency?: string;
}

export interface Group {
  id: string;
  name: string;
  type: "trip" | "roommates" | "other";
  created_by: string;
  created_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id?: string;
  name: string;
}

export interface Expense {
  id: string;
  group_id: string;
  title: string;
  amount: number;
  paid_by: string;          // member name
  created_by: string;       // auth user id
  created_at: string;
  groups?: { name: string; type: string };
  expense_splits?: ExpenseSplit[];
}


export interface ExpenseSplit {
  id: string;
  expense_id: string;
  member_name: string;
  amount: number;           // share owed by this member
  settled: boolean;
}

// ─── Auth Cache & Listener ───────────────────────────────────────────────────
let _cachedUser: any = null;

// Listen for auth state changes to keep cache in sync
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
    _cachedUser = null;
  } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
    _cachedUser = session?.user ?? null;
  }
});

/** Helper to get user, caching the result for the current session lifecycle. */
async function getAuthUser() {
  if (_cachedUser) return _cachedUser;
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      if (error.name === 'AuthApiError' && error.message.includes('Refresh Token Not Found')) {
        console.warn("Session expired or refresh token invalid. Signing out.");
        await supabase.auth.signOut();
      }
      _cachedUser = null;
      return null;
    }
    _cachedUser = user;
    return user;
  } catch (err) {
    console.error("getAuthUser unexpected error:", err);
    _cachedUser = null;
    return null;
  }
}

/** Returns the currently authenticated user's profile, or null. */
export async function getCurrentProfile(): Promise<Profile | null> {
  try {
    const user = await getAuthUser();
    if (!user) return null;
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    return data ?? null;
  } catch (err) {
    console.error("Supabase fetch failed (likely network or invalid URL):", err);
    return null;
  }
}

/** Updates the current user's profile. */
export async function updateProfile(updates: Partial<Profile>) {
  const user = await getAuthUser();
  if (!user) throw new Error("No user logged in");
  
  // Create a copy of updates without the id field
  const { id, ...cleanUpdates } = updates as any;
  
  const { data, error } = await supabase
    .from("profiles")
    .update(cleanUpdates)
    .eq("id", user.id)
    .select()
    .single();

  if (error) throw error;
  return data as Profile;
}


/** All groups created by (or containing) the current user, with member count + total spend. */
export async function fetchGroups() {
  const user = await getAuthUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("groups")
    .select(`
      id, name, type, created_at,
      group_members ( id, name ),
      expenses ( id, amount )
    `)
    .eq("created_by", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("fetchGroups error:", error);
    return [];
  }
  if (!data) return [];

  return data.map((g: any) => ({
    id: g.id,
    name: g.name,
    type: g.type ?? "other",
    created_at: g.created_at,
    member_count: (g.group_members ?? []).length,
    members: (g.group_members ?? []) as GroupMember[],
    total_expense: (g.expenses ?? []).reduce((s: number, e: any) => s + (e.amount ?? 0), 0),
  }));
}

/** Single group with members + expenses. */
export async function fetchGroupById(groupId: string) {
  const { data, error } = await supabase
    .from("groups")
    .select(`
      id, name, type, created_at,
      group_members ( id, name ),
      expenses (
        id, title, amount, paid_by, created_at,
        expense_splits ( id, member_name, amount, settled )
      )
    `)
    .eq("id", groupId)
    .single();

  if (error) {
    console.error(`fetchGroupById error for ${groupId}:`, error);
    return null;
  }
  if (!data) return null;
  return data as any;
}

export async function fetchAllExpenses() {
  const user = await getAuthUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("expenses")
    .select(`
      id, title, amount, paid_by, created_at,
      groups ( id, name, type ),
      expense_splits ( id, member_name, amount, settled )
    `)
    .eq("created_by", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("fetchAllExpenses error:", error);
    return [];
  }
  if (!data) return [];
  return data as any[];
}

/** Insert group + members in one transaction-like sequence. */
export async function createGroup(
  name: string,
  type: string,
  memberNames: string[]
): Promise<string | null> {
  const user = await getAuthUser();
  if (!user) return null;

  const { data: group, error: gErr } = await supabase
    .from("groups")
    .insert({ name, type, created_by: user.id })
    .select()
    .single();

  if (gErr || !group) return null;

  if (memberNames.length) {
    const rows = memberNames
      .filter(n => n.trim())
      .map(n => ({ group_id: group.id, name: n.trim() }));
    await supabase.from("group_members").insert(rows);
  }

  return group.id as string;
}

/** Insert expense + equal splits. */
export async function createExpense(
  groupId: string,
  title: string,
  amount: number,
  paidBy: string,
  splitMembers: string[]
): Promise<boolean> {
  const user = await getAuthUser();
  if (!user) return false;

  const { data: exp, error: eErr } = await supabase
    .from("expenses")
    .insert({ group_id: groupId, title, amount, paid_by: paidBy, created_by: user.id })
    .select()
    .single();

  if (eErr || !exp) return false;

  if (splitMembers.length) {
    const share = parseFloat((amount / splitMembers.length).toFixed(2));
    const splits = splitMembers.map(m => ({
      expense_id: exp.id,
      member_name: m,
      amount: share,
      settled: false,
    }));
    await supabase.from("expense_splits").insert(splits);
  }

  return true;
}

/** Insert a payment (special expense with title "Payment") to settle up. */
export async function createPayment(
    groupId: string,
    amount: number,
    fromPerson: string,
    toPerson: string
): Promise<boolean> {
    const user = await getAuthUser();
    if (!user) return false;

    // A payment is recorded as an expense with the title "Payment"
    // The person who "owes" becomes the payer (paid_by)
    // The person who "is owed" is the only one in the split (member_name)
    const { data: exp, error: eErr } = await supabase
        .from("expenses")
        .insert({
            group_id: groupId,
            title: "Payment",
            amount,
            paid_by: fromPerson,
            created_by: user.id
        })
        .select()
        .single();

    if (eErr || !exp) return false;

    // Create a single split for the recipient
    const split = {
        expense_id: exp.id,
        member_name: toPerson,
        amount: amount,
        settled: false,
    };
    await supabase.from("expense_splits").insert(split);

    return true;
}

/** Compute simplified balances from expense_splits. */
export function computeBalances(
  expenses: any[],
  myName: string
): { person: string; amount: number; direction: "owe" | "owed" }[] {
  // net[person] = positive means they owe me, negative means I owe them
  const net: Record<string, number> = {};

  for (const exp of expenses) {
    const splits: any[] = exp.expense_splits ?? [];
    for (const s of splits) {
      if (s.settled) continue;
      if (exp.paid_by === myName && s.member_name !== myName) {
        net[s.member_name] = (net[s.member_name] ?? 0) + s.amount;
      } else if (s.member_name === myName && exp.paid_by !== myName) {
        net[exp.paid_by] = (net[exp.paid_by] ?? 0) - s.amount;
      }
    }
  }

  return Object.entries(net)
    .filter(([, v]) => Math.abs(v) > 0.01)
    .map(([person, v]) => ({
      person,
      amount: Math.abs(v),
      direction: v > 0 ? "owed" : "owe",
    }));
}

export const G_COLORS = ["#6366f1", "#a855f7", "#ec4899", "#22d3ee", "#10b981", "#f59e0b", "#ef4444", "#3b82f6"];
export const GROUP_EMOJIS: Record<string, string> = { trip: "✈️", roommates: "🏠", other: "💰" };
