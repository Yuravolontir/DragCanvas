import { useNode } from '@craftjs/core';

/**
 * Read a list prop as records, and write it back as records.
 *
 * Nine elements hold a list of small records - team members, pricing plans,
 * logos - and every editor for them needs the same six operations. They are
 * written once here so nine hand-rolled versions cannot drift apart.
 *
 * The write is also what converts a legacy node: whatever shape the list was
 * stored in, the first edit here replaces it with the object form the reader
 * prefers, so a node stops being legacy the moment somebody touches it.
 *
 * @param {string} propKey            the prop holding the list
 * @param {(props: object) => object[]} read  turns the stored prop into records
 * @param {() => object} blank        a fresh, empty record
 */
export const useRowProp = (propKey, read, blank) => {
  const {
    props,
    actions: { setProp },
  } = useNode((node) => ({ props: node.data.props }));

  const rows = read(props || {});

  /** Store a whole new list, replacing whatever shape was there before. */
  const write = (nextRows) => setProp((draft) => {
    draft[propKey] = nextRows;
  });

  const update = (index, key, value) => write(
    rows.map((row, position) => (position === index ? { ...row, [key]: value } : row)),
  );

  const replace = (index, row) => write(
    rows.map((existing, position) => (position === index ? row : existing)),
  );

  const add = () => write([...rows, blank()]);

  const remove = (index) => write(rows.filter((_row, position) => position !== index));

  /** Swap a record with its neighbour. Direction is -1 for up, 1 for down. */
  const move = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= rows.length) return;

    const nextRows = [...rows];
    [nextRows[index], nextRows[target]] = [nextRows[target], nextRows[index]];
    write(nextRows);
  };

  return { props: props || {}, rows, setProp, update, replace, add, remove, move, write };
};
