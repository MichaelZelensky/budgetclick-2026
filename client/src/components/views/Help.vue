<template>
  <main>
    <h1>Help</h1>

    <h2>Client ID</h2>

    <p>
      Your Client ID identifies this application installation for
      synchronization and conflict detection.
    </p>

    <p>
      It is not a password and does not protect your financial data.
    </p>

    <p>
      Memorize or write down your Client ID. If you reinstall BudgetClick,
      enter the same Client ID in Settings to restore this client identity.
    </p>

    <h2>Storage</h2>

    <p>
      BudgetClick stores your data in an S3-compatible storage bucket that
      you configure yourself. BudgetClick does not own or manage your storage.
    </p>

    <h3>1. Create a bucket</h3>

    <p>
      Create a dedicated bucket for BudgetClick using an S3-compatible
      provider such as AWS S3.
    </p>

    <p>
      Do not use a bucket containing other personal or important data.
      BudgetClick's storage path acts as an access capability.
    </p>

    <h3>2. Allow public access</h3>

    <p>
      BudgetClick does not use AWS credentials. The bucket therefore needs
      to allow anonymous read and write access to objects.
    </p>

    <p>
      If your provider has a public-access blocking feature, configure it so
      that the bucket policy can grant public access.
    </p>

    <h3>3. Configure the bucket policy</h3>

    <p>
      The bucket policy should allow anonymous:
    </p>

    <ul class="tw-list-disc tw-pl-5">
      <li>GetObject</li>
      <li>PutObject</li>
      <li>ListBucket</li>
    </ul>

    <p>
      It should not allow bucket deletion, bucket configuration changes,
      IAM access, or object deletion.
    </p>

    <p>
      For AWS S3, the policy is:
    </p>

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

    <p>
      Replace <code>BUCKET_NAME</code> with the name of your bucket.
    </p>

    <h3>4. Enter the storage path</h3>

    <p>
      Copy the HTTPS URL of your bucket and enter it in Settings.
      For example:
    </p>

    <pre><code>https://your-bucket.s3.us-east-1.amazonaws.com/</code></pre>

    <p>
      The complete storage path is sensitive. Anyone who obtains it can
      access the bucket according to its public policy.
    </p>

    <h2>Offline use</h2>

    <p>
      BudgetClick is a Progressive Web App (PWA). Installing it allows the
      application to keep its application files available when the network
      is unavailable. Your local data is stored in the browser on the device.
    </p>

    <h3>Install on a desktop</h3>

    <p>
      Open BudgetClick in a supported browser such as Chrome or Edge.
      Look for the install icon in the browser address bar, or open the
      browser menu and choose the option to install BudgetClick.
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
      Open BudgetClick from the new Home Screen icon to use the installed
      PWA.
    </p>

    <h2>Important</h2>

    <p>
      Installing the PWA does not replace your storage. Remote data remains
      in your configured storage bucket, while the application can continue
      working with locally cached data when offline.
    </p>

    <p>
      Keep your Client ID, storage location, and encryption passphrase
      available. BudgetClick cannot recover them if they are lost.
    </p>
  </main>
</template>