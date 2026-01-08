import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  signal,
  computed,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TaskService } from '../../../services/task.service';
import { AuthService } from '../../../services/auth.service';
import { ThemeService } from '../../../services/theme.service';
import { TaskColumnComponent } from '../task-column/task-column.component';
import { TaskModalComponent } from '../task-modal/task-modal.component';
import {
  ITask,
  ICreateTask,
  IUpdateTask,
  TaskStatus,
  TaskCategory,
  TaskPriority,
} from '@arao-5db7e763-d567-4c90-b836-3ebf57b9cc25/data';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, TaskColumnComponent, TaskModalComponent],
  template: `
    <div class="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-200">
      <!-- Header -->
      <header class="bg-white dark:bg-gray-800 shadow-sm transition-colors duration-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div class="flex justify-between items-center">
            <div>
              <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Task Dashboard</h1>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Welcome, {{ authService.user()?.email }}
                <span
                  class="ml-2 px-2 py-1 text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 rounded-full"
                >
                  {{ authService.userRole() }}
                </span>
              </p>
            </div>
            <div class="flex items-center gap-4">
              <!-- Dark Mode Toggle -->
              <button
                (click)="themeService.toggleTheme()"
                class="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                [attr.aria-label]="themeService.isDark() ? 'Switch to light mode' : 'Switch to dark mode'"
                title="Toggle theme (T)"
              >
                @if (themeService.isDark()) {
                  <!-- Sun icon for dark mode -->
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                    ></path>
                  </svg>
                } @else {
                  <!-- Moon icon for light mode -->
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                    ></path>
                  </svg>
                }
              </button>

              <!-- Keyboard shortcuts help -->
              <button
                (click)="showShortcuts.set(!showShortcuts())"
                class="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Keyboard shortcuts (?)"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
              </button>

              <button
                (click)="openCreateModal()"
                class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center gap-2"
                title="New Task (N)"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                </svg>
                New Task
              </button>
              <button
                (click)="logout()"
                class="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <!-- Filters -->
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6 transition-colors duration-200">
          <div class="flex flex-wrap gap-4 items-center">
            <div class="flex-1 min-w-48">
              <input
                type="text"
                [ngModel]="searchQuery()"
                (ngModelChange)="searchQuery.set($event)"
                placeholder="Search tasks... (Press / to focus)"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                #searchInput
              />
            </div>
            <select
              [ngModel]="filterCategory()"
              (ngModelChange)="filterCategory.set($event)"
              class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">All Categories</option>
              @for (category of categories; track category) {
                <option [value]="category">{{ category | titlecase }}</option>
              }
            </select>
            <select
              [ngModel]="filterPriority()"
              (ngModelChange)="filterPriority.set($event)"
              class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">All Priorities</option>
              @for (priority of priorities; track priority) {
                <option [value]="priority">{{ priority | titlecase }}</option>
              }
            </select>
            @if (searchQuery() || filterCategory() || filterPriority()) {
              <button
                (click)="clearFilters()"
                class="px-3 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                title="Clear filters (Esc)"
              >
                Clear Filters
              </button>
            }
          </div>
        </div>

        <!-- Task completion visualization -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6 transition-colors duration-200">
          <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Task Progress</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Progress Bar -->
            <div class="flex flex-col gap-2">
              <div class="flex items-center gap-4">
                <div class="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
                  <div
                    class="bg-green-500 h-full transition-all duration-500 ease-out"
                    [style.width.%]="completionPercentage()"
                  ></div>
                </div>
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-20 text-right">
                  {{ completionPercentage() }}% done
                </span>
              </div>
              <div class="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>{{ taskService.doneTasks().length }} of {{ taskService.allTasks().length }} tasks completed</span>
              </div>
            </div>

            <!-- Status Distribution Chart -->
            <div class="flex items-center gap-4">
              <!-- Donut Chart -->
              <div class="relative w-24 h-24 flex-shrink-0">
                <svg class="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <!-- Background circle -->
                  <circle
                    cx="18"
                    cy="18"
                    r="15.915"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="3"
                    class="text-gray-200 dark:text-gray-700"
                  />
                  <!-- To Do segment -->
                  <circle
                    cx="18"
                    cy="18"
                    r="15.915"
                    fill="none"
                    stroke="#fbbf24"
                    stroke-width="3"
                    [attr.stroke-dasharray]="todoPercentage() + ' ' + (100 - todoPercentage())"
                    [attr.stroke-dashoffset]="0"
                    class="transition-all duration-500"
                  />
                  <!-- In Progress segment -->
                  <circle
                    cx="18"
                    cy="18"
                    r="15.915"
                    fill="none"
                    stroke="#3b82f6"
                    stroke-width="3"
                    [attr.stroke-dasharray]="inProgressPercentage() + ' ' + (100 - inProgressPercentage())"
                    [attr.stroke-dashoffset]="-todoPercentage()"
                    class="transition-all duration-500"
                  />
                  <!-- Done segment -->
                  <circle
                    cx="18"
                    cy="18"
                    r="15.915"
                    fill="none"
                    stroke="#22c55e"
                    stroke-width="3"
                    [attr.stroke-dasharray]="donePercentage() + ' ' + (100 - donePercentage())"
                    [attr.stroke-dashoffset]="-todoPercentage() - inProgressPercentage()"
                    class="transition-all duration-500"
                  />
                </svg>
                <div class="absolute inset-0 flex items-center justify-center">
                  <span class="text-lg font-bold text-gray-700 dark:text-gray-300">
                    {{ taskService.allTasks().length }}
                  </span>
                </div>
              </div>

              <!-- Legend -->
              <div class="flex flex-col gap-1.5">
                <div class="flex items-center gap-2">
                  <div class="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <span class="text-sm text-gray-600 dark:text-gray-400">
                    To Do: {{ taskService.todoTasks().length }}
                  </span>
                </div>
                <div class="flex items-center gap-2">
                  <div class="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span class="text-sm text-gray-600 dark:text-gray-400">
                    In Progress: {{ taskService.inProgressTasks().length }}
                  </span>
                </div>
                <div class="flex items-center gap-2">
                  <div class="w-3 h-3 rounded-full bg-green-500"></div>
                  <span class="text-sm text-gray-600 dark:text-gray-400">
                    Done: {{ taskService.doneTasks().length }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Loading state -->
        @if (taskService.isLoading()) {
          <div class="flex justify-center py-12">
            <svg
              class="animate-spin h-8 w-8 text-indigo-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </div>
        }

        <!-- Error state -->
        @if (taskService.errorMessage()) {
          <div
            class="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded mb-6"
          >
            {{ taskService.errorMessage() }}
            <button (click)="taskService.clearError()" class="ml-4 underline">Dismiss</button>
          </div>
        }

        <!-- Kanban Board -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <app-task-column
            title="To Do"
            [status]="TaskStatus.TODO"
            [tasks]="filteredTodoTasks()"
            (addTask)="openCreateModal($event)"
            (editTask)="openEditModal($event)"
            (deleteTask)="confirmDelete($event)"
            (taskDropped)="onTaskDropped($event)"
          />
          <app-task-column
            title="In Progress"
            [status]="TaskStatus.IN_PROGRESS"
            [tasks]="filteredInProgressTasks()"
            (addTask)="openCreateModal($event)"
            (editTask)="openEditModal($event)"
            (deleteTask)="confirmDelete($event)"
            (taskDropped)="onTaskDropped($event)"
          />
          <app-task-column
            title="Done"
            [status]="TaskStatus.DONE"
            [tasks]="filteredDoneTasks()"
            (addTask)="openCreateModal($event)"
            (editTask)="openEditModal($event)"
            (deleteTask)="confirmDelete($event)"
            (taskDropped)="onTaskDropped($event)"
          />
        </div>

        <!-- Keyboard Shortcuts Footer -->
        <div class="mt-8 text-center text-xs text-gray-400 dark:text-gray-600">
          Press <kbd class="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">?</kbd> for keyboard shortcuts
        </div>
      </div>

      <!-- Task Modal -->
      <app-task-modal
        #taskModal
        [task]="selectedTask()"
        [defaultStatus]="defaultTaskStatus()"
        (close)="closeModal()"
        (save)="saveTask($event)"
      />

      <!-- Delete Confirmation Modal -->
      @if (taskToDelete()) {
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-sm w-full mx-4">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Delete Task</h3>
            <p class="text-gray-600 dark:text-gray-400 mb-4">
              Are you sure you want to delete "{{ taskToDelete()?.title }}"? This action cannot be undone.
            </p>
            <div class="flex justify-end gap-3">
              <button
                (click)="taskToDelete.set(null)"
                class="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                (click)="deleteTask()"
                class="px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Keyboard Shortcuts Modal -->
      @if (showShortcuts()) {
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" (click)="showShortcuts.set(false)">
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4" (click)="$event.stopPropagation()">
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Keyboard Shortcuts</h3>
              <button
                (click)="showShortcuts.set(false)"
                class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            <div class="space-y-3">
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">Create new task</span>
                <kbd class="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-sm">N</kbd>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">Focus search</span>
                <kbd class="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-sm">/</kbd>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">Toggle dark mode</span>
                <kbd class="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-sm">T</kbd>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">Clear filters / Close modal</span>
                <kbd class="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-sm">Esc</kbd>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">Refresh tasks</span>
                <kbd class="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-sm">R</kbd>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">Show shortcuts</span>
                <kbd class="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-sm">?</kbd>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class DashboardComponent implements OnInit, OnDestroy {
  @ViewChild('taskModal') taskModal!: TaskModalComponent;

  TaskStatus = TaskStatus;
  categories = Object.values(TaskCategory);
  priorities = Object.values(TaskPriority);

  // Use signals for reactive filtering
  searchQuery = signal('');
  filterCategory = signal('');
  filterPriority = signal('');

  selectedTask = signal<ITask | null>(null);
  defaultTaskStatus = signal<TaskStatus>(TaskStatus.TODO);
  taskToDelete = signal<ITask | null>(null);
  showShortcuts = signal<boolean>(false);

  // Filtered tasks based on search and filters - now reactive to signal changes
  filteredTodoTasks = computed(() => this.filterTasks(this.taskService.todoTasks()));
  filteredInProgressTasks = computed(() => this.filterTasks(this.taskService.inProgressTasks()));
  filteredDoneTasks = computed(() => this.filterTasks(this.taskService.doneTasks()));

  // Completion statistics
  completionPercentage = computed(() => {
    const total = this.taskService.allTasks().length;
    if (total === 0) return 0;
    return Math.round((this.taskService.doneTasks().length / total) * 100);
  });

  todoPercentage = computed(() => {
    const total = this.taskService.allTasks().length;
    if (total === 0) return 0;
    return (this.taskService.todoTasks().length / total) * 100;
  });

  inProgressPercentage = computed(() => {
    const total = this.taskService.allTasks().length;
    if (total === 0) return 0;
    return (this.taskService.inProgressTasks().length / total) * 100;
  });

  donePercentage = computed(() => {
    const total = this.taskService.allTasks().length;
    if (total === 0) return 0;
    return (this.taskService.doneTasks().length / total) * 100;
  });

  constructor(
    public taskService: TaskService,
    public authService: AuthService,
    public themeService: ThemeService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadTasks();
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  // Keyboard shortcuts handler
  @HostListener('document:keydown', ['$event'])
  handleKeyboardShortcut(event: KeyboardEvent): void {
    // Don't trigger shortcuts when typing in inputs
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
      // Only handle Escape in inputs
      if (event.key === 'Escape') {
        (target as HTMLInputElement).blur();
        this.clearFilters();
      }
      return;
    }

    // Handle modal-specific shortcuts
    if (this.taskModal?.isOpen()) {
      if (event.key === 'Escape') {
        this.closeModal();
      }
      return;
    }

    if (this.taskToDelete()) {
      if (event.key === 'Escape') {
        this.taskToDelete.set(null);
      }
      return;
    }

    if (this.showShortcuts()) {
      if (event.key === 'Escape') {
        this.showShortcuts.set(false);
      }
      return;
    }

    // Global shortcuts
    switch (event.key.toLowerCase()) {
      case 'n':
        event.preventDefault();
        this.openCreateModal();
        break;
      case '/':
        event.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
        break;
      case 't':
        event.preventDefault();
        this.themeService.toggleTheme();
        break;
      case 'r':
        event.preventDefault();
        this.loadTasks();
        break;
      case '?':
        event.preventDefault();
        this.showShortcuts.set(true);
        break;
      case 'escape':
        this.clearFilters();
        break;
    }
  }

  loadTasks(): void {
    this.taskService.loadTasks().subscribe();
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.filterCategory.set('');
    this.filterPriority.set('');
  }

  private filterTasks(tasks: ITask[]): ITask[] {
    const search = this.searchQuery();
    const category = this.filterCategory();
    const priority = this.filterPriority();

    return tasks.filter((task) => {
      const matchesSearch =
        !search ||
        task.title.toLowerCase().includes(search.toLowerCase()) ||
        task.description?.toLowerCase().includes(search.toLowerCase());

      const matchesCategory = !category || task.category === category;
      const matchesPriority = !priority || task.priority === priority;

      return matchesSearch && matchesCategory && matchesPriority;
    });
  }

  openCreateModal(status?: TaskStatus): void {
    this.selectedTask.set(null);
    this.defaultTaskStatus.set(status || TaskStatus.TODO);
    this.taskModal.open(undefined, status);
  }

  openEditModal(task: ITask): void {
    this.selectedTask.set(task);
    this.taskModal.open(task);
  }

  closeModal(): void {
    this.selectedTask.set(null);
    this.taskModal.isOpen.set(false);
  }

  saveTask(data: ICreateTask | IUpdateTask): void {
    const task = this.selectedTask();

    if (task) {
      this.taskService.updateTask(task.id, data as IUpdateTask).subscribe({
        next: () => this.closeModal(),
        error: (err) => console.error('Failed to update task:', err),
      });
    } else {
      this.taskService.createTask(data as ICreateTask).subscribe({
        next: () => this.closeModal(),
        error: (err) => console.error('Failed to create task:', err),
      });
    }
  }

  confirmDelete(task: ITask): void {
    this.taskToDelete.set(task);
  }

  deleteTask(): void {
    const task = this.taskToDelete();
    if (task) {
      this.taskService.deleteTask(task.id).subscribe({
        next: () => this.taskToDelete.set(null),
        error: (err) => console.error('Failed to delete task:', err),
      });
    }
  }

  onTaskDropped(event: { taskId: string; newStatus: TaskStatus }): void {
    // Optimistic update
    this.taskService.moveTask(event.taskId, event.newStatus);

    // Persist to server
    this.taskService.updateTask(event.taskId, { status: event.newStatus }).subscribe({
      error: () => {
        // Reload on error to restore correct state
        this.loadTasks();
      },
    });
  }

  logout(): void {
    this.authService.logout();
  }
}
