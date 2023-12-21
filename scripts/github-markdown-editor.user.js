// ==UserScript==
// @name         fullscreen
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://github.com/shyn/shyn.github.io/issues/new
// @icon         https://www.google.com/s2/favicons?sz=64&domain=github.com
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

async function renderPreview(container) {
  const commentBody = container.querySelector(".comment-body")

  commentBody.innerHTML = "<p>Loading preview&hellip;</p>"
  try {
    const html = await fetchPreview(container)
    commentBody.innerHTML = html || "<p>Nothing to preview</p>"
    fire(container, "preview:rendered", null)
  } catch (error) {
    if (error.name !== "AbortError") {
      commentBody.innerHTML = "<p>Error rendering preview</p>"
    }
  }
}

function fetchPreview(container) {
  const url = container.getAttribute("data-preview-url")
  const data = previewForm(container)
  fire(container, "preview:setup", { data })
  return cachedFetch(url, data)
}

function previewForm(container) {
  const text = container.querySelector(".js-comment-field").value
  const path = container.querySelector(".js-path")?.value
  const lineNumber = container.querySelector(".js-line-number")?.value
  const startLineNumber = container.querySelector(".js-start-line-number")
    ?.value
  const side = container.querySelector(".js-side")?.value
  const startSide = container.querySelector(".js-start-side")?.value
  const startCommitOid = container.querySelector(".js-start-commit-oid")?.value
  const endCommitOid = container.querySelector(".js-end-commit-oid")?.value
  const baseCommitOid = container.querySelector(".js-base-commit-oid")?.value
  const commentId = container.querySelector(".js-comment-id")?.value

  const form = new FormData()
  form.append("text", text)
  form.append("authenticity_token", token(container))
  if (path) form.append("path", path)
  if (lineNumber) form.append("line_number", lineNumber)
  if (startLineNumber) form.append("start_line_number", startLineNumber)
  if (side) form.append("side", side)
  if (startSide) form.append("start_side", startSide)
  if (startCommitOid) form.append("start_commit_oid", startCommitOid)
  if (endCommitOid) form.append("end_commit_oid", endCommitOid)
  if (baseCommitOid) form.append("base_commit_oid", baseCommitOid)
  if (commentId) form.append("comment_id", commentId)
  return form
}

const cachedFetch = memoize(uncachedFetch, { hash })
let previousController = null
async function uncachedFetch(url, body) {
  previousController?.abort()
  const { signal } = (previousController = new AbortController())
  const response = await fetch(url, { method: "post", body, signal })
  if (!response.ok) throw new Error("something went wrong")
  return response.text()
}

function defaultHash(...args) {
  return JSON.stringify(args, (_, v) => (typeof v === "object" ? v : String(v)))
}

function memoize(fn, opts = {}) {
  const { hash = defaultHash, cache = new Map() } = opts
  return function(...args) {
    const id = hash.apply(this, args)
    if (cache.has(id)) return cache.get(id)
    let result = fn.apply(this, args)
    if (result instanceof Promise) {
      result = result.catch(error => {
        cache.delete(id)
        throw error
      })
    }
    cache.set(id, result)
    return result
  }
}

function hash(url, body) {
  const params = [...body.entries()].toString()
  return `${url}:${params}`
}

function throttle(
  callback,
  wait = 0,
  { start = true, middle = true, once = false } = {}
) {
  let last = 0
  let timer
  let cancelled = false
  function fn(...args) {
    if (cancelled) return
    const delta = Date.now() - last
    last = Date.now()
    if (start) {
      start = false
      callback.apply(this, args)
      if (once) fn.cancel()
    } else if ((middle && delta < wait) || !middle) {
      clearTimeout(timer)
      timer = setTimeout(
        () => {
          last = Date.now()
          callback.apply(this, args)
          if (once) fn.cancel()
        },
        !middle ? wait : wait - delta
      )
    }
  }
  fn.cancel = () => {
    clearTimeout(timer)
    cancelled = true
  }
  return fn
}
function debounce(
  callback,
  wait = 0,
  { start = false, middle = false, once = false } = {}
) {
  return throttle(callback, wait, { start, middle, once })
}

