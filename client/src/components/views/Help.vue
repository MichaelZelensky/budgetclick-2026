<template>
  <main>
    <h1>Help</h1>

    <ul>
      <li>
        <a href="#client-id" @click.prevent="scrollTo('client-id')"
          >Client ID</a
        >
      </li>
      <li>
        <a href="#storage" @click.prevent="scrollTo('storage')">Storage</a>
      </li>
      <li>
        <a
          href="#encryption-passphrase"
          @click.prevent="scrollTo('encryption-passphrase')"
          >Encryption passphrase</a
        >
      </li>
      <li>
        <a href="#offline-use" @click.prevent="scrollTo('offline-use')"
          >Offline use</a
        >
      </li>
      <li>
        <a href="#import-export" @click.prevent="scrollTo('import-export')"
          >Import and export</a
        >
      </li>
      <li>
        <a href="#statistics" @click.prevent="scrollTo('statistics')"
          >Statistics</a
        >
      </li>
      <li>
        <a href="#balances" @click.prevent="scrollTo('balances')">Balances</a>
      </li>
      <li>
        <a href="#currency-rates" @click.prevent="scrollTo('currency-rates')"
          >Currency Rates</a
        >
      </li>
    </ul>

    <h2 id="client-id" class="tw-mt-8">Client ID</h2>

    <p>
      Your Client ID identifies this application installation for
      synchronization and conflict detection.
    </p>

    <p>It is not a password and does not protect your financial data.</p>

    <p>
      Memorize or write down your Client ID. If you reinstall BudgetClick, enter
      the same Client ID in <router-link to="/settings">Settings</router-link> to restore this client identity.
    </p>

    <p><a href="#" @click.prevent="scrollToTop">Back to top</a></p>

    <h2 id="storage" class="tw-mt-8">Storage</h2>

    <h3>1. Create a bucket</h3>

    <p>
      Create a dedicated bucket for BudgetClick using an S3-compatible provider
      such as AWS S3.
    </p>

    <p>
      Do not use a bucket containing other personal or important data.
      BudgetClick's storage path acts as an access capability.
    </p>

    <h3>2. Allow public access</h3>

    <p>
      BudgetClick does not use AWS credentials. The bucket therefore needs to
      allow anonymous read and write access to objects.
    </p>

    <p>
      If your provider has a public-access blocking feature, configure it so
      that the bucket policy can grant public access.
    </p>

    <h3>3. Configure the bucket policy</h3>

    <p>The bucket policy should allow anonymous:</p>

    <ul class="tw-list-disc tw-pl-5">
      <li>GetObject</li>
      <li>PutObject</li>
      <li>ListBucket</li>
    </ul>

    <p>
      It should not allow bucket deletion, bucket configuration changes, IAM
      access, or object deletion.
    </p>

    <p>For AWS S3, the policy is:</p>

    <pre><code>{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "BudgetClickPublicReadWrite",
      "Effect": "Allow",
      "Principal": "*",
      "Action": [
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": "arn:aws:s3:::BUCKET_NAME/*"
    },
    {
      "Sid": "BudgetClickPublicList",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:ListBucket",
      "Resource": "arn:aws:s3:::BUCKET_NAME"
    }
  ]
}</code></pre>

    <p>Replace <code>BUCKET_NAME</code> with the name of your bucket.</p>

    <h3>4. Enter the storage path</h3>

    <p>
      Copy the HTTPS URL of your bucket and enter it in <router-link to="/settings">Settings</router-link>. For example:
    </p>

    <pre><code>https://your-bucket.s3.us-east-1.amazonaws.com/</code></pre>

    <p>
      The complete storage path is sensitive. Anyone who obtains it can access
      the bucket according to its public policy.
    </p>

    <InlineAlert variant="warning">
      <p>
        Each storage object, including monthly transaction chunks and
        attachments, must not exceed 5 MB. Large attachments or months with many
        transactions may need to be reduced or split.
      </p>
    </InlineAlert>

    <p><a href="#" @click.prevent="scrollToTop">Back to top</a></p>

    <h2 id="encryption-passphrase" class="tw-mt-8">Encryption passphrase</h2>

    <p>
      BudgetClick encrypts all user data before it is uploaded to storage. Your
      encryption passphrase is used to derive the encryption key.
    </p>

    <InlineAlert>
      <p>
        The passphrase is never persisted or uploaded to storage. BudgetClick
        cannot recover it for you.
      </p>
    </InlineAlert>

    <p>
      Use the same passphrase on every BudgetClick client that accesses the same
      storage. If the passphrase is lost and no recovery information is
      available, the encrypted data cannot be recovered.
    </p>

    <p>
      Keep the storage path and passphrase secret. The storage path provides
      access to the storage, while the passphrase protects the encrypted
      application data.
    </p>

    <h3>Recovery information</h3>

    <p>
      When initializing new storage, BudgetClick recommends printing or securely
      saving:
    </p>

    <ul class="tw-list-disc tw-pl-5">
      <li>Storage path</li>
      <li>Passphrase</li>
      <li>Salt</li>
      <li>Encryption key</li>
    </ul>

    <p>
      The salt is not secret and is stored in the storage. The encryption key is
      sensitive and should be protected like the passphrase.
    </p>

    <p><a href="#" @click.prevent="scrollToTop">Back to top</a></p>

    <h2 id="offline-use" class="tw-mt-8">Offline use</h2>

    <p>
      BudgetClick is a Progressive Web App (PWA). Installing it allows the
      application to keep its application files available when the network is
      unavailable. Your local data is stored in the browser on the device.
    </p>

    <h3>Install on a desktop</h3>

    <p>
      Open BudgetClick in a supported browser such as Chrome or Edge. Look for
      the install icon in the browser address bar, or open the browser menu and
      choose the option to install BudgetClick.
    </p>

    <p>
      After installation, launch BudgetClick from the installed application
      instead of the normal browser tab.
    </p>

    <h3>Install on Android</h3>

    <p>
      Open BudgetClick in Chrome. Open the browser menu and choose
      <strong>Install app</strong> or <strong>Add to Home screen</strong>,
      depending on the browser version.
    </p>

    <h3>Install on iPhone or iPad</h3>

    <p>
      Open BudgetClick in Safari. Tap the Share button, choose
      <strong>Add to Home Screen</strong>, and confirm.
    </p>

    <p>
      Open BudgetClick from the new Home Screen icon to use the installed PWA.
    </p>

    <InlineAlert class="tw-mt-4" variant="warning">
      <h2 class="tw-mt-0">Important</h2>

      <p>
        Installing the PWA does not replace your storage. Remote data remains in
        your configured storage bucket, while the application can continue
        working with locally cached data when offline.
      </p>

      <p>
        Keep your Client ID, storage location, encryption passphrase, and
        recovery information available. BudgetClick cannot recover them if
        they are lost.
      </p>
    </InlineAlert>

    <p><a href="#" @click.prevent="scrollToTop">Back to top</a></p>

    <h2 id="import-export" class="tw-mt-8">Import and export</h2>

    <p>
      BudgetClick can export your data to a ZIP file and import it later. This
      allows you to create an independent backup or move your data to another
      BudgetClick installation.
    </p>

    <h3>Export</h3>

    <p>
      Open <router-link to="/settings">Settings</router-link> and choose
      <strong>Export</strong>.
    </p>

    <p>
      You can choose whether to include attachments. Without attachments, the
      export contains your accounts, categories, contractors, currency rates,
      and transactions. When attachments are included, their files are added
      to the export as well.
    </p>

    <p>
      The exported ZIP file is not encrypted. Store it securely and do not share
      it with others.
    </p>

    <h3>Import</h3>

    <p>
      Open <router-link to="/settings">Settings</router-link>, choose
      <strong>Import</strong>, and select a BudgetClick export ZIP file.
    </p>

    <InlineAlert variant="warning">
      <p>
        Import replaces the current data. Existing accounts, categories,
        contractors, rates, transactions, and related remote data are removed
        before the imported data is stored.
      </p>
    </InlineAlert>

    <p>
      Import does not restore the exported Client ID, storage path, or
      encryption passphrase. The imported data is stored using the current
      BudgetClick storage and client configuration.
    </p>

    <p>
      If the export contains attachments, they are restored together with the
      corresponding transactions. An export made without attachments cannot
      restore attachment files.
    </p>

    <p><a href="#" @click.prevent="scrollToTop">Back to top</a></p>

    <h2 id="statistics" class="tw-mt-8">Statistics</h2>

    <p>
      Statistics are derived from transaction history and contain aggregated
      income, outcome, and balance values, including values by account.
    </p>

    <p>
      Statistics can be rebuilt from all transaction chunks. Rebuilding
      downloads the required transaction data and recalculates the complete
      statistics object.
    </p>

    <p>
      To completely rebuild statistics, use the Rebuild button
      <RefreshIcon class="tw-inline-block" /> on the Statistics Widget on the
      <router-link to="/">Dashboard</router-link>.
    </p>

    <p><a href="#" @click.prevent="scrollToTop">Back to top</a></p>

    <h2 id="balances" class="tw-mt-8">Balances</h2>

    <p>
      Balances are derived from the account starting balance and transaction
      history. Each balance entry represents the account balance at the
      beginning of a month, before that month's transactions are applied.
    </p>

    <p>
      Balances can be updated when transactions are created or changed. They can
      also be completely rebuilt from all transaction chunks. During a rebuild,
      the account starting balance is used as the starting balance of the first
      transaction month, and each subsequent month's starting balance is
      calculated from the preceding month's transactions.
    </p>

    <p>
      To completely rebuild balances, use the Rebuild button
      <RefreshIcon class="tw-inline-block" /> on the Statistics Widget on the
      <router-link to="/">Dashboard</router-link>.
    </p>

    <p>
      The spreadsheet calculates each transaction's balance from the starting
      balance for its month and the transactions in that month up to that
      transaction.
    </p>

    <p><a href="#" @click.prevent="scrollToTop">Back to top</a></p>

    <h2 id="currency-rates" class="tw-mt-8">Currency Rates</h2>

    <p>
      <router-link to="/rates">Currency rates</router-link> are used to calculate total statistics in the default
      currency.
    </p>

    <p>
      A rate has a From currency, a To currency, an effective Date, and a Rate.
      A rate in one direction is sufficient to calculate the reverse conversion.
      If no rate exists for a currency conversion, a 1:1 rate is used.
    </p>

    <p>
      The default currency is set in <router-link to="/settings">Settings</router-link> and is not persisted. For new
      storage, it is initially set to the currency of the first account. For
      existing storage, the currency of the first account in the account list is
      used as the default currency.
    </p>

    <p>
      When statistics are recalculated, total statistics use the current default
      currency. The default currency can be changed in <router-link to="/settings">Settings</router-link>.
    </p>

    <p><a href="#" @click.prevent="scrollToTop">Back to top</a></p>
  </main>
</template>

<script setup lang="ts">
import InlineAlert from "@/components/ui/InlineAlert.vue";
import RefreshIcon from "@/components/icons/Refresh.vue";

const scrollTo = (id: string): void => {
  document.getElementById(id)?.scrollIntoView();
};

const scrollToTop = (): void => {
  window.scrollTo({ top: 0, behavior: "smooth" });
};
</script>