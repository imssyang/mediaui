import {
    Dispatch,
    ReactNode,
    createContext,
    useContext,
    useReducer,
} from "react";

class Task {
    connID: string;
    urls: string[];

    constructor(connID: string, urls: string[]) {
      this.connID = connID;
      this.urls = urls;
    }

    equalURLs(urls: string[]): boolean {
        return this.urls.length === urls.length
        && new Set(this.urls).size === new Set(urls).size
        && [...new Set(this.urls)].every(item => new Set(urls).has(item));
    }
}

type Action =
    | { type: 'addConnection'; connID: string; urls: string[] }
    | { type: 'delConnection'; connID: string };

function taskReducer(tasks: Task[], action: Action): Task[] {
    switch (action.type) {
        case 'addConnection': {
            return [
                ...tasks,
                new Task(action.connID, action.urls),
            ];
        }
        case 'delConnection': {
            return tasks.filter((t) => t.connID !== action.connID);
        }
        default: {
            throw new Error('Unknown action: ' + (action as any).type);
        }
    }
}

const TasksContext = createContext<Task[] | null>(null);

const DispatchContext = createContext<Dispatch<Action> | null>(null);

type StateProviderProps = {
    children: ReactNode
}

export function StateProvider({
    children,
}: StateProviderProps) {
    const [task, dispatch] = useReducer(taskReducer, []);

    return (
        <TasksContext.Provider value={task}>
            <DispatchContext.Provider value={dispatch}>
                {children}
            </DispatchContext.Provider>
        </TasksContext.Provider>
    );
};

export function useTasks() {
    const context = useContext(TasksContext);
    if (!context) {
        throw new Error("useTasks must used inside of StateProvider");
    }
    return context;
}

export function useDispatch() {
    const context = useContext(DispatchContext);
    if (!context) {
        throw new Error("useDispatch must used inside of StateProvider");
    }
    return context;
}
