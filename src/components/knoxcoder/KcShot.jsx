import React from 'react'

/**
 * Product screenshot from KnoxCoder 2.2.2 (One Dark). Files live in
 * docs/static/img/knoxcoder/.
 */
export default function KcShot({ src, alt, caption }) {
  return (
    <figure className="kc-shot">
      <img src={src} alt={alt} loading="lazy" />
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  )
}
