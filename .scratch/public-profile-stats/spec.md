Status: ready-for-agent

# Profile dashboard and public typing record

## Problem Statement

My current public profile is too small to communicate how I type or how I am improving, while the private Stats page feels separate from my identity. I want a profile experience that makes personal records, progress, and consistency easy to understand without copying another typing product or exposing individual runs. When I am signed in, Profile should become the natural home for both my public identity and my detailed private statistics.

## Solution

Create a distinctive KEYSMASH profile dashboard for signed-in owners and public visitors. It uses the existing off-white, black, and yellow brutalist system with an oversized handle, ruled totals, numbered record rows, a stepped improvement chart, and a 52-week strike ledger. The public page contains cloud-only aggregates; the owner page adds profile controls and retains private local/cloud history below the dashboard. Signed-in navigation changes from Stats to a Profile account menu, while guests keep the existing local Stats experience.

## User Stories

1. As a signed-in typist, I want Profile to replace Stats in the main navigation, so that my identity and performance have one clear home
2. As a signed-in typist, I want the Profile control to open an account menu, so that profile destinations and logout are easy to reach
3. As a signed-in typist, I want to open my profile dashboard from the account menu, so that I can review the same story visitors see
4. As a signed-in typist, I want to jump directly to my detailed statistics, so that I do not need to scroll from the top manually
5. As a published typist, I want a shortcut to my public page, so that I can inspect the link I share
6. As an unpublished typist, I want the public-page shortcut hidden, so that the menu does not offer a dead destination
7. As a signed-in typist, I want logging out to return me to typing, so that the account transition has a clear endpoint
8. As a guest, I want Stats to remain available, so that I can inspect runs saved in my browser without creating an account
9. As a signed-in typist opening the old Stats route, I want to arrive at Profile, so that old bookmarks lead to the current account experience
10. As a guest opening the private Profile route, I want to return to guest Stats after authentication resolves, so that private account UI is not shown
11. As a profile owner, I want my handle to dominate the page visually, so that the profile feels personal without requiring an avatar
12. As a visitor, I want to see completed cloud runs, so that I understand the volume behind the profile
13. As a visitor, I want to see all-time average WPM, so that I understand the typist's usual speed
14. As a visitor, I want to see all-time average accuracy, so that speed retains quality context
15. As a visitor, I want to see recorded typing time, so that I understand how much measured practice contributed to the profile
16. As a visitor, I want missing historical elapsed time handled honestly, so that the dashboard never estimates measurements that were not recorded
17. As a profile owner without a handle, I want to see a complete private dashboard preview, so that I know what I am choosing to publish
18. As a profile owner, I want publication status and actions near the dashboard header, so that sharing controls stay visible without dominating the page
19. As a profile owner, I want to choose and validate a lowercase handle, so that my public URL is valid and memorable
20. As a profile owner, I want to publish explicitly, so that signing in never makes my performance public automatically
21. As a profile owner, I want to copy my public URL, so that sharing does not require reconstructing it
22. As a profile owner, I want useful feedback when clipboard access fails, so that I can select and copy the visible URL manually
23. As a profile owner, I want to rename my handle, so that my only public identity remains editable
24. As a profile owner, I want a failed or conflicting rename to preserve my working profile, so that an error cannot break the current URL
25. As a profile owner, I want the old URL to stop resolving after a rename, so that stale links do not reveal or redirect my identity
26. As a profile owner, I want to unpublish without losing my handle or results, so that I can take the page offline and republish later
27. As a visitor, I want to see four featured records, so that the typist's strongest practiced configurations are clear at a glance
28. As a visitor, I want featured records chosen from the most-practiced modes, so that short or easy configurations do not dominate merely because their WPM is higher
29. As a visitor, I want each record to show its combined word-count and time-limit mode, so that unlike configurations are not confused
30. As a visitor, I want record accuracy to come from the same winning run as WPM, so that the figures describe a real performance
31. As a visitor, I want to expand every populated mode inline, so that full records remain available without leaving the profile
32. As a visitor, I want modes without runs omitted, so that the records list contains measured performances only
33. As a visitor, I want to select a practiced mode for the improvement chart, so that I compare like with like
34. As a visitor, I want to switch between 12 weeks, 6 months, and 1 year, so that I can inspect recent and sustained improvement
35. As a visitor, I want weekly average WPM shown as a stepped series, so that the chart matches KEYSMASH's hard-edged visual language
36. As a visitor, I want weeks without runs shown as gaps, so that inactivity is not misrepresented as zero WPM
37. As a visitor, I want the latest measured week marked in yellow, so that the current point is immediately identifiable
38. As a visitor, I want a 52-week activity ledger, so that I can see practice consistency over a year
39. As a visitor, I want strike height to represent weekly completed-run volume, so that busy and quiet weeks are distinguishable
40. As a keyboard or assistive-technology user, I want exact week labels and counts available without relying on hover, so that the activity ledger is understandable to me
41. As a visitor, I want UTC week boundaries stated clearly, so that the same public profile has consistent activity totals for everyone
42. As a visitor, I want a zero-run profile to have an intentional empty state, so that missing records and charts do not look broken
43. As a visitor, I want unknown, unpublished, and superseded handles to share one not-found state, so that private account state is not disclosed
44. As a profile owner, I want aggregate-profile failures isolated from private history, so that I can still use saved run data during an outage
45. As a profile owner, I want local and cloud history controls below my profile dashboard, so that detailed run inspection remains available
46. As a privacy-conscious typist, I want profile summaries to use cloud runs only, so that local browser history is never published implicitly
47. As a privacy-conscious typist, I want individual runs and account data to remain private, so that a public dashboard does not expose raw behavior or identity
48. As a mobile visitor, I want the dashboard to fit a narrow screen without clipping, so that the shared page works on a phone
49. As a keyboard user, I want the account menu, profile controls, record expansion, chart controls, and activity ledger operable with visible focus, so that the experience works without a pointer
50. As a motion-sensitive visitor, I want the dashboard to respect reduced-motion preferences, so that the data remains comfortable to inspect
51. As a profile owner, I want to race the personal best shown for any combined mode, so that every record can become a new challenge
52. As a visitor, I want to race a published typist's personal best, so that a shared profile becomes interactive rather than only descriptive
53. As a visitor, I want each record row to offer a clear Race this ghost action, so that I can start from the performance I am inspecting
54. As a challenger, I want a ghost race to have a shareable URL, so that I can revisit or send the same challenge to someone else
55. As a challenger, I want the race URL to survive refresh and browser history navigation, so that the challenge behaves like a real route
56. As a profile owner, I want to race my cloud best while my profile is unpublished, so that privacy does not remove my own practice tools
57. As a challenger, I want the ghost to use the winning run's combined mode and seeded text, so that we type the same challenge
58. As a challenger, I want the ghost to follow the winning run's recorded progress, so that I race its actual pace rather than a decorative estimate
59. As a challenger racing an older record, I want a useful average-pace fallback, so that records without samples remain raceable
60. As a challenger, I want to see the ghost marker inside the typing text, so that I can understand who is ahead without leaving the test
61. As a challenger, I want a live ahead-or-behind delta and target WPM, so that I can adjust my pace during the race
62. As a challenger, I want restart and rematch to preserve the selected ghost, so that repeated attempts require one action
63. As a challenger, I want higher WPM to beat the ghost and higher accuracy to break an equal-WPM result, so that race scoring matches personal-record ranking
64. As a challenger, I want results to compare my run with the challenged ghost, so that the outcome and pace difference are clear
65. As a challenger, I want my completed race saved as my own run, so that racing contributes to my history and personal bests
66. As a profile owner, I want a visitor's race result isolated from my data, so that challengers cannot change my records
67. As a privacy-conscious profile owner, I want only the replay data needed for a public race exposed, so that mistakes and raw samples remain private
68. As a returning challenger, I want old ghost links to reproduce the same word stream, so that future word-list changes do not alter the challenge
69. As a local-only typist, I want the existing ghost shortcut to work for every combined mode, so that ghost racing is not limited to 60-second tests
70. As a signed-in typist, I want an explicitly selected cloud ghost to take priority while normal typing retains my local shortcut, so that race intent is predictable

