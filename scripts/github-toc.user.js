// ==UserScript==
// @name        github-toc
// @namespace   Violentmonkey Scripts
// @match       https://github.com/*/*
// @grant       none
// @version     1.0
// @author      -
// @description 2023/12/21 09:52:51
// ==/UserScript==

console.log('button=>',document.querySelector('button[aria-label="Outline"]'))

const $ = document.querySelector.bind(document);
let $githubToc = false;
document.addEventListener('scroll', _ => {
  const tocBtn = $('button[aria-label="Outline"]')
const header = tocBtn?.parentElement;
  if (!header) return;

  const {top} = header.getBoundingClientRect()
  if (top < 1) {
    if ($githubToc) {
      $('#toc').style.display = 'block';
    } else {
      tocBtn?.click();
      const toc = $('section[aria-labelledby="outline-id"]')
      if (!toc) return;
      //wait react attach the dom
      console.log('toc=>', toc)
      const finaltoc = $('.Layout-sidebar').appendChild(toc);
      finaltoc.id = 'toc'
      finaltoc.style.position='sticky';
      finaltoc.style.top = '10px';
      finaltoc.style.borderShadow='rgba(31, 35, 40, 0.12) 0px 1px 3px, rgba(66, 74, 83, 0.12) 0px 8px 24px';
      $githubToc = true;
    }

  } else if (top > window.innerHeight/3) {
    $('#toc').style.display = 'none';
  }
})
