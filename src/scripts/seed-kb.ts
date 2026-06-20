/**
 * KB Seed Script — seeds the Cordelia knowledge base into pgvector.
 * Run: npx ts-node -r tsconfig-paths/register src/scripts/seed-kb.ts
 *
 * Idempotent: re-running only re-embeds documents whose content (or the
 * embedding/chunking version) changed. Unchanged documents are skipped with zero
 * embedding cost. Documents removed from KB_DOCS are deleted from the DB.
 *
 * Adding a new document: append a SeedDoc entry below with a stable, unique
 * `sourceKey` and Markdown `content` using #/## headings (the chunker splits on
 * those). Never change a sourceKey once seeded — that is treated as delete+create.
 */
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.join(__dirname, '../../.env') });

import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from '../app.module';
import { KbService } from '../module/retrieval/kb.service';
import { EmbeddingsService } from '../module/retrieval/embeddings.service';
import { chunkDocument } from '../module/ingestion/chunk-document';
import { EMBEDDING_VERSION, CHUNKING_VERSION, computeContentHash } from '../module/ingestion/versions';

// ── Document model ──────────────────────────────────────────────────────────

type SeedDoc = {
  sourceKey: string; // STABLE unique id — never change after first seed
  title: string;
  source: 'faq' | 'policy' | 'cms' | 'call_mined';
  locale: string;
  metadata: {
    topic: string;
    ship?: 'empress' | 'sky';
    entityType?: string;
    priority?: 'low' | 'medium' | 'high' | 'critical';
    tags?: string[];
  };
  content: string; // Markdown body using #/## headings
};

// ── Knowledge Base ────────────────────────────────────────────────────────────

