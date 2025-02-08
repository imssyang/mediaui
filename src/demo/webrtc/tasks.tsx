import {
    createContext,
    useContext,
    useReducer,
    ReactNode,
    Dispatch,
} from 'react';

type Task = {
    id: number;
    text: string;
    done: boolean;
};

type Action =
    | { type: 'added'; id: number; text: string }
    | { type: 'changed'; task: Task }
    | { type: 'deleted'; id: number };

type TasksProviderProps = {
    children: ReactNode;
};

const TasksContext = createContext<Task[] | undefined>(undefined);
const TasksDispatchContext = createContext<Dispatch<Action> | undefined>(
    undefined
);

function tasksReducer(tasks: Task[], action: Action): Task[] {
    switch (action.type) {
        case 'added': {
            return [
                ...tasks,
                {
                    id: action.id,
                    text: action.text,
                    done: false,
                },
            ];
        }
        case 'changed': {
            return tasks.map((t) =>
                t.id === action.task.id ? action.task : t
            );
        }
        case 'deleted': {
            return tasks.filter((t) => t.id !== action.id);
        }
        default: {
            throw new Error('Unknown action: ' + (action as any).type);
        }
    }
}

const initialTasks: Task[] = [
    { id: 0, text: 'Philosopher’s Path', done: true },
    { id: 1, text: 'Visit the temple', done: false },
    { id: 2, text: 'Drink matcha', done: false },
];

export function TasksProvider({ children }: TasksProviderProps) {
    const [tasks, dispatch] = useReducer(tasksReducer, initialTasks);

    return (
        <TasksContext.Provider value={tasks}>
            <TasksDispatchContext.Provider value={dispatch}>
                {children}
            </TasksDispatchContext.Provider>
        </TasksContext.Provider>
    );
}

export function useTasks(): Task[] {
    const context = useContext(TasksContext);
    if (context === undefined) {
        throw new Error('useTasks 必须在 TasksProvider 内部使用');
    }
    return context;
}

export function useTasksDispatch(): Dispatch<Action> {
    const context = useContext(TasksDispatchContext);
    if (context === undefined) {
        throw new Error('useTasksDispatch 必须在 TasksProvider 内部使用');
    }
    return context;
}
