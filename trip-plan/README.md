# Roamly AI Trip Planner

Roamly turns a free-form trip description into a structured, interactive three-day itinerary. Instead of displaying raw AI text, it renders validated day and stop data that users can expand, reorder, and remove.

## Features

- Free-form trip brief plus destination, date, travelers, and style controls
- Structured itinerary JSON (`title`, `summary`, `days`, and `activities`)
- Expand/collapse itinerary days
- Reorder or remove individual stops without regenerating the whole plan
- Loading, empty, error, timeout, and retry states
- Request cancellation prevents an older response from overwriting a newer request
- Responsive black/pink glassmorphism UI
- Local demo mode with detailed plans for Varanasi, Goa, Manali, Delhi, Paris, and Dubai

## Tech stack

- React with hooks and functional components
- Vite
- Node.js HTTP backend
- OpenAI Responses API with JSON Schema structured output (optional)
- Lucide React icons

## Run locally

Install packages:

```bash
npm install
```

Start the backend in one terminal:

```bash
npm run server
```

Start the React app in another terminal:

```bash
npm start
```

Open the Vite URL shown in the terminal.

## Demo mode

No API key is required for a working demo. Leave `OPENAI_API_KEY` unset and enter a destination. The app returns a local structured itinerary; known destinations receive richer curated content.

## Live AI setup

Create a `.env` file beside `package.json`:

```env
OPENAI_API_KEY=your_api_key_here
PORT=8787
```

Restart `npm run server`. The server calls the model, requests JSON matching a schema, parses it, and validates the response before returning it to the browser. The API key never reaches the frontend.

## AI usage and reliability

AI was used during development for implementation assistance, UI iteration, and copy suggestions. The application does not trust model output by default:

- The API is asked for schema-constrained JSON.
- The backend rejects malformed JSON and incorrect or incomplete shapes.
- The frontend validates returned data again before rendering.
- Both frontend and backend use timeouts.
- Starting a new request aborts the previous request, preventing stale results.
- Failures display a retry action instead of crashing the UI.

## Known limitations

- Demo itineraries are curated local data, not real-time travel information.
- Live AI generation needs an API key with available usage credit.
- Stops can be reordered or removed, but edits are not persisted after refresh.
- This app does not include maps, bookings, live weather, authentication, or a database.

## Time spent

Approximately 8 hours: project setup, responsive UI, backend, structured data flow, interactive itinerary controls, failure handling, testing, and documentation.

## Next steps

- Save itineraries in a database
- Add manual stop editing and new-stop creation
- Add map, weather, and booking integrations
- Add itinerary refinement prompts that update an existing plan
