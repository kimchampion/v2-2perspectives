# Local verification — updated November 14, 2026

This record covers the phone UI in this checkout. The original project was used only as a read-only reference. Source repository: [kimchampion/v2-2perspectives](https://github.com/kimchampion/v2-2perspectives). Browser checks below use the local development server.

## Automated checks

Final source verified with Node v24.22.1:

| Command | Result |
| --- | --- |
| `npm test` | 80 passed, 0 failed, 0 skipped |
| `npm run build` | Passed with Vite 7.3.7 |

The tests include 26 session/domain checks, 9 ColorMind request/validation checks, 11 real-component rendering checks for private response visibility, active-participant avatars, separate drawing/explanation views, optional response parts, drawing retention, and comparison order, 3 handoff navigation regressions, 11 avatar asset/configuration checks, 5 setup/scenario rendering checks, 7 grid-navigation checks, 4 grid-rendering checks, and 4 deployment checks. They cover compiled production HTML and asset prefixes, the local development URL, keyboard boundaries/semantics, nickname/avatar validation, immutable private drafts, explicit empty submissions, submission locking, joint reveal, reset/end clearing, avatar-only reset, all five source asset catalogs, independent eyewear/facial hair, and return to the correct private screen. Catalog failures and timeout/abort behavior use controlled fixtures; these are not live API verification.

## Browser checks

Used the local Vite development server in the Codex in-app browser. The preview is available at `http://127.0.0.1:5173/` while the server runs.

- Checked portrait layouts at 320, 375, 390, and 430 CSS pixels: onboarding, welcome, participant setup, join dialog, perspective, response, comparison, reflection, and reflection dialog. No broken images were observed. Fixed scenario-rail overflow at 320px and verified document width equals the viewport at all four widths, including a 30-character unbroken nickname. Long names also wrap in handoffs and response prompts.
- Exercised all four introduction pages and skip, welcome acknowledgment validation, ground rules, both participant forms, duplicate/empty nickname validation, invalid demo code and accepted `DEMO24`, required scenario selection, and the two assigned perspectives.
- Drew with a pointer using a selected ColorMind color, visually checked the stroke, cleared and redrew, and submitted with an explanation. Also exercised the written alternative and empty response validation.
- Confirmed first-submit and unfinished-response handoffs mount no textarea, canvas, response text, or drawing image. Confirmed both submitted responses appear together, with the partner first in each comparison.
- Opened all five reflection dialogs and checked their four discussion prompts. Checked dialog keyboard trapping, Escape, focus restoration, and canceling end-session confirmation.
- Confirmed a new scenario clears both responses and the reflection choice while retaining participant setup. Confirmed ending clears draft content and a fresh start has empty nickname fields.
- Manually returning through a private handoff preserves the reading screen. The automatic page-hide return decision has regression tests; an actual browser visibility change was not exercised.
- A live ColorMind request succeeded in the browser and showed a labeled ColorMind palette. Live failure/retry was not forced; failure handling is covered by controlled request tests and code review.

Independent specification and code quality reviews were completed. Actionable findings about private-screen resume navigation and long nickname wrapping were corrected and rechecked.

## Response tab revision

Moved “What does this drawing represent for you?” into the renamed **This represents...** tab. The Draw tab now has a Next action that opens the explanation. Participants can still respond entirely in words. Both views share the same private draft, and submitted drawings remain visible with their explanations in the comparison.

Rechecked both views at 320, 375, 390, and 430 CSS pixels without document overflow. In the browser, drew a stroke, switched between views, entered an explanation, switched back and forth, submitted, confirmed the private handoff mounts no response content, then submitted the second participant’s text-only response. The final comparison showed the retained drawing and both explanations. Empty text validation was also checked. Next was verified to open the explanation without submitting or showing a premature error.

## Remaining limitations and future work

- Physical phone touch, mobile Safari, the on-screen keyboard, and hardware safe areas still need device testing. The browser checks used viewport resizing and a mouse pointer, not touch emulation. Reduced-motion styles were reviewed but the OS preference was not exercised.
- Visual implementation used the user-authorized desktop Figma reference because connector access was unavailable. It has not received the user's final visual approval.
- Session codes and QR artwork are explicitly local demonstrations. There is no real QR scanner or two-device connection. The Node/Podman joint-session server is deferred until the UI is approved.
- Responses and reflection choices remain in React memory. Refresh, reset, and end clear participant data. There is no persistence or saved session to resume later.

## Onboarding spacing correction — November 13, 2026

The image grid allowed its artwork to overflow its allocated height on shorter screens, overlapping the heading. The hero now contains the image in a fixed flex item, and the copy has 24px top padding at every breakpoint. All four onboarding pages were checked at 320, 375, 390, and 430px widths with 568, 700, and 932px viewport heights: 48 combinations. Every image fit its container, every image-to-heading gap measured 24px, and no document overflow or broken image was observed.

## Reflection scrolling — November 13, 2026

The reflection page now fills the current browser viewport. The app header, reflection heading and introduction, and both bottom actions remain in view; only the card region scrolls. The region is keyboard-focusable and has room for visible card focus outlines. Other pages retain their normal document scrolling.

Verified fixed header/text/footer geometry and no document overflow at 320, 375, 390, and 430px widths with 568, 812, and 932px heights. Confirmed scrolling reaches the last card, including the bottom of the card region at 320×568. Opened the last reflection dialog at all four widths on the shortest viewport, checked both bottom action dialogs, and checked back/forward navigation to comparison. A mouse-wheel check at 375×812 scrolled only the cards while the header, introduction, and footer stayed in place. Physical touch and mobile Safari remain unverified. All 40 tests and the production build passed after the application changes.

## Compact top spacing — November 13, 2026

Reduced the navigation bar's nominal height from 72px to 56px and removed 16px of top content padding, moving screen headings 32px higher overall. Updated the minimum content-height calculation accordingly. Safe-area padding remains in effect, and navigation buttons retain their 44px touch targets. Onboarding keeps its separate padding and image-to-heading spacing.

Measured the welcome heading moving from y=104px to y=72px at 375×812. Checked welcome, participant setup, scenario, perspective, drawing response, comparison, and reflection at 320, 375, 390, and 430px widths: headings did not overlap navigation, navigation targets stayed at least 44px high, and there was no horizontal document overflow. Rechecked the reflection page at 568px viewport height at all four widths; its cards remained scrollable and both footer actions stayed visible. All 40 tests and the production build passed after the application changes.

## Optional response parts — November 13, 2026

Participants may submit with no drawing, no text, or neither. Both people must still explicitly submit before joint reveal. The comparison displays “[nickname] did not draw anything” and/or “[nickname] did not provide a response.” for missing parts; whitespace-only values count as empty. Messages are derived for display and are not written into drafts. Existing text limits, field-type checks, submission locking, private handoffs, and reset/end clearing remain in place.

In the browser, completed one scenario with both participants leaving drawing and text empty (including whitespace-only text). Confirmed the first handoff mounted no private response elements or missing-content messages. Both comparison orders showed the correct four messages after the second submission. Checked both orders at 320, 375, 390, and 430px with a 30-character unbroken nickname; there was no horizontal overflow or clipped placeholder text.

Started a new scenario, submitted a pointer drawing without text and a text response without a drawing, and checked both comparison orders at the same four widths. The drawing loaded as a local 720×600 PNG, the written text remained present, and only each missing part received a message. Ending cleared participant text and drawing elements. Physical touch and mobile Safari remain unverified. All 46 tests and the production build passed after the application changes.

## Create your person and expression changes — November 14, 2026

Replaced the earlier participant categories with the original brief's heading, supporting copy, nickname field, and five curated controls: hair/head covering, hair color, clothing, accessories, and expression. The later desktop Figma frame supplied the large preview and category-button layout; Skin and Pose controls were omitted following the user's clarification. Appearance is edited during setup. Each participant can change their own expression while composing a response; submission locks it.

Imported a curated local Open Peeps set from the supplied Flat Assets archive. The reproducible importer preserves source vector geometry and validates UTF-8 SVG input, rejects active/remote content, and records original mappings and CC0 attribution. All avatar paths are local. No avatar dependency, API, upload, persistence, or account was added. Independent asset and feature specification/quality reviews completed; the importer encoding finding was corrected and re-reviewed.

Browser verification used the in-app browser and the existing local Vite server:

- Exercised all 22 curated options at 375×812. Each selected state and live preview updated immediately; no broken local image was observed. Visually inspected the composed heads, head coverings, colors, outfits, eyewear, and expressions.
- Checked setup plus all five option dialogs at 320×568, 375×812, 390×844, 430×932, and 1280×812: 30 layout cases. Controls and labels fit, dialogs remained within the centered frame/viewport, and there was no horizontal overflow. Setup scrolls naturally so the Continue action cannot cover the controls.
- Confirmed an empty or name-only form cannot continue, the second participant starts unselected, case-insensitive duplicate names show an inline error, and both avatars/nicknames survive backward navigation.
- Completed both perspectives, changed expressions independently, drew a pointer stroke, submitted one drawing/text response and one empty response, viewed both comparison orders, and reached reflection. The empty participant showed both requested missing-content messages.
- Verified the first-submit handoff mounted no avatar images, canvas, textarea, drawing image, or private response text. The second participant saw only their own setup expression and avatar. New-scenario navigation retained both updated expressions and appearance.
- Checked the response row and expression dialog at all four phone widths, without overflow. The drawing frame remains 280px high, including its border. Enter opened the expression picker, Space selected an expression, Escape closed it, and focus returned to Change expression.
- Confirmed end and reset each return to fresh setup with empty nickname, unselected default example, and disabled Continue. No runtime warnings/errors were recorded in the QA tab.

The final automated suite contains 56 passing tests, and the production build passes. ColorMind automated tests use controlled fixtures; they are not live API checks. Physical phone touch, mobile Safari, the on-screen keyboard, hardware safe areas, and an OS reduced-motion preference remain unverified. The local preview remains running; nothing was committed, pushed, deployed, or published.

## Hair style, bald default, and avatar reset — November 14, 2026

Removed Hair color and its swatch styling, renamed Hair to Hair style, and set the default preview to the existing No Hair artwork. The four remaining controls are Hair style, Clothing, Accessories, and Expression. A Reset avatar button restores the unselected bald/T-shirt/no-accessory/Calm example, preserving the nickname and the other participant. Continue requires a fresh avatar selection after reset; selecting No hair is a valid choice. Reset is allowed only during setup, and the existing submitted-response locks remain intact.

Verified all six hair-style/head-covering selections update the preview and selected state. Customized hair, clothing, eyewear, and expression, then used Space on Reset avatar: all avatar choices cleared while River's nickname remained. Checked the setup heading/reset row and the hair-style dialog at 320×568, 375×812, 390×844, and 430×932. No horizontal overflow, clipped labels, or out-of-viewport dialogs were observed; Reset avatar is a 44px-high touch target. Confirmed selecting No hair enables Continue for a valid name, the second participant starts with the bald default, and navigating back retains the first participant. No runtime warnings/errors were recorded.

Updated default/rendering assertions and added a reducer regression for avatar-only reset, participant isolation, required reselection, and phase locks. All 57 tests and the production build pass with Node v24.22.1. Physical phone touch and mobile Safari remain unverified.

## All face elements under Expression — November 14, 2026

Added all 30 SVGs from the archive's Separate Atoms/face directory to both expression pickers, including Blank, Cyclops, Monster, and all smile/grin variants. The six existing expression IDs remain compatible. The importer checks its mappings against every face SVG in the local archive, validates the originals, and imports the additional 24 files without altering their geometry. The generated set now contains 67 files, including 65 SVGs and 30 faces. No additional service or dependency is used.

The expression modal keeps its heading, live preview, and Done button in view while only its choice grid scrolls. Checked all 30 selections in the browser: each selected state, modal preview, and main preview matched the chosen local asset. Verified both setup and response pickers at 320×568, 375×812, 390×844, and 430×932; all 30 choices were present, labels fit without horizontal overflow, and the preview and Done button stayed visible. The shortest viewport retained a 190px scrollable grid. Space selected Cyclops, Escape closed the dialog, and focus returned to Expression.

Continued both participants through setup and the scenario, changed River's face from Cyclops to Monster while responding, submitted, and confirmed the handoff mounted no avatar assets or response inputs. Sky retained only their own Happy expression; both explicit submissions opened the joint comparison. No runtime warnings/errors were recorded. Added a regression proving all 30 source faces are mapped to selectable options and used new face IDs in the expression privacy/submission-lock check. All 58 tests, the deterministic importer check, and the production build pass under Node v24.22.1. Physical phone touch and mobile Safari remain unverified.

## Complete appearance catalogs and unclipped previews — November 14, 2026

Expanded Hair style to all 46 heads, Clothing to all 30 bodies, and Accessories to all 9 accessories and 17 facial-hair elements from the supplied archive. Accessories contains separate eyewear/accessory and facial-hair groups; either may be cleared independently. Added a whitelisted facialHair field to the avatar configuration. The bald default, nickname retention on avatar-only reset, independent participants, and submission locks remain in place.

Investigated the reported clipping with the actual local vectors. Many head paths extend beyond their original 473×567 SVG frame. A side-by-side browser comparison confirmed that referencing the original vector group renders the complete Long Afro where an SVG image clipped it. Renderable files now expose a validated avatar-part group; the app uses local SVG use references at the original bust placements. The importer validates unchanged vector XML and dimensions, retains raw original heads, and leaves title/desc outside the rendered group to prevent source-name tooltips. Head preview bounds cover the measured union of all 46 heads, and the full preview uses the complete 1136×1533 source canvas. The main display is wider with reduced horizontal inset and a 280px image area.

Removed visible names beneath expression faces, the selected-expression caption, and the emotion name in the response row. Descriptive option labels and avatar descriptions remain available to screen readers. SVG parts are hidden from accessibility independently, preventing source artwork names from leaking into option labels.

Browser checks used the in-app browser and local Vite server:

- Selected all 132 catalog choices: 46 heads, 30 bodies, 30 faces, 9 accessories, and 17 facial-hair choices, including None. Every selected state and live/main preview matched; all nonempty vector groups rendered and fit their preview bounds. Changing eyewear preserved facial hair and vice versa. All 30 expression captions were visually hidden.
- Checked all four category dialogs at 320×568, 375×812, 390×844, and 430×932: 16 cases. Dialogs, preview, Done button, option labels, and scrolling regions fit without horizontal overflow.
- Checked the main preview with Long Afro, Pointing Up, Glasses 5, and Full Beard 4 at all four widths. All artwork fit; measured SVG display widths were 278, 329, 344, and 384px respectively.
- Reset a complex avatar and confirmed the nickname stayed while eyewear/facial hair cleared, the bald example returned, and Continue required a new selection.
- Created distinct expanded avatars for River and Sky. Changed River's expression with Enter/Space, closed with Escape, and confirmed focus restoration and unchanged appearance/facial hair. The response row displayed no emotion name. Private handoffs mounted no avatar SVG parts, response inputs, or private feeling names. Sky saw only their own Beanie/Gaming/Eyepatch/Goatee configuration. Both submissions opened comparison.
- Chose a new scenario, navigated back to both setups, and confirmed all seven avatar fields remained. Ended the session and checked fresh empty setup with no hair/accessory/facial hair and disabled Continue/Reset. No runtime warnings/errors were recorded.

Independent focused feature and importer reviews approved the final changes. The deterministic importer check verifies all 318 files, including 316 SVGs, all 132 source assets, unchanged vectors, and six encoding guard probes. All 63 tests and the production build pass with Node v24.22.1. Physical phone touch, mobile Safari, on-screen keyboards, hardware safe areas, and an OS reduced-motion setting remain unverified. The preview remains local and running; nothing was committed, pushed, deployed, or published.

## Persona heading and supporting copy — November 14, 2026

Updated the shared setup screen to the exact heading “Persona” and supporting sentence “Create an avatar that feels like you.” Both participant screens show the new copy. Checked the first setup at 320, 375, 390, and 430px without horizontal overflow and continued to the second participant to verify the shared wording. Updated the existing copy assertions and current screen map. All 63 tests and the production build pass.

## Avatar flush bottom border — November 14, 2026

Removed the primary preview's 12px bottom padding and trimmed its empty SVG canvas to the selected body's measured vector base. The 30 base coordinates are stored as clothing metadata; source geometry, full preview width, and other avatar views remain unchanged. The default example hint now sits below the border.

The initial default preview had about 71.7px between artwork and the inner bottom border. Checked every body option at 375×812: all 30 reached the border within 0.001px, with no clipped artwork. Checked Long Afro with Whatever at 320, 375, 390, and 430px: measured gap was 0px, all artwork fit, and the document had no horizontal overflow. Reset and the second participant's default preview also measured 0px, with the hint outside the frame. No runtime warnings/errors were recorded. All 63 tests and the production build pass with Node v24.22.1. Physical phone testing remains outstanding.

## Avatar 36px top gap — November 14, 2026

Set the main preview's top gap to 36px from the inner border to the visible artwork, preserving its 0px bottom gap. Added measured head-top coordinates alongside the body-base metadata, trimmed the unused top canvas, and adjusted the SVG's displayed height to preserve the existing artwork scale. Other avatar views retain their prior framing.

The bald default previously had about 63px above its artwork. Checked all 46 heads and all 30 body choices at 375×812: top spacing remained 36px and bottom spacing 0px within 0.001px, with no clipped artwork. Checked Long Afro/Whatever at 320, 375, 390, and 430px without overflow. Reset and the second participant's default also measured 36px/0px. No runtime warnings/errors were recorded. All 63 tests and the production build pass with Node v24.22.1. Physical phone testing remains outstanding.

## Keyboard selection grids — November 14, 2026

Added a shared SelectionGrid component to all avatar choices (including response expressions and the two independent accessory groups), scenario cards, and reflection cards. Uses the W3C [layout-grid pattern](https://www.w3.org/WAI/ARIA/apg/patterns/grid/) and [keyboard conventions](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/): one roving tabindex=0 per grid, logical rows/gridcells containing native buttons, arrow-key focus movement, explicit Enter/Space activation, row Home/End and whole-grid Control/Command+Home/End. Tab/Shift+Tab leave or enter the group. Arrow focus never selects or opens a dialog. Existing pressed states, labels, expression-label hiding, and local state/privacy guards remain.

Native modal boundary Tab navigation initially escaped to the document body in the in-app browser. Added boundary-only wrapping to the shared dialog according to the [modal-dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/), filtering inactive/disabled/nonrendered controls and preserving interior native Tab order. At the shortest phone height, a reflection card could be taller than its scrolling region and native nearest scrolling hid its label. Oversized focused cards now align within that nearest vertical scroller; the header and bottom actions stay in place.

Browser verification used actual keyboard events in the local in-app browser:

- Hair style: Close → Tab entered the first/selected option; arrows moved by columns/reading order without selecting; Space and Enter selected; Home/End and Control/Command+Home/End reached correct boundaries. Tab left for Done, Shift+Tab returned to the last focused option. Escape returned focus to Hair style; reopening started at the selected choice.
- Clothing, expression, and independent eyewear/facial-hair groups behaved consistently. Verified the complete forward/reverse modal sequence Close → eyewear → facial hair → Done, including both boundary wraps, plus the join dialog and single-Close reflection dialog. Focus and selected state remained distinct.
- Checked the last focused item in five avatar grids at 320×568, 375×812, 390×844, and 430×932: 20 cases. Each grid had one Tab stop, the full 7px focus-ring extent fit within the scroller, dialogs/actions stayed visible, and no horizontal overflow occurred.
- Scenarios: Tab entered the first card and left for Continue; arrows changed focus without choosing. Enter selected. Home/End scrolled the first/last cards fully into view at all four phone widths: 8 cases without overflow.
- Response expressions: reopening focused the participant's selected face; keyboard selection changed only their expression. First-submit handoff contained no private avatar parts, textarea, or canvas. The second participant did not see the first expression. Both submissions opened comparison.
- Reflection: Tab entered Repair and left for End Session; arrows did not open a dialog or select a path. Enter opened Pause and Escape returned focus to that card. Checked first/last focus at the four phone sizes plus 1280×812: 10 cases. Focused labels and the focus indicator remained visible, the footer stayed in view, and the document did not overflow.
- Ended the synthetic session, began again, and verified fresh persona selection with a visible focus outline separate from the selected choice. No runtime warnings/errors were recorded.

Independent focused reviews approved the component, integrations, modal boundary fix, and oversized-card scrolling. All 74 tests and the production build pass with Node v24.22.1. Browser keyboard/DOM checks do not constitute testing with physical VoiceOver/NVDA or a mobile external keyboard; those checks remain outstanding.

## Avatars beside screen introductions — November 14, 2026

Used the three user-supplied screenshots as the visual reference. Added a shared responsive avatar/text row: the first participant’s avatar beside the scenario greeting and introduction, and the active participant’s avatar beside Scenario setup and the response prompt. The square avatar slot scales from 80px at 320px viewport width to 100px at 400px and above, with an 8px text gap. Uses each participant’s existing local vector configuration, including their current expression. The response expression control now sits below the prompt beside the same avatar. Existing drawing/explanation tabs, 280px drawing surface, and submission behavior remain in place.

Checked 28 layout cases in the in-app browser: scenario selection plus both participants’ perspective, drawing, and explanation screens at 320×568, 375×812, 390×844, and 430×932. Each screen mounted one correctly configured avatar; avatar boxes remained square, the text gap measured 8px, and document width matched the viewport. Checked a 30-character unbroken nickname and the wide Long afro artwork. Keyboard activation opened Change expression, Space selected Happy, Escape returned focus to the trigger, and only that participant’s face updated.

Continued both responses through the private handoff, joint comparisons, and reflection. Handoffs mounted zero avatar parts, canvas elements, or textareas, and no submitted sample text. The second participant retained their separate Beanie/Calm avatar. Ending cleared the sample session; a fresh setup had an empty nickname, the bald default, and disabled Continue. No browser warnings/errors were recorded. Screenshots are saved in ignored test-results/avatar-perspective.png and test-results/avatar-response.png. Added scenario-avatar identity and perspective-isolation regressions. All 76 tests and the production build pass with Node v24.22.1. Physical phone touch, mobile Safari, hardware safe areas, and screen-reader testing remain outstanding.

## Avatar 16px top gap and larger change previews — November 14, 2026

Reduced the main avatar frame’s top padding from 36px to 16px while retaining the 0px bottom gap. Increased the live preview in appearance/expression dialogs from a 100–160px height to 140–220px, filling the available dialog width. Short viewports use a smaller responsive cap so choices retain enough scrolling space for keyboard focus outlines. At 375×812 the preview area is 301×220px, previously 301×160px. At 320×568 the final preview is 254×140px, previously 254×113.6px. Option thumbnails remain 64×64px.

Checked the default and Long afro/Whatever main previews at 320, 375, 390, and 430px: top spacing measured 16px and bottom spacing 0px, with no document overflow. Checked all four appearance/expression dialogs at those phone widths; the preview and Done action stayed visible and choices remained scrollable. Increasing the preview initially clipped part of the last hair option’s focus outline at 320×568. After adjusting the short-height sizing, checked the last option in all five independent grids at that viewport: each full 7px focus outline fit inside its scroller, and Done remained visible. Keyboard Tab reached Done and Escape closed the picker. Browser logs contained no warnings/errors. All 76 tests and the production build pass with Node v24.22.1. Screenshot evidence is in ignored test-results/avatar-top-gap-16.png and test-results/larger-avatar-change-preview.png. Physical phone and mobile Safari checks remain outstanding.

## No-expression persona default — November 14, 2026

Added a No expression choice alongside the 30 existing faces and made it the default. It mounts no expression SVG layer; the catalog’s existing Blank artwork is a drawn face and remains a separate choice. Starting setup and Reset avatar now show an empty face. Choosing or clearing an expression preserves the other avatar fields. Participants may continue after any valid avatar choice without selecting an expression, and both expression pickers offer all 30 faces plus No expression.

Updated default configuration, catalog coverage, full-layer placement fixtures, and setup-rendering assertions. Observed the expected test failures before implementation; all 76 tests and the production build then passed with Node v24.22.1. In the browser, verified Persona and the expression picker at 320×568, 375×812, 390×844, and 430×932: no horizontal overflow, zero face layers initially, all 31 choices present, and Done visible. Verified keyboard selection of No expression and Happy, reset to the empty face with nickname retained, and the independent second participant’s expression-free default.

Continued both participants through a scenario. In the response picker, selecting Happy mounted its face and selecting No expression removed it without changing appearance. Both no-expression participants submitted successfully and opened joint comparison. The private handoff mounted no avatar parts, canvas, or textarea, and the partner retained their independent Hoodie/no-expression avatar. No browser warnings/errors were recorded. Screenshot evidence is saved in ignored test-results/persona-no-expression.png. Existing user preview data was left in place; isolated test tabs were closed. Physical phone, mobile Safari, and screen-reader checks remain outstanding.

## Larger framed avatar preview from supplied mockup — November 14, 2026

Replaced the floating head preview in Hair style, Accessories, and Expression dialogs with the complete avatar bust used by the main Persona preview. Clothing now uses the same framing too. All four dialogs show the participant’s actual hair, clothing, accessories, facial hair, and expression inside a bordered frame, with 16px top padding and the artwork aligned to its base. The preview trims unused source canvas through the existing renderer; original vectors and option thumbnails are unchanged. Taller phone frames now grow to 260px, with the compact short-screen sizing retained so choices and Done stay usable. The main Persona frame and no-expression default remain in place.

Checked 16 dialog/layout cases at 320×568, 375×812, 390×844, and 430×932 using Long afro/Whatever/Happy. Every live preview included the selected body, choices scrolled, Done stayed visible, and the document did not overflow. Frame heights measured 140px, 259.84px, 260px, and 260px respectively. At 375×812 the framed area is 301px wide with about 242px of image height inside its border and padding. Checked last-option keyboard focus in all five independent grids at 320×568; every full focus outline fit inside its scroller. Escape returned focus to Expression. Reset returned to the bald, no-expression T-shirt avatar, including in the new framed preview. No browser warnings/errors were recorded.

Saved the user-mockup comparison screenshot in ignored test-results/framed-avatar-preview.png. All 76 tests and the production build pass with Node v24.22.1. Physical phone, mobile Safari, and screen-reader checks remain outstanding. Isolated test tabs were closed and the existing local preview was retained.

## GitHub Pages build and asset paths — November 14, 2026

Diagnosed the blank hosted page: Pages used legacy branch publishing from main’s repository root and served an empty React root with a /src/main.jsx module reference. Production also assumed root-relative assets, although the project is mounted at /v2-2perspectives/. Added a Node 24 GitHub Actions workflow that installs with npm ci, tests, builds, uploads dist, and deploys the built artifact. Build and preview configurations use the project base; development retains /. Illustrations and all composed avatar SVG references now use Vite’s BASE_URL, including the existing avatar-part fragments. The favicon uses the same configured base.

Observed three deployment regressions fail before the fix: compiled entry paths, illustration URLs, and avatar URLs. All 80 tests and the production build passed after the fix. Checked the real production preview at http://127.0.0.1:4173/v2-2perspectives/: onboarding, Persona, and scenario selection at 320×568, 375×812, 390×844, and 430×932 had no horizontal overflow, missing images, or incorrect asset prefixes. Continued both participants through perspectives, response expression changes, written submissions, joint comparison, and reflection at 430px. The private handoff mounted no avatar, canvas, textarea, or submitted sample text. Actual rendered avatar parts and illustrations loaded under the project path. Browser logs contained no warnings/errors. A focused independent review approved the deployment changes; Pages must use GitHub Actions as its source for the workflow deployment. Physical phone and mobile Safari checks remain outstanding.
