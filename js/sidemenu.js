$(function() {

  var $sidemenu = $('#site-sidemenu'),
      $categoryList = $sidemenu.find('ul'),
      $categoryItems = $categoryList.find('li');

  HHPP.events.on('hhpp-video-changed', function(event, data) {
    if (data.categoryKey) {
      $categoryList.addClass('video-category-active');
      $categoryItems.removeClass('active').find('[data-video-category="' + data.categoryKey + '"]').closest('li').addClass('active');
    } else {
      $categoryList.removeClass('video-category-active');
      $categoryItems.removeClass('active');
    }
  });

  HHPP.events.on('menu-toggled', function(event, data) {
    if (data && data.open) {
      $sidemenu.stop().slideDown();
    } else {
      $sidemenu.stop().slideUp(function() {
        $sidemenu.css('display', '');
      });
    }
  });
});
