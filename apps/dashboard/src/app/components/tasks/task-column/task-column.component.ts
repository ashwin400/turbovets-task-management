import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ITask, TaskStatus } from '@arao-5db7e763-d567-4c90-b836-3ebf57b9cc25/data';
import { TaskCardComponent } from '../task-card/task-card.component';

@Component({
  selector: 'app-task-column',
  standalone: true,
  imports: [CommonModule, TaskCardComponent],
  template: `
    <div
      class="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 min-h-96 transition-colors duration-200"
      [class.ring-2]="isDropTarget"
      [class.ring-indigo-400]="isDropTarget"
      (dragover)="onDragOver($event)"
      (dragleave)="onDragLeave($event)"
      (drop)="onDrop($event)"
    >
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
          {{ title }}
          <span class="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs px-2 py-1 rounded-full">
            {{ tasks.length }}
          </span>
        </h3>
        <button
          (click)="addTask.emit(status)"
          class="p-1 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          title="Add task"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
          </svg>
        </button>
      </div>

      <div class="space-y-2">
        @for (task of tasks; track task.id) {
          <app-task-card
            [task]="task"
            (edit)="editTask.emit($event)"
            (delete)="deleteTask.emit($event)"
            (dragStart)="onTaskDragStart($event)"
            (dragEnd)="onTaskDragEnd()"
          />
        }

        @if (tasks.length === 0) {
          <div class="text-center py-8 text-gray-400 dark:text-gray-500">
            <p>No tasks</p>
          </div>
        }
      </div>
    </div>
  `,
})
export class TaskColumnComponent {
  @Input({ required: true }) title!: string;
  @Input({ required: true }) status!: TaskStatus;
  @Input() tasks: ITask[] = [];

  @Output() addTask = new EventEmitter<TaskStatus>();
  @Output() editTask = new EventEmitter<ITask>();
  @Output() deleteTask = new EventEmitter<ITask>();
  @Output() taskDropped = new EventEmitter<{ taskId: string; newStatus: TaskStatus }>();

  isDropTarget = false;

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDropTarget = true;
  }

  onDragLeave(event: DragEvent): void {
    this.isDropTarget = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDropTarget = false;

    const taskId = event.dataTransfer?.getData('text/plain');
    if (taskId) {
      this.taskDropped.emit({ taskId, newStatus: this.status });
    }
  }

  onTaskDragStart(task: ITask): void {
    // Can add visual feedback here
  }

  onTaskDragEnd(): void {
    this.isDropTarget = false;
  }
}
