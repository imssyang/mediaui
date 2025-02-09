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

    clone(fields: Partial<Task>): Task {
        return new Task(
            fields.connID ?? this.connID,
            fields.urls ?? this.urls
        );
    }

    equalURLs(urls: string[]): boolean {
        const urlSet = new Set(urls);
        return this.urls.length === urls.length && this.urls.every(item => urlSet.has(item));
    }
}

type Action =
    | { type: 'addConnection'; connID: string; urls: string[] }
    | { type: 'delConnection'; connID: string };

function taskReducer(task: Task, action: Action): Task {
    switch (action.type) {
        case 'addConnection':
            return task.clone({ 
                connID: action.connID,
                urls: action.urls,
            });
        case 'delConnection': {
            return task.clone({ 
                connID: "",
                urls: [],
            });
        }
        default: {
            throw new Error('Unknown action: ' + (action as any).type);
        }
    }
}

const TaskContext = createContext<Task | null>(null);

const DispatchContext = createContext<Dispatch<Action> | null>(null);

type StateProviderProps = {
    children: ReactNode
}

export function StateProvider({
    children,
}: StateProviderProps) {
    const [task, dispatch] = useReducer(taskReducer, new Task("", []));

    return (
        <TaskContext.Provider value={task}>
            <DispatchContext.Provider value={dispatch}>
                {children}
            </DispatchContext.Provider>
        </TaskContext.Provider>
    );
};

export function useTask() {
    const context = useContext(TaskContext);
    if (!context) {
        throw new Error("useTask must used inside of StateProvider");
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
