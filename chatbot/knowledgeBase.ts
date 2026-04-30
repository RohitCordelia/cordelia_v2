/**
 * Nyra's Knowledge Base — Cordelia Cruises
 * Populated from Empress Knowledge Hub & Cordelia Sky Knowledge Hub
 */

const KNOWLEDGE_BASE = {

    about: `
ABOUT CORDELIA CRUISES:
- Cordelia Cruises by Waterways Leisure Tourism Limited is India's premium cruise line.
- Meaning of Cordelia: "heart" or "daughter of the sea(-god)", Jewel of the Sea.
- CEO: Mr. Jurgen Bailom.
- Bookings: 022-68811111. Customer Support: 022-68811190.
- Email: info@cordeliacruises.com. Website: cordeliacruises.com.
- Two ships: The Empress and The Sky.
`,

    empress: `
THE EMPRESS:
- Total Rooms: 796 (Interior: 311, Ocean View: 416, Mini Suite: 63, Suite: 5, Chairman's Suite: 1).
- Load Factor: 1750 Guests.
- 11 Decks, 6 Elevators, 2 Embarkation Points.
- 5 Bars: The Dome, Chairman's Club, Connexions, Pool Bar, Casino.
- 3 Restaurants: Food Court, Starlight, Chopstix.
- 2 Swimming Pools (1 adult, 1 kids), 3 Jacuzzis.
- Medical Facility on Deck 2.
- Marquee Theatre (840 guests), Fitness Area, Shopping Arcade, Video Arcade, Cordelia Academy (kids).
- Home Port West: Mumbai. Home Port East: Chennai.
- 4 Accessible Rooms (Deck 4).
`,

    sky: `
THE SKY (CORDELIA SKY):
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
- 7 Wheelchair accessible cabins, 46 Hearing impaired cabins, 4 Connected cabins.
`,

    empress_cabins: `
EMPRESS CABIN DETAILS:
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
- All cabins include: two twin beds converting to queen, private bathroom, vanity area, TV, telephone, locker.
`,

    sky_cabins: `
SKY CABIN DETAILS:
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
- Interior (Solo): 29 cabins, 1 person, 118 sq ft.
`,

    sky_restaurants: `
SKY RESTAURANTS & BARS:
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
- Atrium Bar (Deck 7, paid): 21 seats, lobby bar with panoramic windows + live piano.
`,

    empress_restaurants: `
EMPRESS RESTAURANTS & VENUES:
- Marquee Theatre (Deck 5-6): 840 guests. Shows: Balle Balle, Indian Cinemagic, Magic Show, Romance in Bollywood, Burlesque.
- Connexions (Deck 6): 280 inside + 60 promenade. Bar with dance floor, stage, piano. Coffee shop at entrance.
- Dome (Deck 10): 110 guests. Ocean views, social space for parties.
- Pool Deck (Deck 10): 200-400 guests. Smoking zone, exhibitions, parties (weather permitting).
- Starlight (Deck 4-5): 412 (Deck 4) + 292 (Deck 5). Freestyle seating, fixed tables. Deck 5 serves exclusively Jain & vegetarian. Breakfast 08:00-10:00, Lunch 13:00-15:00, Dinner 20:00-22:00.
- Food Court (Deck 10): 563 seats (443 inside, 120 outside). Veg/Non-Veg/Jain. Breakfast 07:30-10:30, Lunch 12:30-15:30, Hi Tea 16:30-18:00, Dinner 19:30-22:30, Midnight snacks 00:30-01:30.
- Chopstix (Deck 5): 74 guests. Ala Carte. Regular breakfast & lunch for Chairman's Suite and Suite guests. Dinner 20:00-22:30.
- Chef's Table (Deck 5): 6-8 guests. Special interactive menu, perfect for celebrations. Dinner 20:00-22:30.
- Casino (Deck 6): 400 guests. 21 gaming tables (Indian Flush: 6, Roulette: 4, Three Card Poker: 2, Blackjack: 1, Andar Bahar: 2, Mini Baccarat: 2, Casino War: 1). Open during sea sailing, closed at port.
`,

    entertainment: `
ENTERTAINMENT & SHOWS (EMPRESS):
- Balle Balle: Colorful Indian wedding spectacular. Complimentary (all itineraries).
- India Cinemagic: Best of Indian cinema musical spectacle. Complimentary (all itineraries).
- Romance in Bollywood: Bollywood romance & love music show. Complimentary (5-night itinerary only).
- Burlesque The Bollywood Way: Western burlesque with Bollywood energy. $10 + 18% GST (all itineraries).
- Magician's Cut: Grand illusionist Tejas Malode. Complimentary (5-night itinerary only).
- Magical Evening: Advanced magic by Tejas (guests 9+ years only). $10 + 18% GST.
- Razmataz: Tribute to South Indian legends. Complimentary.

ACTIVITIES:
- Bridge Tour: Ship bridge tour. $15 + 18% GST.
- Rock Wall Climbing: Highest rock wall in the ocean. $2 + 18% GST.
- Magical Workshop: Ages 16+ only.
- Cordelia Academy (Kids): Arts & crafts, scavenger hunts, jewellery making, karaoke. 1 hour/day complimentary. Kids must be potty trained.
- Casino, Swimming Pool, Jacuzzis, Fitness Area, Shopping Arcade, Video Arcade, Disco at Dome.
`,

    sky_decks: `
SKY DECK LAYOUT:
- Deck 4-5: Staterooms.
- Deck 6: Retail shop, Connextions Lounge, Chairman's Club, Library, 3 Meeting rooms, Photo Gallery.
- Deck 7: Splash Academy (youth center), Video arcade, Atrium bar, Casino, Just Beans, EFFY Jewellery, Park West Gallery, Tides gift shopping.
- Deck 8-10: Staterooms.
- Deck 11: Sauna & Steam Room, Spa & Salon, La Cucina, The Local Bar & Grill, Topsiders, Garden Cafe, Great Outdoor Cafe, Dome, Pool & Pool Deck, Fitness Center (Gym).
- Deck 12: Hot Tub, Children's Pool, Shower, SKY Bar, Pickleball & Cricket Court, The Great Sushi Bar, Salt n Smoke.
`,

    alcohol: `
ALCOHOL PACKAGES (EMPRESS):
Three tiers — prices per person per night + taxes:

REGULAR ($15/night): Smirnoff/Romanov vodka, Old Monk/Bacardi rum, Blue Riband gin, Blenders Pride/Antiquity/VAT 69 whiskey, Jose Cuervo Silver tequila, Honey Bee brandy, House wines, Kingfisher/Tuborg beer, basic cocktails & mocktails.

PREMIUM ($30/night): Absolut/Stolichnaya vodka, Bacardi Superior/Captain Morgan rum, Tanqueray gin, JW Black Label/Chivas Regal/Dewar's whiskey, Jose Cuervo tequila, Morpheus XO/Jagermeister brandy, Chenin Blanc/Zinfandel/Breezer wines, Budweiser/Heineken beer, Long Island/Manhattan cocktails.

LUXURY ($55/night): Grey Goose/Belvedere vodka, Mount Gay rum, Bombay Sapphire gin, Glenfiddich/Glenmorangie/Jack Daniels/JW Black whiskey, Reposado tequila, Hennessy VS brandy, Chardonnay/Cabernet wines, Corona beer, Margarita/Cosmopolitan cocktails, RedBull, Virgin Pinacolada.

Note: Upgrade requires all guests on same booking to upgrade. Prices are per person per night + taxes.
`,

    wifi: `
WI-FI PACKAGES (EMPRESS):
- 200 MB: USD 4.50 + 18% GST (1 device).
- 600 MB: USD 13 + 18% GST (1 device).
- 2.4 GB: USD 49 + 18% GST (1 device).
- 4.2 GB: USD 85 + 18% GST (1 device).
- Chairman's Suite & Suite guests: Complimentary 600 MB voucher per person for 2-3 night sailings, 2 vouchers for 5-night sailings.
`,

    inclusions: `
WHAT'S INCLUDED (ALL CABINS):
- Accommodation, meals at Food Court & Starlight/Palace/Crossings restaurants.
- Access to public areas, swimming pool & fitness centre.
- Regular All-Inclusive Alcohol Package.
- Cordelia Academy for kids (1 hour daily complimentary).
- Live band performance, party under the stars at pool deck.
- Disco night in The Dome.
- Water bottles per person per day (varies by cabin tier: Standard 2, Upper 3, Premier 4).
- Service charges, Travel Insurance and GST.
- Help Desk on Deck 5.

WHAT'S NOT INCLUDED:
- Specialty restaurants (Chopstix, International Grill, La Cucina, Spice Route, Salt n Smoke, etc.).
- Alcohol & beverages beyond regular package.
- Paid shows (Burlesque: $10, Magical Evening: $10).
- Shore excursions, Wi-Fi packages, casino coupons.
- Spa & salon services, bridge tour ($15), rock wall climbing ($2).
- Gaming arcade, board games (deposit required), photography.
`,

    empress_policies: `
EMPRESS POLICIES:

Cancellation:
- 46+ days: Full refund.
- 45-31 days: 90% refund on cabin fare.
- 30-7 days: 80% refund on cabin fare.
- 7 days or less: Non-refundable.
- Service charges & levies refunded. Fuel charges non-refundable.
- Cancellation is for entire stateroom only (no partial).
- Refund processed within 31 working days.

Reschedule:
- Must commence within 6 months from original date.
- Fare difference payable by customer. No refund for higher-to-lower fare change.

Payment:
- 25% of total amount at booking. Remaining 75% due 60 days before sailing.
- International itineraries: TCS to be paid in advance.
- Auto-cancellation if final payment not received by due date (amount forfeited).
`,

    sky_policies: `
SKY POLICIES:

Cancellation:
- 46+ days: Full refund.
- 31-45 days: 10% cabin fare + 100% fuel charges forfeited.
- 30-7 days: 20% cabin fare + 100% fuel charges forfeited.
- Within 7 days: Non-refundable.
- No Show: 100% cabin fare + 100% fuel charges forfeited (service charges & levies refunded).
- GST on refunded amount returned.
- 100% fuel surcharge forfeited across all categories.
- Death or major illness: 100% refund for entire stateroom with valid proof.
- Refund processed within 31 working days.

Reschedule:
- Must commence within 6 months.
- 46+ days: INR 5000/stateroom + fare difference.
- 31-45 days: INR 7000/stateroom + fare difference.
- 16-30 days: INR 10000 + fare difference.
- 0-15 days: No rescheduling possible.
- Free rescheduling for death of immediate family or severe illness with valid certificate.

Name Change:
- $50 + GST for first guest, $100 + GST for next in same stateroom.
- Free corrections within 48 hours of booking.
- $15 + GST for corrections after 48 hours.
- No name changes within 72 hours before sailing (corrections still allowed).
`,

    destinations: `
DESTINATIONS:
- Sri Lanka: Stunning landscapes, ancient sites, wildlife, beaches. Affordable international destination with welcoming locals. Requires passport + visa (all ages). Good for culturally curious families with older children; major ports have hospitals nearby.
- Lakshadweep: Pristine beaches, crystal-clear waters, vibrant marine life. Snorkeling, diving, sandy shores. Very remote — limited medical facilities ashore. Best for nature-loving families with older children; not recommended for infants or guests needing regular medical access.
- Goa: Stunning beaches, vibrant nightlife, rich cultural heritage, water sports. Range of beaches from lively to calm. Good for all ages including young children; modern hospitals and facilities nearby.
- Kochi: Charming coastal city, beautiful backwaters, delicious food, culturally rich. Calm and easy-going — good for families of all ages.
- Chennai: Golden beaches, cultural heritage, lively markets, history, art. Well-connected city with good facilities; suitable for families.
- Dubai: International sailing. World-class family-friendly city with top attractions, great medical facilities, and activities for all ages.

DESTINATION SUITABILITY SUMMARY (concierge guidance):
- Best for young children / toddlers: Goa, Kochi, Dubai (calm beaches, good facilities)
- Best for older kids / teens: Lakshadweep (snorkeling, adventure), Sri Lanka (culture + nature)
- Best for couples / romantic: Lakshadweep, Sri Lanka
- Best for large families / groups: Goa, Dubai
- NOTE: Cordelia Cruises does NOT allow children below 12 months (infants/babies) onboard under any circumstances — this applies regardless of destination.

PORT DETAILS:
- Mumbai: Mumbai International Cruise Terminal, Green Gate, Alexandra Dock, Ballard Pier, Fort.
- Goa: Mormugao Port Trust, Headland Sada, Vasco da Gama.
- Agatti (Lakshadweep): Agatti Eastern Jetty.
- Kochi: Cochin Port / Sagarika International Cruise Terminal, Willingdon Island.
- Chennai: Chennai Seafarer's Club, Opp. RBI, Rajaji Salai.
- Jaffna (Sri Lanka): Kankasanturei Port.
- Trincomalee (Sri Lanka): Trincomalee Harbour.
- Hambantota (Sri Lanka): Hambantota International Port.
- Dubai: Cruise Terminal Port Rashid.

VALET & PARKING (Mumbai only):
- Available at CR2 Mall, 10-15 mins from Mumbai Port.
- 2 Nights: INR 1099, 3 Nights: INR 1499, 5 Nights: INR 2099.
`,

    tender_port: `
TENDER PORT POLICY:
- Cruise itinerary including ports of call and tender operations subject to change without notice due to weather, sea conditions, port authority regulations, or operational requirements.
- At ports where vessel cannot berth alongside dock, guests transported ashore via tender boats.
- Captain retains sole discretion to alter, delay, cancel, or suspend any port call or tender operations for safety.
- No refunds, compensation, or alternate arrangements for cancelled/modified port calls or shore excursions due to such circumstances.
`,

    general_policies: `
GENERAL POLICIES:

Baggage: Max 3 bags/person, each under 20 kgs, total max 50 kgs. Excess: Rs 300/kg.
Prohibited: Drugs, guns, explosives, flammable items, e-cigarettes, hookahs, outside liquor & food, high voltage devices (hair curling irons, clothing iron, electric kettles, hair dryers), aerial drones (subject to permissions).
Smoking: Designated areas only. Stateroom smoking: fine up to US $1000 + possible disembarkation. Spitting: fine up to US $1000.
Pets: Not allowed.
Children: Below 12 months not allowed. Above 2 years = child (extra beds chargeable).
Pregnancy: Beyond 24 weeks not permitted. Medical certificate may be requested.
Alcohol: Minimum 21 years for liquor, 25 years for hard liquor. Bars open per timings, alcohol after 12 nautical miles.
Currency: USD & INR accepted. Key card for all onboard purchases (rechargeable via debit/credit/cash). Remaining credit refunded.
Medical: Deck 2 (Empress) / Deck 3 (Sky). Doctor & nurses. Services NOT complimentary.
Dress: Smart casuals. Swimsuits mandatory at pool. Bring warm jacket for evenings at sea.
Web Check-in: MANDATORY. Generates boarding pass.
Documents (Domestic): Boarding pass + Aadhar/Passport/DL/Voter ID/PAN. Infants: birth certificate.
Documents (International): Boarding pass + Passport (6 months validity) + Visa. Tourist visa required for Sri Lanka (all ages). Apply online, fee not included.
Lost items: support@cordeliacruises.com. Lost key card: reception counter (charges may apply).
`,

    offers: `
CURRENT OFFERS (EMPRESS):
- Kids Sail Free: Kids below 12 sail free on all future sailings. Only service charges, levies and fuel charges with GST applicable.
- Companion Offer (select June sailings, Interior & Ocean View): Second guest's cabin fare waived.
- Super Special Pricing (select April sailings, Interior to Ocean View): Upgrade from Interior to Ocean View.
- Pay for 3N Sail for 4N (select April dates, Interior & Ocean View).
- No Cost EMI: Available on credit cards from select banks. Mention this whenever discussing offers.
Note: Super Special Pricing — no cancellations/reschedules permitted, no no-show refunds.

NO COST EMI — ELIGIBLE CREDIT CARDS ONLY:
Available on credit cards issued by these banks: ICICI Bank, HDFC Bank, Axis Bank, Kotak Mahindra Bank, IndusInd Bank, IDFC Bank, HSBC, IDBI, Yes Bank, Standard Chartered Bank, Bank of Baroda, One Card, Federal Bank, AU Small Finance Bank, RBL Bank.
Note: No Cost EMI is available on CREDIT CARDS only (not debit cards).
`,

    faq: `
ADDITIONAL FAQs:
- Seasickness: Ship is large and stable. Middle of ship has least motion. Consult physician for medication.
- Language: Multilingual crew, all speak English.
- Shopping: Available onboard.
- Laundry: Available, additional charge.
- Stateroom upgrade: Possible onboard based on availability, additional charges.
- Interconnecting rooms: Interior and Ocean View categories (Empress). Connected cabins on Deck 7 (Sky).
- Wheelchairs: Available (limited). Notify when booking. Foldable recommended.
- Food in stateroom: Not allowed. Dedicated dining areas provided.
- Baby food: Can carry with prior notice.
- Halal food: All food is halal, certificate available.
- Jain food: Dedicated service with authentic dishes. Starlight Deck 5 exclusively Jain & veg (Empress). Palace Restaurant for Jain (Sky).
- Beverage packages: Available onboard.
- Embarkation timings: Vary per sailing, guests notified in advance.
- Disembarkation: Staggered, normally completed within 3 hours. Book flights 5-7 hours after arrival.
- Late arrival/denied boarding: Cannot join at next port.
`,

};

