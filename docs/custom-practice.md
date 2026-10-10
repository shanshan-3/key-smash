# Timed custom practice

Choose Custom, paste or write a passage, and select **Use this text**. The editor accepts up to 2,000 entered UTF-16 code units, including whitespace. Applying text trims its ends and replaces consecutive whitespace with one space; case, punctuation, and other characters remain intact. Invalid drafts leave the applied passage unchanged.

Practice repeats the passage until the selected 15, 30, 60, or 120-second timer expires. The first typing keystroke starts the timer. Editing a draft leaves the attempt intact; applying text, changing the timer, or retrying resets it. Abandoned attempts are not saved.

Completed runs appear as **Custom practice / <duration>s** in local history. They never update personal bests, standard averages, profile statistics, cloud results, or ghosts. History stores metrics without the passage or seeded replay data. If storage fails, results remain available for the current session with visible feedback.

The last applied normalized passage and custom timer are remembered in this browser under `keysmash-custom-setup-v1`. Select Custom after refreshing or reopening to resume the setup; restoration never starts a run. Unapplied drafts, invalid input, and standard timer changes do not replace it. There is no account sync or passage library.

Missing or corrupt settings fall back to an empty passage and a 60-second timer. Text and duration are validated independently, so a valid saved field can survive damage to the other. Blocked, full, or unreadable storage leaves the current setup usable for this visit and shows a message beside the editor. Successfully applying text or changing a custom timer saves again and clears the warning when storage recovers.

## Verification

Run `node --test tests/auth.browser.test.mjs tests/custom.test.mjs`, `npm.cmd run lint`, and `npm.cmd run build`. Browser tests need Chrome at its default Windows installation path or `CHROME_PATH`. Authentication responses are local HTTP fixtures; no real account or cloud writes are needed. `KEYSMASH_TEST_ROOT` can point the browser suite at an isolated checkout.

Coverage includes all timers, validation at 2,000/2,001 characters, normalization, native editor paste, Unicode, repetition and paging, known scoring errors, abandoned-run resets, mixed history and PB isolation, signed-in cloud isolation, blocked/full storage, 320px keyboard use, standard saving afterward, and a standard PB ghost race. The suite also retains the persistent-login checks.

Setup checks cover guest and signed-in refresh/reopen, unapplied and invalid drafts, custom versus standard timers, corrupt or unsupported saved fields, and blocked, full, and read-failing settings storage with visible 320px feedback. Authentication uses fixtures rather than live provider calls.