function fire(target, name, detail) {
  return target.dispatchEvent(
    new CustomEvent(name, {
      bubbles: true,
      cancelable: true,
      detail: detail
    })
  )
}

function token(container) {
  const dataToken = container.querySelector(".js-data-preview-url-csrf")
  const formTokenRef = container
    .closest("form")
    .elements.namedItem("authenticity_token")
  if (dataToken instanceof HTMLInputElement) {
    return dataToken.value
  } else if (formTokenRef instanceof HTMLInputElement) {
    return formTokenRef.value
  } else {
    throw new Error("Comment preview authenticity token not found")
  }
}

function setupCss() {
  var styleElement = document.createElement("style")
  styleElement.id = "patch"
  styleElement.innerHTML = `
      .fullscreen {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        padding: 10px;
        backdrop-filter: blur(18px);
      }
      .fullscreen .patch-fullscreen {
        flex: 1;
        display: grid;
        grid-template-rows: 38px auto;
      }
      .patch-fullscreen .CommentBox-header {
        height: 38px;
        grid-column: 1 / 3;
      }
      .patch-fullscreen action-bar {
        justify-content: flex-start!important;
      }
      .patch-fullscreen textarea#issue_body {

      }
      .patch-fullscreen file-attachment.js-upload-markdown-image.is-default {
        grid-column: span 1;
      }
      .patch-fullscreen file-attachment.js-upload-markdown-image.is-default > div {
        height: 100%;
        border-right: 1px black solid;
      }
      text-expander, .patch-fullscreen file-attachment.js-upload-markdown-image.is-default > div textarea {
        height: 100%!important;
      }
      .patch-fullscreen .js-preview-panel {
        grid-column: span 1;
      }
      .patch-fullscreen .tabnav-tabs {
        display: none;
      }
    `

  document.head.appendChild(styleElement)
}

function addButton(container) {
  const c = container.querySelector(".ActionBar-item-container")
  const btn = document.createElement("div")
  btn.className = "ActionBar-item"
  btn.innerHTML = `<div data-view-component="true" class="Button-withTooltip">
    <button data-md-button="link" data-hotkey-scope="issue_body" data-hotkey="Meta+k" aria-labelledby="tooltip-177dd791-47f8-4dc1-b9bf-5111b7cf3572" type="button" data-view-component="true" class="Button Button--iconOnly Button--invisible Button--medium" tabindex="-1">
    <svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" data-view-component="true" class="octicon octicon-link Button-visual">
    <g fill="none" fill-rule="evenodd" id="Page-1" stroke="none" stroke-width="1"><g fill="#000000" id="Core" transform="translate(-215.000000, -257.000000)"><g id="fullscreen" transform="translate(215.000000, 257.000000)"><path d="M2,9 L0,9 L0,14 L5,14 L5,12 L2,12 L2,9 L2,9 Z M0,5 L2,5 L2,2 L5,2 L5,0 L0,0 L0,5 L0,5 Z M12,12 L9,12 L9,14 L14,14 L14,9 L12,9 L12,12 L12,12 Z M9,0 L9,2 L12,2 L12,5 L14,5 L14,0 L9,0 L9,0 Z" id="Shape"/></g></g></g>
    </svg>
  </button>
  <tool-tip popover="manual" data-direction="s" data-type="label" data-view-component="true" class="position-absolute sr-only" aria-hidden="true" role="tooltip" style="--tool-tip-position-top: 294px; --tool-tip-position-left: 749.3515625px;">Fullscreen</tool-tip>
  </div></div>`
  c?.appendChild(btn)
  btn
    .querySelector("button")
    ?.addEventListener("click", () => fullscreen(container))
}

function fullscreen(container) {
  container.parentElement?.classList.toggle("fullscreen")
  container.classList.toggle("patch-fullscreen")
  const p = container.querySelector(".js-preview-panel")
  p?.toggleAttribute("hidden")
}

function setupRender(container) {
  const t = container.querySelector("textarea#issue_body")
  t?.addEventListener("input", e => {
    throttle(() => renderPreview(container), 200)()
  })
}

function run() {
  const container = document.querySelector("tab-container")
  if (container === null) return
  setupCss()

  addButton(container)
  setupRender(container)
}

run()


})();
