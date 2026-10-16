# GPDMV update log

Every change made to the GPDMV calendar and website, newest at the bottom.
A new version number is added each time something changes.

**Live on gpdmv.com:** up to version 11.
**Built and waiting on the `dev` branch:** versions 12 to 26, going live
Saturday 17 October.

---

## The calendar as a Claude artifact

**1 — The GPDMV event calendar**
A month calendar of community events on a shareable link, with event
details, flyers and a day panel. Pinned in the WhatsApp group.

**2 — Manage events, and version history**
An editor panel for adding, changing and deleting events without going
through Claude each time. Every save keeps a copy of what the calendar
looked like beforehand, and any kept version can be restored — built into
the page because the platform's own version history was not available.

**3 — The season's events added**
Garba Evening (GarbaTogether) with its Partiful RSVP link, Bhumi Pujan,
Nav Vilas, Jaane Pehchaane Anjane, Tribute to SPB, Diwali Nite and others.
Kirtidan Gadhvi's venue corrected to Droumavalla Farm, Leesburg.

**4 — Contact line and WhatsApp link**
"Created by Jahnvi Mehta · To add your event, call or text 214-463-7811"
added under the title and in the footer. The WhatsApp invite link updated
to the current one.

**5 — Bookmark button**
No browser lets a page bookmark itself, so the button opens a panel with
the right steps for whichever device the viewer is holding.

**6 — Category renamed**
"Snehmilan" became "Social", because the label was not landing with
everyone reading it.

---

## The move to gpdmv.com

**7 — The calendar becomes a website · 11 October**
Hosted on Cloudflare Pages at gpdmv.com, with the events stored on the
server rather than inside the page. Manage events kept working, now behind
a password, with sign-in attempts limited to stop guessing. Code on GitHub,
deploying automatically on push.

**8 — Bookmark panel uses the site's own address · 11 October**
It was still offering the old artifact link.

**9 — Share preview card and activity log · 12 October**
A proper image and title when the link is shared on WhatsApp, and an
account activity list showing every sign-in and save, so a sign-in that
wasn't you would be visible. Both came out of the members' security
feedback.

**10 — Full-resolution logo · 12 October**

**11 — Section tab bar · 12 October**
The bar that now carries Calendar, Jobs and Directory.

---

## Built on `dev`, going live Saturday 17 October

**12 — Seven event categories, and a calendar you can subscribe to · 12 October**
Categories redrawn to match what the group actually posts: Garba & Raas,
Temple & Spiritual, Shopping & Expo, Community & Culture, Food & Dining,
Youth & Kids, and Meetups for later. Events saved under the old names keep
working, and a one-time tidy-up panel in Manage proposes where each
belongs. A Subscribe button adds GPDMV events to a member's own phone
calendar — all events or one category — and every event added afterwards
arrives on its own. Feed at `gpdmv.com/calendar.ics`.

**13 — Security headers · 12 October**
A members' scan had given the site D (35/100, 9 of 12 checks). The missing
headers were added and the site now scores **A+ (125/100, 12 of 12)**.
SSL Labs was already A.

**14 — Renamed to GPDMV · 12 October**
Was "GPDMV Event Calendar". The calendar is what the site does, not what it
is called.

**15 — Jobs section at /jobs · 12 October**
Openings members share: role, company, type, location, the posting text,
and whichever of apply link, email or phone came with it. A posting comes
down by itself on its closing date, or 60 days after going up, so the board
cannot quietly go stale. Each record is tagged so that "members seeking
work" and an H1B/referral flag can be added later without a rebuild.

**16 — Section addresses fixed · 12 October**
Clicking Jobs showed the calendar: the address was being rewritten back to
the root, and the page reads the address to decide what to show. Each
section is now its own file, so /jobs and /directory stay as they are.

**17 — Directory section at /directory · 12 October**
The 54 rows from the business sheet, cleaned into 51 entries — three pairs
were the same business filed twice. Free-text trades grouped into fourteen
the community would look under, while each business keeps its owner's own
wording. Searchable by name, trade or town; readable grouped, A to Z or
newest first. Opening a business shows its contact details and buttons
through to its reviews on Google and on Yelp — links rather than pulled-in
star ratings, which stay current, cost nothing and need no account.

**18 — Trades stand in a column down the left · 12–13 October**
All fourteen readable at a glance beside the businesses. On a phone the
column narrows and uses short names so the businesses still read.

**19 — Members can send their business in · 13 October**
A form at `gpdmv.com/directory#add`, replacing the Google form. Nothing a
member sends is published by sending it: submissions wait in a "Waiting to
be added" panel in Manage, where one tap fills the business form with the
trade already guessed, and saving it publishes the business and clears the
request. Asks for the number they use in the WhatsApp group — never
published, only so membership can be checked — and two tick boxes, one
confirming membership and one consenting to be listed publicly. A hidden
field and a five-an-hour limit keep bots down.

**20 — Clearer form, and a waiting count · 13 October**
The form's hints described what goes in each box instead of naming real
members' businesses. The number waiting became readable without the
password — the number alone, never the details.

**21 — Email on every submission · 13 October**
Each submission now emails gpdmvinfo@gmail.com with every field laid out
and a link to the review panel. Submissions are stored first and emailed
second, so a listing is never lost to a mail provider having a bad day.
Tested end to end on dev.

**22 — Required boxes left empty · 13 October**
Your name and Business name start blank; the label already says what goes
in them.

**23 — Website and Instagram open the business's page · 13 October**
Both are fields on a business now rather than lines buried in its notes,
and both appear on the card as links. A bare handle, an @handle,
instagram.com/name and a full link all reach the same place, and Facebook
pages are recognised. Anything that cannot safely become a link is shown as
plain text rather than linked or dropped.

**24 — Site titled GPDMV - Gujarati Parivaar of DMV · 14 October**
The full name carries the heading, the browser tab, the footer and the
link previews. The line above it keeps only the Gujarati, since the
English half was saying the same thing twice.

**25 — Jobs tab hidden for now · 14 October**
The Jobs section is built, tested and still reachable at /jobs, but the
tab is hidden until there are real postings behind it — an empty page in
the menu says less than no page at all. One switch brings it back.

**26 — Instagram, Threads and YouTube in the footer · 16 October**
Links to @GPDMVOfficial on all three, with their icons, beside the
contact line at the foot of every section.
