// Tables that collapse into stacked "label: value" cards on phones.
// Give each <td> a data-label; it is shown in place of the hidden header row.
export const stackedHead = "hidden sm:table-header-group";
export const stackedRow = "block py-2 sm:table-row sm:py-0";
export const stackedCell =
  "flex justify-between items-center gap-4 py-1 max-sm:text-right sm:table-cell " +
  "before:content-[attr(data-label)] before:text-left before:text-[10px] before:font-bold before:uppercase before:text-slate-500 sm:before:content-none";
