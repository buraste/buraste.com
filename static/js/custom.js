/** Add target=_blank attr. to all external links. */
document.addEventListener('DOMContentLoaded', function () {
  var links = document.getElementsByTagName('a');
  for (var i = 0; i < links.length; i++) {
    if (links[i].hostname != window.location.hostname) {
      links[i].target = '_blank';
    }
  }
});

document.addEventListener('DOMContentLoaded', function myFunction() {
  var colorfulLogo = '<div id="colorful-logo">'
  + '<p class="playful" aria-label="buraste">'
  + '<span aria-hidden="true">b</span><span aria-hidden="true">u</span>'
  + '<span aria-hidden="true">r</span><span aria-hidden="true">a</span>'
  + '<span aria-hidden="true">s</span><span aria-hidden="true">t</span>'
  + '<span aria-hidden="true">e</span></p>'
  + '</div>';
  document.getElementsByClassName('logo')[0].children[0].innerText = ""
  document.getElementsByClassName('logo')[0].children[0].innerHTML += colorfulLogo
});

