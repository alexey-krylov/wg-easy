<template>
  <footer>
    <p class="m-10 text-center text-xs text-gray-300 dark:text-neutral-600">
      <a
        class="hover:underline"
        target="_blank"
        href="https://github.com/wg-easy/wg-easy"
        >WireGuard Easy</a
      >
      ({{ globalStore.information?.currentRelease }}) © 2021-2026 by
      <a
        class="hover:underline"
        target="_blank"
        href="https://emile.nl/?ref=wg-easy"
        >Emile Nijssen</a
      >
      is licensed under
      <a
        class="hover:underline"
        target="_blank"
        href="https://opensource.org/license/agpl-v3"
        >AGPL-3.0-only</a
      >
      ·
      <a
        class="hover:underline"
        href="https://github.com/wg-easy/wg-easy#donate"
        target="_blank"
        >{{ $t('layout.donate') }}</a
      >
    </p>
    <p
      v-if="buildLine"
      class="-mt-8 mb-10 text-center text-xs text-gray-300 dark:text-neutral-600"
    >
      {{ buildLine }}
    </p>
  </footer>
</template>

<script lang="ts" setup>
const globalStore = useGlobalStore();

/**
 * Build provenance, when the image carries it: date, source ref and the
 * wg/awg tools inside. The release number above says which upstream version
 * this is; this line says which build of it is actually running.
 */
const buildLine = computed(() => {
  const info = globalStore.information;

  if (!info) {
    return null;
  }

  const parts = [
    info.buildDate ? `build ${info.buildDate}` : null,
    info.buildRef,
    info.toolsVersion,
  ].filter(Boolean);

  return parts.length ? parts.join(' · ') : null;
});
</script>
