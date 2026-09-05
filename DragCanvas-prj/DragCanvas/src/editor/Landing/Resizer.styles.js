import styled from 'styled-components';

/**
 * Where the top handle sits.
 *
 * A free element gets a handle in each corner. An element that fills its parent
 * can only be resized along one axis, so it gets two handles instead of four,
 * centred on the two edges that can still move.
 */
function topHandle({ $bound }) {
  if ($bound === 'row') return 'left: 50%; top: -5px; transform: translateX(-50%);';
  if ($bound) return 'top: 50%; left: -5px; transform: translateY(-50%);';
  return 'left: -5px; top: -5px;';
}

/** The mirror image of topHandle, at the other end of the element. */
function bottomHandle({ $bound }) {
  if ($bound === 'row') return 'left: 50%; bottom: -5px; transform: translateX(-50%);';
  if ($bound) return 'bottom: 50%; left: -5px; transform: translateY(-50%);';
  return 'left: -5px; bottom: -5px;';
}

/** The corner dots drawn over a selected element. */
export const Indicators = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;

  span {
    position: absolute;
    display: block;
    width: 10px;
    height: 10px;
    border: 2px solid #0060ac;
    border-radius: 100%;
    background: #fff;
    box-shadow: 0 0 12px -1px rgba(0, 0, 0, 0.25);
    z-index: 99999;
    pointer-events: none;

    &:nth-child(1) {
      ${topHandle}
    }

    /* The two right-hand dots exist only when all four corners can move. */
    &:nth-child(2) {
      right: -5px;
      top: -5px;
      display: ${({ $bound }) => ($bound ? 'none' : 'block')};
    }

    &:nth-child(3) {
      ${bottomHandle}
    }

    &:nth-child(4) {
      bottom: -5px;
      right: -5px;
      display: ${({ $bound }) => ($bound ? 'none' : 'block')};
    }
  }
`;
