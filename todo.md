# TODO
- offline Ios: app doesn’t load, pwa doesn't load in browser
- open app in browser/win-app -> go to flight mode (app is open) -> make changes -> turn offline mode off -> reload the app -> Error: Cannot start the app, data version mismatch.
- open app in the browser (Windows) -> go to flight mode -> offline mode is not detected (works on iOs/Safari, though)
+ add offline detection test
+ add offline startup test
- add/update record - saved, but not updated in the spreadsheet; remove attachment - save - spreadsheet still shows paperclip icon
- select record -> widget is populated -> Load more -> widget stays pouplated, but no record is selected ==> either clear the selection with the widget, or keep populated and selected
- Account.currentBalance should be Account.startingBalance
- cleanup empty fields from transaction type to save storage/transfer size
- rebuild statistics: no "loading" overlay during loading of missing chunks
+ do not change account after form reset; when fresh, account must be the last actual (?)
+ delete transaction
- switch views: takes time
- stats.ts and balance.ts are still using JS arithmetics - use Big.js instead
- recheck and remove clientid, if unused; or use it
- add edit image button to open image editor 

Done: 
- format Account numbers
+ account: correct current balance -> correction record
- create tr -> loading -> 5s delay -> clear form ==> bad UX
- ios: resolution is not responsive (often scales out of the window; data grid controls are hidden behind the footer)
- amount allows strings -> disallow
- UI: Account starting balance must be a number
+ change field order in tr widgets: amount-> description
+ edit widget: mark tabs active when data is there (comments)
- spreadsheet sorting: days - asc, time within the day - desc
- spreadsheet balance calculation: balances change when earlier records are loaded to the spreadsheet
? maybe fixed - bug: offline mode tag turned on (with attachment?) -> add transaction -> internet works -> still offline mode turned on -> reload -> Startup failed: transaction chunk version mismatch.

# Backlog
- print recovery info on existing storage should be removed
- help: change text encryption key is not printed and saved
- persist settings.defaultCurrency
- is Manifest.migration mutex implemented?
- repositories: refactor "Object not initialized" -> move from service to repositories
- DELETE /del endpoint doesn't work
- transaction.actual must be set only for past transactions, they cannot be actual in the future.
- alert for planned records that are remaining in the past - we need to either move or remove them.
- datagrids (accounts, rates, etc) have row selection - add disabling selection in Datagrid
- check if anything uses console instead of logger