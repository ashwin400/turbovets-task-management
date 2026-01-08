export interface IOrganization {
  id: string;
  name: string;
  description?: string;
  parentId?: string | null; // For 2-level hierarchy
  parent?: IOrganization | null;
  children?: IOrganization[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateOrganization {
  name: string;
  description?: string;
  parentId?: string | null;
}

export interface IUpdateOrganization {
  name?: string;
  description?: string;
}
