import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ITask, TaskPriority, TaskCategory } from '@arao-5db7e763-d567-4c90-b836-3ebf57b9cc25/data';

@Component({
  selector: 'app-task-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="bg-white dark:bg-gray-700 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 p-4 mb-2 cursor-move hover:shadow-md transition-all duration-200"
      [class.opacity-50]="isDragging"
      draggable="true"
      (dragstart)="onDragStart($event)"
      (dragend)="onDragEnd($event)"
    >
      <div class="flex justify-between items-start mb-2">
        <h4 class="font-medium text-gray-900 dark:text-white flex-1">{{ task.title }}</h4>
        <div class="flex gap-1 ml-2">
          <button
            (click)="edit.emit(task)"
            class="p-1 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            title="Edit (E)"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
            </svg>
          </button>
          <button
            (click)="delete.emit(task)"
            class="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            title="Delete (D)"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
          </button>
        </div>
      </div>

      @if (task.description) {
        <p class="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">{{ task.description }}</p>
      }

      <div class="flex flex-wrap gap-2">
        <span [class]="getPriorityClass(task.priority)" class="px-2 py-1 text-xs rounded-full">
          {{ task.priority }}
        </span>
        <span [class]="getCategoryClass(task.category)" class="px-2 py-1 text-xs rounded-full">
          {{ task.category }}
        </span>
        @if (task.dueDate) {
          <span
            class="px-2 py-1 text-xs rounded-full"
            [class]="isOverdue(task.dueDate) ? 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300' : 'bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-200'"
          >
            {{ formatDate(task.dueDate) }}
            @if (isOverdue(task.dueDate)) {
              (Overdue)
            }
          </span>
        }
      </div>
    </div>
  `,
})
export class TaskCardComponent {
  @Input({ required: true }) task!: ITask;
  @Output() edit = new EventEmitter<ITask>();
  @Output() delete = new EventEmitter<ITask>();
  @Output() dragStart = new EventEmitter<ITask>();
  @Output() dragEnd = new EventEmitter<void>();

  isDragging = false;

  onDragStart(event: DragEvent): void {
    this.isDragging = true;
    event.dataTransfer?.setData('text/plain', this.task.id);
    this.dragStart.emit(this.task);
  }

  onDragEnd(event: DragEvent): void {
    this.isDragging = false;
    this.dragEnd.emit();
  }

  getPriorityClass(priority: TaskPriority): string {
    const classes: Record<TaskPriority, string> = {
      [TaskPriority.HIGH]: 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200',
      [TaskPriority.MEDIUM]: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200',
      [TaskPriority.LOW]: 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200',
    };
    return classes[priority];
  }

  getCategoryClass(category: TaskCategory): string {
    const classes: Record<TaskCategory, string> = {
      [TaskCategory.WORK]: 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200',
      [TaskCategory.PERSONAL]: 'bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200',
      [TaskCategory.URGENT]: 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200',
      [TaskCategory.OTHER]: 'bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-200',
    };
    return classes[category];
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString();
  }

  isOverdue(date: Date | string): boolean {
    const dueDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dueDate < today;
  }
}
