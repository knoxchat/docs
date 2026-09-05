import { useEffect, useState } from 'react'
import useDocusaurusContext from '@docusaurus/useDocusaurusContext'

const localeMap = {
  en: 'en-US',
  'zh-Hans': 'zh-CN',
}

export default function TimeStamp({ timestamp }) {
  const { i18n: { currentLocale } } = useDocusaurusContext()
  // Use client-side rendering for timestamp, against React Minified React error #418 and #425
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Return null during SSR
  if (!mounted) {
    return null
  }

  const dateLocale = localeMap[currentLocale] || currentLocale

  return <time dateTime={timestamp}>{new Date(timestamp).toLocaleDateString(dateLocale)}</time>
}
