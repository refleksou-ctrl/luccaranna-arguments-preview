(function(){'use strict';var MOBILE_MAX=768;function isMobile(){return window.matchMedia('(max-width: '+MOBILE_MAX+'px)').matches}
function initSlider(slider){var slides=Array.prototype.slice.call(slider.querySelectorAll('.full-slider_slide'));if(slides.length<2){return}
var markupActive=slides.findIndex(function(slide){return slide.classList.contains('active')});if(markupActive<0){markupActive=0}
var active=markupActive;function forceActive(index){slides.forEach(function(slide){slide.classList.remove('active')});slides[index].classList.add('active');active=index}
function setActive(index){if(index<0){index=0}
if(index>slides.length-1){index=slides.length-1}
if(index===active){return}
slides[active].classList.remove('active');slides[index].classList.add('active');active=index}
var wasMobile=isMobile();forceActive(wasMobile?0:markupActive);slides.forEach(function(slide,index){slide.addEventListener('click',function(){if(index===active){return}
if(isMobile()){setActive(index)}else{setActive(index<active?active-1:active+1)}})});window.addEventListener('resize',function(){var nowMobile=isMobile();if(nowMobile!==wasMobile){wasMobile=nowMobile;forceActive(nowMobile?0:markupActive)}})}
function initAll(){var sliders=document.querySelectorAll('[data-full-slider]');Array.prototype.forEach.call(sliders,initSlider)}
if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',initAll)}else{initAll()}})()