## Implementation Decisions

- The signed-in account destination is `/profile`. The guest/local-history destination remains `/stats`, and the public route remains `/u/:handle`.
- Signed-in navigation contains Type and a Profile menu. The menu contains View profile, Your stats, conditional View public page, and Log out. Your stats targets the private history section within Profile. Logout returns to typing.
- Route decisions wait until authentication restoration finishes to avoid flashing or exposing the wrong page. Signed-in `/stats` requests redirect to `/profile`; signed-out `/profile` requests redirect to `/stats`.
- The account menu closes on selection, Escape, outside interaction, route change, and logout. It exposes expanded state, supports keyboard traversal, returns focus to its trigger, and never overflows the mobile viewport.
- The profile dashboard reads in this order: oversized handle and total ledger, compact owner controls when applicable, four featured records, improvement chart, and activity ledger. Private run history follows under a stable history anchor.
- Identity remains handle-only. Before a handle exists, the owner masthead says “Your profile.” No avatar placeholder, joined date, display name, biography, level, XP, or badge is introduced.
- Total metrics are completed cloud runs, all-time rounded average WPM, rounded average accuracy, and recorded typing time. Recorded time sums only non-null measured elapsed seconds, rounds to whole seconds, uses compact human-readable units, and displays an em dash when no elapsed time exists.
- Existing combined modes remain authoritative. Labels continue to describe word count and duration together, such as `60 words / 60s`; the feature does not create separate time and word categories.
- Personal best selection uses WPM descending, accuracy descending, then stable result ID ascending. The ID is used only as an internal tie-breaker and is never returned publicly.
- Each personal-best aggregate contains the mode, number of completed runs in that mode, winning WPM, and accuracy from the same run.
- The four featured records are the modes with the highest run count. Remaining ties use winning WPM descending and then mode identifier. Fewer than four populated modes render only the available records.
- Featured records use numbered, ruled score-sheet rows rather than cards. View all modes expands an inline table ordered by word count, duration, and mode identifier.
- The improvement chart defaults to the most-practiced mode and offers every populated mode. Its ranges are the current UTC week plus the preceding 11, 25, or 51 weeks, labeled 12 weeks, 6 months, and 1 year.
- Improvement values are weekly average WPM for the selected mode. Missing weeks are gaps. The visual is a stepped black line with square points and a yellow marker on the latest measured point; an accessible data representation communicates the same values.
- The activity ledger contains 52 UTC week buckets including the current week. Each yellow strike is proportional to the busiest visible week. A zero-activity year uses the profile empty state rather than fabricated bars.
- Exact activity week and count are available through a roving-focus interaction so keyboard users do not receive 52 permanent tab stops. Week boundaries are labeled as UTC.
- The owner dashboard and public page share one aggregate presentation model. The owner may retrieve their dashboard while unpublished or before choosing a handle; anonymous callers may retrieve only published handles.
- Add a new aggregate RPC while retaining the existing public-profile RPC during rollout. A null requested handle resolves only the authenticated caller's own profile. A non-null normalized handle resolves only a published profile. Every other request returns no row.
- The aggregate response contains `handle`, `run_count`, `average_wpm`, `average_accuracy`, `recorded_typing_seconds`, `personal_bests`, `weekly_activity`, and `weekly_mode_trends`.
- `personal_bests` entries contain `mode`, `run_count`, `wpm`, and `accuracy`. `weekly_activity` entries contain `week_start` and `run_count`. `weekly_mode_trends` entries contain `week_start`, `mode`, `run_count`, and `average_wpm`.
- Aggregate week dates are the only public date information in the dashboard response and intentionally represent groups rather than individual activity timestamps. The dashboard response excludes user IDs, emails, result IDs, individual timestamps, individual runs, seeds, missed keys, and pace samples.
- The RPC uses a fixed empty search path, fully qualified database objects, revoked default access, and explicit anonymous/authenticated execution grants. Anonymous raw access to profile and result tables remains denied.
- Aggregates use all cloud results at request time, including results beyond the private 200-run display limit. Local-only results, cached rollups, polling, and subscriptions are excluded.
- Profile controls support initial publication, selectable copy URL, clipboard feedback, unpublish, republish, and inline handle editing with save/cancel behavior. Rename updates the existing profile atomically and preserves publication state, account, and results.
- Handles keep the established normalization, validation, uniqueness, and reserved-name rules. Unchanged normalized handles are accepted as unchanged. Failed or concurrent claims preserve the persisted handle and publication state.
- Renames create no redirects, aliases, or history. The previous route immediately uses the same generic not-found state as unknown and unpublished profiles.
- Profile loading, empty, error, and retry states remain independent of private history loading. A dashboard request failure cannot remove or disable local/cloud history controls.
- The visual system remains fixed light: off-white paper, black ink, yellow emphasis, Archivo Black headings, Space Mono data, thick rules, hard edges, and minimal motion. The layout deliberately avoids the reference's dark theme, avatar card, soft panels, and equal-card grids.
- On narrow screens the total ledger becomes two columns, score rows stack within their rules, controls wrap, charts stay within the viewport, and no document-level horizontal overflow is introduced.
- Hosting fallback configuration includes the private Profile route as well as existing Stats, callback, and public profile routes.
- Apply the new migration before deploying frontend code that calls the aggregate RPC. The existing public profile remains functional throughout that deployment order.
- Every populated personal-record row gains a Race this ghost action. Public rows open `/u/:handle/race/:mode`; owner rows open `/profile/race/:mode`, including while unpublished.
- Add direct-load hosting fallbacks for both race route shapes. Refresh, back/forward navigation, restart, and rematch retain the selected ghost.
- Add a dedicated ghost RPC instead of placing replay data in the main dashboard response. A non-null handle resolves a winning mode only for a published profile; a null handle resolves only the authenticated owner's winning mode.
- The ghost RPC selects the same winning run as the personal-record aggregate: WPM descending, accuracy descending, then stable internal result ID ascending.
- The ghost response contains only the handle, mode, winning WPM and accuracy, word count, duration, measured elapsed time, seed, word-set version, and a derived replay trace of elapsed second plus target-character position.
- Raw samples, keystrokes, mistakes, result IDs, account identity, and individual timestamps remain private. The winning seed and derived trace are the deliberate, narrowly scoped exceptions required to make a selected public ghost raceable.
- Version the deterministic word set in saved results and backfill existing results as version 1. Keep version 1 generation available so existing records continue to reproduce their original text after future word-list changes.
- Lock the selected word count, duration, seed, word-set version, and target text for the race. Reject unsupported word-set versions rather than silently generating different text.
- Interpolate the ghost marker between derived trace points and clamp it to the target length. If the winning run has no usable samples, generate constant progress from its final average WPM.
- Show the marker within the typing text together with the challenged WPM and a live character lead or deficit. The selected ghost is distinct from the challenger's own current personal best.
- Determine the race result by WPM first and accuracy second. Higher WPM wins; equal WPM with higher accuracy wins; equal WPM and accuracy is a tie. Internal result ID never decides a challenger outcome.
- Race results prioritize the challenged ghost comparison and may independently show a New personal best state for the challenger.
- Completed public or owner races use the normal persistence path. Guests update their local history and personal best; signed-in challengers also save to their own cloud account. No race operation writes to the challenged owner's data.
- A race already loaded in memory may finish if the owner unpublishes during the attempt. A fresh load or refresh after unpublishing returns the generic ghost-unavailable state.
- Unknown handles, unpublished public profiles, missing modes, malformed race routes, and unsupported word-set versions use one generic ghost-unavailable state. Network failures remain distinct and retryable.
- Generalize the existing local ghost shortcut from 60-second modes to every combined mode. An explicitly selected owner/public ghost takes priority for that attempt; ordinary typing without one continues to use the browser's local personal best.