// ── Token-capped retrieval ───────────────────────────────────────────────────
// Replaces full-dump getRelevantKnowledge for live prompt injection.
// Sections are ranked by keyword specificity; the budget is filled top-down,
// truncating or dropping lower-priority sections to stay within maxTokens.

interface ScoredChunk { content: string; weight: number; }

/**
 * Returns only the KB sections most relevant to `query`, capped at ~maxTokens.
 * Uses a weighted match system — higher-weight sections are included first.
 * Returns empty string when no sections match (suppresses KB injection entirely).
 */
export function getRelevantKnowledgeCapped(query: string, maxTokens = 400): string {
    const lower = query.toLowerCase();
    const scored: ScoredChunk[] = [];

    const add = (re: RegExp, content: string, weight: number) => {
        if (re.test(lower)) scored.push({ content: content.trim(), weight });
    };

    // Ship-specific — highest priority when ship is named directly
    add(/\bempress\b/,                                                    KNOWLEDGE_BASE.empress,           5);
    add(/\bempress\b/,                                                    KNOWLEDGE_BASE.empress_cabins,    4);
    add(/\bempress\b/,                                                    KNOWLEDGE_BASE.empress_restaurants,4);
    add(/\bempress\b/,                                                    KNOWLEDGE_BASE.empress_policies,  3);
    add(/\bsky\b/,                                                        KNOWLEDGE_BASE.sky,               5);
    add(/\bsky\b/,                                                        KNOWLEDGE_BASE.sky_cabins,        4);
    add(/\bsky\b/,                                                        KNOWLEDGE_BASE.sky_restaurants,   4);
    add(/\bsky\b/,                                                        KNOWLEDGE_BASE.sky_decks,         3);
    add(/\bsky\b/,                                                        KNOWLEDGE_BASE.sky_policies,      3);

    // Topic-specific — match regardless of ship name
    add(/cabin|room|suite|balcony|interior|ocean view|stateroom/,        KNOWLEDGE_BASE.empress_cabins,    4);
    add(/cabin|room|suite|balcony|interior|ocean view|stateroom/,        KNOWLEDGE_BASE.sky_cabins,        4);
    add(/food|dining|restaurant|meal|breakfast|lunch|dinner|jain|halal/, KNOWLEDGE_BASE.empress_restaurants,4);
    add(/food|dining|restaurant|meal|breakfast|lunch|dinner|jain|halal/, KNOWLEDGE_BASE.sky_restaurants,   4);
    add(/alcohol|drink|bar|beer|wine|whiskey|vodka|cocktail|package/,    KNOWLEDGE_BASE.alcohol,           5);
    add(/wifi|wi-fi|internet/,                                            KNOWLEDGE_BASE.wifi,              5);
    add(/show|entertainment|casino|activit|sport|swim|gym|spa|kid/,      KNOWLEDGE_BASE.entertainment,     4);
    add(/destination|port|goa|lakshadweep|kochi|mumbai|chennai|dubai/,   KNOWLEDGE_BASE.destinations,      4);
    add(/include|exclude|free|offer|discount|emi|credit card/,           KNOWLEDGE_BASE.offers,            4);
    add(/include|exclude|what.s included|what is included/,              KNOWLEDGE_BASE.inclusions,        3);
    add(/cancel|reschedule|refund|baggage|luggage|smoke|pet|dress|passport|visa/, KNOWLEDGE_BASE.empress_policies, 3);
    add(/cancel|reschedule|refund|baggage|luggage|smoke|pet|dress|passport|visa/, KNOWLEDGE_BASE.sky_policies,     3);
    add(/cancel|reschedule|refund|baggage|luggage|smoke|pet|dress|passport|visa/, KNOWLEDGE_BASE.general_policies, 3);
    add(/tender|port call/,                                               KNOWLEDGE_BASE.tender_port,       5);
    add(/park|valet/,                                                     KNOWLEDGE_BASE.destinations,      4);
    add(/deck/,                                                           KNOWLEDGE_BASE.sky_decks,         4);

    if (scored.length === 0) return ''; // No match → don't inject KB at all

    // Sort descending, deduplicate by content identity
    const seen = new Set<string>();
    const ranked = scored
        .sort((a, b) => b.weight - a.weight)
        .filter(({ content }) => { if (seen.has(content)) return false; seen.add(content); return true; });

    // Fill char budget (rough estimate: 1 token ≈ 4 chars)
    const charBudget = maxTokens * 4;
    let used = 0;
    const result: string[] = [];

    for (const { content } of ranked) {
        if (used >= charBudget) break;
        const remaining = charBudget - used;
        if (content.length <= remaining) {
            result.push(content);
            used += content.length;
        } else if (remaining > 120) {
            // Only include a truncated chunk if there's still meaningful space
            result.push(content.slice(0, remaining - 3) + '...');
            used = charBudget;
        }
    }

    return result.join('\n');
}

