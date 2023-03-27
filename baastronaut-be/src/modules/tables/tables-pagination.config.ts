import { PaginateConfig } from 'nestjs-paginate';
import { Table } from './table.entity';

export const TABLES_PAGINATION_CONFIG: PaginateConfig<Table> = {
  sortableColumns: ['id', 'createdAt', 'updatedAt'],
  defaultSortBy: [['id', 'DESC']],
  maxLimit: 10,
  defaultLimit: 10,
};
