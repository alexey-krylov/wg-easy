import { defineEventHandler } from 'h3';
import { gt } from 'semver';

import Database from '#server/utils/Database';
import {
  BUILD_DATE,
  BUILD_REF,
  RELEASE,
  WG_ENV,
  getToolsVersion,
} from '#server/utils/config';
import { cachedFetchLatestRelease } from '#server/utils/release';

export default defineEventHandler(async () => {
  /*
   * Whether upstream has a newer release is a nice-to-have, and this endpoint
   * is where the panel gets everything else: its own version, the build it is
   * running, the AWG mode, the firewall state. A host that cannot reach
   * api.github.com — no route, a blocked domain, a slow link — used to take
   * the whole endpoint down with a 500, and with it the footer that says which
   * build this is. The panel now simply reports no known upstream release.
   */
  let latestRelease: Awaited<
    ReturnType<typeof cachedFetchLatestRelease>
  > | null = null;
  let updateAvailable = false;

  try {
    latestRelease = await cachedFetchLatestRelease();
    updateAvailable = gt(latestRelease.version, RELEASE);
  } catch {
    // Left null on purpose: the update banner reads updateAvailable first.
  }
  const insecure = WG_ENV.INSECURE;
  const isAwg = WG_ENV.WG_EXECUTABLE === 'awg';
  const wgInterface = await Database.interfaces.get();

  const toolsVersion = await getToolsVersion(WG_ENV.WG_EXECUTABLE);

  return {
    currentRelease: RELEASE,
    buildDate: BUILD_DATE,
    buildRef: BUILD_REF,
    toolsVersion,
    latestRelease: latestRelease,
    updateAvailable,
    insecure,
    isAwg,
    firewallEnabled: wgInterface.firewallEnabled,
  };
});
