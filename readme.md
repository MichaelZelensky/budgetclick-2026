# BudgetClick

**Private, offline-first personal finance tracker and planner.**

Your data is encrypted on your device before it leaves it, and it syncs to a storage bucket you own. There are no accounts, no backend and no analytics. BudgetClick is free and open source.

| | |
| --- | --- |
| App | [budgetclick.com/pwa](https://budgetclick.com/pwa) |
| Website | [budgetclick.com](https://budgetclick.com) |
| User docs | [budgetclick.com/docs](https://budgetclick.com/docs) |
| Product Hunt | [producthunt.com/posts/budgetclick](https://www.producthunt.com/posts/budgetclick) |
| Build in public | [YouTube playlist](https://www.youtube.com/watch?v=u-WiqLOK_bs&list=PLfNvWdk4AKZ0) |
| Architecture and security (5 min) | [Video](https://youtu.be/32Xa8HtbvKg) |

## Features

- Accounts, categories and contractors, with multiple currencies and rates
- Spreadsheet-style transaction explorer: income and expense, planned and actual, balance after each transaction
- Recurring transactions (daily, weekly, monthly, annual)
- Monthly statistics and balances
- Receipt attachments, search, filtering, import and export
- Works fully offline, then resyncs automatically
- Installable PWA for desktop and iOS, from one codebase

## How it works

- **Encryption:** AES-GCM (256-bit key), with the key derived from your passphrase using PBKDF2-SHA256 (600,000 iterations). Everything stored remotely is encrypted, and the storage provider is treated as untrusted.
- **Storage:** your own S3-compatible bucket (AWS S3, Cloudflare R2, Backblaze B2, MinIO). The browser talks to it directly.
- **Local data:** IndexedDB holds the working copy, so the app stays usable offline.
- **Identity:** none. There is no BudgetClick account, only your storage, your device and your passphrase.

> **Important:** the passphrase is never stored and there is no recovery service. If you lose it and your local key, your data cannot be recovered.

## Getting started

1. Open [budgetclick.com/pwa](https://budgetclick.com/pwa).
2. Follow the setup steps: client ID, storage, passphrase, first account.
3. For storage, create a bucket with the CloudFormation template in [`server/s3/cloudformation.yml`](server/s3/cloudformation.yml) (create the stack, then copy the bucket address from its Outputs).

Full user guidance is at [budgetclick.com/docs](https://budgetclick.com/docs).

## Development

The [`/docs`](docs) directory holds the complete design and implementation details (architecture, data model, storage, encryption, sync, offline mode, migrations).

```bash
pnpm install
pnpm --dir client dev      # run the client
pnpm local-storage         # local dev storage server (replaces S3)
pnpm test-client           # run the tests
pnpm build                 # build
```

## Acknowledgements

BudgetClick is built on the work of many open-source projects and free tools.

**Framework and build**
- [Vue](https://vuejs.org/) and [Vue Router](https://router.vuejs.org/)
- [Vite](https://vite.dev/), [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) and [Workbox](https://developer.chrome.com/docs/workbox)
- [TypeScript](https://www.typescriptlang.org/), [vue-tsc](https://github.com/vuejs/language-tools) and [tsx](https://tsx.is/)
- [Tailwind CSS](https://tailwindcss.com/), [Sass](https://sass-lang.com/) and [Autoprefixer](https://github.com/postcss/autoprefixer)

**Data and utilities**
- [big.js](https://github.com/MikeMcl/big.js): exact decimal arithmetic for money
- [fflate](https://github.com/101arrowz/fflate): compression
- [Chart.js](https://www.chartjs.org/) and [vue-chartjs](https://vue-chartjs.org/): statistics charts
- [vue-advanced-cropper](https://github.com/advanced-cropper/vue-advanced-cropper): image cropping
- [Bootstrap Icons](https://icons.getbootstrap.com/)

**Schemas and tooling**
- [Ajv](https://ajv.js.org/), [json5](https://json5.org/) and [ts-json-schema-generator](https://github.com/vega/ts-json-schema-generator)
- [pnpm](https://pnpm.io/)

**Testing**
- [Vitest](https://vitest.dev/), [Vue Test Utils](https://test-utils.vuejs.org/), [jsdom](https://github.com/jsdom/jsdom) and [fake-indexeddb](https://github.com/dumbmatter/fakeIndexedDB)

**Infrastructure and tools**
- [AWS](https://aws.amazon.com/): S3 storage, hosting, CloudFormation and the automated website build
- [Nuxt](https://nuxt.com/): the public website
- [VS Code](https://code.visualstudio.com/), [Git](https://git-scm.com/) and [GitHub](https://github.com/)
- [OBS Studio](https://obsproject.com/), [CapCut](https://www.capcut.com/) and [YouTube](https://www.youtube.com/): demos and build-in-public videos

**AI assistants (free tiers)**
- [ChatGPT](https://chatgpt.com/) did most of the work (about 90%): design and architecture brainstorming, all the docs and most of the code.
- [Claude](https://claude.ai/) helped now and then (about 10%) in the same way.

## License

[MIT](license)