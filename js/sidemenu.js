$(function() {

  var $sidemenu = $('#site-sidemenu').find('ul'),
      $items = $sidemenu.find('li');

  HHPP.events.on('hhpp-video-changed', function(event, data) {
    if (data.categoryKey) {
      $sidemenu.addClass('video-category-active');
      $items.removeClass('active').find('[data-video-category="' + data.categoryKey + '"]').closest('li').addClass('active');
    } else {
      $sidemenu.removeClass('video-category-active');
      $items.removeClass('active');
    }
  });
});
