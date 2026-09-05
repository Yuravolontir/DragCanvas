import API_URL, { getToken } from '../api.js';
import { collectImageTasks } from './imagePrompts.js';

/**
 * How many pictures one generation is allowed to buy.
 *
 * `collectImageTasks` walks every page, so a four-page site with five pictures
 * a page would order twenty images from one click. Six covers what a visitor
 * actually sees before deciding to stay - the hero and the first row - and the
 * rest keep their seeded placeholder, which is a real photograph rather than a
 * broken image.
 */
const IMAGE_BUDGET = 6;

/** Pictures ordered at the same time, to keep provider pressure modest. */
const IMAGES_PER_BATCH = 3;

/**
 * Ask our own server for one generated image.
 *
 * The provider key lives on the server: a key in an `import.meta.env` variable
 * would be compiled into the bundle every visitor downloads. The server stores
 * the result in Cloudinary and answers with a permanent HTTPS URL.
 *
 * Returns `null` when the image could not be drawn, which means "leave the
 * placeholder" - so one failed picture never costs the whole page.
 */
async function generateImage(imagePrompt) {
  try {
    const response = await fetch(`${API_URL}/api/ai/image`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${getToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt: imagePrompt }),
    });

    if (!response.ok) return null;

    const payload = await response.json();
    return payload?.data?.url || null;
  } catch (error) {
    console.error('Image generation error:', error);
    return null;
  }
}

/** Every distinct prompt in the layout, cut down to what the budget allows. */
function promptsWithinBudget(imageTasks) {
  const allPrompts = [...new Set(imageTasks.map((task) => task.prompt))];
  const affordablePrompts = allPrompts.slice(0, IMAGE_BUDGET);

  if (allPrompts.length > affordablePrompts.length) {
    console.log(
      `[AI] ${allPrompts.length} pictures asked for, generating the first ${affordablePrompts.length}`,
    );
  }

  return affordablePrompts;
}

/**
 * Replace every placeholder picture in a generated layout with a real one.
 *
 * This covers ordinary images, section backgrounds, legacy carousels and the
 * current slides-array carousel format - `collectImageTasks` knows where they
 * all live and hands back a list of "write the URL into this property".
 *
 * @param {object} layout                  pages produced by the AI
 * @param {object} options                 passed straight to collectImageTasks
 * @param {(progress: {remaining: number, total: number}) => void} onProgress
 */
export async function replacePlaceholderImages(layout, options, onProgress) {
  const imageTasks = collectImageTasks(layout, options);
  if (imageTasks.length === 0) return;

  const prompts = promptsWithinBudget(imageTasks);
  const total = prompts.length;
  let remaining = total;
  onProgress({ remaining, total });

  for (let index = 0; index < prompts.length; index += IMAGES_PER_BATCH) {
    const batch = prompts.slice(index, index + IMAGES_PER_BATCH);

    await Promise.all(batch.map(async (imagePrompt) => {
      const url = await generateImage(imagePrompt);

      remaining -= 1;
      onProgress({ remaining, total });
      if (!url) return;

      // One prompt can be shared by several pictures, so every task asking for
      // this prompt gets the same finished image.
      imageTasks
        .filter((task) => task.prompt === imagePrompt)
        .forEach((task) => { task.target[task.key] = url; });
    }));
  }
}
