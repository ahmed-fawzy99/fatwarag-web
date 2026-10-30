/** One page of a paginated list from the API. */
export type Paginated<T> = {
  data: T[];
  meta: { page: number; perPage: number; total: number; lastPage: number };
};
