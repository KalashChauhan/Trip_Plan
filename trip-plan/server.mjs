import http from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'

try {
  const envFile = await readFile(join(process.cwd(), '.env'), 'utf8')
  for (const line of envFile.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/)
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '')
  }
} catch { /* .env is optional; environment variables also work. */ }
const port = Number(process.env.PORT || 8787)
const apiKey = process.env.OPENAI_API_KEY
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' }
const schema = { type: 'object', additionalProperties: false, properties: { title: { type: 'string' }, summary: { type: 'string' }, days: { type: 'array', items: { type: 'object', additionalProperties: false, properties: { day: { type: 'string' }, theme: { type: 'string' }, activities: { type: 'array', items: { type: 'string' } } }, required: ['day', 'theme', 'activities'] } } }, required: ['title', 'summary', 'days'] }
const send = (res, status, body) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(body)) }
const isItinerary = (value) => value && typeof value.title === 'string' && typeof value.summary === 'string' && Array.isArray(value.days) && value.days.length > 0 && value.days.every((day) => typeof day?.day === 'string' && typeof day.theme === 'string' && Array.isArray(day.activities) && day.activities.length > 0 && day.activities.every((activity) => typeof activity === 'string'))

const demoTrips = {
  varanasi: { title: 'Sacred Varanasi: ghats, history, and flavor', days: [
    { day: 'Day 1', theme: 'The timeless ghats', activities: ['Begin at Assi Ghat and walk the riverside in the morning.', 'Visit Kashi Vishwanath Temple area and the narrow lanes of the old city.', 'Watch the Ganga Aarti ceremony from Dashashwamedh Ghat.'] },
    { day: 'Day 2', theme: 'Heritage and local life', activities: ['Take an early-morning boat ride on the Ganges.', 'Explore Manikarnika Ghat respectfully with a local guide.', 'Try Banarasi breakfast specialties and browse silk shops.'] },
    { day: 'Day 3', theme: 'Sarnath and a slow farewell', activities: ['Visit the Dhamek Stupa and Sarnath Museum.', 'Enjoy a peaceful cafe break back in Varanasi.', 'Return to the ghats for sunset and a final riverside walk.'] },
  ] },
  goa: { title: 'Goa: beach days and Portuguese charm', days: [
    { day: 'Day 1', theme: 'North Goa highlights', activities: ['Start at Candolim or Calangute Beach.', 'Explore Fort Aguada for coastal views.', 'Have a relaxed seafood dinner near the shore.'] },
    { day: 'Day 2', theme: 'Old Goa and Panjim', activities: ['Visit the Basilica of Bom Jesus and Se Cathedral.', 'Walk the colorful Fontainhas Latin Quarter.', 'Take an evening Mandovi River cruise or visit a waterfront cafe.'] },
    { day: 'Day 3', theme: 'Slow coastal escape', activities: ['Spend the morning at Palolem or Agonda Beach.', 'Try a water activity or simply relax by the sea.', 'Catch the sunset from a beach shack before departure.'] },
  ] },
  manali: { title: 'Manali: mountain air and Himalayan views', days: [
    { day: 'Day 1', theme: 'Old Manali at an easy pace', activities: ['Visit Hadimba Devi Temple among the cedar trees.', 'Explore cafes and small shops in Old Manali.', 'End the day with a stroll beside the Beas River.'] },
    { day: 'Day 2', theme: 'High-altitude adventure', activities: ['Drive toward Solang Valley for mountain views.', 'Choose a seasonal activity such as paragliding or a gondola ride.', 'Warm up with local Himachali food in the evening.'] },
    { day: 'Day 3', theme: 'Culture and quiet views', activities: ['Visit Vashisht village and its hot springs.', 'Browse local handicrafts at Mall Road.', 'Watch the last sunset over the valley.'] },
  ] },
  delhi: { title: 'Delhi: old lanes, monuments, and modern energy', days: [
    { day: 'Day 1', theme: 'Old Delhi discoveries', activities: ['Visit Jama Masjid and explore Chandni Chowk.', 'Sample street food with a trusted local guide.', 'See the Red Fort area before an evening rickshaw ride.'] },
    { day: 'Day 2', theme: 'New Delhi landmarks', activities: ['Visit India Gate and the nearby government district.', 'Explore Humayuns Tomb and Lodhi Garden.', 'Have dinner in Khan Market or a nearby neighborhood.'] },
    { day: 'Day 3', theme: 'Art, shopping, and a final view', activities: ['Visit Qutub Minar in the morning.', 'Browse Dilli Haat for crafts and regional food.', 'Choose a rooftop or garden cafe for a final meal.'] },
  ] },
  paris: { title: 'Paris: classics, cafes, and neighborhood charm', days: [
    { day: 'Day 1', theme: 'The Paris essentials', activities: ['See the Eiffel Tower and walk along the Seine.', 'Visit Trocadero for city views.', 'Enjoy a classic French bistro dinner.'] },
    { day: 'Day 2', theme: 'Art and Left Bank streets', activities: ['Spend the morning at the Louvre or Musee dOrsay.', 'Walk through Saint-Germain-des-Pres.', 'Watch sunset from the Luxembourg Gardens area.'] },
    { day: 'Day 3', theme: 'Montmartre magic', activities: ['Explore Sacre-Coeur and the streets of Montmartre.', 'Visit a patisserie and small artists square.', 'End with a relaxed canal-side or cafe evening.'] },
  ] },
  dubai: { title: 'Dubai: skyline, souks, and desert sunsets', days: [
    { day: 'Day 1', theme: 'Downtown Dubai', activities: ['Visit Burj Khalifa and Dubai Mall.', 'See the Dubai Fountain show after sunset.', 'Have dinner with views of the skyline.'] },
    { day: 'Day 2', theme: 'Old Dubai and the creek', activities: ['Cross Dubai Creek in an abra boat.', 'Explore the Gold and Spice Souks.', 'Visit Al Fahidi Historical Neighbourhood.'] },
    { day: 'Day 3', theme: 'Desert and coastline', activities: ['Choose a desert safari or a morning at Jumeirah Beach.', 'Stop by Madinat Jumeirah for photos and shops.', 'Enjoy a final sunset near the water.'] },
  ] },
}

