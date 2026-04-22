import { createStore } from '../../src/index';

export interface TodoItem {
  readonly id: number;
  readonly text: string;
  readonly done: boolean;
}

export interface TodoState {
  readonly todoItems: readonly TodoItem[];
  readonly hideDone: boolean;
}

export const state = createStore<TodoState>({
  todoItems: [],
  hideDone: false,
});
