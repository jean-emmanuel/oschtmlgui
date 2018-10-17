# Changelog

## 0.38.0

- bug fixes
  - `@{parent}` calls not working consistently in clone widgets
  - `slider/pads`: inteverted ranges not working
  - fix `doubleTap` for sliders with `snap` set to `true`
- editor
  - major performance improvements (containers' children are reused whenever possible instead of being recreated)
  - removed widget deletion confirmation popup
  - properties categories can now be folded
  - added keyboard shortcut `F2` for editing the label quickly
  - added keyboard shortcut `mod + s` for saving the session
  - use `backspace` instead of `delete` for deleting widgets on MacOs
  - added keyboard shortcut `mod + e` for enabling / disabling the editor
  - added keyboard shortcuts `mod + arrows` for selecting widgets
  - added keyboard shortcut `mod + a` for selecting a widget's siblings and itself
  - added keyboard shortcut `mod + shift + a` for cancelling selection
  - added multi widget selection with mouse when `shift` is pressed
  - right-click doesn't modify current selection when `mod` or `shift` is pressed
- formulas
  - added `extend(x, y)` function for merging two objects
  - objects' closing brackets (`}`) don't need to be escaped with a backslash anymore

## 0.37.4

- bug fixes
  - osc receivers (`OSC{}`) not working in non-dynamic properties
- remote control
  - added `/GET/#` to get a widget's value without using `/GET` as reply address

## 0.37.3

- bug fixes
  - gyroscope: osc sendings not properly triggered on value updates


## 0.37.2

- bug fixes
  - osc: regression making empty `preArgs` count as one empty string argument

## 0.37.1

- bug fixes
  - closing popups when clicking precisely on the "x"
- translations
  - fr: corrections
  - ru: added russian translation

## 0.37.0

- bug fixes
  - editor: opening the sidepanel doesn't select the root widget anymore
  - ios: fix `doubleTap`
- widgets
  - **new** `gyroscope` widget
  - **new** `frame` widget
  - **breaking change** in `panel`: dropped Visual Format Language support (`layout` and `spacing` properties)
  - maths: added `timestamp()` function
- editor
  - widget property names can be clicked to show documentation
- misc
  - the client app can be translated (https://github.com/jean-emmanuel/open-stage-control/issues/302)

## 0.36.0

- bug fixes
  - `linkId` synchronizations now correctly trigger property updates
  - widgets with multiple `linkId` are now properly handled
  -  synchronization issue between `visualizer` widgets
- widgets
  - `keys` (**breaking changes**): formulas in `keydown` and `keyup` must be explicitely written using the `#{}` syntax; variable `value` got removed from these formulas context (use `@{this}` instead); removed `widgetId` property, the value emitted by the widget on keypress events can be linked with other widgets via the `linkId` property or the property inheritance syntax;
  - `visualizer`: update rate set to default canvas framerate
- editor
  - **new** keyboard shortcuts (undo, redo, copy, paste, etc)

## 0.35.0

- main
  - added `--state` option for loading a state file with a session file
- state
  - loading a state file doesn't replace the quick save slot anymore
- widgets
  - **new** `script` widget
- misc
  - reduced session file size (indentation set to 2 instead of 4)

## 0.34.4

- bug fixes
  - widgets: dynamic `address` when `split` is `true`
  - strip: missing osc properties (`address` and `preArgs`) for remote control
  - switcher: update linked widgets' osc properties before sending if they depend on the switcher's value

## 0.34.3

- bug fixes
  - launcher: regression breaking the `port` option

## 0.34.2

- bug fixes
  - matrices: spacing issue when wrapped in strips
  - launcher: regression preventing options to be applied

## 0.34.1

- bug fixes
  - switch: display object-values properly when `showValues` is set to `true`
  - prevent non-dynamic properties updates from breaking an osc sending event chain
- deprecations
  - `formula` has been removed from the editor's context menu
- custom module
  - expose `app` to the custom module's scope: an event emitter for monitoring the events sent by the different clients
- misc
  - fixed rpi build

## 0.33.3

- bug fixes
  - matrix: recreation loop issue with matrices of clones
  - multixy: glitch when some letters are used in the points' labels

## 0.33.2

- bug fixes
  - matrix: set initial value at widget's creation; missing border under widget's label
- widgets
  - property math syntax: add `values()` and `keys()` functions

## 0.33.1

- bug fixes
  - widgets: remove unnused properties to avoid having hidden properties laying around when the type changes (especially dangerous when those properties where linked to other widgets)

## 0.33.0

- bug fixes
 - osc receivers: unregister properly when widgets are recreated (memory leak); allow non-string values (eg. objects)
 - circular property update issues
- widgets
  - **new** generic `matrix` widget
  - fader: restore right-click focusing the input in compact mode (mouse only)

## 0.32.6

- bug fixes
  - css border-radius not applying correctly for some widgets
- themes
  - multiple adjustments

## 0.32.5

- bug fixes
  - missing feedback support for widgets with typed preArgs
- themes
  - improved `dark` theme
  - added `flat`

## 0.32.4

- bug fixes
  - regression breaking typed osc args


## 0.32.3

- bug fixes
  - regression in editor/resize function

## 0.32.2

- bug fixes
  - sliders colors not displayed correctly on iOS
- widgets
  - xy: tiny knob style change
- editor
  - reallow editing disabled properties

## 0.32.1

- bug fixes
  - error in osc receivers

## 0.32.0

- main
  - add tcp support

## 0.31.0

- bug fixes
  - regression breaking multitouch widgets
- widgets
  - fader/knob/pad: right-click / long tap doesn't give focus to the input anymore

## 0.30.4

- bug fixes
  - regression breaking touch traversing gestures
  - clone widgets becomming unselectable for edition
  - `preArgs` property still being coerced to an array

## 0.30.3

- bug fixes
  - big regression breaking many touch gestures

## 0.30.2

- bug fixes
  - broken remote-control /TABS command
  - disabled `spacing` property in strips
  - disabled properties in modals
  - broken arm build


## 0.30.1

- midi
  - prevent the main process from exiting when MIDI setup fails

## 0.30.0

- widgets
  - `target` and `preArgs` properties are no longer coerced to arrays and can be written as single string values
  - `linkId` supports master and slave modes with `>>` and `<<` prefixes
  - the special `target` token `null` can now be used in conjunction with regular targets, it disables the default global targets set via the `--send` option
- editor
  - disabled widget properties are now greyed out

## 0.29.2

- bug fixes
  - launcher: parsing errors are not fatal anymore
  - css parsing error on iOS

## 0.29.1

- bug fixes
  - editor: "wrap" deleting the widget just before the one being wrapped
  - regression breaking traversing gestures and high precision gestures (0.29.0)
- server
  - allow sending osc to broadcast ip addresses
- widgets
  - limited support for property inheritance nesting (`@{id_@{id_2}}`)
  - support using property inheritance syntax in osc listeners' addresses

## 0.29.0

- beaking changes
  - dropped supported for `.js` sessions (deprecated in 0.20.0)
- bug fixes
  - zeroconf: unpublish when shutting down
  - ios 9.3 compatibility issue
  - function mispelling in rgb widget
- widgets
  - modal: added `popupLeft` and `popupTop` properties
  - faders/meter: add css variable `--gauge-opacity` to allow setting a fixed gauge opacity for meters and compact faders
- custom module
  - messages converted from midi inputs can be filtered


## 0.28.3

- bug fixes
  - widgets not correctly drawn when hidden/shown with dynamic css
  - iOS: file upload failing sometimes
- widgets
  - knob: small design improvements (pips don't take extra space anymore)   

## 0.28.2

- bug fixes
  - session list: fix "remove from history" always removing the first item in the list
- custom module
  - expose `setInterval`
  - expose `clearTimeout` and `clearInterval`
  - prevent errors when failing to run the module    


## 0.28.1

- bug fixes
  - regression in nested clones structures handling


## 0.28.0

- widgets
  - matrices: support setting `split` property as a string to allow using children's indexes in their address (`$` is replaced with the index number)
  - text: `wrap` property doesn't break words by default anymore
  - rgb: added `range` property
- launcher
  - right-click context menu (copy, paste, clear console, toggle console autoscoll, relaunch app)
  - better font for the console

## 0.27.2

- bug fixes
  - session/state file upload sometimes failing silently
  - regression breaking the app for iOS

## 0.27.1

- bug fixes
  - error when resizing a widget and its clone(s) at the same time
  - error with non string css property
  - session list not reappearing when failing to load
  - broken state file loading
- misc
  - added a loading indicator when uploading a session file or a state file

## 0.27.0

- bug fixes
  - strip: nested strips were inheriting their parent's `spacing`
  - modal: prevent error when retrieving a child's property
  - modal: prevent touch event from affecting elements behind the popup when closing it
  - clone: some properies in target widget were not applied to the clone
  - clone: prevent clone from resetting its target value when created
  - text: vertical centering issues in narrow widgets
  - dynamic properties: when using a widget's own value to determine its osc settings, these are checked and updated if needed before sending the message
  - prevent error when loading a session containing invalid property inheritance calls
  - broken build for iOS 9.3
- editor
  - wrap in: insert wrapper at selected widget's index
  - wrap in: set label to false by default when wrapping in a strip or a panel
  - css property `pointer-events:none;` is now ignored when the editor is enabled
  - preverve pecentages when dragging/resizing a widget that has its position/size written in percents
- widgets
  - **new** `OSC{/address, default_value}` syntax
- ui
  - sidepanel is now resizable
- themes
  - `responsive-fonts`: increase size for big screens
- build
  - dropped support for node < 4.8

## 0.26.3

- bug fixes
  - ios: broken default accent color in clone Widgets
  - ios/android: closing the sidepanel opened the tab next to the menu button
- editor
  - mac: use `shift` instead of `command` for multi widget selection to match native behaviour and prevent unwanted zoom with trackpads
- widgets
  - strip: `spacing` now accepts percents

## 0.26.2

- bug fixes
  - regression preventing glass effect from using the widget's color
  - missing last key in keyboard widget
  - editor: select parent widget after deleting a widget
  - regression letting user to scroll the main document
  - editor: wrap/cut/delete multiple widget not working properly
- widgets
  - text: set line-height relative to font size
  - meter: added `gradient` feature

## 0.26.1

- bug fixes
  - ios: text input fields not editable
- editor
  - mac: use `command` instead of `ctrl` for multi widget selection

## 0.26.0

- bug fixes
  - editor: when selecting another widget while editing a property, changes where applied to the newly selected widget
  - widgets: css: @media queries parsing
  - prevent some errors when synchronizing clients
  - use command key instead of ctrl for zooming on mac
  - clone: memory leak / freeze
- default client
  - mac: disabled unsupported pinch zoom
- themes
  - alt-buttons: modal font-weight & color fix; push button active state colored border
  - added "responsive-fonts" theme
- editor
  - allow multi widget resizing/dragging
  - tweaked ctrl+click/right-click selection behaviors
  - **new** "Wrap in" context menu


## 0.25.0

- bug fixes
  - launcher: parse array options correctly when an item contains spaces,
  - launcher: the terminal now grows and scrolls to bottom automatically
  - editor: broken children reordering; children
   list display bug with long `id`s
- main
  - add `--fullscreen` switch (default gui only, bypasses the sidepanel fullscreen button)
  - added/updated some themes: `orange`, `light`, `dark`, `alt-buttons` (the latter can be combined with other themes)
- widgets
  - knob: big knobs design tweaks
  - **new** `default` property that sets a widgets initial/doubleTap/spring value. The `value` property does no longer serve this purpose.
  - **new** `bypass` property that disable osc messages (except when requested via `/GET` and `/EDIT/GET`)
  - panel: **removed** `noSync` property (backward compatible fallback to `bypass`)
  - property inheritance: `@{widget_id.value}`, `@{widget_id}` and `@{widget_id._value}` now all refer to the widget's current value (the latter being kept for backward compatibility); If a property update triggers an osc message, it will now be sent after the other dynamic properties changes are resolved (such as osc `address`, `target`, etc)
  - text: added `align` and `wrap` properties
  - input: added `align` property
  - sliders/xy: `doubleTap` can be an osc address to send a special message instead of resetting the widget's value
- editor
  - allow selecting multiple widgets (`ctrl + click`) if they share the same parent. Context-menu and sidepanel editing actions apply to all selected widgets

## 0.24.3

- bug fixes
  - property maths: variables names declared in a formula were replaced by their associated value if found in the formula's result
  - missing console logs on windows
- ui
  - add iOS fullscreen support via add-to-home feature
- editor
  - ask for confirmation when closing or refreshing the page if the editor has been enabled at least once
  - prevent default widget interaction when selecting a widget for edition
- widgets
  - knob: small design tweaks
- misc
  - remove proprietary ffmepg codec from package

## 0.24.2

- bug fixes
  - macOs app menu & shortcuts

## 0.24.1

- bug fixes
  - server/client communication errors
  - prevent error windows from spawning
- main
  - added some menu items on macOs (including "Quit" !)

## 0.24.0

:warning: **BREAKING CHANGES** :warning:

Read the changelog carefully, old sessions files are likely to need some adjustements to work as they used to. Plots and input widgets had their `widgetId` option removed because it was redundant with the generic `linkId` property.

- bug fixes
  - regression preventing dropdown to display no option selected
  - crossfaders display issue on iOS
  - restored compatibility options for server-client communications  
  - xy: `doubleTap` option
  - range: `spring` option
  - plot: crash when drawing only one point
  - widget css: fixed @media queries @keyframes parsings
- main
  - theme files changes are automatically applied
  - server-client communication system rewritten -> HUGE latency reduction and stability improvement especially under stress conditions
  - engine update (electron@1.8.2)
- widgets
  - **new** svg plot widget
  - switch: wrap non-array `values` property in an array
  - dropdown: wrap non-array `values` property in an array; always add a default empty value
  - property inheritance: added shorthand default to `_value` when no property is specified (`@{widgetId}`); some properties can now be dynamically changed without recreating the widget entirely
  - property maths: added support for math expressions everywhere via `#{}`
  - input: add glass effect when `editable` is `false`
  - `linkId` can now be set as an array of linkIds
  - plot: added `dots` options; **removed** `points` options (use `value` and property inheritance instead)
  - eq:  **removed** `filters` options (use `value` and property inheritance instead)
  - plot/meter/led/rgbled/text: **removed** `widgetId` option
  - input: **removed** `widgetId` option
  - math: **deprecated** `formula` widget

## 0.23.1

- bug fixes
  - regression breaking modal's position in scrolled tab containers
  - widget with a `touchAddress` set now send their touch-off message when removed or recreated while being interacted with
  - broken windows builds (long path issue)

## 0.23.0

- bug fixes
  - plots now send their value to other widget for synchronization as expected
  - text widgets now apply their target widget's precision
  - property inheritance accepts targetting a parent widget by its id
  - multiple icons not displayed correctly
  - broken `--blank` option
- main
  - added `--disable-gpu` option for disabling hardware acceleration (fixes rendering glitches and reduces input lag on some systems)
- widgets
  - inputs: **new** `keys` widget, for keyboard bindings
  - property inheritance: new special property name `_value` (retrieve the widget's value, and update when it changes)
  - switch: added `showValues` to display both values and labels in the buttons; array values can now be selected via osc
  - range: both handles can be moved by holding `shift` while dragging
  - rgb: **removed** `touchAddress` option
  - labels/texts: multiple white spaces are no longer merged
  - plot: can receive stringified arrays of coordinates or stringified objects for merging coordinates sets; added `bars` option for drawing barcharts;
  - widgets' `precision` option allows setting a specific data type for numbers (sliders can send doubles !)
- misc
  - event system rewritten
  - js build size reduced

## 0.22.0

- bug fixes
  - sessions opened from command line with relative paths are now added to the history with their absolute path
  - sending an empty message to a `text` widget resets it to its initial value and without ignoring its `value` property
  - sending no value to a widget with `preArgs` is now possible : all the arguments found in incomming osc messages are now taken into account to match the widgets in the session
  - regression breaking state quicksave from sidepanel
- engine
  - downgraded to the latest *stable* electron release
- main
  - added `zeroconf` / `bonjour` publishing for the app's http and osc input ports
  - added `--instance-name` option to differenciate mulitple instances in zeroconf networks
- widgets
  - sliders/pads: holding `Ctrl` now enables high precision dragging with the mouse and bypasses the `snap` option
  - inputs: renamed `input`'s property `horizontal` to `vertical` to match how the widget actually displays
  - sliders: **new** `range` widget
  - plots: **new** `image` widget
- remote control
  - **removed** deprecated `/EXEC`
  - renamed `/EDIT_SOFT` to `/EDIT/MERGE`
  - added  `/EDIT/GET` (get a widget's data)
  - added `/GET` (get a widget's value)
  - added `/SET` (set a widget's value as if it was interacted with from the interface)


## 0.21.3

- bug fixes
  - session/state: regression (0.21.2) breaking save-to-file function
- ui
  - FontAwesome 5 (icon font) !

## 0.21.2

- bug fixes
  - cli: broken long flag `--no-gui`
  - headless: when running with `node`, errors don't stop the server; when running with `electron` (default), errors are logged in the console instead of being showed in a dialog window
  - switcher widgets regression (broken)
- midi
  - float values are now allowed and automatically rounded
- misc
  - some code refactoring

## 0.21.1

- bug fixes
  - visualizer: fix memory leak when editing; fix ignored `smooth` option
  - plots: regression preventing widgets with no `target` option from receiving messages sent by other clients

## 0.21.0

- main
  - renamed `--sync` option to `--send` (deprecation,  backward-compatible)
- widgets
  - sliders/pads: when receiving feedback while touched, the widget waits to be released before updating to the latest received value.
  - input: the widget's value is no longer validated when leaving focus by clicking somewhere else or hitting the `Tab` key (it must be submitted by hitting the `Enter` key); when submitting a value to another widget, the feedback from this widget doesn't trigger a second osc message anymore; non-editable inputs can't steal focus anymore
  - added support for `null` value in `target` option to disable osc sending
- misc
  - property fields are now parsed using [JSON5](https://github.com/json5/json5), a more flexible notation. Session files are still written in standard JSON format, this is just a way to avoid typing mistakes when using the editor.
  - remote editing also accepts JSON5 notation

## 0.20.3

- bug fixes
  - allow loading `.json` session files from the launcher
- launcher
  - new log/error console (shows once the app is started)

## 0.20.2

- bug fixes
  - pads: regression breaking the built-in input
  - multifader: inverted order in horizontal mode
- widgets
  - plots: add `smooth` option (thanks to [cardinal-spline-js](https://github.com/epistemex/cardinal-spline-js)); draw thicker lines
  - pads: draw thicker inner circle
 - mobile
  - prevent devices from entering sleep mode


## 0.20.1

- bug fixes
  - error popups not created
- misc
  - rename sessions files to `.json`

## 0.20.0

- **breaking changes**
  - sessions are now saved as `.json`files by default (the deprecated `.js` extension can still be opened).
  - states are now saved as `.state` files (the old `.preset` files can be renamed without any problem)
- bug fixes
  - touch release event is properly dispatched in traversing containers (ie keyboards and matrices) (#94)
- widgets
  - css `border-radius` support enhanced
  - css `color` applies locally while `--color-text` applies to children too
  - plot/text: new lines are properly printed
- packaging
  - added `arm64` binaries
- iOS
  - compatibility improved (version 9.3 and above)
- engine
  - electron 1.8.0 (chrome 59)

## 0.19.6

- hot fix
  - broken formula widget

## 0.19.5

- launcher
  - fixed typo in new version message
- misc
  - client-side javascript's size reduced, now for real !!

## 0.19.4

- bug fixes
  - buttons: changing `css` background works as expected
  - widgets: changing  `css` (text) color works as expected
  - fader: fix hidden input in horizontal + compact mode
  - pads: pips scaling bug
- widgets
  - `css` font-sizes apply correctly to all children (better use percents)
  - formula: add `unit` option
- misc
  - client-side javascript's size reduced !

## 0.19.3

- bug fixes
  - midi: noteOff messages not being sent;

## 0.19.2

- bug fixes
  - lobby: regression breaking the lobby for touch devices


## 0.19.1

- bug fixes
  - launcher: load correct font
  - midi: python3 compatibility fix

## 0.19.0

- ui
  - general design improved, heavily inspired by [budislavTVP](http://budislavtvp.deviantart.com/) works; color schemes are much simpler and easier to customize (try `--theme light` !); Font changed to Roboto; Texts are slightly thicker and uppercased in most cases for better readability (use css `text-transform:none` to disable the latter).
- widgets
  - fader: added `dashed` option; added `input` option;
  - meter: added `alignRight` option; added `dashed` option;
  - knob: removed `compact` option; added `dashed` option; added `input` option;
  - xy/rgb: added `input` option; added `pips` option:
  - panel/strip: removed inner widgets dark borders; added `border` option;
  - buttons: new `dropdown` widget;
  - toggle: added `led` option to choose between the old appearance and the new one; added `douleTap` option
  - new `input` widget
  - containers: new `clone` widgets
  - added support for `"self"` value in `target` option (sends the message back to the clients, useful for sending `/EDIT` messages...)
- editor
  - option fields are now multiline (`ctrl + enter` to add a new line), and pretty printed
  - added checkboxes for boolean options
  - added `Edit Parent` context menu option
- midi
  - replaced `pyo` dependency with [`pyrtmidi`](https://github.com/patrickkidd/pyrtmidi): lighter, dedicated to midi only, and handling virtual ports (no `mididings` dependency anymore)
  - pitchbend value is now a single integer between 0 and 16383
- bug fixes
  - fixed VisualFormat errors in iOS
- main
  - added `--url-options` command line option
  - fixed `--disable-vsync` not working when starting from the launcher
- documentation
  - new style, better organization

## 0.18.0

:warning: **Breaking changes** :warning:

Sessions saved with this version will not be readable with older versions (old sessions a can be opened but wont be backward-compatible once saved).


- widgets
  - add property inheritance between widgets with statements `@{parent.propertyName}`, `@{this.propertyName}` and `@{widgetID.propertyName}`
  - containers: added `variables` options (arbitrary varibles to pass to children)
  - panel: added full osc support (for sending/receiving tab changes)
  - modal: changed style to fit popups' appearance; added `popupWidth` and `popupHeight` options; :warning: removed `tabs` option; added full osc support; added `doubleTap` option (makes it openable with double taps instead of single taps)
  - strip: refactored widget using `panel` as base; added `stretch` and `spacing` option; now it's really cool
  - sliders: added `doubleTap` option (double taps reset the widget to its initial value when enabled)
  - knob/fader: renamed `noPip` option to `pips` (inverted behaviour; backward compatible)
  - encoder: mousewheel support
  - knob: compact design remake
- bug fixes
  - sliders: fixed `spring` when `value` equals `0`
  - modal: fixed osc values (was `True`/`False` instead of `1`/`0`)
- session
  - the root panel is now saved as a special `panel` widget (which means it has savable options)
- custom module
  - add access to the app's `settings` object

## 0.17.8

- bug fixes
  - regression breaking widgets' `split` option (0.17.6)
  - regression breaking the state export button (0.17.7)
  - regression breaking editor's `cut` action (0.17.7)
- osc
  - javascript object are now stringifyied before beeing sent
- widgets
  - maths: add `condition` option to [`formula`](http://osc.ammd.net/user-guide/widgets-specifics/maths/#formula)
  - sliders/pads: add `touchAddress` option
  - fader: add `meterAddress`

## 0.17.7

- engine
  - socket.io v2
- client
  - scripts are now transpiled to ES5 javascript code, thus increasing compatibility with some browser (iOS9's chrome, firefox, etc)
  - scripts size reduced from 2.4M to 1M thanks to minification
- bug fixes
  - elements duplications in sidepanel when loading another session

## 0.17.6

- main
  - osc sending speed optimization: all static infos (target, address, preArgs) are cached server side to reduce network overhead
- widgets
  - **new** encoder widget
- mobile
  - `hdpi` support (add `?hdpi=1` to the server's url)
- bug fixes
  - launcher: link to the app's address is now clickable
  - sidepanel: layout glitches with iOS
  - midi: `program` now works with the correct number of arguments
- misc
  - some little style fixes

## 0.17.5

- bug fixes
  - `multixy` snap mode position offset
- widgets
  - **new** [`rgbled`](http://osc.ammd.net/user-guide/widgets-specifics/plots/#rgbled)


## 0.17.4

- bug fixes
  - broken `--blank` option fixed (false-positive detection of concurrency with `--read-only`)
  - remove debug message in console when closing windows

## 0.17.3

Hot fix for `--read-only` switch.
Dependencies updates.

## 0.17.2 (deleted)

- bug fixes
  - `editor`: correctly remove editing state when disabling the editor right after going to another tab
- main
  - **new** `--read-only` switch for disabling the editor and preventing change to the session history
- widgets
  - `panel/modal`: add `layout` option ([Visual Format Language](https://github.com/IjzerenHein/autolayout.js))
  - `css` option now interprets `&` as a selector for the widget's element itself (useful for targetting pseudo-elements such as `&:after`)
  - `plots`: add `widgetId` option to `text`, `meter` and `led`

## 0.17.1

- bug fixes
  - `midi`: missing dependency
  - `headless`: terminate `midi` correctly when process exits

## 0.17.0

- main
  - **new** `midi` support ([documentation](http://osc.ammd.net/user-guide/midi/))
- ui
  - **new** `/TABS id1 id2 etc` osc address to remotely enable tabs
  - remote editing through `/EXEC` command is now deprecated, use `/EDIT` and `/EDIT_SOFT` instead
- bug fixes
  - `push` widgets (and `keyboards`) not correctly synchronizing each other (with shared widget ids or between different clients)
- widgets
  - `css` option now supports css selectors, scoped to the widgets element
  - `matrices` don't pass `css` option to their children anymore; subwidgets' indexes are now append to `preArgs` instead of being prepended.
- misc
  - app's title uppercased
  - tabs titles' letter-spacing increased

## 0.16.5

- bug fixes
  - `modal`: correct z-stacking with absolutely positionned widgets; proper rendering for inner widgets; disable parent tab's scrolling when opened; fix various style glitches;
  - `strip`: resize glitch when containing compact horizontal sliders

## 0.16.4

- bug fixes
  - tab links broken after activating traversing gestures
  - `push` release is now handled per touch point (releasing one finger used to release all pressed buttons)
- misc
  - destroy default client window when the app process exits

## 0.16.3

- bug fixes
  - crash when remote-editing widgets in disabled tabs
  - desktop client touch screen support restored

## 0.16.1

- bug fixes
  - string arguments overquoted in sent osc messages
- custom module
  - added support for initialization script
  - unified expected formatting in sendOsc and receiveOsc methods
- ui
  - reduced scrollbars width


## 0.16.0

- new logo :)
- bug fixes
  - editor: new widgets are correctly positionned in scrolled areas
- widgets
  - **new** `formula` widget, a [mathjs](http://mathjs.org/) expression evaluator that can process other widgets' values
  - `multixy` supports named points; fixed drag-dead zone in the border

## 0.15.1

- widgets
  - multifader: add `snap` option
- misc
  - minor css-related performance fix
  - some titles in the editor had the first-letter uppercased

## 0.15.0

- style
  - improved coherence, no more pure greys, better differenciation between clickable and static elements. Went back from "pure flat" to "flatty" to help with that (ie a few shadows to make layout more self-explanatory). Some widgets were slightly repimped.
- bug fixes
  - `push`: options separators not hidden in the editor
  - error when touching a non-interractive object while touching a widget with the other fingers
- widgets
  - `multixy` now behaves smarter: points are assigned to the closest touch points
- main
  - modifying a session file will automatically update clients that have loaded the same file

## 0.14.0

- bug fixes
  - some layout regressions in chrome v49
- main
  - osc input port (`-o`) is now set to the http port (`-p`) by default
- widgets
  - **new** `crossfader` and `switcher` widgets that store and recall the state of other widgets
  - `matrices` now accept multiple color values (that will be sequencially passed to their children)
  - `switches` accept icons in their values' labels
- engine
  - electron v1.4.13
- misc
  - all widgets classes were rewritten using ES6 class expressions
  - firefox's minimal version is now 46 because of a ES6 related bug (*note that it's still not officially supported*)

## 0.13.1

- bug fixes
  - regression preventing received osc messages to be properly routed to widgets with `preArgs`
- debug
  - errors occuring in the browser process are now piped to the main process' console with the source file name and the line number.

## 0.13.0

- main
  - **new** `-b / --blank` option to start editing a new session directly
  - **new** `--disable-vsync` option that improves performance (reduce input lag) on some systems
  - some inconsistent parameter combinations are now prevented
  - firefox compatibility improved (yet not perfect)
  - launcher window is no longer of the `splash` type, as it was difficult to close with some window managers
- widgets
  - **new** `modal` container : a button that turns into a fullscreen panel when clicked.
  - sliders/xy: add `spring` option that makes that widget jump back to its initial value when released
  - fader: horizontal mode default height fixed
  - keyboard: black keys pressed state is more noticeable
  - matrices: added `start` option to choose the first subwidget's `id`
  - labels' height reduced
- editor
  - **new** snap-to-grid feature
  - widgets' min-width set to grid's width
- misc
  - building with node 4 is fixed

## 0.12.0

- bug fixes
  - error popups raised by the main process can be closed
  - sliders don't send same value over network when the value change is below the widget's precision
- widgets
  - **new** (piano) keyboard widget
  - matrices: fixed `preArgs` option; added `split` option (default to `false`), *this changes the default osc messages formatting for these widgets*
  - icons in labels are inserted using the `^` prefix
  - text: icons support in value
- tabs
  - icons support in label
- misc
  - fontawesome update (4.7.0)

## 0.11.6

- widgets
  - meter: rewritten using fader as base
  - strip: center widget horizontally if width is set
  - fader/knob: compact gauge's alpha varies slightly as the distance to the origin grows
- misc
  - one example session added

## 0.11.5

- bug fixes
  - [regression] broken horizontal fader and pads

## 0.11.4

- bug fixes
  - fader: default `height/width` not set when `top/left` is `auto`

## 0.11.3

- widgets
  - knob: gesture's precision is proportionnal to the widget's size
  - fader: `height:auto` (or `width` for `horizontal` mode) makes the fader expand automatically
- ui
  - cleaner forms in editor and launcher

## 0.11.2

- touch
  - using multiple fingers to control a widget increases the precision (reduces the gesture's computed speed)
- widgets
  - fader: display pips in `compact` mode when `range` has multiple breakpoints
  - pads: display pips when `range` has multiple breakpoints
  - multixy: style update (stroked dots, bold number font); `snap` option added; points are automatically assigned to touches as they come; fix `logScale(X|Y)` options

## 0.11.1

- bug fixes
  - meters in faders were not always properly positionned
- widgets
  - knob: gauge's width is proportionnal to the knob's size in `compact` mode; widget's content centering fixed; `compact` style update;

## 0.11.0

- bug fixes
  - `-g / --no-gui` not preventing the launcher from spawning
  - `-e / --examples` not correctly parsed
- main
  - launcher displays options descriptions for booleans too
- widgets
  - added generic `value` option for setting a widget's initial value (does not sync linked widgets nor send osc message)
  - **text** widget's `defaultText` replaced with `value`
  - multixy dots are drawn with filled background instead of stroke

## 0.10.4

- main
  - launcher displays new version if available
  - launcher stays opened after starting the server and/or the gui except if `--gui-only` is set

## 0.10.3

- main
  - launcher: resetting boolean option properly sets it to false
  - launcher: display package's version
  - guis: adjust window's background to match the app's
- ui
  - launcher and session lobby appear more smoothly

## 0.10.2

- main
  - when executing the app with no CLI argument, a launcher window is created allowing user to adjust settings before starting the server (config is saved in the user's directory)

## 0.10.1

- bug fixes
  - rgb: minor visual glitch on extreme value, drawing performance improved
  - main: examples sessions path are properly stored as absolute paths (fixes `-e / --examples` mode)
- ui
  - lobby: session file names are diplayed first, then shortened paths
- misc
  - widgets `precision` doesn't affect their visual interraction accuracy since values are now rounded only before osc sending

## 0.10.0-alpha-2

- bug fixes
  - [windows] fix long path issue (#35) returns

## 0.10.0-alpha

- main
  - **new** `-c / --custom-module` switch allowing user to define custom osc filtering fonctions
  - `address` is now used everywhere instead of `path` to describe osc address to avoid confusion. Session files using the old `path` option for widgets are still supported.
  - **osc bundles** are properly received (subsequent messages are processed separately with a delay if the timetag is set)
  - widgets can be edited via osc messages using the special `/EXEC` address

## 0.9.2

- bug fixes
  - [windows] fix long path issue (#35)

## 0.9.1

- widgets
  - multiXy: added `pointSize` option; made default size bigger; points don't overflow the pad anymore

## 0.9.0

- widgets
  - **new** `multixy` pad
- misc
  - rewritten `pads` with prototype inheritance and using faders under the hood to handle events (this adds *fader*'s `range` capabilities to *xy*)
- engine
  - electron 1.4.4

## 0.8.3

- bug fixes
  - scrollbar arrows not showing
  - `fader` pips position when `noPip` is `true`
- widgets
  - matrices : all `fader`, `push` and `toggle` options are now available to `multifader`, `multipush` and `multitoggle`

## 0.8.2

- bug
  - avoid crash when sending osc with incorrect typetags
  - fixed fallback typetag ('s')
  - fixed broken `null` value for `push` & `toggle`

## 0.8.1

- bug
  - broken `fader` with `horizontal` set to `true` and `compact` set to `false`
- widgets
  - remove margins from `plots`
  - added `origin` options to `plots`

## 0.8.0

- main
  - the headless server/clients model is now the only one beeing used : the GUI mode is nothing more than an embedded chromium (electron) client
  - when a new client opens a session on the server, it is synchronized with the other clients
  - **new switches** : `--no-gui`, `--gui-only`, `--port`, `--osc-port`, `--version` (see docs)
- ui
  - explicit loadings
- widgets
  - make push's backlight only respond to external osc messages (not to synchronization messages from other widgets or clients)
  - removed special `false` value case for push/toggles (which used to disable osc sending)
  - add `norelease` option to `push` for disabling osc messages when releasing the button
  - `true` and `false` values are now properly sent as boolean
  - **args type definition** in `preArgs` option now uses the osc typetags only ('f', 'i', 'T', 'F', etc)
- engine
  - electron 1.4.3
- misc
  - rewritten matrices with prototypes inheritance

## 0.7.0

- bug fixes
  - osc messages with 0-item and 1-item args are correctly unpacked and routed
  - buttons can handle messages with 0 arg if one of their state has the value "null"
- ui
  - nice and bigger scrollbar
  - right-click no longer starts a dragging gesture
- editor
  - copy/paste data auto-incrementation fix
- widgets
  - new equalizer plotter
  - push/toggles made more obvious
  - knob's new options: angle and origin
  - fader's new option: origin
- engine
  - electron 1.4.1 (chrome 53, node 6.5.0)
- misc
  - added `--examples` switch for showing the availabe example sessions instead of the history
  - rewritten sliders and plots using canvas and prototypes inheritance
  - reorganized package using the two-package.json structure: js and css assets are now create at build time, and only necessary dependencies are shipped with the app

## 0.6.3

- bug fixes
  - regression (since 498ba4a06adf63d76fe7181691299c1cc55e8240) breaking the editor on touch devices

## 0.6.2

- cool stuff
  - armv7l prebuilt binaries ! (raspberry 2, etc)
- engine
  - electron 1.3.5

## 0.6.1

- bug fixes
  - editor: widgets/tabs can be accessed through their parent's children list (#27)
- engine
  - electron 1.3.1

## 0.6.0

- bug fixes
  - pasted widget properly use the pointer's position
  - traversing gestures are effective from the first touch, not after the first move
  - out-of-range values are properly clipped by faders/knob
- ui
  - Faders & Meters design improved
  - The main font (droid sans) is now loaded...
  - Knob's sizing got smarter
  - Widgets don't blink not jump when they appear for the first time or when they resize
- misc
  - Fader's `align` option replaced with boolean option `alignRight`
  - Widget's `label` now accepts special directive `icon: fontawesome-class` to display icons from [FontAwesome](http://fontawesome.io/icons/)
  - Text widget `defaultText` option added
- engine
  - electron 1.2.2

## 0.5.4

- bug fixes
  - [desktop] menu bar auto-hide
  - [headless] multitouch support
- ui
  - [mobile] better faders pips rendering
  - fixed horizontal fader knob centering
  - [mobile] better numeric inputs rendering (not blurred anymore)
- engine
  - [desktop] electron 1.2.0 (chrome 51)

## 0.5.3

- bug fixes
  - [again] touch fake-right-click only fires on long touch, not after every tap
  - traversing gestures bug with touch
- misc
  - better mouse/touch drag events handlers
- engine
  - electron 1.1.1

## 0.5.2

- bug fixes
  - touch fake-right-click only fires on long touch, not after every tap

## 0.5.1

- bug fixes
  - feedback is now handled precisely by widets (ie not rounded according to the `precision` option, see issue #21)
- engine
  - electron 1.1.0

## 0.5.0

- bug fixes
  - touch/mouse events are both handled simultaneously, module rewritten for better performances (see issue #18)
- engine
  - electron 1.0.2


## 0.4.8

- bug fixes
  - regression preventing newly created widgets from using the pointer's coordinates as position
  - add 0.4.7's fix to headless mode

## 0.4.7

- bug fixes
  - regression causing widgets with `preArgs` to not receive osc correctly

## 0.4.6

- engine
  - electron 0.37.6
  - node-osc 2.0.3
- features
  - `compact` option added to knob and fader
  - if an osc input port is specified, osc messages will be sent from it. This enhances compatibility with apps that send their feedback messages directly to the sender.
- misc
  - mouse/touch dragging handler rewritten, now using event delegation and direct handler calls instead of DOM event bubbling whenever it's possible

## 0.4.5

- engine
  - electron 0.37.3
- ui
  - new logo
  - better lobby design
- misc
  - renamed sliders/pads' `absolute` property to `snap`

## 0.4.4

- bug fixes
  - [headless] scripts are no longer bundled on the fly, it didn't work on some systems
  - touching widgets without changing their value doesn't make them send the same value again anymore
- ui
  - slightly tightened layout
- features
  - `noPip` option added to knob and fader
  - `preArgs` accepts object if the arg's type needs to be specified
  - knob supports breakpoints scale, same as fader's
  - fader and knob pip scales now support custom label
  - a push/toggle's value can be set to `null` if only the path needs to be sent in the osc messages
  -  push buttons do not update their own leds and return their value (for state save and widgets sync) based on their last changed property (led state or touch on/off)
- misc
  - refining the fader's pip scale that looked choppy on mobile devices. All pips are now evenly spaced, not relatively to the fader's height.
  - [desktop mode] saved sessions are added to history

## 0.4.3

- features
  - text widget can be `vertical`
  - panel widget `scroll` option
- bug fixes
  - smart pasting now works when the clipboard contains several widgets whose unsuffixed ids are the identical
  - osc received array that contain only one item are correctly unpacked (fixes cross-app sync for widgets that don't accept array, broken since the introduction of `preArgs`)
  - memory leak when loading a new session (cached tabs were not properly purged)
- misc
  - push widget doesn't fire its 'on' value if pressed while stuck in 'on' position
  - panel widgets don't have inner margins anymore
  - fader widget optimization : the pip scale is generated from a single gradient plus some elements for each breakpoint (instead of one element per percent), thus reducing the number of elements to draw.

## 0.4.2

- features
  - new widget : text (just displays received values)
- bug fixes
  - widget linking doesn't cause multiple unwanted osc sends anymore

## 0.4.1

- features
  - `preArgs` option for widgets (prepends constants to osc messages args)

## 0.4.0

- engine
  - electron 0.37.2 (chrome 49)
- ui
  - new flat ui
  - tab system rewritten : inactive tabs are detached from the DOM tree, thus improving performances while slowing down tab switching.
  - widget categories in editor's context menu
- features
  - logarithmic scaling (log10) support added to knob, fader & xy
  - mousewheel support added to knob and fader (ctrlKey for fine control)
  - new widgets : plot, visualizer & meter. Fader built-in feedback meter option
  - traversing gestures switch in sidepanel
  - custom color property for all widgets with inheritance (containers)
  - editor pasting function now smartly increments widget's id and path while keeping label if different from default
  - true theming support
- misc
  - sync/link event handling improved
  - stylesheets cannot be recompiled on the fly anymore (`--c` switch removed)
  - **new state save file format, no backward compatibility**

## 0.3.1

- electron updated to 0.36.11
- editor paste menu lets you choose between `Same ID` (cloned widgets) or `New ID` (resets id, label, linkId, and path)
- minor style updates

## 0.3.0

- 3 new widgets
	- multifader
	- multitoggle
	- multipush


## 0.2.1

- style update (push/toggle widgets, widgets' dragging handle)
- widget dragging/resizing doesn't get broken when editing the root
- sidepanel toggle doesn't select root for edition anymore

## 0.2.0

- editor code rewriting
	- right-click context-menu quick editing (widget copy/cut/paste, add & delete tabs/widgets)
