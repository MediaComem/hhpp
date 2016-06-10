$(function() {

  var shuffler,
      autoPlayVimeo = false,
      vimeoPlayerOrigin = '*',
      $videosContainer = $('#hhpp-videos'),
      $mainVideo = $videosContainer.find('.main-video'),
      $mainVideoIframe = $mainVideo.find('iframe');

  forwardVimeoPlayerEvents();

  HHPP.events.on('hhpp-video-changed', function(event, data) {

    // First-time initialization.
    if (data.initialized) {

      // Remove static related videos generated by Jekyll.
      removeRelatedVideos();

      // Initialize the shuffle library.
      initializeShuffler();

      // Generate and add new related videos.
      generateRelatedVideos();
    }

    // If the current video changes, update the URL of the iframe displaying it.
    if (!data.initialized && data.videoChanged) {
      HHPP.getCurrentVideo().then(function(video) {

        $mainVideo.find('iframe').attr('src', HHPP.getVideoUrl(video));

        $relatedVideos = $videosContainer.find('.related-video');
        $relatedVideos.filter('[data-video-category="' + video.category + '"]').addClass('current-category');
        $relatedVideos.filter('[data-video-category!="' + video.category + '"]').removeClass('current-category');
      });
    }

    // If the video or the category changes, tell shuffle to re-filter and re-sort.
    if (!data.initialized && (data.videoChanged || data.categoryChanged)) {
      filterShuffler();
    }
  });

  HHPP.events.on('vimeo-ready', function(event, data) {
    if (autoPlayVimeo) {
      playMainVideo();
    } else {
      autoPlayVimeo = true;
    }
  });

  function initializeShuffler() {

    shuffler = new shuffle($videosContainer, {
      itemSelector: '.video-container',
      speed: 250,
      easing: 'ease',
      sizer: $('.video-sizer-element')
    });

    filterShuffler();
  }

  function filterShuffler() {
    shuffler.filter(isVideoElementVisible, {
      by: getVideoElementOrder
    });
  }

  function generateRelatedVideos() {
    $.when(HHPP.getVideos(), HHPP.getVideoCategory(HHPP.currentVideoKey)).then(function(videos, currentVideoCategory) {
      $.when.apply($, _.map(videos, _.bind(HHPP.buildVideoContainer, HHPP))).then(function() {

        var $newVideoContainers = Array.prototype.slice.call(arguments);
        _.each($newVideoContainers, function(element) {

          $video = $(element);

          if (isVideoElementVisible(element)) {
            $video.addClass('video-visible');
          }

          if (currentVideoCategory && $video.data('video-category') == currentVideoCategory.key) {
            $video.addClass('current-category');
          }
        });

        $videosContainer.append($newVideoContainers);
        shuffler.add(_.invokeMap($newVideoContainers, 'get', 0));

        setTimeout(function() {
          _.invokeMap($newVideoContainers, 'addClass', 'video-visible');
        }, 1000);
      });
    });
  }

  function isVideoElementVisible(element) {
    var $video = $(element);
    return $video.hasClass('main-video') || ($video.data('video') != HHPP.currentVideoKey && (!HHPP.currentCategoryKey || $video.data('video-category') == HHPP.currentCategoryKey));
  }

  function getVideoElementOrder(element) {
    $video = $(element);
    if ($video.hasClass('main-video')) {
      return 0;
    } else {
      return 1 + HHPP.getVideoOrder($video.data('video'));
    }
  }

  function removeRelatedVideos() {
    $videosContainer.find('.video-container.related-video').remove();
  }

  function playMainVideo() {
    postVimeoMessage('play');
  }

  function postVimeoMessage(action, value) {

    var data = {
      method: action
    };

    if (value) {
        data.value = value;
    }

    var message = JSON.stringify(data);
    $mainVideoIframe[0].contentWindow.postMessage(message, vimeoPlayerOrigin);
  }

  function forwardVimeoPlayerEvents() {

    // Listen for messages from the player.
    if (window.addEventListener) {
      window.addEventListener('message', onMessageReceived, false);
    } else {
      window.attachEvent('onmessage', onMessageReceived, false);
    }

    function onMessageReceived(event) {

      // Only handle messages from the vimeo player.
      if (!(/^https?:\/\/player.vimeo.com/).test(event.origin)) {
        return false;
      }

      if (vimeoPlayerOrigin === '*') {
        vimeoPlayerOrigin = event.origin;
      }

      var data = JSON.parse(event.data);

      HHPP.events.trigger('vimeo-' + data.event, data);
    }
  }
});