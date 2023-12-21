// ==UserScript==
// @name         better-ms-doc
// @namespace    http://tampermonkey.net/
// @version      2023-12-19
// @description  try to take over the world!
// @author       You
// @match        https://learn.microsoft.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=microsoft.com
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const toc = document.querySelector('#center-doc-outline')
    const training = document.querySelector('#right-rail-training')
    training.parentElement.insertBefore(toc, training)

    const content = document.querySelector('div.content');
    document.querySelectorAll('#content-well-in-this-article-list li').forEach(li => {
        li.classList.remove('expandable')
        const anchor = li.firstElementChild.getAttribute('href').substring(1)
        let flag = false;
        for(const h of content.querySelectorAll(".heading-wrapper")) {
            if (h.dataset.headingLevel === 'h2') {
                if (h.querySelector('h2').id === anchor) {
                    flag = true;
                } else if (flag) {
                    break;
                }
            }
            else if (h.dataset.headingLevel === 'h3') {
                if (flag){
                    let subol = li.querySelector('ol')
                    if (subol === null) { subol = document.createElement('ol');subol.className='padding-left-xxs';li.appendChild(subol)}
                    const subli = document.createElement('li')
                    const suba = document.createElement('a')
                    const subheading = h.querySelector(h.dataset.headingLevel)
                    suba.setAttribute('href', '#' + subheading.id)
                    suba.innerText=subheading.innerText
                    subli.appendChild(suba)
                    subol.appendChild(subli)

                }
            }

        }
    })
    const nextElm = document.querySelector('#content-well-in-this-article-list').nextElementSibling
    if (nextElm && nextElm.tagName == 'BUTTON' && nextElm.dataset.showMore === '') nextElm.remove()
})();