## Testing Decisions

- The agreed high-level seams are the aggregate and ghost RPC contracts plus browser-visible profile and race routes. Checks evaluate returned public data and user-observable behavior rather than component structure, SQL implementation details, or CSS internals.
- No automated test files, test scripts, or test dependencies will be introduced. The repository owner explicitly removed automated test tooling; verification is manual plus lint and production build checks.
- Exercise the RPC with anonymous and authenticated roles for owner preview, published lookup, unpublished/unknown parity, cross-account denial, and continued denial of raw profile and result reads.
- Verify aggregates with more than 200 runs, multiple combined modes, equal-WPM ties, differing accuracy, deterministic remaining ties, fewer than four modes, feature ordering, UTC week boundaries, inactive weeks, all three chart ranges, null elapsed values, and zero runs.
- Verify profile mutations for initial claim, lowercase normalization, invalid and reserved handles, duplicate and concurrent claims, unchanged rename, published and unpublished rename, old/new URLs, unpublish, republish, request failure, and clipboard denial.
- Verify navigation for restored sessions, signed-in `/stats`, signed-out `/profile`, direct public links, refresh, back/forward, account-menu destinations, conditional public link, history anchor, and logout returning to typing.
- Verify local ghosts across every combined mode; public and unpublished-owner ghost selection; both race route shapes; direct load, refresh, back/forward, restart, and rematch.
- Verify deterministic target text for word-set version 1, recorded trace interpolation, average-WPM fallback, target clamping, and the generic unavailable state for unsupported versions or missing modes.
- Verify higher-WPM wins, equal-WPM accuracy wins, exact ties, challenged-ghost result comparison, and an independent challenger personal-best state.
- Verify guest local persistence, signed-in local/cloud persistence, and complete isolation of the challenged owner's profile and results.
- Verify the ghost RPC exposes only the selected winner's approved replay fields and that anonymous callers still cannot select raw profiles, results, or samples.
- Verify visible loading, error, retry, empty, not-found, and partial-data states. Confirm an aggregate failure leaves private local/cloud history usable.
- Verify keyboard opening and dismissal of the account menu, focus return, record expansion, chart selectors, activity-ledger roving focus, profile mutations, and visible focus throughout.
- Inspect desktop and 320px layouts for overflow, readable hierarchy, wrapped controls, stacked record rows, usable charts, and reduced-motion behavior.
- Existing private Stats behavior, mode formatting, public profile states, and owner controls are the prior art to extend rather than replace with a separate data model.
- Run lint and the production build after implementation. Record the manual database and browser scenarios with the ticket completion evidence.

