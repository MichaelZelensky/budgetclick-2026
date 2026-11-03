<template>
  <div class="recovery-sheet">
    <h1>BudgetClick Recovery Sheet</h1>

    <p>
      Keep this sheet in a secure place. It contains everything required to
      recover access to your BudgetClick storage.
    </p>

    <dl>
      <dt>Storage path</dt>
      <dd>{{ storage }}</dd>

      <dt>Passphrase</dt>
      <dd>{{ passphrase }}</dd>

      <dt>Salt</dt>
      <dd>{{ salt }}</dd>
    </dl>

    <h2>Recovery instructions</h2>

    <ol>
      <li>Keep this sheet somewhere safe and private.</li>
      <li>Keep the storage path and passphrase together.</li>
      <li>
        If you reinstall BudgetClick or use another device, enter the same
        storage path and passphrase to recover your data.
      </li>
      <li>
        The passphrase cannot be recovered or reset by BudgetClick.
      </li>
      <li>
        If you lose the passphrase, your encrypted data cannot be recovered.
      </li>
    </ol>

    <p>
      <strong>Important:</strong> Anyone who has both the storage path and
      passphrase can access your BudgetClick data.
    </p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  storage: string;
  passphrase: string;
  salt: string;
}>();
</script>

<style scoped lang="scss">
.recovery-sheet {
  display: none;
}

@media print {
  :global(body *) {
    visibility: hidden;
  }

  .recovery-sheet,
  .recovery-sheet * {
    visibility: visible;
  }

  .recovery-sheet {
    display: block;
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    padding: 2rem;
    color: black;
    background: white;
    font-family: sans-serif;
  }

  .recovery-sheet h1 {
    margin-bottom: 2rem;
  }

  .recovery-sheet h2 {
    margin-top: 2rem;
  }

  .recovery-sheet dt {
    margin-top: 1rem;
    font-weight: bold;
  }

  .recovery-sheet dd {
    margin: 0.25rem 0 0;
    padding: 0.5rem;
    overflow-wrap: anywhere;
    font-family: monospace;
    border: 1px solid #ccc;
  }

  .recovery-sheet li {
    margin-top: 0.5rem;
  }
}
</style>