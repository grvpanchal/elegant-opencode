// One concrete exemplar per variable microtask. Small models pattern-match
// strongly off exemplars, so we ship the smallest possible *complete* example
// of the `{ files: {...} }` shape for each agent — drawn directly from the
// chota-react-redux template (the reference embodiment of the same skills).
//
// The emitter at `src/emitters/<task>.js` produces the canonical full output
// for the canonical "Todo" entity; the exemplar here is a one-file slice
// shown to the LLM as a stylistic anchor. The agent's job is to project the
// same skill onto the user's entity.

export const EXEMPLARS = {
  "entity-schema": `Example output for the prompt "build a todo app":
{
  "name": "Todo",
  "slice": "todo",
  "appName": "Todo App",
  "projectName": "todo-app",
  "itemsField": "todoItems",
  "currentField": "currentTodoItem",
  "operations": ["create", "edit", "update", "toggle", "delete"]
}`,

  "state-selectors": `Exemplar file (only one of two — agent must also emit the test):
// src/state/todo/todo.selectors.js
export const selectTodoItems = (state) => state.todo.todoItems;
export const selectCurrentTodoItem = (state) => state.todo.currentTodoItem;
export const selectVisibleTodoItems = (state) => {
  const items = selectTodoItems(state);
  const filter = state.filters.visibility;
  if (filter === 'active') return items.filter((t) => !t.done);
  if (filter === 'completed') return items.filter((t) => t.done);
  return items;
};`,

  "ui-domain-atom": `Exemplar component (one of six — agent must also emit stories/style/test/type/type-test):
// src/ui/atoms/TodoItem/TodoItem.component.jsx
import './TodoItem.style.css';
export default function TodoItem({ todoItem, onToggleClick, onDeleteClick }) {
  return (
    <li className={todoItem.done ? 'item done' : 'item'}>
      <span onClick={() => onToggleClick(todoItem.id)}>{todoItem.title}</span>
      <button onClick={() => onDeleteClick(todoItem.id)}>×</button>
    </li>
  );
}`,

  "ui-molecule": `Exemplar component (AddTodoForm; agent must also emit FilterGroup, TodoItems, and tests/stories):
// src/ui/molecules/AddTodoForm/AddTodoForm.component.jsx
import { useState } from 'react';
import Input from '../../atoms/Input/Input.component';
import Button from '../../atoms/Button/Button.component';
export default function AddTodoForm({ onSubmit }) {
  const [value, setValue] = useState('');
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (value.trim()) { onSubmit(value); setValue(''); } }}>
      <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Add a todo" />
      <Button type="submit">Add</Button>
    </form>
  );
}`,

  "ui-organism": `Exemplar component (TodoList; agent must also emit SiteHeader, TodoFilters, and tests/stories):
// src/ui/organisms/TodoList/TodoList.component.jsx
import AddTodoForm from '../../molecules/AddTodoForm/AddTodoForm.component';
import TodoItems from '../../molecules/TodoItems/TodoItems.component';
import Alert from '../../atoms/Alert/Alert.component';
import ListSkeleton from '../../skeletons/ListSkeleton/ListSkeleton.component';
export default function TodoList({ todoData, events }) {
  const { todos, status, error } = todoData;
  if (status === 'loading') return <ListSkeleton />;
  if (status === 'failed')  return <Alert variant="error">{error}</Alert>;
  return (<><AddTodoForm onSubmit={events.onCreateClick} /><TodoItems items={todos} {...events} /></>);
}`,

  container: `Exemplar container (TodoListContainer; agent must also emit TodoFiltersContainer and tests):
// src/containers/TodoListContainer.jsx
import { useSelector, useDispatch } from 'react-redux';
import TodoList from '../ui/organisms/TodoList/TodoList.component';
import { selectVisibleTodoItems } from '../state/todo/todo.selectors';
import { createTodo, toggleTodo, deleteTodo } from '../state/todo/todo.actions';
export default function TodoListContainer() {
  const todos = useSelector(selectVisibleTodoItems);
  const dispatch = useDispatch();
  const events = {
    onCreateClick: (title) => dispatch(createTodo({ id: Date.now().toString(), title, done: false })),
    onToggleClick: (id) => dispatch(toggleTodo(id)),
    onDeleteClick: (id) => dispatch(deleteTodo(id)),
  };
  return <TodoList todoData={{ todos, status: 'idle' }} events={events} />;
}`
};

export function exemplarFor(name) {
  return EXEMPLARS[name] || null;
}