// ── Always-on compact FAQ core ────────────────────────────────────────────────
// Injected into every prompt on every page (~260 chars, ~65 tokens).
// Covers the five questions most likely asked from any context.
// Deliberately omits pricing and policy specifics — those come from the
// targeted getRelevantKnowledgeCapped() layer when the query warrants it.

export function getGlobalKnowledgeCore(): string {
    return `CRUISE BASICS (always available):
- Cabin types: Interior (no view), Ocean View (window/porthole), Mini Suite (balcony, larger), Suite/Chairman's Suite (premium, largest).
- Wi-Fi: Yes, purchasable onboard (200 MB / 600 MB / 2.4 GB / 4.2 GB packages, USD pricing + 18% GST).
- Inclusions: Accommodation, meals at main restaurants, pool, gym, kids club (1 hr/day), regular alcohol package, service charges & GST.
- Baggage: Max 3 bags/person, each under 20 kg, total max 50 kg. Excess charged at ₹300/kg.
- Dining: Main buffet restaurants are complimentary. Specialty restaurants (La Cucina, Spice Route, Chopstix, etc.) are paid.`;
}

export function getKnowledgeBase(): string {
    return Object.values(KNOWLEDGE_BASE).join('\n');
}

export function getRelevantKnowledge(query: string): string {
    const lower = query.toLowerCase();
    const sections: string[] = [];

    if (/empress/.test(lower)) sections.push(KNOWLEDGE_BASE.empress, KNOWLEDGE_BASE.empress_cabins, KNOWLEDGE_BASE.empress_restaurants, KNOWLEDGE_BASE.empress_policies);
    if (/sky/.test(lower)) sections.push(KNOWLEDGE_BASE.sky, KNOWLEDGE_BASE.sky_cabins, KNOWLEDGE_BASE.sky_restaurants, KNOWLEDGE_BASE.sky_decks, KNOWLEDGE_BASE.sky_policies);
    if (/cabin|room|suite|balcony|interior|ocean view|stateroom/.test(lower)) sections.push(KNOWLEDGE_BASE.empress_cabins, KNOWLEDGE_BASE.sky_cabins);
    if (/food|dining|restaurant|meal|breakfast|lunch|dinner|buffet|cuisine|jain|halal|chopstix|starlight|food court|palace|crossing|la cucina|spice route/.test(lower)) sections.push(KNOWLEDGE_BASE.empress_restaurants, KNOWLEDGE_BASE.sky_restaurants);
    if (/alcohol|drink|bar|beer|wine|whiskey|vodka|cocktail|beverage|package/.test(lower)) sections.push(KNOWLEDGE_BASE.alcohol);
    if (/wifi|wi-fi|internet/.test(lower)) sections.push(KNOWLEDGE_BASE.wifi);
    if (/show|entertainment|balle|burlesque|magic|cinemagic|casino|activit|sport|pool|swim|climb|gym|spa|kid|academy/.test(lower)) sections.push(KNOWLEDGE_BASE.entertainment);
    if (/destination|port|goa|lakshadweep|kochi|mumbai|chennai|sri lanka|dubai|agatti|jaffna|trincomalee/.test(lower)) sections.push(KNOWLEDGE_BASE.destinations);
    if (/include|exclude|free|charge|cost|price|offer|discount|emi|bank|credit card|instalment|installment/.test(lower)) sections.push(KNOWLEDGE_BASE.inclusions, KNOWLEDGE_BASE.offers);
    if (/cancel|reschedule|refund|policy|baggage|luggage|smoke|pregnant|pet|dress|document|passport|visa|check.?in|board|embark|name change/.test(lower)) sections.push(KNOWLEDGE_BASE.empress_policies, KNOWLEDGE_BASE.sky_policies, KNOWLEDGE_BASE.general_policies);
    if (/tender|port call/.test(lower)) sections.push(KNOWLEDGE_BASE.tender_port);
    if (/park|valet/.test(lower)) sections.push(KNOWLEDGE_BASE.destinations);
    if (/deck/.test(lower)) sections.push(KNOWLEDGE_BASE.sky_decks);

    return sections.length > 0 ? Array.from(new Set(sections)).join('\n') : getKnowledgeBase();
}
