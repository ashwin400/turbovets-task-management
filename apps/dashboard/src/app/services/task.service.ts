import { Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';
import {
  ITask,
  ICreateTask,
  IUpdateTask,
  ITaskFilters,
  TaskStatus,
  TaskCategory,
  TaskPriority,
} from '@arao-5db7e763-d567-4c90-b836-3ebf57b9cc25/data';

const API_URL = 'http://localhost:3000/api';

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  private tasks = signal<ITask[]>([]);
  private loading = signal(false);
  private error = signal<string | null>(null);

  readonly allTasks = this.tasks.asReadonly();
  readonly isLoading = this.loading.asReadonly();
  readonly errorMessage = this.error.asReadonly();

  // Computed values for task grouping
  readonly todoTasks = computed(() =>
    this.tasks().filter((t) => t.status === TaskStatus.TODO)
  );
  readonly inProgressTasks = computed(() =>
    this.tasks().filter((t) => t.status === TaskStatus.IN_PROGRESS)
  );
  readonly doneTasks = computed(() =>
    this.tasks().filter((t) => t.status === TaskStatus.DONE)
  );

  constructor(private http: HttpClient) {}

  loadTasks(filters?: ITaskFilters): Observable<ITask[]> {
    this.loading.set(true);
    this.error.set(null);

    let params = new HttpParams();
    if (filters) {
      if (filters.status) params = params.set('status', filters.status);
      if (filters.category) params = params.set('category', filters.category);
      if (filters.priority) params = params.set('priority', filters.priority);
      if (filters.search) params = params.set('search', filters.search);
      if (filters.assigneeId) params = params.set('assigneeId', filters.assigneeId);
    }

    return this.http.get<ITask[]>(`${API_URL}/tasks`, { params }).pipe(
      tap((tasks) => {
        this.tasks.set(tasks);
        this.loading.set(false);
      }),
      catchError((error) => {
        this.error.set(error.message || 'Failed to load tasks');
        this.loading.set(false);
        return throwError(() => error);
      })
    );
  }

  createTask(task: ICreateTask): Observable<ITask> {
    return this.http.post<ITask>(`${API_URL}/tasks`, task).pipe(
      tap((newTask) => {
        this.tasks.update((tasks) => [...tasks, newTask]);
      }),
      catchError((error) => {
        this.error.set(error.message || 'Failed to create task');
        return throwError(() => error);
      })
    );
  }

  updateTask(id: string, updates: IUpdateTask): Observable<ITask> {
    return this.http.put<ITask>(`${API_URL}/tasks/${id}`, updates).pipe(
      tap((updatedTask) => {
        this.tasks.update((tasks) =>
          tasks.map((t) => (t.id === id ? updatedTask : t))
        );
      }),
      catchError((error) => {
        this.error.set(error.message || 'Failed to update task');
        return throwError(() => error);
      })
    );
  }

  deleteTask(id: string): Observable<void> {
    return this.http.delete<void>(`${API_URL}/tasks/${id}`).pipe(
      tap(() => {
        this.tasks.update((tasks) => tasks.filter((t) => t.id !== id));
      }),
      catchError((error) => {
        this.error.set(error.message || 'Failed to delete task');
        return throwError(() => error);
      })
    );
  }

  reorderTask(id: string, newOrder: number, newStatus?: TaskStatus): Observable<ITask> {
    return this.http.put<ITask>(`${API_URL}/tasks/${id}/reorder`, {
      order: newOrder,
      status: newStatus,
    }).pipe(
      tap((updatedTask) => {
        this.tasks.update((tasks) =>
          tasks.map((t) => (t.id === id ? updatedTask : t))
        );
      }),
      catchError((error) => {
        this.error.set(error.message || 'Failed to reorder task');
        return throwError(() => error);
      })
    );
  }

  // Local state updates for optimistic UI
  moveTask(taskId: string, newStatus: TaskStatus): void {
    this.tasks.update((tasks) =>
      tasks.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );
  }

  clearError(): void {
    this.error.set(null);
  }
}
