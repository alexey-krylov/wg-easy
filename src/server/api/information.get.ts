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
  const latestRelease = await cachedFetchLatestRelease();
  const updateAvailable = gt(latestRelease.version, RELEASE);
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