const KB_DOCS: SeedDoc[] = [
  {
    sourceKey: 'about',
    title: 'About Cordelia Cruises',
    source: 'cms',
    locale: 'en',
    metadata: { topic: 'company', entityType: 'overview', priority: 'medium', tags: ['about', 'company', 'overview'] },
    content: `# About Cordelia Cruises
- Cordelia Cruises by Waterways Leisure Tourism Limited is India's premium cruise line.
- Meaning of Cordelia: "heart" or "daughter of the sea(-god)", Jewel of the Sea.
- CEO: Mr. Jurgen Bailom.
- Website: cordeliacruises.com.
- Two ships: The Empress and The Sky.`,
  },
  {
    sourceKey: 'support_contact',
    title: 'Customer Support & Booking Contact',
    source: 'cms',
    locale: 'en',
    metadata: { topic: 'support', entityType: 'contact', priority: 'critical', tags: ['phone', 'contact', 'support', 'email', 'booking'] },
    content: `# Customer Support & Booking Contact
- Booking phone: 022-68811111
- Customer support phone: 022-68811190
- Email: info@cordeliacruises.com
- Website: cordeliacruises.com`,
  },
  {
    sourceKey: 'empress',
    title: 'The Empress — Ship Overview',
    source: 'cms',
    locale: 'en',
    metadata: { topic: 'ship', ship: 'empress', entityType: 'overview', priority: 'high', tags: ['empress', 'ship', 'decks', 'capacity'] },
    content: `# The Empress — Ship Overview
- Total Rooms: 796 (Interior: 311, Ocean View: 416, Mini Suite: 63, Suite: 5, Chairman's Suite: 1).
- Load Factor: 1750 Guests.
- 11 Decks, 6 Elevators, 2 Embarkation Points.
- 5 Bars: The Dome, Chairman's Club, Connexions, Pool Bar, Casino.
- 3 Restaurants: Food Court, Starlight, Chopstix.
- 2 Swimming Pools (1 adult, 1 kids), 3 Jacuzzis.
- Medical Facility on Deck 2.
- Marquee Theatre (840 guests), Fitness Area, Shopping Arcade, Video Arcade, Cordelia Academy (kids).
- Home Port West: Mumbai. Home Port East: Chennai.
- 4 Accessible Rooms (Deck 4).`,
  },
  {
    sourceKey: 'sky',
    title: 'Cordelia Sky — Ship Overview',
    source: 'cms',
    locale: 'en',
    metadata: { topic: 'ship', ship: 'sky', entityType: 'overview', priority: 'high', tags: ['sky', 'ship', 'decks', 'capacity'] },
    content: `# Cordelia Sky — Ship Overview
- Originally Norwegian Sky, launched 1999, refurbished 2024.
- Gross Tonnage: 77,104 GT. Length: 258m (848 feet). Max Beam: 32m. Draft: 26 feet.
- Diesel Electric engines, cruise speed 22 knots.
- Total Cabins: 1003 (Interior: 429, Ocean View: 313, Mini Suite: 245, Suite: 11, Chairman's Suite: 4).
- Guest Capacity: 2004 (double occupancy), 2404 (max). Crew: 899.
- 12 Decks, 8 Elevators.
- 8 Bars & Lounges: SKY Bar, The Great Sushi Bar, Topsiders Bar & Grill, The Local Bar & Grill, Dome, Atrium Bar, Connextions Lounge, Chairman's Club, Just Beans, Casino Bar, The Great Outdoor Bar.
- 10 Restaurants: Salt n Smoke ($$), La Cucina ($$), Garden Cafe & Kid's Cafe (complimentary), Great Outdoor Cafe (complimentary), Spice Route ($$), The Crossings Restaurant (complimentary), Palace Restaurant (complimentary), The Great Sushi Bar ($$), Topsiders Bar & Grill, The Local Bar & Grill ($$).
- 2 Swimming Pools (Deck 11, 7.2ft depth), 5 Hot Tubs (Deck 11 & 12).
- Pickleball & Cricket Court (Deck 12).
- Medical Facility on Deck 3.
- Marquee Theater (930 seats), Meeting Rooms (3), Library, Shopping, Spa & Salon, Fitness Center.
- Embarkation Deck: 5.
- 16 Lifeboats (capacity 2400), 74 Life Rafts (capacity 1600).
- 7 Wheelchair accessible cabins, 46 Hearing impaired cabins, 4 Connected cabins.`,
  },
  {
    sourceKey: 'empress_cabins',
    title: 'Empress — Cabin Details',
    source: 'cms',
    locale: 'en',
    metadata: { topic: 'cabins', ship: 'empress', entityType: 'cabin', priority: 'high', tags: ['empress', 'cabins', 'rooms', 'suites'] },
    content: `# Empress — Cabin Details
- Interior Standard: 117 sq ft, Deck 3-4, no view, 4 accessible cabins (4605, 4607). 2x500ml water/person/day.
- Interior Upper: 117 sq ft, Deck 7, no view, hairdryer included. 3x500ml water/person/day.
- Interior Premier: 117 sq ft, Deck 8-9, no view, hairdryer, reserved section in Starlight Restaurant. 4x500ml water/person/day.
- Ocean View Standard: 142-144 sq ft, Deck 3-4 (+ obstructed on Deck 7-8), window or porthole. 2x500ml water/person/day.
- Ocean View Upper: 142-144 sq ft, Deck 7-8, full-size window, hairdryer. 3x500ml water/person/day.
- Ocean View Premier: 142-144 sq ft, Deck 9, full-size window, hairdryer, reserved Starlight section. 4x500ml water/person/day. Exclusive Dome access 10 AM-5 PM.
- Mini Suite: 258 sq ft + 25 sq ft balcony, Deck 7-9, triple occupancy, private balcony.
- Suite: 336 sq ft + 222 sq ft balcony, Deck 7-9, triple occupancy.
- Chairman's Suite: Deck 8, 1 cabin, triple occupancy, 222 sq ft balcony.
- Interconnecting rooms available in Interior and Ocean View categories.
- All cabins include: two twin beds converting to queen, private bathroom, vanity area, TV, telephone, locker.`,
  },
  {
    sourceKey: 'sky_cabins',
    title: 'Cordelia Sky — Cabin Details',
    source: 'cms',
    locale: 'en',
    metadata: { topic: 'cabins', ship: 'sky', entityType: 'cabin', priority: 'high', tags: ['sky', 'cabins', 'rooms', 'suites'] },
    content: `# Cordelia Sky — Cabin Details
- Chairman's Suite (Owner Suite): 4 cabins, max 5 occupancy, 829 sq ft (485 + 344 balcony).
- Suite (Aft Facing Penthouse): 6 cabins, max 4 occupancy, 581 sq ft (388 + 193 balcony).
- Suite (Forward-Facing Penthouse): 4 cabins, max 5 occupancy, 560 sq ft (324 + 236 balcony).
- Suite (Penthouse with Balcony): 1 cabin, max 3 occupancy, 398 sq ft (312 + 86 balcony).
- Mini Suite (Aft Facing Balcony): 15 cabins, max 3 occupancy, 215 sq ft (151 + 64 balcony).
- Mini Suite (Balcony): 218 cabins, max 3 occupancy, 194 sq ft (151 + 43 balcony).
- Mini Suite (Solo Balcony): 12 cabins, 1 person, 194 sq ft.
- Ocean View (Family): 40 cabins, max 5 occupancy, 140 sq ft.
- Ocean View: 50 cabins, max 3 occupancy, 140 sq ft.
- Ocean View (Large Porthole): 156 cabins, max 3 occupancy, 140 sq ft.
- Ocean View (Picture Window): 48 cabins, max 3 occupancy, 140 sq ft.
- Ocean View (Solo): 19 cabins, 1 person, 140 sq ft.
- Interior (Family): 73 cabins, max 4 occupancy, 140 sq ft.
- Interior: 327 cabins, max 3 occupancy, 140 sq ft.
- Interior (Solo): 29 cabins, 1 person, 118 sq ft.`,
  },
  {
    sourceKey: 'sky_restaurants',
    title: 'Cordelia Sky — Restaurants & Bars',
    source: 'cms',
    locale: 'en',
    metadata: { topic: 'dining', ship: 'sky', entityType: 'restaurant', priority: 'medium', tags: ['sky', 'restaurants', 'bars', 'dining', 'timings'] },
    content: `# Cordelia Sky — Restaurants & Bars
- Palace Restaurant (Deck 5, complimentary): 536 seats, traditional Veg & Jain buffet. Breakfast 07:30-10:30, Lunch 12:00-14:30, Dinner 17:30-21:30.
- The Crossings Restaurant (Deck 5, complimentary): 568 seats, traditional buffet. Same timings as Palace.
- Spice Route (Deck 5, paid): 84 seats, elevated Indian cuisine. Dinner 17:30-22:30.
- Garden Cafe & Kid's Cafe (Deck 11, complimentary): 210 seats, global flavors + kids cafe. Early Breakfast 05:30-07:00, Breakfast 07:30-10:30, Lunch 12:00-14:30, Dinner 17:30-21:30.
- Great Outdoor Cafe (Deck 11, complimentary): 289 seats, open-air. Breakfast 07:30-00:00, late-lunch/snacks 14:30-17:30, Night snacks 21:30-02:00.
- La Cucina (Deck 11, paid): 96 seats, Italian. Lunch 12:00-14:30, Dinner 17:30-21:30.
- Salt n Smoke (Deck 12, paid): BBQ & grilled specialties.
- The Great Sushi Bar (Deck 12, paid): 68 seats, sushi & Asian.
- Topsiders Bar & Grill (Deck 11): casual grill.
- The Local Bar & Grill (Deck 11, paid): local flavors.
- Just Beans (Deck 7, paid): 46 seats, coffee shop. 06:00 AM-23:00.
- Chairman's Club (Deck 6, paid): 57 seats, specialty cocktails + live music. 11 AM till late.
- Connextions Lounge (Deck 6, paid): 183 seats, vibrant social lounge. 11 AM till late.
- Dome (Deck 11): 223 seats, ocean views.
- SKY Bar (Deck 12): 60 seats, ocean views.
- Atrium Bar (Deck 7, paid): 21 seats, lobby bar with panoramic windows + live piano.`,
  },
  {
    sourceKey: 'empress_restaurants',
    title: 'Empress — Restaurants & Venues',
    source: 'cms',
    locale: 'en',
    metadata: { topic: 'dining', ship: 'empress', entityType: 'restaurant', priority: 'medium', tags: ['empress', 'restaurants', 'venues', 'dining', 'timings'] },
    content: `# Empress — Restaurants & Venues
- Marquee Theatre (Deck 5-6): 840 guests. Shows: Balle Balle, Indian Cinemagic, Magic Show, Romance in Bollywood, Burlesque.
- Connexions (Deck 6): 280 inside + 60 promenade. Bar with dance floor, stage, piano. Coffee shop at entrance.
- Dome (Deck 10): 110 guests. Ocean views, social space for parties.
- Pool Deck (Deck 10): 200-400 guests. Smoking zone, exhibitions, parties (weather permitting).
- Starlight (Deck 4-5): 412 (Deck 4) + 292 (Deck 5). Freestyle seating, fixed tables. Deck 5 serves exclusively Jain & vegetarian. Breakfast 08:00-10:00, Lunch 13:00-15:00, Dinner 20:00-22:00.
- Food Court (Deck 10): 563 seats (443 inside, 120 outside). Veg/Non-Veg/Jain. Breakfast 07:30-10:30, Lunch 12:30-15:30, Hi Tea 16:30-18:00, Dinner 19:30-22:30, Midnight snacks 00:30-01:30.
- Chopstix (Deck 5): 74 guests. Ala Carte. Regular breakfast & lunch for Chairman's Suite and Suite guests. Dinner 20:00-22:30.
- Chef's Table (Deck 5): 6-8 guests. Special interactive menu, perfect for celebrations. Dinner 20:00-22:30.
- Casino (Deck 6): 400 guests. 21 gaming tables. Open during sea sailing, closed at port.`,
  },
  {
    sourceKey: 'entertainment',
    title: 'Entertainment & Shows (Empress)',
    source: 'cms',
    locale: 'en',
    metadata: { topic: 'entertainment', ship: 'empress', entityType: 'activity', priority: 'medium', tags: ['empress', 'shows', 'entertainment', 'activities'] },
    content: `# Entertainment & Shows (Empress)
- Balle Balle: Colorful Indian wedding spectacular. Complimentary (all itineraries).
- India Cinemagic: Best of Indian cinema musical spectacle. Complimentary (all itineraries).
- Romance in Bollywood: Bollywood romance & love music show. Complimentary (5-night itinerary only).
- Burlesque The Bollywood Way: Western burlesque with Bollywood energy. $10 + 18% GST (all itineraries).
- Magician's Cut: Grand illusionist Tejas Malode. Complimentary (5-night itinerary only).
- Magical Evening: Advanced magic by Tejas (guests 9+ years only). $10 + 18% GST.
- Razmataz: Tribute to South Indian legends. Complimentary.

## Activities
- Bridge Tour: $15 + 18% GST.
- Rock Wall Climbing: $2 + 18% GST.
- Cordelia Academy (Kids): Arts & crafts, scavenger hunts, jewellery making, karaoke. 1 hour/day complimentary. Kids must be potty trained.
- Casino, Swimming Pool, Jacuzzis, Fitness Area, Shopping Arcade, Video Arcade, Disco at Dome.`,
  },
  {
    sourceKey: 'sky_decks',
    title: 'Cordelia Sky — Deck Layout',
    source: 'cms',
    locale: 'en',
    metadata: { topic: 'ship', ship: 'sky', entityType: 'deck_layout', priority: 'low', tags: ['sky', 'decks', 'layout'] },
    content: `# Cordelia Sky — Deck Layout
- Deck 4-5: Staterooms.
- Deck 6: Retail shop, Connextions Lounge, Chairman's Club, Library, 3 Meeting rooms, Photo Gallery.
- Deck 7: Splash Academy (youth center), Video arcade, Atrium bar, Casino, Just Beans, EFFY Jewellery, Park West Gallery, Tides gift shopping.
- Deck 8-10: Staterooms.
- Deck 11: Sauna & Steam Room, Spa & Salon, La Cucina, The Local Bar & Grill, Topsiders, Garden Cafe, Great Outdoor Cafe, Dome, Pool & Pool Deck, Fitness Center (Gym).
- Deck 12: Hot Tub, Children's Pool, Shower, SKY Bar, Pickleball & Cricket Court, The Great Sushi Bar, Salt n Smoke.`,
  },
  {
    sourceKey: 'alcohol',
    title: 'Alcohol Packages (Empress)',
    source: 'policy',
    locale: 'en',
    metadata: { topic: 'alcohol', ship: 'empress', entityType: 'package', priority: 'medium', tags: ['empress', 'alcohol', 'drinks', 'packages'] },
    content: `# Alcohol Packages (Empress)

## Regular ($15/night)
Smirnoff/Romanov vodka, Old Monk/Bacardi rum, Blue Riband gin, Blenders Pride/Antiquity/VAT 69 whiskey, Jose Cuervo Silver tequila, Honey Bee brandy, House wines, Kingfisher/Tuborg beer, basic cocktails & mocktails.

## Premium ($30/night)
Absolut/Stolichnaya vodka, Bacardi Superior/Captain Morgan rum, Tanqueray gin, JW Black Label/Chivas Regal/Dewar's whiskey, Jose Cuervo tequila, Morpheus XO/Jagermeister brandy, Chenin Blanc/Zinfandel/Breezer wines, Budweiser/Heineken beer, Long Island/Manhattan cocktails.

## Luxury ($55/night)
Grey Goose/Belvedere vodka, Mount Gay rum, Bombay Sapphire gin, Glenfiddich/Glenmorangie/Jack Daniels/JW Black whiskey, Reposado tequila, Hennessy VS brandy, Chardonnay/Cabernet wines, Corona beer, Margarita/Cosmopolitan cocktails, RedBull, Virgin Pinacolada.

## Notes
- Upgrade requires all guests on same booking to upgrade.
- Prices are per person per night + taxes.`,
  },
  {
    sourceKey: 'wifi',
    title: 'Wi-Fi Packages (Empress)',
    source: 'policy',
    locale: 'en',
    metadata: { topic: 'wifi', ship: 'empress', entityType: 'package', priority: 'medium', tags: ['wifi', 'internet', 'packages'] },
    content: `# Wi-Fi Packages (Empress)
- 200 MB: USD 4.50 + 18% GST (1 device).
- 600 MB: USD 13 + 18% GST (1 device).
- 2.4 GB: USD 49 + 18% GST (1 device).
- 4.2 GB: USD 85 + 18% GST (1 device).
- Chairman's Suite & Suite guests: Complimentary 600 MB voucher per person for 2-3 night sailings, 2 vouchers for 5-night sailings.`,
  },
  {
    sourceKey: 'inclusions',
    title: "What's Included / Excluded",
    source: 'faq',
    locale: 'en',
    metadata: { topic: 'inclusions', entityType: 'inclusions', priority: 'high', tags: ['inclusions', 'included', 'excluded', 'whats included'] },
    content: `# What's Included / Excluded

## Included (all cabins)
- Accommodation, meals at Food Court & Starlight/Palace/Crossings restaurants.
- Access to public areas, swimming pool & fitness centre.
- Regular All-Inclusive Alcohol Package.
- Cordelia Academy for kids (1 hour daily complimentary).
- Live band performance, party under the stars at pool deck.
- Disco night in The Dome.
- Water bottles per person per day (Standard 2, Upper 3, Premier 4).
- Service charges, Travel Insurance and GST.

## Not Included
- Specialty restaurants (Chopstix, La Cucina, Spice Route, Salt n Smoke, etc.).
- Alcohol & beverages beyond regular package.
- Paid shows (Burlesque: $10, Magical Evening: $10).
- Shore excursions, Wi-Fi packages, casino coupons.
- Spa & salon services, bridge tour ($15), rock wall climbing ($2).`,
  },
  {
    sourceKey: 'empress_policies',
    title: 'Empress — Booking Policies',
    source: 'policy',
    locale: 'en',
    metadata: { topic: 'policy', ship: 'empress', entityType: 'booking_policy', priority: 'high', tags: ['empress', 'cancellation', 'reschedule', 'payment', 'refund'] },
    content: `# Empress — Booking Policies

## Cancellation
- 46+ days: Full refund.
- 45-31 days: 90% refund on cabin fare.
- 30-7 days: 80% refund on cabin fare.
- 7 days or less: Non-refundable.
- Refund processed within 31 working days.

## Reschedule
- Must commence within 6 months from original date.
- Fare difference payable by customer.

## Payment
- 25% of total amount at booking. Remaining 75% due 60 days before sailing.
- Auto-cancellation if final payment not received by due date.`,
  },
  {
    sourceKey: 'sky_policies',
    title: 'Cordelia Sky — Booking Policies',
    source: 'policy',
    locale: 'en',
    metadata: { topic: 'policy', ship: 'sky', entityType: 'booking_policy', priority: 'high', tags: ['sky', 'cancellation', 'reschedule', 'name change', 'refund'] },
    content: `# Cordelia Sky — Booking Policies

## Cancellation
- 46+ days: Full refund.
- 31-45 days: 10% cabin fare + 100% fuel charges forfeited.
- 30-7 days: 20% cabin fare + 100% fuel charges forfeited.
- Within 7 days: Non-refundable.
- No Show: 100% cabin fare + 100% fuel charges forfeited.
- Refund processed within 31 working days.

## Reschedule
- 46+ days: INR 5000/stateroom + fare difference.
- 31-45 days: INR 7000/stateroom + fare difference.
- 16-30 days: INR 10000 + fare difference.
- 0-15 days: No rescheduling possible.

## Name Change
- $50 + GST for first guest, $100 + GST for next in same stateroom.
- Free corrections within 48 hours of booking.`,
  },
  {
    sourceKey: 'destinations',
    title: 'Destinations & Seasonal Weather',
    source: 'cms',
    locale: 'en',
    metadata: { topic: 'destinations', entityType: 'destination', priority: 'medium', tags: ['destinations', 'weather', 'seasons', 'ports'] },
    content: `# Destinations
- Sri Lanka: Ancient sites, wildlife, beaches. Requires passport + visa (all ages).
- Lakshadweep: Pristine beaches, snorkeling, diving. Very remote, limited medical facilities ashore.
- Goa: Beaches, nightlife, cultural heritage, water sports. Good for all ages.
- Kochi: Backwaters, cultural city. Calm, good for families of all ages.
- Chennai: Golden beaches, cultural heritage. Well-connected.
- Dubai: World-class family-friendly city, top attractions, great medical facilities.

## Destination Suitability
- Best for young children / toddlers: Goa, Kochi, Dubai.
- Best for older kids / teens: Lakshadweep, Sri Lanka.
- Best for couples / romantic: Lakshadweep, Sri Lanka.
- NOTE: Children below 12 months NOT allowed onboard under any circumstances.

## Seasonal Weather Guide
- Lakshadweep: Best Oct-Apr. Monsoon Jun-Sep (rough seas).
- Goa: Best Nov-Feb. Monsoon Jun-Sep.
- Kochi: Best Oct-Feb. Monsoon Jun-Sep.
- Sri Lanka: Best Nov-Apr for west coast. May-Sep for east coast (Trincomalee).
- Chennai: Best Nov-Feb. Monsoon Oct-Dec.
- Dubai: Best Oct-Apr. May-Sep very hot (35-45°C).`,
  },
  {
    sourceKey: 'port_details',
    title: 'Port Details',
    source: 'cms',
    locale: 'en',
    metadata: { topic: 'ports', entityType: 'port', priority: 'low', tags: ['ports', 'terminals', 'embarkation'] },
    content: `# Port Details
- Mumbai: Mumbai International Cruise Terminal, Green Gate, Alexandra Dock, Ballard Pier, Fort.
- Goa: Mormugao Port Trust, Headland Sada, Vasco da Gama.
- Agatti (Lakshadweep): Agatti Eastern Jetty.
- Kochi: Cochin Port / Sagarika International Cruise Terminal, Willingdon Island.
- Chennai: Chennai Seafarer's Club, Opp. RBI, Rajaji Salai.
- Jaffna (Sri Lanka): Kankasanturei Port.
- Trincomalee (Sri Lanka): Trincomalee Harbour.
- Hambantota (Sri Lanka): Hambantota International Port.
- Dubai: Cruise Terminal Port Rashid.`,
  },
  {
    sourceKey: 'parking',
    title: 'Valet & Parking (Mumbai)',
    source: 'faq',
    locale: 'en',
    metadata: { topic: 'parking', entityType: 'service', priority: 'low', tags: ['parking', 'valet', 'mumbai'] },
    content: `# Valet & Parking (Mumbai only)
- Valet parking available for guests sailing from Mumbai.
- Location: CR2 Mall, Nariman Point — approximately 10-15 minutes from Mumbai Port.
- 2 Nights: INR 1,099 | 3 Nights: INR 1,499 | 5 Nights: INR 2,099.`,
  },
  {
    sourceKey: 'tender_port',
    title: 'Tender Port Policy',
    source: 'policy',
    locale: 'en',
    metadata: { topic: 'policy', entityType: 'tender_policy', priority: 'low', tags: ['tender', 'port', 'policy'] },
    content: `# Tender Port Policy
- At ports where vessel cannot berth, guests transported ashore via tender boats.
- Captain retains sole discretion to alter, delay, cancel, or suspend any port call for safety.
- No refunds or compensation for cancelled/modified port calls due to such circumstances.`,
  },
  {
    sourceKey: 'general_policies',
    title: 'General Policies',
    source: 'policy',
    locale: 'en',
    metadata: { topic: 'policy', entityType: 'general_policy', priority: 'high', tags: ['baggage', 'prohibited', 'smoking', 'children', 'documents', 'check-in'] },
    content: `# General Policies
- Baggage: Max 3 bags/person, each under 20 kgs, total max 50 kgs. Excess: Rs 300/kg.
- Prohibited: Drugs, guns, explosives, flammable items, e-cigarettes, hookahs, outside liquor & food, high voltage devices, aerial drones.
- Smoking: Designated areas only. Stateroom smoking fine up to US $1000.
- Pets: Not allowed.
- Children: Below 12 months not allowed. Above 2 years = child (extra beds chargeable).
- Pregnancy: Beyond 24 weeks not permitted.
- Alcohol: Minimum 21 years for liquor, 25 years for hard liquor.
- Medical: Deck 2 (Empress) / Deck 3 (Sky). Services NOT complimentary.
- Dress: Smart casuals. Swimsuits mandatory at pool.
- Web Check-in: MANDATORY. Generates boarding pass.
- Documents (Domestic): Boarding pass + Aadhar/Passport/DL/Voter ID/PAN.
- Documents (International): Boarding pass + Passport (6 months validity) + Visa.`,
  },
  {
    sourceKey: 'offers',
    title: 'Current Offers & Promotions',
    source: 'cms',
    locale: 'en',
    metadata: { topic: 'offers', entityType: 'offer', priority: 'high', tags: ['offers', 'promotions', 'discounts', 'emi'] },
    content: `# Current Offers & Promotions
1. Kids Sail Free: Kids below 12 sail free. Only service charges, levies, and fuel charges applicable.
2. Companion Offer: Select June sailings. Second guest cabin fare waived (Interior & Ocean View).
3. Super Special Pricing: Select April sailings. Interior to Ocean View upgrade. No cancellations/reschedules.
4. Pay for 3 Nights, Sail for 4 Nights: Select April dates. Interior & Ocean View cabins.
5. No Cost EMI: Available on credit cards from ICICI, HDFC, Axis, Kotak, IndusInd, IDFC, HSBC, IDBI, Yes Bank, Standard Chartered, Bank of Baroda, One Card, Federal Bank, AU Small Finance Bank, RBL Bank. Credit cards only.`,
  },
  {
    sourceKey: 'faq',
    title: 'Frequently Asked Questions',
    source: 'faq',
    locale: 'en',
    metadata: { topic: 'faq', entityType: 'faq', priority: 'medium', tags: ['faq', 'questions', 'food', 'laundry', 'disembarkation'] },
    content: `# Frequently Asked Questions
- Seasickness: Ship is large and stable. Middle of ship has least motion.
- Language: Multilingual crew, all speak English.
- Laundry: Available, additional charge.
- Interconnecting rooms: Interior and Ocean View categories (Empress). Connected cabins on Deck 7 (Sky).
- Wheelchairs: Available (limited). Notify when booking.
- Food in stateroom: Not allowed.
- Baby food: Can carry with prior notice.
- Halal food: All food is halal, certificate available.
- Jain food: Dedicated service. Starlight Deck 5 exclusively Jain & veg (Empress). Palace Restaurant for Jain (Sky).
- Disembarkation: Staggered, normally completed within 3 hours. Book flights 5-7 hours after arrival.
- Late arrival/denied boarding: Cannot join at next port.`,
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Booting NestJS context...');
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });

  const kbService = app.get(KbService);
  const embeddingsService = app.get(EmbeddingsService);
  const dataSource = app.get(DataSource);

  console.log(`📚 Syncing ${KB_DOCS.length} KB documents...\n`);
  let created = 0;
  let reingested = 0;
  let unchanged = 0;
  let totalChunks = 0;

  for (const doc of KB_DOCS) {
    const contentHash = computeContentHash(doc.content);

    const { documentId, status } = await kbService.syncDocument({
      sourceKey: doc.sourceKey,
      source: doc.source,
      title: doc.title,
      locale: doc.locale,
      metadata: doc.metadata,
      contentHash,
      embeddingVersion: EMBEDDING_VERSION,
      chunkingVersion: CHUNKING_VERSION,
    });

    // Skip unchanged docs unless a prior run left zero chunks (self-heal).
    let needsIngest = status !== 'unchanged';
    if (!needsIngest && (await kbService.countChunks(documentId)) === 0) needsIngest = true;
    if (!needsIngest) {
      unchanged++;
      console.log(`  = ${doc.title} (unchanged)`);
      continue;
    }

    const chunks = chunkDocument(doc.content, {
      title: doc.title,
      ship: doc.metadata.ship,
      topic: doc.metadata.topic,
    });
    if (chunks.length === 0) {
      console.warn(`  ! ${doc.title} — produced no chunks, leaving existing intact`);
      continue;
    }

    // Embed all chunks (batches of 10 for Gemini rate-limit safety) BEFORE writing.
    const embeddings: number[][] = [];
    const batchSize = 10;
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      const embedded = await embeddingsService.embedBatch(batch.map((c) => c.content));
      embeddings.push(...embedded);
      if (i + batchSize < chunks.length) await sleep(500);
    }

    await kbService.replaceChunks(
      documentId,
      contentHash,
      chunks.map((c) => ({
        chunkIndex: c.chunkIndex,
        content: c.content,
        metadata: { ...doc.metadata, ...c.metadata },
      })),
      embeddings,
    );

    totalChunks += chunks.length;
    if (status === 'created') {
      created++;
      console.log(`  + ${doc.title} — ${chunks.length} chunk(s) [created]`);
    } else {
      reingested++;
      console.log(`  ~ ${doc.title} — ${chunks.length} chunk(s) [reingested]`);
    }
    await sleep(300);
  }

  // Orphan cleanup: drop documents no longer present in KB_DOCS (cascades to chunks).
  const seenKeys = KB_DOCS.map((d) => d.sourceKey);
  const orphans = await dataSource.query(
    `DELETE FROM kb_document WHERE source_key <> ALL($1::text[]) RETURNING source_key`,
    [seenKeys],
  );
  if (orphans.length) {
    console.log(`\n🗑️  Removed ${orphans.length} orphan document(s): ${orphans.map((r: any) => r.source_key).join(', ')}`);
  }

  console.log(
    `\n✅ Done — ${created} created, ${reingested} reingested, ${unchanged} unchanged. ${totalChunks} chunk(s) (re)embedded.`,
  );
  await app.close();
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
