# TODO
- !IMPORTANT: remove /storage/get,put,... file relay (security)
- !IMPORTANT: offline Ios: app doesn’t load, pwa doesn't load in browser
- Add Ext/Exclude from total in/out (only total?) stats checkbox (for exchange)
- Add "Load earlier"/"Prev page" buttons to the top / Mobile: Show on pull down
- is it possible to make table header sticky?
- update/rebuild recurrence -> new items are not in the sheet, old items are gone (refresh fixes this)
- add offline detection test
- add offline startup test
- rebuild statistics: no "loading" overlay during loading of missing chunks
- recheck and remove clientid, if unused; or use it
- refactor: use types/AppState.ts:ReferenceDataKey for all reference data keys in the code, e.g. "ReferenceDataKey.Recurrences" instead of "recurrences"
- attachment deletion doesn't go to SyncOffline
- orphan attachment is not deleted on recurrence rebuild
- remove Recurrence.month: https://chatgpt.com/g/g-p-6a698ebe1a3c8191b594382d91c10d0c-development/c/6ae8699b-7604-83ec-8eed-7e51d9c383f8
- open app in browser/win-app -> go to flight mode (app is open) -> make changes -> turn offline mode off -> reload the app -> Error: Cannot start the app, data version mismatch.
- install on a used storage -> version mismatch -> dead end (need a way to fix it)
- mobile brave: db connection closes after some time -> fixed. test on liteed.com

Done: 
- highlight recurrence family when a record is selected
- highlight current page on spreadsheet pager
- add/update record - saved, but not updated in the spreadsheet; remove attachment - save - spreadsheet still shows paperclip icon
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
- Account.currentBalance should be Account.startingBalance
- cleanup empty fields from transaction type to save storage/transfer size
- limit length for all values
- stats.ts and balance.ts are still using JS arithmetics - use Big.js instead