function createDemoItinerary(details) {
  const place = details.destination.trim()
  const key = Object.keys(demoTrips).find((city) => place.toLowerCase().includes(city))
  const itinerary = key ? demoTrips[key] : { title: `A three-day escape to ${place}`, days: [
    { day: 'Day 1', theme: 'Settle in and explore', activities: [`Walk through a central neighborhood in ${place}.`, 'Visit a well-known landmark or local museum.', 'Finish with a popular local dinner.'] },
    { day: 'Day 2', theme: 'A deeper local experience', activities: ['Take a guided food, history, or culture experience.', 'Explore a market, independent shops, or a scenic viewpoint.', 'Choose a relaxed cafe or live-music spot for the evening.'] },
    { day: 'Day 3', theme: 'Make the last day memorable', activities: ['See one quieter neighborhood or nearby nature spot.', 'Pick up local treats or souvenirs at a small market.', 'Leave time for a final meal at your favorite place from the trip.'] },
  ] }
  const interestText = details.interests?.length ? details.interests.join(' and ').toLowerCase() : 'local culture, food, and memorable sights'
  const brief = details.brief?.trim() ? ` Your brief: ${details.brief.trim()}` : ''
  return { ...itinerary, summary: `A flexible ${details.travelers || 'solo'} itinerary for ${details.dates || 'your chosen dates'}, shaped around ${interestText}.${brief}` }
}

async function itinerary(req, res) {
  let raw = ''; for await (const chunk of req) raw += chunk
  if (raw.length > 10_000) return send(res, 413, { error: 'Your trip description is too long. Please keep it under 10,000 characters.' })
  let details; try { details = JSON.parse(raw) } catch { return send(res, 400, { error: 'Invalid request.' }) }
  if (!details.destination?.trim()) return send(res, 400, { error: 'Please enter a destination.' })
  if (!apiKey) return send(res, 200, createDemoItinerary(details))
  const input = `Create a practical and inspiring 3-day itinerary for ${details.destination}. Dates: ${details.dates || 'flexible'}. Travelers: ${details.travelers || 'solo'}. Interests: ${(details.interests || []).join(', ') || 'local culture, food, and highlights'}. User brief: ${details.brief || 'No extra notes.'}. Group activities by area and do not claim bookings were made.`
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)
    const openai = await fetch('https://api.openai.com/v1/responses', { method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: 'gpt-5.6-sol', instructions: 'You are an expert travel planner. Return only the requested JSON.', input, text: { format: { type: 'json_schema', name: 'trip_itinerary', strict: true, schema } } }), signal: controller.signal })
    clearTimeout(timeout)
    const data = await openai.json()
    if (!openai.ok) return send(res, openai.status, { error: data.error?.message || 'OpenAI could not create an itinerary.' })
    let result; try { result = JSON.parse(data.output_text) } catch { return send(res, 502, { error: 'The AI returned malformed data. Please retry.' }) }
    if (!isItinerary(result)) return send(res, 502, { error: 'The AI returned an incomplete itinerary. Please retry.' })
    return send(res, 200, result)
  } catch (error) { return send(res, error?.name === 'AbortError' ? 504 : 500, { error: error?.name === 'AbortError' ? 'The AI request timed out. Please retry.' : 'Unable to create itinerary. Please retry.' }) }
}

http.createServer(async (req, res) => {
  if (req.method === 'POST' && req.url === '/api/itinerary') return itinerary(req, res)
  if (req.method !== 'GET') return send(res, 405, { error: 'Method not allowed.' })
  const requested = req.url === '/' ? '/index.html' : req.url.split('?')[0]
  const safe = normalize(requested).replace(/^([.][.][\\/])+/, '')
  try { const file = await readFile(join(process.cwd(), 'dist', safe)); res.writeHead(200, { 'Content-Type': mime[extname(safe)] || 'application/octet-stream' }); res.end(file) }
  catch { try { const index = await readFile(join(process.cwd(), 'dist', 'index.html')); res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); res.end(index) } catch { send(res, 404, { error: 'Build the client first with npm run build.' }) } }
}).listen(port, () => console.log(`Trip Planner server running at http://localhost:${port}`))
