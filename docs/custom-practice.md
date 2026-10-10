# Timed custom practice

Choose Custom, paste or write a passage, and select **Use this text**. The editor accepts up to 2,000 entered UTF-16 code units, including whitespace. Applying text trims its ends and replaces consecutive whitespace with one space; case, punctuation, and other characters remain intact. Invalid drafts leave the applied passage unchanged.

Practice repeats the passage until the selected 15, 30, 60, or 120-second timer expires. The first typing keystroke starts the timer. Editing a draft leaves the attempt intact; applying text, changing the timer, or retrying resets it. Abandoned attempts are not saved.

Completed runs appear as **Custom practice / <duration>s** in local history. They never update personal bests, standard averages, profile statistics, cloud results, or ghosts. History stores metrics without the passage or seeded replay data. If storage fails, results remain available for the current session with visible feedback.

Remembering the passage and timer across visits is ticket 02 and is not implemented here.

## Verification

Run `node --test tests/auth.browser.test.mjs tests/custom.test.mjs`, `npm.cmd run lint`, and `npm.cmd run build`. Browser tests need Chrome at its default Windows installation path or `CHROME_PATH`. Authentication responses are local HTTP fixtures; no real account or cloud writes are needed. `KEYSMASH_TEST_ROOT` can point the browser suite at an isolated checkout.

Coverage includes all timers, validation at 2,000/2,001 characters, normalization, native editor paste, Unicode, repetition and paging, known scoring errors, abandoned-run resets, mixed history and PB isolation, signed-in cloud isolation, blocked/full storage, 320px keyboard use, standard saving afterward, and a standard PB ghost race. The suite also retains the persistent-login checks.
