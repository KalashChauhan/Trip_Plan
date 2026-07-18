import { useState } from 'react'
import { CalendarDays, Compass, MapPin, Plane, Plus, Search, Sparkles, Users } from 'lucide-react'
import './index.css'

const trips = [{ city: 'Kyoto, Japan', date: 'Oct 12 - 18, 2026', days: '7 days', color: 'orange', emoji: 'T' }, { city: 'Amalfi, Italy', date: 'May 02 - 08, 2027', days: '7 days', color: 'blue', emoji: 'A' }]
const tripStyles = ['Food & culture', 'Nature & adventure', 'Relaxation', 'City break']

function App() {
  const [destination, setDestination] = useState('')
  const [travelDate, setTravelDate] = useState('')
  const [travelers, setTravelers] = useState('Just me')
  const [interests, setInterests] = useState([])
  const [itinerary, setItinerary] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function planTrip(event) {
    event.preventDefault(); setLoading(true); setError(''); setItinerary(null)
    try {
      const response = await fetch('/api/itinerary', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ destination, dates: travelDate || 'Flexible dates', travelers, interests }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to create an itinerary.')
      setItinerary(data)
    } catch (requestError) { setError(requestError.message) } finally { setLoading(false) }
  }
  const toggleInterest = (style) => setInterests((current) => current.includes(style) ? current.filter((item) => item !== style) : [...current, style])

  return <main>
    <nav className="nav shell"><a className="brand" href="#top"><span><Compass size={20} /></span>Roamly</a><div className="nav-links"><a href="#planner">Plan a trip</a><a href="#trips">My trips</a><a href="#inspiration">Inspiration</a></div><button className="profile" aria-label="Open profile">KC</button></nav>
    <section className="hero shell" id="top"><div className="eyebrow"><Sparkles size={15} /> Your intelligent travel companion</div><h1>Travel farther.<br /><em>Plan smarter.</em></h1><p>Tell us where you want to go and we will turn your ideas into a beautiful, personalized itinerary in seconds.</p><a className="primary" href="#planner">Start planning <span>-&gt;</span></a><div className="hero-stats"><span><b>10k+</b> trips planned</span><i></i><span><b>4.9/5</b> traveler rating</span><i></i><span><b>190+</b> countries</span></div></section>
    <section className="planner-wrap" id="planner"><div className="planner shell"><div className="section-heading"><span className="mini-icon"><Sparkles size={19}/></span><div><h2>Where would you like to go?</h2><p>A few details are all we need to build your perfect trip.</p></div></div>
      <form onSubmit={planTrip}>
        <label>Destination<div className="field"><MapPin size={19}/><input value={destination} onChange={(event) => setDestination(event.target.value)} placeholder="City, country, or a place on your list" required /><Search size={18}/></div></label>
        <div className="field-grid">
          <label>When are you going?<div className="field"><CalendarDays size={18}/><input type="date" value={travelDate} onChange={(event) => setTravelDate(event.target.value)} aria-label="Travel date" /></div></label>
          <label>Who is coming along?<div className="field"><Users size={18}/><select value={travelers} onChange={(event) => setTravelers(event.target.value)} aria-label="Number of travelers"><option>Just me</option><option>2 travelers</option><option>3-4 travelers</option><option>5+ travelers</option></select></div></label>
        </div>
        <label>What kind of trip are you dreaming of? <small>optional</small><div className="chips">{tripStyles.map((style) => <button className={interests.includes(style) ? 'selected' : ''} type="button" key={style} onClick={() => toggleInterest(style)}>{style}</button>)}</div></label>
        <button className="generate" type="submit" disabled={loading}><Sparkles size={18}/>{loading ? 'Creating your trip...' : 'Generate my itinerary'}</button>
      </form>
      {error && <div className="error-message">{error}</div>}
      {itinerary && <section className="itinerary"><div className="itinerary-title"><Sparkles size={18}/><div><h3>{itinerary.title}</h3><p>{itinerary.summary}</p></div></div>{itinerary.days.map((day) => <article key={day.day}><b>{day.day}</b><div><strong>{day.theme}</strong>{day.activities.map((activity) => <p key={activity}>{activity}</p>)}</div></article>)}</section>}
    </div></section>
    <section className="saved shell" id="trips"><div className="saved-head"><div><p className="overline">YOUR JOURNEYS</p><h2>Saved trips</h2></div><button className="outline"><Plus size={17}/> New trip</button></div><div className="trip-grid">{trips.map((trip) => <article className={'trip-card ' + trip.color} key={trip.city}><div className="trip-art"><span>{trip.emoji}</span><div className="card-tags"><b>{trip.days}</b><b>Saved</b></div></div><div className="trip-info"><p>{trip.date}</p><h3>{trip.city}</h3><button>View itinerary <span>-&gt;</span></button></div></article>)}<button className="new-card"><span><Plane size={24}/></span><strong>Plan a new adventure</strong><small>Anywhere you can imagine</small></button></div></section>
    <section className="inspiration shell" id="inspiration"><p className="overline">NEED A SPARK?</p><h2>Go somewhere unforgettable</h2><div className="inspo-row"><span>Island escapes</span><span>Hidden gems</span><span>Weekend getaways</span></div></section>
  </main>
}
export default App
