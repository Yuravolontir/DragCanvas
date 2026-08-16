/**
 * The prompts behind what the scene is building.
 *
 * Two jobs at once. It answers "what counts as a good prompt?" with five
 * concrete ones instead of instructions, and it hands over the remote control -
 * a hero that only plays at you is a video, one you can steer is a product.
 *
 * Picking a chip also fills the prompt box, because the chip is the sentence
 * that produced what is on screen. Someone who likes what they see is then one
 * click from building their own version of it rather than retyping.
 */
export default function Examples({ layouts, activeIndex, onPick }) {
  return (
    <div className="home-examples">
      <span className="home-examples__label">Try one</span>

      <ul className="home-examples__list">
        {layouts.map((layout, index) => (
          <li key={layout.id}>
            <button
              type="button"
              className={`home-examples__chip${index === activeIndex ? ' home-examples__chip--active' : ''}`}
              // The list is a set of alternatives with one showing, which is what
              // aria-pressed says; the chips are not links and not tabs.
              aria-pressed={index === activeIndex}
              onClick={() => onPick(index, layout.prompt)}
            >
              {layout.prompt}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
