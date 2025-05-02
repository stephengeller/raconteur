export interface PRChoice {
  title: string;
  value: number;
  selected: boolean;
}

export interface UserPromptChoice<T> {
  title: string;
  value: T;
  selected?: boolean;
}