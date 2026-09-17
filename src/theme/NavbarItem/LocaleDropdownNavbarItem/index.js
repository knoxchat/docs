/**
 * Swizzled `localeDropdown` navbar item.
 *
 * Rendered as a click-to-toggle pill instead of a dropdown, so switching
 * language feels like the dark/light color mode toggle: a single click, no
 * menu to open. A site with more than two locales falls back to the stock
 * Docusaurus dropdown, because a two-segment pill does not scale past two.
 *
 * Short labels come from `themeConfig.navbar.items[].shortLabels`
 * (e.g. `{ en: 'EN', 'zh-Hans': '中文' }`), defaulting to the uppercased
 * language subtag of the locale.
 */
import React from 'react'
import clsx from 'clsx'
import { Languages } from 'lucide-react'
import Link from '@docusaurus/Link'
import useDocusaurusContext from '@docusaurus/useDocusaurusContext'
import { translate } from '@docusaurus/Translate'
import { mergeSearchStrings, useHistorySelector } from '@docusaurus/theme-common'
import { useAlternatePageUtils } from '@docusaurus/theme-common/internal'
import LocaleDropdownOriginal from '@theme-original/NavbarItem/LocaleDropdownNavbarItem'
import styles from './styles.module.css'

/** "en-US" -> "EN" ... used when no `shortLabels` entry is configured. */
function getFallbackShortLabel(locale) {
  return locale.split('-')[0].toUpperCase()
}

function useLocaleToggleUtils() {
  const {
    siteConfig,
    i18n: { currentLocale, locales, localeConfigs }
  } = useDocusaurusContext()
  const alternatePageUtils = useAlternatePageUtils()
  const search = useHistorySelector((history) => history.location.search)
  const hash = useHistorySelector((history) => history.location.hash)

  const getLocaleConfig = (locale) => {
    const localeConfig = localeConfigs[locale]
    if (!localeConfig) {
      throw new Error(`Docusaurus bug, no locale config found for locale=${locale}`)
    }
    return localeConfig
  }

  const getBaseURLForLocale = (locale) => {
    const localeConfig = getLocaleConfig(locale)
    // Shorter paths if localized sites are hosted on the same domain
    if (localeConfig.url === siteConfig.url) {
      return `pathname://${alternatePageUtils.createUrl({ locale, fullyQualified: false })}`
    }
    return alternatePageUtils.createUrl({ locale, fullyQualified: true })
  }

  return {
    currentLocale,
    locales,
    // We have 2 query strings because there's the current one, and one the
    // user can provide through the navbar config.
    getURL: (locale, { queryString: itemQueryString } = {}) => {
      const finalSearch = mergeSearchStrings([search, itemQueryString], 'append')
      return `${getBaseURLForLocale(locale)}${finalSearch}${hash}`
    },
    getLabel: (locale) => getLocaleConfig(locale).label,
    getLang: (locale) => getLocaleConfig(locale).htmlLang,
    getShortLabel: (locale, shortLabels) => shortLabels?.[locale] ?? getFallbackShortLabel(locale)
  }
}

export default function LocaleDropdownNavbarItem({
  mobile,
  queryString,
  shortLabels,
  className,
  onClick,
  ...props
}) {
  const utils = useLocaleToggleUtils()
  const { currentLocale, locales } = utils

  // A two-segment pill only makes sense for exactly two locales.
  // `position` stays inside `props` so the fallback keeps `dropdown--right`.
  if (locales.length !== 2) {
    return (
      <LocaleDropdownOriginal
        mobile={mobile}
        queryString={queryString}
        className={className}
        onClick={onClick}
        {...props}
      />
    )
  }

  const otherLocale = locales.find((locale) => locale !== currentLocale)
  const groupLabel = translate({
    id: 'theme.navbar.localeToggle.ariaLabel',
    message: 'Language switcher',
    description: 'The ARIA label of the language switcher in the navbar'
  })
  const switchLabel = translate(
    {
      id: 'theme.navbar.localeToggle.switchTo',
      message: 'Switch to {language}',
      description: 'The title of a language switcher segment for a non-current language'
    },
    { language: utils.getLabel(otherLocale) }
  )

  // Desktop nav items live in a <div>, mobile ones in a <ul>, so the wrapper
  // element has to follow the host list to stay valid HTML.
  const Container = mobile ? 'li' : 'div'

  return (
    <Container
      className={clsx(
        styles.localeToggle,
        mobile ? styles.localeToggleMobile : styles.localeToggleDesktop,
        className
      )}
      {...(mobile ? {} : { role: 'group', 'aria-label': groupLabel })}>
      <Languages className={styles.localeToggleIcon} aria-hidden />
      {locales.map((locale) => {
        const label = utils.getShortLabel(locale, shortLabels)
        const lang = utils.getLang(locale)

        // The current locale is inert: it marks state, it is not a link.
        if (locale === currentLocale) {
          return (
            <span
              key={locale}
              className={clsx(styles.localeSegment, styles.localeSegmentActive)}
              lang={lang}
              aria-current='true'
              title={utils.getLabel(locale)}>
              {label}
            </span>
          )
        }

        return (
          <Link
            key={locale}
            className={clsx(styles.localeSegment, styles.localeSegmentLink)}
            to={utils.getURL(locale, { queryString })}
            autoAddBaseUrl={false}
            // Locale URLs use the `pathname://` pseudo-protocol so the router
            // does not intercept them; it also makes them look "external".
            // `_self` keeps the switch in the current tab, like the stock item.
            target='_self'
            lang={lang}
            hrefLang={lang}
            aria-label={switchLabel}
            title={switchLabel}
            onClick={onClick}>
            {label}
          </Link>
        )
      })}
    </Container>
  )
}