## Out of Scope

- Avatars, avatar placeholders, display names, biographies, join dates, levels, XP, badges, achievements, or social links
- Started-test and abandoned-test counts; only completed cloud runs are available
- Estimating elapsed time from configured duration when actual elapsed time was not recorded
- Separate timed-test and word-test categories or changes to typing gameplay and mode generation
- Public individual run history, exact run timestamps, missed keys, raw pace samples, raw keystrokes, or account identity
- Public seeds or replay traces outside the dedicated selected-ghost response
- Editing or uploading custom ghosts, racing non-winning historical runs, or multiplayer live races
- Leaderboards, follows, likes, comments, challenges, profile discovery, or public search
- Redirects, aliases, or rename history for old handles
- Custom domains, QR codes, social preview images, or profile-view analytics
- Publishing local-only guest history or merging local and cloud runs into one profile total
- Cached aggregate tables, scheduled rollups, live subscriptions, or client polling
- A site-wide dark theme or theme selector
- Automated test infrastructure

## Further Notes

- The completed publication foundation and deployed profile migration remain valid. This work adds a new aggregate contract and richer presentation without weakening the existing privacy boundary.
- The public release intentionally supersedes the earlier decision that excluded visitor-selectable date ranges and improvement charts. Public weekly dates are approved only as aggregate UTC buckets.
- The design is inspired by the informational hierarchy of the supplied example, not its visual treatment. KEYSMASH uses typography as identity, ruled score rows instead of cards, a stepped report-style chart, and proportional weekly strikes instead of a square heatmap.
- Personal records lead the story, followed by improvement and activity. Average headline metrics still cover all modes, while personal records and progress remain separated by combined mode.
- Ghost racing is a first-class action on those personal records. Public raceability intentionally permits the winning seed and a derived correct-progress trace while keeping the original result row and raw samples private.
