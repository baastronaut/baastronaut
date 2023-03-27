import { PaginateConfig } from 'nestjs-paginate';
import { Project } from './project.entity';

export const PROJECTS_PAGINATION_CONFIG: PaginateConfig<Project> = {
  sortableColumns: ['id', 'createdAt', 'updatedAt'],
  defaultSortBy: [['id', 'DESC']],
  maxLimit: 20,
  defaultLimit: 20,
};
