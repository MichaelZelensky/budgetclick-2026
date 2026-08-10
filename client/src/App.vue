<template>
  <div>
    <header>
      <RouterLink to="/" aria-label="Home">
        BudgetClick
      </RouterLink>

      <RouterLink to="/settings" aria-label="Settings" title="Settings">
        <i class="bi bi-gear"></i>
      </RouterLink>
    </header>

    <RouterView />
  </div>
</template>