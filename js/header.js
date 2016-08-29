$(function() {

  var menuOpen = false,
      $header = $('#site-header'),
      $openIcon = $header.find('.open'),
      $closeIcon = $header.find('.close');

  $openIcon.on('click', toggleMenu);
  $closeIcon.on('click', toggleMenu);

  function toggleMenu(event) {
    menuOpen = !menuOpen;

    $openIcon[menuOpen ? 'hide' : 'show']();
    $closeIcon[menuOpen ? 'show' : 'hide']();

    HHPP.events.trigger('menu-toggled', {
      open: menuOpen
    });
  }
});
