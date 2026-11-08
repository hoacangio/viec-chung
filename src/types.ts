export type ItemKind = 'task' | 'shopping';

export type Item = {
  id: string;
  household_id: string;
  kind: ItemKind;
  title: string;
  assignee_id: string | null;
  due_at: string | null;
  done: boolean;
  done_by: string | null;
  done_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type Member = {
  user_id: string;
  display_name: string;
  role: 'owner' | 'partner' | 'helper';
};

export type Household = {
  id: string;
  name: string;
  invite_code: string | null;
  invite_expires_at: string | null;
};
