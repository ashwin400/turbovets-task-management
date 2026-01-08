import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ITask,
  ICreateTask,
  IUpdateTask,
  TaskStatus,
  TaskCategory,
  TaskPriority,
} from '@arao-5db7e763-d567-4c90-b836-3ebf57b9cc25/data';

@Component({
  selector: 'app-task-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (isOpen()) {
      <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto transition-colors duration-200">
          <div class="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ task ? 'Edit Task' : 'Create Task' }}
            </h3>
            <button (click)="close.emit()" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          <form (ngSubmit)="onSubmit()" class="p-4 space-y-4">
            <div>
              <label for="title" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
              <input
                id="title"
                type="text"
                required
                [(ngModel)]="formData.title"
                name="title"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Task title"
              />
            </div>

            <div>
              <label for="description" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
              <textarea
                id="description"
                [(ngModel)]="formData.description"
                name="description"
                rows="3"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Task description"
              ></textarea>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label for="status" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                <select
                  id="status"
                  [(ngModel)]="formData.status"
                  name="status"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  @for (status of statuses; track status) {
                    <option [value]="status">{{ formatStatus(status) }}</option>
                  }
                </select>
              </div>

              <div>
                <label for="priority" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
                <select
                  id="priority"
                  [(ngModel)]="formData.priority"
                  name="priority"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  @for (priority of priorities; track priority) {
                    <option [value]="priority">{{ priority | titlecase }}</option>
                  }
                </select>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label for="category" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                <select
                  id="category"
                  [(ngModel)]="formData.category"
                  name="category"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  @for (category of categories; track category) {
                    <option [value]="category">{{ category | titlecase }}</option>
                  }
                </select>
              </div>

              <div>
                <label for="dueDate" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Due Date</label>
                <input
                  id="dueDate"
                  type="date"
                  [(ngModel)]="formData.dueDate"
                  name="dueDate"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div class="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                (click)="close.emit()"
                class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                [disabled]="loading()"
                class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {{ task ? 'Update' : 'Create' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
})
export class TaskModalComponent {
  @Input() task: ITask | null = null;
  @Input() defaultStatus: TaskStatus = TaskStatus.TODO;

  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<ICreateTask | IUpdateTask>();

  isOpen = signal(false);
  loading = signal(false);

  formData = {
    title: '',
    description: '',
    status: TaskStatus.TODO,
    category: TaskCategory.OTHER,
    priority: TaskPriority.MEDIUM,
    dueDate: '',
  };

  statuses = Object.values(TaskStatus);
  categories = Object.values(TaskCategory);
  priorities = Object.values(TaskPriority);

  open(task?: ITask, defaultStatus?: TaskStatus): void {
    if (task) {
      this.task = task;
      // Populate form with existing task data
      this.formData = {
        title: task.title,
        description: task.description || '',
        status: task.status,
        category: task.category,
        priority: task.priority,
        dueDate: task.dueDate
          ? new Date(task.dueDate).toISOString().split('T')[0]
          : '',
      };
    } else {
      // Reset form for new task
      this.task = null;
      const status = defaultStatus || this.defaultStatus;
      this.formData = {
        title: '',
        description: '',
        status: status,
        category: TaskCategory.OTHER,
        priority: TaskPriority.MEDIUM,
        dueDate: '',
      };
    }
    if (defaultStatus) {
      this.defaultStatus = defaultStatus;
    }
    this.isOpen.set(true);
  }

  formatStatus(status: TaskStatus): string {
    return status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  }

  onSubmit(): void {
    if (!this.formData.title.trim()) return;

    const data: ICreateTask | IUpdateTask = {
      title: this.formData.title.trim(),
      description: this.formData.description.trim() || undefined,
      status: this.formData.status,
      category: this.formData.category,
      priority: this.formData.priority,
      dueDate: this.formData.dueDate || undefined,
    };

    this.save.emit(data);
  }
}
