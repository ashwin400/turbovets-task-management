import { TaskStatus, TaskCategory, TaskPriority } from '../enums/task-status.enum';
import { IUser } from './user.interface';
import { IOrganization } from './organization.interface';

export interface ITask {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  category: TaskCategory;
  priority: TaskPriority;
  order: number; // For drag-and-drop ordering
  dueDate?: Date | null;
  createdById: string;
  createdBy?: IUser;
  assigneeId?: string | null;
  assignee?: IUser | null;
  organizationId: string;
  organization?: IOrganization;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateTask {
  title: string;
  description?: string;
  status?: TaskStatus;
  category?: TaskCategory;
  priority?: TaskPriority;
  dueDate?: Date | string | null;
  assigneeId?: string | null;
}

export interface IUpdateTask {
  title?: string;
  description?: string;
  status?: TaskStatus;
  category?: TaskCategory;
  priority?: TaskPriority;
  order?: number;
  dueDate?: Date | string | null;
  assigneeId?: string | null;
}

export interface IReorderTask {
  taskId: string;
  newOrder: number;
  newStatus?: TaskStatus;
}

export interface ITaskFilters {
  status?: TaskStatus;
  category?: TaskCategory;
  priority?: TaskPriority;
  assigneeId?: string;
  search?: string;
}
