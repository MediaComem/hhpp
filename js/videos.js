$(function() {

  var shuffler,
      numberOfElementsToRemove = 0,
      videosElement = $('#hhpp-videos');

  HHPP.events.on('hhpp-video-changed', function(event, data) {
    if (data.initialized) {
      findVideoContainers().remove();
      initializeShuffler();
    }

    var currentVideoKeys = _.map(findShuffledVideoContainers(), function(container) {
      return $(container).data('video');
    });

    HHPP.getCurrentRelatedVideos().then(function(videos) {

      var videoKeys = _.map(videos, 'key');

      var newVideos = _.filter(videos, function(video) {
        return !_.includes(currentVideoKeys, video.key);
      });

      console.log('add videos: ' + _.map(newVideos, 'key').join(', '));

      var videoContainersToRemove = findVideoContainers().filter(function() {
        return !_.includes(videoKeys, $(this).data('video'));
      });

      console.log('remove videos: ' + _.map(videoContainersToRemove, function(el) {
        return $(el).data('video');
      }).join(', '));

      if (videoContainersToRemove.length) {
        numberOfElementsToRemove = videoContainersToRemove.length;
        shuffler.remove(videoContainersToRemove);
      }

      if (newVideos.length) {
        var newVideoContainers = _.map(newVideos, _.bind(HHPP.buildVideoContainer, HHPP));
        videosElement.append(newVideoContainers);
        shuffler.add(_.invokeMap(newVideoContainers, 'get', 0));
      }
    }, fallBackToStaticVideos);
  });

  function initializeShuffler() {
    shuffler = new shuffle(videosElement, {
      itemSelector: '.video-container',
      speed: 250,
      easing: 'ease',
      sizer: $('.video-sizer-element')
    });

    shuffler.sort({
      by: function(element) {
        if ($(element).hasClass('main-video')) {
          return 0;
        } else {
          return 1 + HHPP.getVideoOrder($(element).data('video'));
        }
      }
    });
  }

  function findVideoContainers() {
    return videosElement.find('.video-container.related-video');
  }

  function findShuffledVideoContainers() {
    return findVideoContainers().filter('.shuffle-item--visible');
  }

  function fallBackToStaticVideos() {
    videoContainers.addClass('video-visible');
  }
});
