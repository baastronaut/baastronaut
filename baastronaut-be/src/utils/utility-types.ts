export type Pageable<T> = {
  data: T[];
  meta: PageInfo;
  links: {
    first?: string;
    previous?: string;
    current: string;
    next?: string;
    last?: string;
  };
};

export type PageInfo = {
  itemsPerPage: number;
  totalItems: number;
  currentPage: number;
  totalPages: number;
};
